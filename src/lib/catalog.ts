import { resolveProductImage, type Product } from "@/data/products";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

// Raw product row joined with category, plus admin-only fields.
export interface ProductRow {
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
  sku?: string | null;
  brand?: string | null;
  condition?: string | null;
  unit_weight?: string | null;
  google_product_category?: string | null;
  custom_label_0?: string | null;
  custom_label_1?: string | null;
  custom_label_2?: string | null;
  metadata?: Record<string, any> | string | null;
}

export const FALLBACK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "فواكه طازجة", sort_order: 1 },
  { id: "cat-2", name: "تمور فاخرة", sort_order: 2 },
  { id: "cat-3", name: "مكسرات ومكملات", sort_order: 3 },
];

export const FALLBACK_PRODUCTS: ProductRow[] = [
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
    image: resolveProductImage({ seed_key: "red-fig" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "yellow-fig" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "dates" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "mulberry" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "cactus" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "truffle" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
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
    image: resolveProductImage({ seed_key: "almonds" }),
    minimum_order_quantity: 1,
    maximum_order_quantity: null,
  },
];

const CAT_STORAGE_KEY = "d1_categories_store";
const PROD_STORAGE_KEY = "d1_products_store";

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch (err) {
    console.warn("[fetchCategories] Server fetch warning:", err);
  }
  return FALLBACK_CATEGORIES;
}

export async function fetchProducts(): Promise<ProductRow[]> {
  try {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
        const formatted: ProductRow[] = data.products.map((p: any) => ({
          ...p,
          image:
            p.image_url || resolveProductImage({ image_url: p.image_url, seed_key: p.seed_key }),
          minimum_order_quantity: Number(p.minimum_order_quantity || 1),
          maximum_order_quantity: p.maximum_order_quantity
            ? Number(p.maximum_order_quantity)
            : null,
        }));
        return formatted;
      }
    }
  } catch (err) {
    console.warn("[fetchProducts] Server fetch warning:", err);
  }
  return FALLBACK_PRODUCTS;
}

// Maps a product row to the unified Product shape used by the storefront/cart.
export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image:
      row.image ||
      row.image_url ||
      resolveProductImage({ image_url: row.image_url, seed_key: row.seed_key }),
    category: row.category || "فواكه طازجة",
    available: row.available !== false,
    minimum_order_quantity: row.minimum_order_quantity || 1,
    maximum_order_quantity: row.maximum_order_quantity ?? null,
  };
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  seed_key?: string | null;
  available: boolean;
  category_id: string | null;
  sort_order: number;
  minimum_order_quantity: number;
  maximum_order_quantity?: number | null;
  sku?: string | null;
  brand?: string | null;
  condition?: string | null;
  unit_weight?: string | null;
  google_product_category?: string | null;
  custom_label_0?: string | null;
  custom_label_1?: string | null;
  custom_label_2?: string | null;
  metadata?: Record<string, any> | string | null;
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const categories = await fetchCategories();
  const cat = categories.find((c) => c.id === input.category_id);
  const resolvedImage =
    input.image_url ||
    resolveProductImage({
      image_url: input.image_url,
      seed_key: input.seed_key || (input.category_id === "cat-2" ? "dates" : "red-fig"),
    });

  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      image_url: input.image_url || null,
      seed_key: input.seed_key || null,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في إضافة المنتج إلى قاعدة البيانات");
  }

  const data = await res.json();
  if (data?.product) {
    const confirmed: ProductRow = {
      ...data.product,
      category: data.product.category || cat?.name || "بدون صنف",
      image:
        data.product.image_url ||
        resolveProductImage({
          image_url: data.product.image_url,
          seed_key: data.product.seed_key,
        }),
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("products_updated"));
    }
    return confirmed;
  }

  const fallbackProd: ProductRow = {
    id: `prod_${Date.now()}`,
    name: input.name.trim(),
    description: (input.description || "").trim(),
    price: Number(input.price),
    image_url: input.image_url,
    seed_key: input.seed_key || null,
    available: input.available,
    category_id: input.category_id,
    sort_order: input.sort_order || 1,
    category: cat?.name || "بدون صنف",
    image: resolvedImage,
    minimum_order_quantity: input.minimum_order_quantity || 1,
    maximum_order_quantity: input.maximum_order_quantity
      ? Number(input.maximum_order_quantity)
      : null,
  };
  return fallbackProd;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في تحديث المنتج");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("products_updated"));
  }
}

export async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في حذف المنتج");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("products_updated"));
  }
}

export async function createCategory(name: string, sort_order: number) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), sort_order: sort_order || 1 }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في إضافة التصنيف");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("categories_updated"));
  }
}

export async function updateCategory(id: string, fields: { name?: string; sort_order?: number }) {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في تعديل التصنيف");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("categories_updated"));
  }
}

export async function deleteCategory(id: string) {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "فشل في حذف التصنيف");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("categories_updated"));
  }
}

// Upload image to Cloudflare R2 Storage (with automatic compression & fallback)
export async function uploadProductImage(file: File): Promise<string> {
  // Compress image on client-side before upload to optimize speed and size
  const compressedDataUrl: string = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof window === "undefined" || !e.target?.result) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("teenliwa_admin_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Attempt 1: Upload via Multipart Form-Data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }

    // Attempt 2: If Multipart failed, try Base64 payload
    if (compressedDataUrl) {
      const base64Res = await fetch("/api/storage/upload", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64: compressedDataUrl,
          filename: file.name || `product_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          folder: "products",
        }),
      });

      if (base64Res.ok) {
        const data = await base64Res.json();
        if (data?.url) {
          return data.url;
        }
      }
    }
  } catch (apiErr) {
    console.warn("Storage upload API error, falling back to optimized image string:", apiErr);
  }

  // Fallback to compressed Data URL so saving is NEVER blocked
  if (compressedDataUrl) {
    return compressedDataUrl;
  }

  throw new Error("تعذّر قراءة أو معالجة ملف الصورة");
}

// Delivery zones removed — flat fee per emirate. See @/lib/emirates.
