import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X, Sparkles, Image as ImageIcon } from "lucide-react";
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
                <div className="truncate font-bold text-foreground">{p.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground font-medium">
                  {p.category || "بدون صنف"}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
        }
      : {
          ...empty,
          category_id: categories.length > 0 ? categories[0].id : null,
        },
  );

  const mut = useMutation({
    mutationFn: async () => {
      if (product) {
        await updateProduct(product.id, form);
      } else {
        await createProduct(form);
      }
    },
    onSuccess: () => {
      toast.success(product ? "تم تحديث المنتج بنجاح" : "تمت إضافة المنتج بنجاح إلى المتجر");
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
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors";

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
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">
              {product ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product ? "تحديث تفاصيل وسعر المنتج" : "أدخل تفاصيل ومواصفات المنتج لإضافته للمتجر"}
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
          className="mt-4 space-y-3.5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">اسم المنتج *</label>
            <input
              className={field}
              placeholder="مثال: تين أحمر ملكي (صندوق 1 كجم)"
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
            متوفر للطلب الفوري
          </label>

          <button
            type="submit"
            disabled={mut.isPending || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-sm transition-all cursor-pointer"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ حفظ المنتج…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {product ? "حفظ التعديلات" : "إضافة المنتج الآن"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
