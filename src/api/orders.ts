import { Hono } from "hono";
import { loadStoreFromR2, saveStoreToR2 } from "../lib/r2store";

export const orderApi = new Hono();

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface CreateOrderPayload {
  id?: string;
  tracking: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  emirate: string;
  items: OrderItemPayload[];
  subtotal: number;
  deliveryFee: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  notes?: string;
}

// In-memory fallback for local dev environment when D1 binding is not attached
const localOrdersFallback: any[] = [];

// Helper to convert D1 row to typed Order object
function formatD1Order(row: any) {
  let items: any[] = [];
  try {
    items = typeof row.items === "string" ? JSON.parse(row.items) : row.items || [];
  } catch {
    items = [];
  }

  let email: string | undefined = undefined;
  let tax: number | undefined = undefined;
  let taxRate: number | undefined = undefined;
  let ziinaPaymentId: string | undefined = undefined;
  let ziinaStatus: string | undefined = undefined;
  let ziinaVerified: boolean | undefined = undefined;
  let ziinaVerifiedAt: string | undefined = undefined;
  let ziinaAmount: number | undefined = undefined;
  let paidAt: number | undefined = undefined;

  if (row.notes) {
    try {
      const parsedNotes = JSON.parse(row.notes);
      if (typeof parsedNotes === "object" && parsedNotes !== null) {
        email = parsedNotes.email;
        tax = parsedNotes.tax;
        taxRate = parsedNotes.taxRate;
        ziinaPaymentId = parsedNotes.ziinaPaymentId;
        ziinaStatus = parsedNotes.ziinaStatus;
        ziinaVerified = parsedNotes.ziinaVerified;
        ziinaVerifiedAt = parsedNotes.ziinaVerifiedAt;
        ziinaAmount = parsedNotes.ziinaAmount;
        if (parsedNotes.paidAt) {
          paidAt = new Date(parsedNotes.paidAt).getTime();
        }
      }
    } catch {
      // notes is plain string
    }
  }

  const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();

  return {
    id: row.id,
    tracking: row.tracking_number || row.tracking,
    name: row.customer_name || row.name,
    email: email || row.email,
    phone: row.phone,
    address: row.address,
    emirate: row.emirate,
    items,
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee || row.deliveryFee || 0),
    tax: tax !== undefined ? Number(tax) : undefined,
    taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
    total: Number(row.total || 0),
    status: row.status || "pending",
    paymentMethod: row.payment_method || "cod",
    createdAt,
    paidAt,
    ziinaPaymentId,
    ziinaStatus,
    ziinaVerified,
    ziinaVerifiedAt,
    ziinaAmount,
  };
}

// Helper to ensure tables exist in D1
async function ensureOrdersD1Tables(db: any) {
  if (!db || typeof db.prepare !== "function") return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          tracking_number TEXT UNIQUE,
          customer_id TEXT,
          customer_name TEXT,
          phone TEXT,
          emirate TEXT,
          address TEXT,
          items TEXT,
          subtotal REAL,
          delivery_fee REAL,
          total REAL,
          payment_method TEXT,
          status TEXT,
          notes TEXT,
          created_at TEXT
        )`,
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          fname TEXT,
          lname TEXT,
          email TEXT,
          phone TEXT UNIQUE,
          address TEXT,
          emirate TEXT,
          total_orders INTEGER DEFAULT 1,
          total_spent REAL DEFAULT 0,
          last_order_tracking TEXT,
          created_at TEXT
        )`,
      )
      .run();
  } catch (e) {
    console.warn("[ensureOrdersD1Tables] Warning:", e);
  }
}

// 1. POST /api/orders - Insert new order into Cloudflare D1 Database
orderApi.post("/", async (c) => {
  try {
    const body: CreateOrderPayload = await c.req.json();
    const {
      tracking,
      name,
      email,
      phone,
      address,
      emirate,
      items,
      subtotal,
      deliveryFee,
      tax,
      taxRate,
      total,
      paymentMethod = "cod",
      status = "pending",
    } = body;

    if (!tracking || !name || !phone || !address || !emirate || !items || !Array.isArray(items)) {
      return c.json({ success: false, error: "Missing required order fields" }, 400);
    }

    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanEmirate = emirate.trim();
    const cleanEmail = email?.trim() || "";

    const orderId = body.id || `ord-${Date.now()}`;
    const customerId = `cust-${Date.now()}`;
    const itemsJson = JSON.stringify(items);
    const createdAtStr = new Date().toISOString();

    const notesObj = {
      email: cleanEmail || undefined,
      tax: tax !== undefined ? Number(tax) : 0,
      taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
    };
    const notesJson = JSON.stringify(notesObj);

    const env = (c.env as any) || {};
    const d1Db = env.DB;

    let savedInD1 = false;
    let d1Error: string | null = null;

    if (d1Db && typeof d1Db.prepare === "function") {
      await ensureOrdersD1Tables(d1Db);
      try {
        // 1. Insert into orders table
        await d1Db
          .prepare(
            `INSERT INTO orders (id, tracking_number, customer_id, customer_name, phone, emirate, address, items, subtotal, delivery_fee, total, payment_method, status, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            orderId,
            tracking,
            customerId,
            cleanName,
            cleanPhone,
            cleanEmirate,
            cleanAddress,
            itemsJson,
            Number(subtotal),
            Number(deliveryFee),
            Number(total),
            paymentMethod,
            status,
            notesJson,
            createdAtStr,
          )
          .run();

        savedInD1 = true;

        // 2. Insert or update customers table
        const nameParts = cleanName.split(" ");
        const fname = nameParts[0] || cleanName;
        const lname = nameParts.slice(1).join(" ") || "";

        try {
          await d1Db
            .prepare(
              `INSERT INTO customers (id, fname, lname, email, phone, address, emirate, total_orders, total_spent, last_order_tracking, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
               ON CONFLICT(phone) DO UPDATE SET 
                 fname = excluded.fname,
                 lname = excluded.lname,
                 email = CASE WHEN excluded.email != '' THEN excluded.email ELSE customers.email END,
                 address = excluded.address,
                 emirate = excluded.emirate,
                 total_orders = customers.total_orders + 1,
                 total_spent = customers.total_spent + excluded.total_spent,
                 last_order_tracking = excluded.last_order_tracking`,
            )
            .bind(
              customerId,
              fname,
              lname,
              cleanEmail,
              cleanPhone,
              cleanAddress,
              cleanEmirate,
              Number(total),
              tracking,
              createdAtStr,
            )
            .run();
        } catch (custErr) {
          console.warn("[D1 Customers Sync Warning]:", custErr);
        }
      } catch (err: any) {
        console.error("[D1 Insert Order Error]:", err);
        d1Error = err?.message || String(err);
      }
    }

    const orderResult = {
      id: orderId,
      tracking,
      name: cleanName,
      email: cleanEmail || undefined,
      phone: cleanPhone,
      address: cleanAddress,
      emirate: cleanEmirate,
      items,
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee),
      tax: tax !== undefined ? Number(tax) : undefined,
      taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
      total: Number(total),
      status,
      paymentMethod,
      createdAt: new Date(createdAtStr).getTime(),
    };

    // Keep in local fallback cache
    localOrdersFallback.unshift(orderResult);

    // Save to R2 Bucket
    saveStoreToR2({ orders: localOrdersFallback }, { env }).catch(() => {});

    return c.json({
      success: true,
      savedInD1,
      d1Error,
      order: orderResult,
    });
  } catch (err: any) {
    console.error("[POST /api/orders Error]:", err);
    return c.json({ success: false, error: err?.message || "Failed to save order" }, 500);
  }
});

// 2. GET /api/orders - Get all orders (for Admin Dashboard)
orderApi.get("/", async (c) => {
  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;

    if (d1Db && typeof d1Db.prepare === "function") {
      const { results } = await d1Db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();

      if (Array.isArray(results) && results.length > 0) {
        const orders = results.map(formatD1Order);
        return c.json({ success: true, source: "d1", orders });
      }
    }

    // Load from R2 if D1 is not used
    try {
      const store = await loadStoreFromR2({ env });
      if (store && Array.isArray(store.orders) && store.orders.length > 0) {
        return c.json({ success: true, source: "r2", orders: store.orders });
      }
    } catch (r2Err) {
      console.warn("[GET /api/orders] R2 load warning:", r2Err);
    }

    return c.json({ success: true, source: "local", orders: localOrdersFallback });
  } catch (err: any) {
    console.error("[GET /api/orders Error]:", err);
    return c.json({ success: true, source: "fallback", orders: localOrdersFallback });
  }
});

// 3. GET /api/orders/:tracking - Get order details by tracking number
orderApi.get("/:tracking", async (c) => {
  const tracking = c.req.param("tracking")?.trim().toUpperCase();
  if (!tracking) {
    return c.json({ success: false, error: "Tracking number is required" }, 400);
  }

  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;

    if (d1Db && typeof d1Db.prepare === "function") {
      const row = await d1Db
        .prepare(`SELECT * FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`)
        .bind(tracking, tracking)
        .first();

      if (row) {
        return c.json({ success: true, source: "d1", order: formatD1Order(row) });
      }
    }

    const localMatch = localOrdersFallback.find(
      (o) => o.tracking.toUpperCase() === tracking || o.id.toUpperCase() === tracking,
    );

    if (localMatch) {
      return c.json({ success: true, source: "local", order: localMatch });
    }

    return c.json({ success: false, error: "Order not found" }, 404);
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to fetch order" }, 500);
  }
});

// 4. PATCH /api/orders/:tracking/status - Update order status in D1
orderApi.patch("/:tracking/status", async (c) => {
  const tracking = c.req.param("tracking")?.trim().toUpperCase();
  const body = await c.req.json().catch(() => ({}));
  const { status } = body;

  if (!tracking || !status) {
    return c.json({ success: false, error: "Tracking and status required" }, 400);
  }

  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;

    if (d1Db && typeof d1Db.prepare === "function") {
      await d1Db
        .prepare(`UPDATE orders SET status = ? WHERE UPPER(tracking_number) = ? OR UPPER(id) = ?`)
        .bind(status, tracking, tracking)
        .run();
    }

    const localMatch = localOrdersFallback.find(
      (o) => o.tracking.toUpperCase() === tracking || o.id.toUpperCase() === tracking,
    );
    if (localMatch) {
      localMatch.status = status;
    }

    saveStoreToR2({ orders: localOrdersFallback }, { env }).catch(() => {});

    return c.json({ success: true, status });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to update status" }, 500);
  }
});

// 5. POST /api/orders/:tracking/confirm-payment - Confirm Ziina Payment & Update D1
orderApi.post("/:tracking/confirm-payment", async (c) => {
  const tracking = c.req.param("tracking")?.trim().toUpperCase();
  const body = await c.req.json().catch(() => ({}));
  const { paymentIntentId, status: requestedStatus = "paid" } = body;

  if (!tracking) {
    return c.json({ success: false, error: "Tracking number required" }, 400);
  }

  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;
    const apiKey = (
      env.ZIINA_API_KEY ||
      (typeof process !== "undefined" ? process.env?.ZIINA_API_KEY : "") ||
      ""
    ).trim();

    let ziinaStatus = "completed";
    let isVerified = false;
    let finalOrderStatus = requestedStatus;
    let liveZiinaData: any = null;

    // If we have a Ziina paymentIntentId and an API Key, verify with Ziina API server-side
    if (paymentIntentId && apiKey && !paymentIntentId.startsWith("ziina_mock_")) {
      try {
        const ziinaRes = await fetch(
          `https://api-v2.ziina.com/api/payment_intent/${encodeURIComponent(paymentIntentId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (ziinaRes.ok) {
          liveZiinaData = await ziinaRes.json();
          ziinaStatus = liveZiinaData.status || "pending";
          if (ziinaStatus === "completed") {
            isVerified = true;
            finalOrderStatus = "paid";
          } else {
            isVerified = false;
            // Payment not completed in Ziina (e.g. pending, canceled, failed, requires_user_action)
            finalOrderStatus = ziinaStatus === "canceled" ? "cancelled" : "pending";
          }
        } else {
          console.warn("[confirm-payment] Ziina API returned status:", ziinaRes.status);
        }
      } catch (zErr) {
        console.error("[confirm-payment] Error calling Ziina API:", zErr);
      }
    } else if (paymentIntentId && paymentIntentId.startsWith("ziina_mock_")) {
      ziinaStatus = "completed_mock";
      isVerified = true;
      finalOrderStatus = "paid";
    }

    let updatedOrder: any = null;

    if (d1Db && typeof d1Db.prepare === "function") {
      await ensureOrdersD1Tables(d1Db);

      const existingRow: any = await d1Db
        .prepare(`SELECT * FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`)
        .bind(tracking, tracking)
        .first();

      if (existingRow) {
        let existingNotes: any = {};
        try {
          existingNotes = existingRow.notes ? JSON.parse(existingRow.notes) : {};
        } catch {
          existingNotes = {};
        }

        existingNotes.ziinaPaymentId = paymentIntentId || existingNotes.ziinaPaymentId;
        existingNotes.ziinaStatus = ziinaStatus;
        existingNotes.ziinaVerified = isVerified;
        existingNotes.ziinaVerifiedAt = new Date().toISOString();
        if (liveZiinaData?.amount) {
          existingNotes.ziinaAmount = liveZiinaData.amount / 100;
        }
        existingNotes.paidAt =
          isVerified || finalOrderStatus === "paid"
            ? new Date().toISOString()
            : existingNotes.paidAt;
        const updatedNotesJson = JSON.stringify(existingNotes);

        await d1Db
          .prepare(
            `UPDATE orders 
             SET status = ?, 
                 payment_method = 'ziina', 
                 notes = ? 
             WHERE UPPER(tracking_number) = ? OR UPPER(id) = ?`,
          )
          .bind(finalOrderStatus, updatedNotesJson, tracking, tracking)
          .run();

        const updatedRow: any = await d1Db
          .prepare(`SELECT * FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`)
          .bind(tracking, tracking)
          .first();

        if (updatedRow) {
          updatedOrder = formatD1Order(updatedRow);
        }
      }
    }

    const localMatch = localOrdersFallback.find(
      (o) => o.tracking.toUpperCase() === tracking || o.id.toUpperCase() === tracking,
    );
    if (localMatch) {
      localMatch.status = finalOrderStatus as any;
      localMatch.paymentMethod = "ziina";
      localMatch.ziinaPaymentId = paymentIntentId || localMatch.ziinaPaymentId;
      localMatch.paidAt = Date.now();
      if (!updatedOrder) {
        updatedOrder = localMatch;
      }
    }

    return c.json({
      success: true,
      verified: isVerified,
      ziinaStatus,
      status: finalOrderStatus,
      message: isVerified
        ? "Payment confirmed and verified with Ziina"
        : "Payment recorded in database",
      order: updatedOrder || { tracking, status: finalOrderStatus, paymentMethod: "ziina" },
      liveZiinaData,
    });
  } catch (err: any) {
    console.error("[confirm-payment Error]:", err);
    return c.json({ success: false, error: err?.message || "Failed to confirm payment" }, 500);
  }
});

// 6. POST & GET /api/orders/:tracking/verify-ziina - Real-time Server verification directly against Ziina API
const verifyZiinaHandler = async (c: any) => {
  const tracking = c.req.param("tracking")?.trim().toUpperCase();
  const query = c.req.query();
  const body = c.req.method === "POST" ? await c.req.json().catch(() => ({})) : {};
  const explicitPaymentId = body?.paymentIntentId || query?.payment_intent_id || query?.id;

  if (!tracking) {
    return c.json({ success: false, error: "Tracking number required" }, 400);
  }

  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;
    const apiKey = (
      env.ZIINA_API_KEY ||
      (typeof process !== "undefined" ? process.env?.ZIINA_API_KEY : "") ||
      ""
    ).trim();

    let targetPaymentId = explicitPaymentId;
    let existingRow: any = null;

    if (d1Db && typeof d1Db.prepare === "function") {
      await ensureOrdersD1Tables(d1Db);
      existingRow = await d1Db
        .prepare(`SELECT * FROM orders WHERE UPPER(tracking_number) = ? OR UPPER(id) = ? LIMIT 1`)
        .bind(tracking, tracking)
        .first();

      if (existingRow && !targetPaymentId && existingRow.notes) {
        try {
          const notes = JSON.parse(existingRow.notes);
          targetPaymentId = notes.ziinaPaymentId;
        } catch {
          // ignore
        }
      }
    }

    if (!targetPaymentId) {
      const localMatch = localOrdersFallback.find(
        (o) => o.tracking.toUpperCase() === tracking || o.id.toUpperCase() === tracking,
      );
      targetPaymentId = localMatch?.ziinaPaymentId;
    }

    if (!targetPaymentId) {
      return c.json(
        {
          success: false,
          error: "لم يتم العثور على معرّف دفع Ziina لهذا الطلب (No Ziina Payment ID found)",
        },
        404,
      );
    }

    // If mock payment ID or no API key
    if (targetPaymentId.startsWith("ziina_mock_") || !apiKey) {
      return c.json({
        success: true,
        verified: true,
        isMock: true,
        status: "completed",
        ziinaStatus: "completed",
        message: "تم التحقق في البيئة التجريبية (Mock / Sandbox Mode)",
        paymentIntent: {
          id: targetPaymentId,
          status: "completed",
          amount: existingRow?.total ? Math.round(Number(existingRow.total) * 100) : 0,
          currency_code: "AED",
        },
      });
    }

    // Real Server-to-Server call to Ziina GET /api/payment_intent/{id}
    const ziinaRes = await fetch(
      `https://api-v2.ziina.com/api/payment_intent/${encodeURIComponent(targetPaymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!ziinaRes.ok) {
      const errText = await ziinaRes.text();
      return c.json(
        {
          success: false,
          error: `خطأ من خادم Ziina (${ziinaRes.status}): ${errText}`,
        },
        502,
      );
    }

    const ziinaData: any = await ziinaRes.json();
    const ziinaStatus = ziinaData.status; // 'completed', 'pending', 'requires_payment_instrument', 'canceled', 'failed'
    const isCompleted = ziinaStatus === "completed";
    const newOrderStatus = isCompleted
      ? "paid"
      : ziinaStatus === "canceled"
        ? "cancelled"
        : "pending";

    // Update D1 Database with the authoritative verified status from Ziina
    if (d1Db && existingRow) {
      let notes: any = {};
      try {
        notes = existingRow.notes ? JSON.parse(existingRow.notes) : {};
      } catch {
        notes = {};
      }

      notes.ziinaPaymentId = ziinaData.id;
      notes.ziinaStatus = ziinaStatus;
      notes.ziinaVerified = isCompleted;
      notes.ziinaVerifiedAt = new Date().toISOString();
      notes.ziinaAmount = (ziinaData.amount || 0) / 100;
      notes.ziinaCurrency = ziinaData.currency_code || "AED";
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
        .bind(newOrderStatus, JSON.stringify(notes), tracking, tracking)
        .run();
    }

    return c.json({
      success: true,
      verified: isCompleted,
      status: newOrderStatus,
      ziinaStatus,
      paymentIntent: ziinaData,
      message: isCompleted
        ? "✓ تم التحقق بنجاح من خوادم Ziina: الدفعة مكتملة ومدفوعة بالكامل."
        : `حالة الدفعة الحالية في Ziina هي: ${ziinaStatus}`,
    });
  } catch (err: any) {
    console.error("[verify-ziina Error]:", err);
    return c.json({ success: false, error: err?.message || "Failed to verify Ziina payment" }, 500);
  }
};

orderApi.get("/:tracking/verify-ziina", verifyZiinaHandler);
orderApi.post("/:tracking/verify-ziina", verifyZiinaHandler);
