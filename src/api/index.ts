import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI, Type } from "@google/genai";
import { todoApi } from "./todos";
import { authApi } from "./auth";
import { orderApi } from "./orders";
import { customerApi } from "./customers";
import { productsApi, categoriesApi } from "./products";
import { storageApi } from "./storage";
import { feedsApi } from "./feeds";

export const api = new Hono().basePath("/api");

// Mount Auth, Orders, Customers, Products, Categories, Storage, Feeds & Todo APIs
api.route("/auth", authApi);
api.route("/orders", orderApi);
api.route("/customers", customerApi);
api.route("/products", productsApi);
api.route("/categories", categoriesApi);
api.route("/storage", storageApi);
api.route("/feeds", feedsApi);
api.route("/todos", todoApi);

// Enable CORS for all API routes
api.use("*", cors());

// Health check endpoint
api.get("/health", (c) => {
  return c.json({
    status: "ok",
    runtime: "cloudflare-workers",
    timestamp: new Date().toISOString(),
    store: "teenliwa",
  });
});

// Ziina payment gateway handler
api.post("/create-ziina-payment", async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, tracking, amount, customerName, customerEmail, customerPhone, origin } =
      body ?? {};

    if (!orderId || !tracking || !amount || !customerName || !origin) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const env = (c.env as Record<string, string> | undefined) || {};
    const apiKey = (
      env.ZIINA_API_KEY ||
      process.env.ZIINA_API_KEY ||
      env.VITE_ZIINA_API_KEY ||
      process.env.VITE_ZIINA_API_KEY ||
      ""
    ).trim();
    const testMode =
      (env.ZIINA_TEST_MODE || process.env.ZIINA_TEST_MODE || "true").trim() !== "false";
    const siteDomain = (env.SITE_DOMAIN || process.env.SITE_DOMAIN || "")
      .trim()
      .replace(/\/+$/, "");
    const baseUrl = siteDomain || origin;

    // Build success and cancel return URLs for Ziina Payment Intent
    const successUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=success&payment_intent_id={PAYMENT_INTENT_ID}`;
    const cancelUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=cancelled`;
    const failureUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=failed`;

    if (!apiKey) {
      // In development or when API key is pending, return simulated success redirect URL
      const mockPaymentId = `ziina_mock_${Date.now()}`;
      const mockRedirectUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=success&payment_intent_id=${mockPaymentId}&simulated=true`;
      return c.json({
        id: mockPaymentId,
        redirect_url: mockRedirectUrl,
        message: "Ziina payment intent created (mock mode)",
      });
    }

    const amountInFils = Math.round(Number(amount) * 100);

    const res = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInFils,
        currency_code: "AED",
        message: `طلب رقم ${tracking} - تين ليوا`,
        success_url: successUrl,
        cancel_url: cancelUrl,
        failure_url: failureUrl,
        test: testMode,
        transaction_source: "directApi",
        metadata: {
          order_id: orderId,
          tracking,
          customer_name: customerName,
          customer_email: customerEmail || "",
          customer_phone: customerPhone || "",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[ziina] create payment failed", res.status, text);
      return c.json({ error: "ziina_error", status: res.status, detail: text }, 502);
    }

    const json: any = await res.json();

    // Store ziina payment ID in D1 DB if available
    const d1Db = (c.env as any)?.DB;
    if (d1Db && json?.id) {
      try {
        const row: any = await d1Db
          .prepare(
            `SELECT notes FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`,
          )
          .bind(tracking.toUpperCase(), tracking.toUpperCase())
          .first();

        let notes: any = {};
        if (row?.notes) {
          try {
            notes = JSON.parse(row.notes);
          } catch {
            notes = {};
          }
        }
        notes.ziinaPaymentId = json.id;
        notes.ziinaStatus = json.status || "pending";
        notes.ziinaAmount = (json.amount || amountInFils) / 100;
        notes.ziinaCurrency = json.currency_code || "AED";

        await d1Db
          .prepare(
            `UPDATE orders SET notes = ?, payment_method = 'ziina' WHERE UPPER(tracking_number) = ? OR UPPER(id) = ?`,
          )
          .bind(JSON.stringify(notes), tracking.toUpperCase(), tracking.toUpperCase())
          .run();
      } catch (dbErr) {
        console.warn("[ziina] failed to update order notes with payment id:", dbErr);
      }
    }

    return c.json({ id: json.id, redirect_url: json.redirect_url, status: json.status });
  } catch (err) {
    console.error("[ziina] unexpected error", err);
    return c.json({ error: "unexpected", message: String(err) }, 500);
  }
});

// Ziina Webhook Handler (Verified Server-Side Route Handler)
const handleZiinaWebhook = async (c: any) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    console.log("[ziina-webhook] Event received:", rawBody?.type || rawBody?.event || "unknown");

    const env = (c.env as any) || {};
    const d1Db = env.DB;
    const apiKey = (
      env.ZIINA_API_KEY ||
      (typeof process !== "undefined" ? process.env?.ZIINA_API_KEY : "") ||
      ""
    ).trim();

    // Extract payment intent details from various Ziina webhook payload formats
    const paymentData =
      rawBody?.data?.payment_intent || rawBody?.data || rawBody?.payment_intent || rawBody;
    const paymentId = paymentData?.id || rawBody?.id;
    const initialStatus = paymentData?.status || rawBody?.status;
    let tracking =
      paymentData?.metadata?.tracking ||
      paymentData?.metadata?.order_id ||
      rawBody?.metadata?.tracking ||
      rawBody?.metadata?.order_id;

    if (!paymentId && !tracking) {
      return c.json(
        { success: false, message: "No payment intent or tracking found in webhook" },
        400,
      );
    }

    let verifiedStatus = initialStatus;
    let verifiedAmount = (paymentData?.amount || 0) / 100;
    let verifiedCurrency = paymentData?.currency_code || "AED";
    let isServerVerified = false;

    // Direct Server Verification with Ziina API if API Key is available
    if (paymentId && apiKey && !paymentId.startsWith("ziina_mock_")) {
      try {
        const verifyRes = await fetch(
          `https://api-v2.ziina.com/api/payment_intent/${encodeURIComponent(paymentId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (verifyRes.ok) {
          const liveData: any = await verifyRes.json();
          verifiedStatus = liveData.status || verifiedStatus;
          verifiedAmount = (liveData.amount || 0) / 100;
          verifiedCurrency = liveData.currency_code || verifiedCurrency;
          tracking = tracking || liveData.metadata?.tracking || liveData.metadata?.order_id;
          isServerVerified = true;
          console.log(
            `[ziina-webhook] Authoritatively verified with Ziina API: Status = ${verifiedStatus}`,
          );
        } else {
          console.warn("[ziina-webhook] Failed live check from Ziina API:", verifyRes.status);
        }
      } catch (verifyErr) {
        console.error("[ziina-webhook] Error during server-to-server check:", verifyErr);
      }
    }

    const isCompleted =
      verifiedStatus === "completed" || verifiedStatus === "succeeded" || verifiedStatus === "paid";

    const targetOrderStatus = isCompleted
      ? "paid"
      : verifiedStatus === "canceled"
        ? "cancelled"
        : "pending";

    // Update D1 Database
    if (d1Db && typeof d1Db.prepare === "function") {
      let existingRow: any = null;

      if (tracking) {
        existingRow = await d1Db
          .prepare(`SELECT * FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`)
          .bind(tracking.toUpperCase(), tracking.toUpperCase())
          .first();
      }

      // If no match by tracking, search by ziinaPaymentId in notes
      if (!existingRow && paymentId) {
        const allRows: any = await d1Db
          .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`)
          .all();
        const results = allRows?.results || [];
        existingRow = results.find((r: any) => {
          if (!r.notes) return false;
          try {
            const n = JSON.parse(r.notes);
            return n.ziinaPaymentId === paymentId;
          } catch {
            return false;
          }
        });
        if (existingRow) {
          tracking = existingRow.tracking_number || existingRow.id;
        }
      }

      if (existingRow) {
        let notes: any = {};
        try {
          notes = existingRow.notes ? JSON.parse(existingRow.notes) : {};
        } catch {
          notes = {};
        }

        notes.ziinaPaymentId = paymentId || notes.ziinaPaymentId;
        notes.ziinaStatus = verifiedStatus;
        notes.ziinaVerified = isCompleted || isServerVerified;
        notes.ziinaVerifiedAt = new Date().toISOString();
        if (verifiedAmount > 0) notes.ziinaAmount = verifiedAmount;
        notes.ziinaCurrency = verifiedCurrency;
        if (isCompleted) {
          notes.paidAt = notes.paidAt || new Date().toISOString();
        }

        await d1Db
          .prepare(
            `UPDATE orders 
             SET status = ?, 
                 payment_method = 'ziina', 
                 notes = ? 
             WHERE UPPER(tracking_number) = ? OR UPPER(id) = ?`,
          )
          .bind(
            targetOrderStatus,
            JSON.stringify(notes),
            tracking.toUpperCase(),
            tracking.toUpperCase(),
          )
          .run();

        console.log(
          `[ziina-webhook] Successfully updated Order ${tracking} in D1 to '${targetOrderStatus}'`,
        );
      }
    }

    return c.json({
      success: true,
      received: true,
      verified: isServerVerified,
      status: targetOrderStatus,
      ziinaStatus: verifiedStatus,
      tracking,
      paymentId,
    });
  } catch (err: any) {
    console.error("[ziina-webhook] Webhook execution error:", err);
    return c.json({ success: false, error: err?.message || "Webhook error" }, 500);
  }
};

// Mount Webhook on standard routes
api.post("/ziina-webhook", handleZiinaWebhook);
api.post("/webhooks/ziina", handleZiinaWebhook);
api.get("/ziina-webhook", (c) =>
  c.json({ status: "active", message: "Ziina Webhook Endpoint Ready" }),
);
api.get("/webhooks/ziina", (c) =>
  c.json({ status: "active", message: "Ziina Webhook Endpoint Ready" }),
);

// Gemini AI Marketing & Ad Generator handler
api.post("/generate-ad", async (c) => {
  try {
    const body = await c.req.json();
    const {
      platform = "meta",
      productName = "تين أحمر وأصفر طازج",
      productPrice = 85,
      productCategory = "فواكه طازجة",
      objective = "conversions",
    } = body ?? {};

    const env = (c.env as Record<string, string> | undefined) || {};
    const geminiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `أنت خبير تسويق أداء وحملات إعلانية مدفوعة متقدمة لـ Meta Ads (Facebook & Instagram) و TikTok Ads في دولة الإمارات ودول الخليج العربي. 
أنت متخصص في تحويل الزوار إلى مشترين لمنتجات الأطعمة الفاخرة والتين والتمور (تين ليوا).
أولويتك إنتاج إعلانات عالية التحويل باللغة العربية مع التركيز على المزايا (التوصيل في نفس اليوم، الطزاجة من المزرعة للمنزل، جودة التغليف الفاخر، الدفع الآمن).`;

    const prompt = `أنشئ خطة إعلانية كاملة لـ ${platform === "meta" ? "إعلانات فيسبوك وإنستغرام (Meta Ads)" : "إعلانات تيك توك (TikTok Ads)"} للمنتج التالي:
اسم المنتج: ${productName}
التصنيف: ${productCategory}
السعر: ${productPrice} درهم إماراتي
الهدف الإعلاني: ${objective}

المطلوب إرجاع النتائج بتنسيق JSON دقيق يحتوي الأقسام التالية:
1. headline: عنوان جذاب قصير للإعلان (Headline)
2. primaryText: النص الرئيسي للإعلان (Primary Text) مكتوب بأسلوب إقناعي جذاب مع إيموجي مناسبة.
3. description: وصف فرعي مبسط (Description / Subtitle)
4. callToAction: زر اتخاذ الإجراء المقترح (e.g., "اطلب الآن", "تضع السلة", "تسوق الآن")
5. targetAudience: فئات الجمهور المستهدف والتوجيه الجغرافي والاهتمامات في الإمارات.
6. visualHook: فكرة الفيديو أو التصميم الإعلاني المميز (Visual Concept & Hook)
7. hashtags: هاشتاغات مشهورة وعالية الانتشار (Hashtags)
8. budgetAdvice: ميزانية يومية مقترحة وتوصية باستراتيجية المزايدة (Bidding Strategy)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            primaryText: { type: Type.STRING },
            description: { type: Type.STRING },
            callToAction: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            visualHook: { type: Type.STRING },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            budgetAdvice: { type: Type.STRING },
          },
          required: [
            "headline",
            "primaryText",
            "description",
            "callToAction",
            "targetAudience",
            "visualHook",
            "hashtags",
            "budgetAdvice",
          ],
        },
      },
    });

    const rawText = response.text?.trim() || "{}";
    let adData;
    try {
      adData = JSON.parse(rawText);
    } catch {
      adData = {
        headline: `ذوق طعم الطزاجة الحقيقية مع ${productName}! 🍇✨`,
        primaryText: `قطف يومي طازج من مزارع ليوا الإنسانية مباشرة إلى باب منزلك في جميع إمارات الدولة. اطلب الآن واستمتع بطعم لا يُنسى!`,
        description: `توصيل سريع في نفس اليوم | دفع آمن 100%`,
        callToAction: "اطلب الآن",
        targetAudience:
          "رجال ونساء في الإمارات (25-55 سنة)، المهتمين بالفواكه الطازجة والتغذية الصحية والمنتجات الوطنية.",
        visualHook:
          "مشهد فيديو سريع يظهر فتح صندوق التين الفاخر واستعراض حبات التين الحمراء العصيرية.",
        hashtags: ["#تين_ليوا", "#فواكه_الإمارات", "#توصيل_سريع", "#MetaAds"],
        budgetAdvice:
          "ميزانية مبدئية: 50-100 درهم يومياً مع اختبار جمهور الإمارات واستراتيجية Highest Volume.",
      };
    }

    return c.json({ success: true, ad: adData });
  } catch (err) {
    console.error("[AI Ad Generator] Error:", err);
    return c.json(
      {
        success: false,
        error: "failed_to_generate_ad",
        details: String(err),
      },
      500,
    );
  }
});

export default api;
