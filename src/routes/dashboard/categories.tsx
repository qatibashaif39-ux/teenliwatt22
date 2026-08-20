import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchCategories,
  fetchProducts,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/catalog";

export const Route = createFileRoute("/dashboard/categories")({
  component: DashboardCategories,
});

function DashboardCategories() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const addMut = useMutation({
    mutationFn: () => createCategory(newName.trim(), categories.length + 1),
    onSuccess: () => {
      toast.success("تمت إضافة الصنف");
      setNewName("");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّرت الإضافة"),
  });

  const renameMut = useMutation({
    mutationFn: () => updateCategory(editId!, { name: editName.trim() }),
    onSuccess: () => {
      toast.success("تم تحديث الصنف");
      setEditId(null);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر التحديث"),
  });

  const removeMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("تم حذف الصنف");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر الحذف"),
  });

  const countFor = (id: string) => products.filter((p) => p.category_id === id).length;
  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الأصناف</h1>
      <p className="mt-1 text-sm text-muted-foreground">أضف الأصناف وعدّلها واحذفها.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) addMut.mutate();
        }}
        className="mt-5 flex gap-2"
      >
        <input
          className={field}
          placeholder="اسم الصنف الجديد"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={addMut.isPending || !newName.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {addMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          إضافة
        </button>
      </form>

      {isLoading ? (
        <div className="mt-8 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
      ) : (
        <div className="mt-5 space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4"
            >
              {editId === c.id ? (
                <input
                  className={field + " ml-3"}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              ) : (
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {countFor(c.id)} منتجات
                  </div>
                </div>
              )}
              <div className="flex shrink-0 gap-1">
                {editId === c.id ? (
                  <>
                    <button
                      onClick={() => renameMut.mutate()}
                      className="rounded-lg border border-border p-1.5 text-primary hover:bg-secondary"
                      aria-label="حفظ"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary"
                      aria-label="إلغاء"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditId(c.id);
                        setEditName(c.name);
                      }}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الصنف "${c.name}"؟ ستبقى منتجاته بدون صنف.`))
                          removeMut.mutate(c.id);
                      }}
                      className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
