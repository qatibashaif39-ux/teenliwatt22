import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { CURRENCY } from "@/data/products";
import { getAllOrders, isCancelled, STATUS_STEPS, statusIndex, type Order } from "@/lib/orders";

export const Route = createFileRoute("/dashboard/orders/")({
  component: DashboardOrders,
});

function statusLabel(order: Order) {
  if (order.status === "cancelled") return "ملغي";
  return STATUS_STEPS[statusIndex(order.status)]?.label ?? "";
}

type Filter = "all" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار الدفع" },
  { key: "paid", label: "تم الدفع" },
  { key: "processing", label: "قيد التجهيز" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التوصيل" },
  { key: "cancelled", label: "ملغية" },
];

function DashboardOrders() {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: getAllOrders,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    return all.filter((o: Order) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (term && !o.tracking.toUpperCase().includes(term) && !o.name.toUpperCase().includes(term))
        return false;
      return true;
    });
  }, [all, filter, q]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الطلبات</h1>
      <p className="mt-1 text-sm text-muted-foreground">إدارة ومتابعة جميع الطلبات.</p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث برقم التتبع أو اسم العميل..."
        className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد طلبات مطابقة.
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {filtered.map((o: Order) => (
            <Link
              key={o.id}
              to="/dashboard/orders/$tracking"
              params={{ tracking: o.tracking }}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary"
            >
              <div>
                <div className="font-bold text-primary">{o.tracking}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{o.name}</span>
                  <span>·</span>
                  <span>{new Date(o.createdAt).toLocaleDateString("ar")}</span>
                  {o.paymentMethod === "ziina" || o.ziinaPaymentId ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                      Ziina Gateway
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
                      دفع عند الاستلام
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="font-semibold">
                    {o.total.toFixed(2)} {CURRENCY}
                  </div>
                  <div
                    className={`mt-1 text-xs font-bold ${isCancelled(o.status) ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {statusLabel(o)}
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
