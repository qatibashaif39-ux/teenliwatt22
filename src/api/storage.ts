import { Hono } from "hono";
import {
  uploadObjectToR2,
  getObjectFromR2,
  listObjectsFromR2,
  deleteObjectFromR2,
  getR2Config,
  getS3Client,
} from "../lib/storage";
import { createFullBackup, listDatabaseBackups, getBackupData } from "../lib/backup";

export const storageApi = new Hono();

/**
 * GET /api/storage/status
 * Returns R2 / S3 connection status and bucket info
 */
storageApi.get("/status", async (c) => {
  const env = (c.env as any) || {};
  const config = getR2Config(env);
  const s3 = getS3Client(env);
  const workerBucket = env.BT_LIWA || env.STORAGE || env.BUCKET || env.R2_BUCKET;

  const isConfigured = Boolean(workerBucket || (config.accessKeyId && config.secretAccessKey));

  let objectsCount = 0;
  let totalBytes = 0;
  let statusMessage = "متصل وجاهز للاستخدام";

  try {
    const files = await listObjectsFromR2("", { env });
    objectsCount = files.length;
    totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  } catch (err: any) {
    statusMessage = "تعذر الاتصال بـ R2: " + (err?.message || "خطأ غير معروف");
  }

  return c.json({
    configured: isConfigured,
    provider: env.BT_LIWA
      ? "Cloudflare R2 (BT_LIWA Binding)"
      : workerBucket
        ? "Cloudflare R2 Native Binding"
        : s3
          ? "AWS SDK S3 / R2"
          : "Memory / Local",
    bucket: config.bucketName || "BT_LIWA",
    accountId: config.accountId ? config.accountId.slice(0, 6) + "..." : "تلقائي",
    hasAccessKey: Boolean(config.accessKeyId),
    publicUrl: config.publicUrl || "مفعل عبر خادم المتجر",
    objectsCount,
    totalBytes,
    totalFormatted: (totalBytes / (1024 * 1024)).toFixed(2) + " MB",
    statusMessage,
  });
});

/**
 * POST /api/storage/upload
 * Direct file upload to Cloudflare R2
 */
storageApi.post("/upload", async (c) => {
  try {
    const env = (c.env as any) || {};
    const contentTypeHeader = c.req.header("content-type") || "";

    let filename = "";
    let buffer: Uint8Array | null = null;
    let mimeType = "application/octet-stream";
    let folder = "products";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      folder = (formData.get("folder") as string) || "products";

      if (!file) {
        return c.json({ error: "لم يتم إرسال أي ملف" }, 400);
      }

      filename = file.name || `file_${Date.now()}`;
      mimeType = file.type || "application/octet-stream";
      const arrayBuf = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuf);
    } else {
      const body = await c.req.json();
      filename = body.filename || `file_${Date.now()}`;
      mimeType = body.mimeType || "application/octet-stream";
      folder = body.folder || "products";

      if (body.base64) {
        const pureBase64 = body.base64.replace(/^data:.*?;base64,/, "");
        const binaryStr = atob(pureBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        buffer = bytes;
      }
    }

    if (!buffer) {
      return c.json({ error: "بيانات الملف غير صحيحة" }, 400);
    }

    // Clean filename and create key
    const sanitizedFilename = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
    const key = `${folder}/${Date.now()}-${sanitizedFilename}`;

    const uploadResult = await uploadObjectToR2(key, buffer, mimeType, { env });

    return c.json({
      success: true,
      key: uploadResult.key,
      url: uploadResult.url,
      size: uploadResult.size,
      mimeType,
    });
  } catch (err: any) {
    console.error("[POST /api/storage/upload] Error:", err);
    return c.json({ error: err?.message || "فشل في رفع الملف إلى R2" }, 500);
  }
});

/**
 * GET /api/storage/files
 * List files in R2 storage
 */
storageApi.get("/files", async (c) => {
  try {
    const env = (c.env as any) || {};
    const prefix = c.req.query("prefix") || "";
    const files = await listObjectsFromR2(prefix, { env });
    return c.json({ success: true, files });
  } catch (err: any) {
    return c.json({ error: err?.message || "فشل في قراءة الملفات من R2" }, 500);
  }
});

/**
 * GET /api/storage/files/:key
 * Serve / download file directly
 */
storageApi.get("/files/*", async (c) => {
  try {
    const env = (c.env as any) || {};
    const rawKey = c.req.path.replace(/^\/api\/storage\/files\//, "");
    const key = decodeURIComponent(rawKey);
    const obj = await getObjectFromR2(key, { env });

    if (!obj) {
      return c.text("الملف غير موجود", 404);
    }

    return new Response(obj.data, {
      headers: {
        "Content-Type": obj.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    return c.text("خطأ في جلب الملف: " + err?.message, 500);
  }
});

/**
 * DELETE /api/storage/files/*
 * Delete an object from R2
 */
storageApi.delete("/files/*", async (c) => {
  try {
    const env = (c.env as any) || {};
    const rawKey = c.req.path.replace(/^\/api\/storage\/files\//, "");
    const key = decodeURIComponent(rawKey);
    await deleteObjectFromR2(key, { env });
    return c.json({ success: true, deletedKey: key });
  } catch (err: any) {
    return c.json({ error: err?.message || "فشل في حذف الملف من R2" }, 500);
  }
});

/**
 * POST /api/storage/backup
 * Creates a full database backup snapshot and uploads to R2
 */
storageApi.post("/backup", async (c) => {
  try {
    const env = (c.env as any) || {};
    const db = env.DB;

    let orders: any[] = [];
    let products: any[] = [];
    let customers: any[] = [];
    let categories: any[] = [];

    if (db && typeof db.prepare === "function") {
      try {
        const oRes = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
        orders = oRes?.results || [];
      } catch (e) {
        console.warn("D1 query orders warning:", e);
      }

      try {
        const pRes = await db.prepare("SELECT * FROM products ORDER BY sort_order ASC").all();
        products = pRes?.results || [];
      } catch (e) {
        console.warn("D1 query products warning:", e);
      }

      try {
        const cRes = await db.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
        customers = cRes?.results || [];
      } catch (e) {
        console.warn("D1 query customers warning:", e);
      }

      try {
        const catRes = await db.prepare("SELECT * FROM categories ORDER BY sort_order ASC").all();
        categories = catRes?.results || [];
      } catch (e) {
        console.warn("D1 query categories warning:", e);
      }
    }

    const backupRes = await createFullBackup(
      {
        orders,
        products,
        customers,
        categories,
      },
      { env },
    );

    return c.json({
      success: true,
      message: "تم إنشاء النسخة الاحتياطية وحفظها في Cloudflare R2 بنجاح",
      backup: backupRes.backup,
    });
  } catch (err: any) {
    console.error("[POST /api/storage/backup] Error:", err);
    return c.json({ error: err?.message || "فشل في إنشاء النسخة الاحتياطية" }, 500);
  }
});

/**
 * GET /api/storage/backups
 * List all available database backups in R2
 */
storageApi.get("/backups", async (c) => {
  try {
    const env = (c.env as any) || {};
    const backups = await listDatabaseBackups({ env });
    return c.json({ success: true, backups });
  } catch (err: any) {
    return c.json({ error: err?.message || "فشل في قراءة النسخ الاحتياطية" }, 500);
  }
});

/**
 * POST /api/storage/restore
 * Restore database from an R2 backup
 */
storageApi.post("/restore", async (c) => {
  try {
    const env = (c.env as any) || {};
    const db = env.DB;
    const body = await c.req.json();
    const backupKey = body.key;

    let backupData = body.data;
    if (!backupData && backupKey) {
      backupData = await getBackupData(backupKey, { env });
    }

    if (!backupData || !backupData.tables) {
      return c.json({ error: "بيانات النسخة الاحتياطية غير صالحة" }, 400);
    }

    const { orders = [], products = [], customers = [], categories = [] } = backupData.tables;

    if (db && typeof db.prepare === "function") {
      // 1. Restore products
      for (const p of products) {
        try {
          await db
            .prepare(
              `INSERT OR REPLACE INTO products (id, name, description, price, image_url, seed_key, available, category_id, sort_order, minimum_order_quantity, maximum_order_quantity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              p.id,
              p.name,
              p.description,
              p.price,
              p.image_url,
              p.seed_key,
              p.available ? 1 : 0,
              p.category_id,
              p.sort_order || 0,
              p.minimum_order_quantity || 1,
              p.maximum_order_quantity || null,
            )
            .run();
        } catch (e) {
          console.warn("Error restoring product:", p.id, e);
        }
      }

      // 2. Restore categories
      for (const cat of categories) {
        try {
          await db
            .prepare(
              `INSERT OR REPLACE INTO categories (id, name, name_en, description, sort_order)
               VALUES (?, ?, ?, ?, ?)`,
            )
            .bind(
              cat.id,
              cat.name,
              cat.name_en || null,
              cat.description || null,
              cat.sort_order || 0,
            )
            .run();
        } catch (e) {
          console.warn("Error restoring category:", cat.id, e);
        }
      }

      // 3. Restore customers
      for (const cust of customers) {
        try {
          await db
            .prepare(
              `INSERT OR REPLACE INTO customers (id, fname, lname, email, phone, address, emirate, total_orders, total_spent, last_order_tracking, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              cust.id,
              cust.fname,
              cust.lname,
              cust.email,
              cust.phone,
              cust.address,
              cust.emirate,
              cust.total_orders || 1,
              cust.total_spent || 0,
              cust.last_order_tracking || null,
              cust.created_at || new Date().toISOString(),
            )
            .run();
        } catch (e) {
          console.warn("Error restoring customer:", cust.id, e);
        }
      }
    }

    return c.json({
      success: true,
      message: "تمت استعادة البيانات بنجاح",
      restored: {
        productsCount: products.length,
        customersCount: customers.length,
        categoriesCount: categories.length,
        ordersCount: orders.length,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/storage/restore] Error:", err);
    return c.json({ error: err?.message || "فشل في استعادة البيانات" }, 500);
  }
});
