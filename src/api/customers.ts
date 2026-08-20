import { Hono } from "hono";
import { loadStoreFromR2, saveStoreToR2 } from "../lib/r2store";

export const customerApi = new Hono();

// In-memory fallback for local dev environment when D1 binding is not attached
const localCustomersFallback: any[] = [];

// Helper to format customer row from D1
function formatCustomerRow(row: any) {
  return {
    id: row.id,
    fname: row.fname,
    lname: row.lname,
    email: row.email || undefined,
    phone: row.phone,
    address: row.address,
    emirate: row.emirate,
    totalOrders: Number(row.total_orders || 1),
    totalSpent: Number(row.total_spent || 0),
    lastOrderTracking: row.last_order_tracking || undefined,
    created_at: row.created_at || new Date().toISOString(),
  };
}

// 1. GET /api/customers - Get all registered customers from D1 or R2
customerApi.get("/", async (c) => {
  try {
    const env = (c.env as any) || {};
    const d1Db = env.DB;

    if (d1Db && typeof d1Db.prepare === "function") {
      const { results } = await d1Db
        .prepare(`SELECT * FROM customers ORDER BY created_at DESC`)
        .all();

      if (Array.isArray(results)) {
        const customers = results.map(formatCustomerRow);
        return c.json({ success: true, source: "d1", customers });
      }
    }

    // Load from R2 if D1 is not present
    try {
      const store = await loadStoreFromR2({ env });
      if (store && Array.isArray(store.customers) && store.customers.length > 0) {
        return c.json({ success: true, source: "r2", customers: store.customers });
      }
    } catch (r2Err) {
      console.warn("[GET /api/customers] R2 load warning:", r2Err);
    }

    return c.json({ success: true, source: "local", customers: localCustomersFallback });
  } catch (err: any) {
    console.error("[GET /api/customers Error]:", err);
    return c.json({ success: true, source: "fallback", customers: localCustomersFallback });
  }
});

// 2. POST /api/customers - Register or update a customer directly in D1
customerApi.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { fname, lname, email, phone, address, emirate, totalSpent, lastOrderTracking } = body;

    if (!fname || !phone || !address || !emirate) {
      return c.json({ success: false, error: "Missing required customer fields" }, 400);
    }

    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
    const cleanFname = fname.trim();
    const cleanLname = (lname || "").trim();
    const cleanEmail = email?.trim() || "";
    const cleanAddress = address.trim();
    const cleanEmirate = emirate.trim();
    const spent = Number(totalSpent || 0);
    const tracking = lastOrderTracking || "";
    const customerId = body.id || `cust-${Date.now()}`;
    const createdAtStr = new Date().toISOString();

    const env = (c.env as any) || {};
    const d1Db = env.DB;
    let savedInD1 = false;
    let d1Error: string | null = null;

    if (d1Db && typeof d1Db.prepare === "function") {
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
               last_order_tracking = CASE WHEN excluded.last_order_tracking != '' THEN excluded.last_order_tracking ELSE customers.last_order_tracking END`,
          )
          .bind(
            customerId,
            cleanFname,
            cleanLname,
            cleanEmail,
            cleanPhone,
            cleanAddress,
            cleanEmirate,
            spent,
            tracking,
            createdAtStr,
          )
          .run();

        savedInD1 = true;
      } catch (err: any) {
        console.error("[D1 Save Customer Error]:", err);
        d1Error = err?.message || String(err);
      }
    }

    const record = {
      id: customerId,
      fname: cleanFname,
      lname: cleanLname,
      email: cleanEmail || undefined,
      phone: cleanPhone,
      address: cleanAddress,
      emirate: cleanEmirate,
      totalOrders: 1,
      totalSpent: spent,
      lastOrderTracking: tracking || undefined,
      created_at: createdAtStr,
    };

    // Update local cache
    const existingIndex = localCustomersFallback.findIndex((c) => c.phone === cleanPhone);
    if (existingIndex >= 0) {
      const existing = localCustomersFallback[existingIndex];
      localCustomersFallback[existingIndex] = {
        ...existing,
        fname: cleanFname,
        lname: cleanLname,
        email: cleanEmail || existing.email,
        address: cleanAddress,
        emirate: cleanEmirate,
        totalOrders: existing.totalOrders + 1,
        totalSpent: existing.totalSpent + spent,
        lastOrderTracking: tracking || existing.lastOrderTracking,
      };
    } else {
      localCustomersFallback.unshift(record);
    }

    // Save to R2 Bucket
    saveStoreToR2({ customers: localCustomersFallback }, { env }).catch(() => {});

    return c.json({ success: true, savedInD1, d1Error, customer: record });
  } catch (err: any) {
    console.error("[POST /api/customers Error]:", err);
    return c.json({ success: false, error: err?.message || "Failed to save customer" }, 500);
  }
});
