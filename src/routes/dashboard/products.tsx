import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Sparkles,
  Image as ImageIcon,
  Rss,
  Tag,
  Barcode,
  Sliders,
  ChevronDown,
  ChevronUp,
  Globe,
  Info,
  Scale,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENCY, resolveProductImage } from "@/data/products";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  type ProductRow,
  type ProductInput,
} from "@/lib/catalog";

export const Route = createFileRoute("/dashboard/products")({
  component: DashboardProducts,
});

const PRESET_IMAGES = [
  { label: "تين أحمر", seed: "red-fig" },
  { label: "تين أصفر", seed: "yellow-fig" },
  { label: "تمور فاخرة", seed: "dates" },
  { label: "توت بلدي", seed: "mulberry" },
  { label: "صبار (تين شوكي)", seed: "cactus" },
  { label: "فقع كمأة", seed: "truffle" },
  { label: "لوز أخضر", seed: "almonds" },
];

const GOOGLE_CATEGORY_PRESETS = [
  "Food, Beverages & Tobacco > Food Items > Fruits & Vegetables",
  "Food, Beverages & Tobacco > Food Items > Nuts & Seeds",
  "Food, Beverages & Tobacco > Food Items > Candy & Chocolate",
  "Food, Beverages & Tobacco > Beverages",
  "Home & Garden > Plants > Fresh Flowers & Produce",
];

const empty: ProductInput = {
  name: "",
  description: "",
  price: 0,
  image_url: null,
  seed_key: null,
  available: true,
  category_id: null,
  sort_order: 0,
  minimum_order_quantity: 1,
  maximum_order_quantity: null,
  sku: "",
  brand: "تين ليوا",
  condition: "new",
  unit_weight: "1 كجم",
  google_product_category: "Food, Beverages & Tobacco > Food Items > Fruits & Vegetables",
  custom_label_0: "",
  custom_label_1: "",
  custom_label_2: "",
  metadata: {},
};

function DashboardProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  useEffect(() => {
    const handleUpdate = () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, [qc]);

  const removeMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر الحذف"),
  });

  const list = useMemo(
    () => (cat === "all" ? products : products.filter((p) => p.category_id === cat)),
    [cat, products],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">المنتجات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف منتجات المتجر وعدّلها واحذفها وخصّص الأسعار والكميات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/ads"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-all shadow-xs"
          >
            <Rss className="h-4 w-4 text-orange-500" />
            <span>كتالوج Meta (RSS)</span>
          </Link>
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> منتج جديد
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setCat("all")} className={chip(cat === "all")}>
          الكل ({products.length})
        </button>
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} className={chip(cat === c.id)}>
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          جارٍ تحميل المنتجات…
        </div>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/50">
          <p className="text-muted-foreground font-semibold">
            لا توجد منتجات مضافة في هذا القسم بعد.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إضافة أول منتج
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-xs hover:border-primary/40 transition-colors"
            >
              <img
                src={resolveProductImage({
                  image_url: p.image_url,
                  seed_key: p.seed_key,
                })}
                alt={p.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover border border-border/40 bg-secondary/30"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold text-foreground">{p.name}</span>
                  {p.sku && (
                    <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                      {p.sku}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span>{p.category || "بدون صنف"}</span>
                  {p.brand && p.brand !== "تين ليوا" && <span>• {p.brand}</span>}
                  {p.unit_weight && <span>• {p.unit_weight}</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-black text-primary">
                    {p.price} {CURRENCY}
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    أقل طلب: {p.minimum_order_quantity ?? 1}
                  </span>
                  {p.maximum_order_quantity && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      أقصى طلب: {p.maximum_order_quantity}
                    </span>
                  )}
                  {p.custom_label_0 && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      #{p.custom_label_0}
                    </span>
                  )}
                  {p.metadata &&
                    typeof p.metadata === "object" &&
                    Object.keys(p.metadata).length > 0 && (
                      <span className="rounded-md bg-accent/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {Object.keys(p.metadata).length} مواصفات
                      </span>
                    )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    p.available
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {p.available ? "متوفر" : "غير متوفر"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`حذف المنتج "${p.name}"؟`)) removeMut.mutate(p.id);
                    }}
                    className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            invalidate();
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
    active
      ? "bg-primary text-primary-foreground shadow-xs"
      : "bg-secondary text-muted-foreground hover:text-foreground"
  }`;
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [showMetadata, setShowMetadata] = useState(
    Boolean(
      product?.sku ||
      product?.brand ||
      product?.unit_weight ||
      product?.custom_label_0 ||
      product?.custom_label_1 ||
      product?.custom_label_2 ||
      product?.google_product_category ||
      (product?.metadata &&
        typeof product.metadata === "object" &&
        Object.keys(product.metadata).length > 0),
    ),
  );

  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          seed_key: product.seed_key || null,
          available: product.available,
          category_id: product.category_id,
          sort_order: product.sort_order,
          minimum_order_quantity: product.minimum_order_quantity ?? 1,
          maximum_order_quantity: product.maximum_order_quantity ?? null,
          sku: product.sku || "",
          brand: product.brand || "تين ليوا",
          condition: product.condition || "new",
          unit_weight: product.unit_weight || "1 كجم",
          google_product_category:
            product.google_product_category ||
            "Food, Beverages & Tobacco > Food Items > Fruits & Vegetables",
          custom_label_0: product.custom_label_0 || "",
          custom_label_1: product.custom_label_1 || "",
          custom_label_2: product.custom_label_2 || "",
          metadata: product.metadata || {},
        }
      : {
          ...empty,
          category_id: categories.length > 0 ? categories[0].id : null,
        },
  );

  // Dynamic custom attributes state
  const [customPairs, setCustomPairs] = useState<Array<{ id: string; key: string; value: string }>>(
    () => {
      if (product?.metadata && typeof product.metadata === "object") {
        return Object.entries(product.metadata).map(([k, v], idx) => ({
          id: `attr_${idx}_${Date.now()}`,
          key: k,
          value: String(v),
        }));
      }
      return [
        { id: "attr_1", key: "بلد المنشأ", value: "مزارع ليوا - الإمارات" },
        { id: "attr_2", key: "حالة القطف", value: "طازج يومياً فجر اليوم" },
      ];
    },
  );

  const addCustomPair = (k = "", v = "") => {
    setCustomPairs((prev) => [
      ...prev,
      { id: `attr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, key: k, value: v },
    ]);
  };

  const removeCustomPair = (id: string) => {
    setCustomPairs((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCustomPair = (id: string, fieldName: "key" | "value", val: string) => {
    setCustomPairs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [fieldName]: val } : item)),
    );
  };

  const mut = useMutation({
    mutationFn: async () => {
      // Build clean metadata record from custom pairs
      const metaObj: Record<string, string> = {};
      customPairs.forEach((pair) => {
        const trimmedKey = pair.key.trim();
        if (trimmedKey) {
          metaObj[trimmedKey] = pair.value.trim();
        }
      });

      const submissionData: ProductInput = {
        ...form,
        sku: form.sku?.trim() || null,
        brand: form.brand?.trim() || "تين ليوا",
        condition: form.condition?.trim() || "new",
        unit_weight: form.unit_weight?.trim() || null,
        google_product_category: form.google_product_category?.trim() || null,
        custom_label_0: form.custom_label_0?.trim() || null,
        custom_label_1: form.custom_label_1?.trim() || null,
        custom_label_2: form.custom_label_2?.trim() || null,
        metadata: Object.keys(metaObj).length > 0 ? metaObj : null,
      };

      if (product) {
        await updateProduct(product.id, submissionData);
      } else {
        await createProduct(submissionData);
      }
    },
    onSuccess: () => {
      toast.success(
        product
          ? "تم تحديث المنتج والبيانات الوصفية بنجاح"
          : "تمت إضافة المنتج بنجاح إلى المتجر والكتالوج",
      );
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر حفظ المنتج"),
  });

  const [uploading, setUploading] = useState(false);
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: url, seed_key: null }));
      toast.success("تم رفع صورة المنتج بنجاح وتجهيزها");
    } catch (err: any) {
      toast.error(err?.message ?? "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary transition-colors";

  const previewImage = resolveProductImage({
    image_url: form.image_url,
    seed_key: form.seed_key || (form.category_id === "cat-2" ? "dates" : "red-fig"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border/70 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {product ? "تعديل المنتج والبيانات الوصفية" : "إضافة منتج جديد مع البيانات الوصفية"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product
                ? "تحديث تفاصيل المنتج ووسوم الكتالوج وMeta Ads"
                : "أدخل تفاصيل ومواصفات المنتج ووسوم الكتالوج لإضافته للمتجر"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("يرجى إدخال اسم المنتج");
              return;
            }
            if (!form.price || form.price <= 0) {
              toast.error("يرجى إدخال سعر صحيح للمنتج");
              return;
            }
            mut.mutate();
          }}
          className="mt-4 space-y-4"
        >
          {/* Main Info */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">اسم المنتج *</label>
            <input
              className={field}
              placeholder="مثال: تين أحمر ملكي فاخر (صندوق 1 كجم)"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">وصف المنتج</label>
            <textarea
              className={field}
              placeholder="وصف تفصيلي عن جودة المحصول، الطزاجة، المصدر، والتعبئة..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">السعر ({CURRENCY}) *</label>
              <input
                className={field}
                type="number"
                min={1}
                step={0.01}
                placeholder="85.00"
                required
                value={form.price || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">أقل كمية طلب (Min)</label>
              <input
                className={field}
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={form.minimum_order_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimum_order_quantity: Math.max(1, Number(e.target.value)),
                  })
                }
              />
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-foreground">أقصى كمية طلب (Max)</label>
              <input
                className={field}
                type="number"
                min={form.minimum_order_quantity || 1}
                step={1}
                placeholder="اختياري"
                value={form.maximum_order_quantity ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maximum_order_quantity: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">التصنيف</label>
              <select
                className={field}
                value={form.category_id ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value || null,
                  })
                }
              >
                <option value="">بدون صنف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">ترتيب العرض</label>
              <input
                className={field}
                type="number"
                placeholder="1, 2, 3..."
                value={form.sort_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Product Image Section with presets */}
          <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/15 p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                صورة المنتج
              </label>
              <span className="text-[11px] text-muted-foreground">معاينة فورية</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={previewImage}
                alt="معاينة"
                className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover bg-secondary/50"
              />

              <div className="flex-1 space-y-1.5">
                <div className="text-[11px] text-muted-foreground font-medium">
                  اختر قالباً جاهزاً أو ارفع صورة خاصة:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset) => {
                    const isSelected = form.seed_key === preset.seed && !form.image_url;
                    return (
                      <button
                        key={preset.seed}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            seed_key: preset.seed,
                            image_url: null,
                          }))
                        }
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background py-2 text-xs font-semibold hover:border-primary hover:text-primary transition-colors">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {uploading ? "جارٍ الرفع إلى R2…" : "رفع صورة من الجهاز"}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                  onChange={onPickImage}
                  disabled={uploading}
                />
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  placeholder="أو ألصق رابط صورة (URL)"
                  value={form.image_url ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image_url: e.target.value || null,
                      seed_key: e.target.value ? null : form.seed_key,
                    })
                  }
                />
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                    className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-500/20 transition-colors"
                    title="حذف الصورة والعودة للقوالب"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- METADATA SECTION ---------------- */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex w-full items-center justify-between text-right font-bold text-sm text-foreground hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>البيانات الوصفية للكتالوج وإعلانات Meta (Product Metadata)</span>
                <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-extrabold">
                  {showMetadata ? "مفتوح" : "انقر للتخصيص"}
                </span>
              </div>
              {showMetadata ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showMetadata && (
              <div className="space-y-4 pt-2 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  تُستخدم هذه البيانات الوصفية (Metadata) لربط وتغذية{" "}
                  <strong>خلاصة كتالوج Meta (Facebook / Instagram Ads)</strong>، وربط رمز SKU
                  والباركود، والتصنيف التلقائي، والوسوم المخصصة للحملات الإعلانية.
                </p>

                {/* SKU, Brand, Weight, Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-primary" />
                      رمز التخزين / SKU / Barcode
                    </label>
                    <input
                      className={field}
                      placeholder="مثال: TL-RED-FIG-01"
                      value={form.sku || ""}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      العلامة التجارية (Brand)
                    </label>
                    <input
                      className={field}
                      placeholder="مثال: تين ليوا"
                      value={form.brand || ""}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-primary" />
                      الوزن / وحدة القياس (Unit Weight)
                    </label>
                    <input
                      className={field}
                      placeholder="مثال: 1 كجم أو عبوة 500 جرام"
                      value={form.unit_weight || ""}
                      onChange={(e) => setForm({ ...form, unit_weight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      حالة المنتج (Condition)
                    </label>
                    <select
                      className={field}
                      value={form.condition || "new"}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    >
                      <option value="new">جديد / طازج قطاف اليوم (new)</option>
                      <option value="refurbished">مُعبأ حديثاً (refurbished)</option>
                      <option value="used">معالجة خاصة (used)</option>
                    </select>
                  </div>
                </div>

                {/* Google Product Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    تصنيف جوجل وMeta القياسي (Google Product Category)
                  </label>
                  <input
                    className={field}
                    placeholder="Food, Beverages & Tobacco > Food Items > Fruits & Vegetables"
                    value={form.google_product_category || ""}
                    onChange={(e) => setForm({ ...form, google_product_category: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {GOOGLE_CATEGORY_PRESETS.map((catPreset) => (
                      <button
                        key={catPreset}
                        type="button"
                        onClick={() => setForm({ ...form, google_product_category: catPreset })}
                        className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        {catPreset.split(">").pop()?.trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Labels for Meta Ads */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-primary" />
                      وسوم إعلانات Meta المخصصة (Custom Labels)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      لإدارة مجموعات المنتجات والحملات
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Custom Label 0 (الموسم / الحملة)
                      </label>
                      <input
                        className={field}
                        placeholder="مثال: صيف_2026"
                        value={form.custom_label_0 || ""}
                        onChange={(e) => setForm({ ...form, custom_label_0: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Custom Label 1 (الشريحة / الأولوية)
                      </label>
                      <input
                        className={field}
                        placeholder="مثال: الأكثر_طلباً"
                        value={form.custom_label_1 || ""}
                        onChange={(e) => setForm({ ...form, custom_label_1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Custom Label 2 (الميزة / الشحن)
                      </label>
                      <input
                        className={field}
                        placeholder="مثال: قطاف_يومي"
                        value={form.custom_label_2 || ""}
                        onChange={(e) => setForm({ ...form, custom_label_2: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Key-Value Attributes / Custom Metadata */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      خصائص ومواصفات إضافية (Custom Metadata Attributes)
                    </span>
                    <button
                      type="button"
                      onClick={() => addCustomPair()}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> إضافة خاصية
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <span className="text-[10px] text-muted-foreground self-center">
                      إضافة سريعة:
                    </span>
                    <button
                      type="button"
                      onClick={() => addCustomPair("المنشأ", "مزارع ليوا - أبوظبي")}
                      className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      + المنشأ: ليوا
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomPair("نوع الصندوق", "كرتون فاخر مهوى")}
                      className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      + نوع الصندوق: كرتون فاخر
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomPair("طريقة الحفظ", "يُحفظ مبرداً بين 2-4 درجات")}
                      className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      + طريقة الحفظ
                    </button>
                  </div>

                  {customPairs.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-1">
                      لا توجد خصائص إضافية مضافة، يمكنك النقر على &quot;إضافة خاصية&quot;.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {customPairs.map((pair) => (
                        <div key={pair.id} className="flex items-center gap-2">
                          <input
                            className="w-1/3 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="المفتاح (مثال: المنشأ)"
                            value={pair.key}
                            onChange={(e) => updateCustomPair(pair.id, "key", e.target.value)}
                          />
                          <input
                            className="flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="القيمة (مثال: مزارع ليوا)"
                            value={pair.value}
                            onChange={(e) => updateCustomPair(pair.id, "value", e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomPair(pair.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="حذف الخاصية"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({
                  ...form,
                  available: e.target.checked,
                })
              }
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
            متوفر للطلب الفوري في المتجر والكتالوج
          </label>

          <button
            type="submit"
            disabled={mut.isPending || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-sm transition-all cursor-pointer"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ حفظ المنتج والبيانات الوصفية…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {product
                  ? "حفظ التعديلات والبيانات الوصفية"
                  : "إضافة المنتج والبيانات الوصفية الآن"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
