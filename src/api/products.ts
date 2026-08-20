import { Hono } from "hono";
import { loadStoreFromR2, saveStoreToR2 } from "../lib/r2store";

export const productsApi = new Hono();
export const categoriesApi = new Hono();

export interface CategoryItem {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  seed_key: string | null;
  available: boolean;
  category_id: string | null;
  sort_order: number;
  category: string;
  image: string;
  minimum_order_quantity: number;
  maximum_order_quantity?: number | null;
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat-1", name: "فواكه طازجة", sort_order: 1 },
  { id: "cat-2", name: "تمور فاخرة", sort_order: 2 },
  { id: "cat-3", name: "مكسرات ومكملات", sort_order: 3 },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "تين أحمر ملكي فاخر",
    description: "تين أحمر طازج عسلي من مزارع ليوا الإنسانية، قطاف يومي فائق الجودة والطزاجة.",
    price: 85,
    image_url: null,
    seed_key: "red-fig",
    available: true,
    category_id: "cat-1",
    sort_order: 1,
    category: "فواكه طازجة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-2",
    name: "تين أصفر عسلي ممتاز",
    description: "تين أصفر بلدي سكري، طازج ومختار بعناية لتجربة استثنائية.",
    price: 75,
    image_url: null,
    seed_key: "yellow-fig",
    available: true,
    category_id: "cat-1",
    sort_order: 2,
    category: "فواكه طازجة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-3",
    name: "تمر مجدول فاخر حبة كبيرة",
    description: "تمور مجدول فاخرة منتقاة بأعلى معايير الجودة، طرية وحلوة المذاق.",
    price: 65,
    image_url: null,
    seed_key: "dates",
    available: true,
    category_id: "cat-2",
    sort_order: 3,
    category: "تمور فاخرة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-4",
    name: "توت بلدي طازج",
    description: "توت أسود بلدي منعش وعصيري، غني بمضادات الأكسدة ومقطوف بعناية.",
    price: 45,
    image_url: null,
    seed_key: "mulberry",
    available: true,
    category_id: "cat-1",
    sort_order: 4,
    category: "فواكه طازجة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-5",
    name: "تين شوكي (صبار حلو)",
    description: "صبار تين شوكي مقشر وطازج، نكهة صيفية منعشة وغنية بالفيتامينات.",
    price: 50,
    image_url: null,
    seed_key: "cactus",
    available: true,
    category_id: "cat-1",
    sort_order: 5,
    category: "فواكه طازجة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-6",
    name: "فقع كمأة طازج فاخر",
    description: "فقع كمأة بري طازج منتقى بعناية، نكهة غنية لمحبي المأكولات الفاخرة.",
    price: 180,
    image_url: null,
    seed_key: "truffle",
    available: true,
    category_id: "cat-1",
    sort_order: 6,
    category: "فواكه طازجة",
    image: "",
    minimum_order_quantity: 1,
  },
  {
    id: "prod-7",
    name: "لوز إماراتي بلدي مقرمش",
    description: "لوز بلدي طازج ومقرمش، مثالي للضيافة والتغذية الصحية اليومية.",
    price: 55,
    image_url: null,
    seed_key: "almonds",
    available: true,
    category_id: "cat-3",
    sort_order: 7,
    category: "مكسرات ومكملات",
    image: "",
    minimum_order_quantity: 1,
  },
];

// In-memory runtime state for fast server responses
let memoryProducts: ProductItem[] = [...INITIAL_PRODUCTS];
let memoryCategories: CategoryItem[] = [...INITIAL_CATEGORIES];

let tablesInitialized = false;

async function ensureD1Tables(db: any) {
  if (!db || typeof db.prepare !== "function") return;
  if (tablesInitialized) return;

  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sort_order INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          image_url TEXT,
          seed_key TEXT,
          available INTEGER DEFAULT 1,
          category_id TEXT,
          sort_order INTEGER DEFAULT 1,
          minimum_order_quantity INTEGER DEFAULT 1,
          maximum_order_quantity INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    // Ensure default categories exist in D1 (INSERT OR IGNORE preserves existing user data)
    for (const cat of INITIAL_CATEGORIES) {
      try {
        await db
          .prepare("INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (?, ?, ?)")
          .bind(cat.id, cat.name, cat.sort_order)
          .run();
      } catch (catErr) {
        console.warn("[ensureD1Tables] category seed warning:", catErr);
      }
    }

    tablesInitialized = true;
  } catch (err) {
    console.warn("[ensureD1Tables] Warning:", err);
  }
}

// ---------------- PRODUCTS API ----------------

// GET /api/products
productsApi.get("/", async (c) => {
  const env = (c.env as any) || {};
  const db = env.DB;

  if (db && typeof db.prepare === "function") {
    try {
      await ensureD1Tables(db);
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.sort_order ASC, p.created_at ASC
      `;
      const res = await db.prepare(query).all();
      if (res && Array.isArray(res.results)) {
        const d1Products: ProductItem[] = res.results.map((r: any) => {
          const fallbackCat = INITIAL_CATEGORIES.find((cat) => cat.id === r.category_id)?.name;
          return {
            id: r.id,
            name: r.name,
            description: r.description || "",
            price: Number(r.price),
            image_url: r.image_url || null,
            seed_key: r.seed_key || null,
            available: r.available === 1 || r.available === true,
            category_id: r.category_id || null,
            sort_order: Number(r.sort_order || 0),
            category: r.category_name || fallbackCat || "فواكه طازجة",
            image: r.image_url || "",
            minimum_order_quantity: Number(r.minimum_order_quantity || 1),
            maximum_order_quantity: r.maximum_order_quantity
              ? Number(r.maximum_order_quantity)
              : null,
          };
        });
        memoryProducts = d1Products;
        return c.json({ success: true, products: d1Products });
      }
    } catch (err) {
      console.warn("[GET /api/products] D1 query error, using memory fallback:", err);
    }
  }

  // Load from R2 if D1 is not used
  try {
    const store = await loadStoreFromR2({ env });
    if (store && store.products && store.products.length > 0) {
      memoryProducts = store.products;
    }
  } catch (r2Err) {
    console.warn("[GET /api/products] R2 load warning:", r2Err);
  }

  return c.json({ success: true, products: memoryProducts });
});

// POST /api/products (Create Product)
productsApi.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      description = "",
      price,
      image_url = null,
      seed_key = null,
      available = true,
      category_id = null,
      sort_order,
      minimum_order_quantity = 1,
      maximum_order_quantity = null,
    } = body;

    if (!name || price === undefined || price === null) {
      return c.json({ success: false, error: "اسم المنتج والسعر مطلوبان" }, 400);
    }

    const id = body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let category =
      memoryCategories.find((cat) => cat.id === category_id)?.name ||
      INITIAL_CATEGORIES.find((cat) => cat.id === category_id)?.name ||
      "بدون صنف";

    // If DB is available, check category name directly
    const env = (c.env as any) || {};
    const db = env.DB;
    if (db && typeof db.prepare === "function" && category_id) {
      try {
        const catRow: any = await db
          .prepare("SELECT name FROM categories WHERE id = ?")
          .bind(category_id)
          .first();
        if (catRow?.name) {
          category = catRow.name;
        }
      } catch (catErr) {
        console.warn("[POST /api/products] category lookup warning:", catErr);
      }
    }

    const newProduct: ProductItem = {
      id,
      name: String(name).trim(),
      description: String(description || "").trim(),
      price: Number(price),
      image_url: image_url || null,
      seed_key: seed_key || null,
      available: Boolean(available),
      category_id: category_id || null,
      sort_order: sort_order !== undefined ? Number(sort_order) : memoryProducts.length + 1,
      category,
      image: image_url || "",
      minimum_order_quantity: Math.max(1, Number(minimum_order_quantity || 1)),
      maximum_order_quantity: maximum_order_quantity ? Number(maximum_order_quantity) : null,
    };

    // Update memory products
    memoryProducts.push(newProduct);

    // Save to R2 Bucket
    saveStoreToR2({ products: memoryProducts, categories: memoryCategories }, { env }).catch(
      () => {},
    );

    // Save to Cloudflare D1 if available
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db
          .prepare(
            `INSERT OR REPLACE INTO products (id, name, description, price, image_url, seed_key, available, category_id, sort_order, minimum_order_quantity, maximum_order_quantity, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newProduct.id,
            newProduct.name,
            newProduct.description,
            newProduct.price,
            newProduct.image_url,
            newProduct.seed_key,
            newProduct.available ? 1 : 0,
            newProduct.category_id,
            newProduct.sort_order,
            newProduct.minimum_order_quantity,
            newProduct.maximum_order_quantity,
            new Date().toISOString(),
          )
          .run();
      } catch (err) {
        console.error("[POST /api/products] D1 insert error:", err);
      }
    }

    return c.json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error("[POST /api/products] Error:", err);
    return c.json({ success: false, error: err?.message || "Failed to create product" }, 500);
  }
});

// PUT /api/products/:id (Update Product)
productsApi.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const index = memoryProducts.findIndex((p) => p.id === id);
    if (index >= 0) {
      const existing = memoryProducts[index];
      const categoryId = body.category_id !== undefined ? body.category_id : existing.category_id;
      const categoryName =
        memoryCategories.find((cat) => cat.id === categoryId)?.name || existing.category;

      const updated: ProductItem = {
        ...existing,
        ...body,
        id,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        available: body.available !== undefined ? Boolean(body.available) : existing.available,
        category: categoryName,
        image: body.image_url !== undefined ? body.image_url : existing.image,
        seed_key: body.seed_key !== undefined ? body.seed_key : existing.seed_key,
      };
      memoryProducts[index] = updated;
    }

    const env = (c.env as any) || {};
    saveStoreToR2({ products: memoryProducts }, { env }).catch(() => {});

    const db = env.DB;
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db
          .prepare(
            `UPDATE products SET 
              name = COALESCE(?, name),
              description = COALESCE(?, description),
              price = COALESCE(?, price),
              image_url = COALESCE(?, image_url),
              seed_key = COALESCE(?, seed_key),
              available = COALESCE(?, available),
              category_id = COALESCE(?, category_id),
              sort_order = COALESCE(?, sort_order),
              minimum_order_quantity = COALESCE(?, minimum_order_quantity),
              maximum_order_quantity = COALESCE(?, maximum_order_quantity)
             WHERE id = ?`,
          )
          .bind(
            body.name ?? null,
            body.description ?? null,
            body.price !== undefined ? Number(body.price) : null,
            body.image_url ?? null,
            body.seed_key ?? null,
            body.available !== undefined ? (body.available ? 1 : 0) : null,
            body.category_id ?? null,
            body.sort_order !== undefined ? Number(body.sort_order) : null,
            body.minimum_order_quantity !== undefined ? Number(body.minimum_order_quantity) : null,
            body.maximum_order_quantity !== undefined ? Number(body.maximum_order_quantity) : null,
            id,
          )
          .run();
      } catch (err) {
        console.warn("[PUT /api/products/:id] D1 update warning:", err);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to update product" }, 500);
  }
});

// DELETE /api/products/:id (Delete Product)
productsApi.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    memoryProducts = memoryProducts.filter((p) => p.id !== id);

    const env = (c.env as any) || {};
    saveStoreToR2({ products: memoryProducts }, { env }).catch(() => {});

    const db = env.DB;
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      } catch (err) {
        console.warn("[DELETE /api/products/:id] D1 delete warning:", err);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to delete product" }, 500);
  }
});

// ---------------- CATEGORIES API ----------------

// GET /api/categories
categoriesApi.get("/", async (c) => {
  const env = (c.env as any) || {};
  const db = env.DB;

  if (db && typeof db.prepare === "function") {
    try {
      await ensureD1Tables(db);
      const res = await db
        .prepare("SELECT * FROM categories ORDER BY sort_order ASC, name ASC")
        .all();
      if (res && res.results && res.results.length > 0) {
        const d1Categories: CategoryItem[] = res.results.map((r: any) => ({
          id: r.id,
          name: r.name,
          sort_order: Number(r.sort_order || 1),
        }));
        memoryCategories = d1Categories;
        return c.json({ success: true, categories: d1Categories });
      }
    } catch (err) {
      console.warn("[GET /api/categories] D1 query warning:", err);
    }
  }

  // Load from R2 if D1 is not present
  try {
    const store = await loadStoreFromR2({ env });
    if (store && store.categories && store.categories.length > 0) {
      memoryCategories = store.categories;
    }
  } catch (r2Err) {
    console.warn("[GET /api/categories] R2 load warning:", r2Err);
  }

  return c.json({ success: true, categories: memoryCategories });
});

// POST /api/categories (Create Category)
categoriesApi.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, sort_order } = body;
    if (!name) return c.json({ success: false, error: "اسم الصنف مطلوب" }, 400);

    const newCat: CategoryItem = {
      id: body.id || `cat_${Date.now()}`,
      name: String(name).trim(),
      sort_order: sort_order !== undefined ? Number(sort_order) : memoryCategories.length + 1,
    };

    memoryCategories.push(newCat);

    const env = (c.env as any) || {};
    saveStoreToR2({ categories: memoryCategories }, { env }).catch(() => {});

    const db = env.DB;
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db
          .prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)")
          .bind(newCat.id, newCat.name, newCat.sort_order)
          .run();
      } catch (err) {
        console.warn("[POST /api/categories] D1 insert warning:", err);
      }
    }

    return c.json({ success: true, category: newCat });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to create category" }, 500);
  }
});

// PUT /api/categories/:id (Update Category)
categoriesApi.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const index = memoryCategories.findIndex((cat) => cat.id === id);
    if (index >= 0) {
      memoryCategories[index] = { ...memoryCategories[index], ...body, id };
    }

    const env = (c.env as any) || {};
    saveStoreToR2({ categories: memoryCategories }, { env }).catch(() => {});

    const db = env.DB;
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db
          .prepare(
            "UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?",
          )
          .bind(body.name ?? null, body.sort_order ?? null, id)
          .run();
      } catch (err) {
        console.warn("[PUT /api/categories/:id] D1 update warning:", err);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to update category" }, 500);
  }
});

// DELETE /api/categories/:id (Delete Category)
categoriesApi.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    memoryCategories = memoryCategories.filter((cat) => cat.id !== id);

    const env = (c.env as any) || {};
    saveStoreToR2({ categories: memoryCategories }, { env }).catch(() => {});

    const db = env.DB;
    if (db && typeof db.prepare === "function") {
      try {
        await ensureD1Tables(db);
        await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
      } catch (err) {
        console.warn("[DELETE /api/categories/:id] D1 delete warning:", err);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || "Failed to delete category" }, 500);
  }
});
