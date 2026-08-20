import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI, Type } from "@google/genai";

export const Route = createFileRoute("/api/generate-ad")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const geminiKey = process.env.GEMINI_API_KEY;
          if (!geminiKey) {
            return Response.json(
              { success: false, error: "GEMINI_API_KEY is required" },
              { status: 400 },
            );
          }

          const ai = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build",
              },
            },
          });

          const body = await request.json();
          const {
            platform = "meta",
            productName = "تين أحمر وأصفر طازج",
            productPrice = 85,
            productCategory = "فواكه طازجة",
            objective = "conversions",
          } = body ?? {};

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
            model: "gemini-3.6-flash",
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

          return new Response(JSON.stringify({ success: true, ad: adData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[AI Ad Generator] Error:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: "failed_to_generate_ad",
              details: String(err),
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
