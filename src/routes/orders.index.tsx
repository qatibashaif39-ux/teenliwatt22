import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReceiptText,
  ChevronLeft,
  Loader2,
  FileText,
  CheckCircle2,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { CURRENCY } from "@/data/products";
import { getMyOrders, isCancelled, getPaymentStatusInfo, type Order } from "@/lib/orders";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "إيصالاتي وطلباتي — تين ليوا" },
      { name: "description", content: "استعرض إيصالات طلباتك وحالات الدفع من تين ليوا." },
    ],
  }),
  component: Orders,
});

type StatusFilter = "all" | "paid" | "cod" | "cancelled";
type TimeFilter = "all" | "7d" | "30d";
type SortOrder = "newest" | "oldest";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "جميع الإيصالات" },
  { key: "paid", label: "تم الدفع" },
  { key: "cod", label: "الدفع عند الاستلام" },
  { key: "cancelled", label: "ملغية" },
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "all", label: "كل الأوقات" },
  { key: "7d", label: "آخر 7 أيام" },
  { key: "30d", label: "آخر 30 يوم" },
];

const PAGE_SIZE = 5;
const DAY = 1000 * 60 * 60 * 24;

function Orders() {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: getMyOrders,
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [time, setTime] = useState<TimeFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const now = Date.now();
    const result = all.filter((o: Order) => {
      if (status === "paid" && o.status !== "paid") return false;
      if (status === "cod" && (o.status === "paid" || (o as any).paymentMethod !== "cod"))
        return false;
      if (status === "cancelled" && !isCancelled(o.status)) return false;
      if (time === "7d" && now - o.createdAt > 7 * DAY) return false;
      if (time === "30d" && now - o.createdAt > 30 * DAY) return false;
      return true;
    });
    result.sort((a: Order, b: Order) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
    return result;
  }, [all, status, time, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-muted-foreground hover:text-foreground"
    }`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <ReceiptText className="h-6 w-6 text-primary" /> إيصالات طلباتي
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            استعراض فواتير وإيصالات طلباتك وحالات الدفع في تين ليوا.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => resetPage(setStatus)(f.key)}
              className={chip(status === f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => resetPage(setTime)(f.key)}
              className={chip(time === f.key)}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => resetPage(setSort)(sort === "newest" ? "oldest" : "newest")}
            className={chip(false)}
          >
            {sort === "newest" ? "الأحدث أولاً" : "الأقدم أولاً"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : paged.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">لا توجد إيصالات طلبات مطابقة.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {paged.map((order: Order) => {
            const paymentInfo = getPaymentStatusInfo(order);
            const isPaid = order.status === "paid";
            const isCod = (order as any).paymentMethod === "cod" || !(order as any).paymentMethod;
            const isCancelled = order.status === "cancelled";

            return (
              <Link
                key={order.id}
                to="/orders/$tracking"
                params={{ tracking: order.tracking }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-primary hover:shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40"
                        : isCancelled
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40"
                          : isCod
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/40"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isCancelled ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : isCod ? (
                      <Banknote className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-foreground flex items-center gap-2">
                      <span>{order.tracking}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentInfo.badgeClass}`}
                      >
                        {paymentInfo.label}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("ar")} · {order.items.length}{" "}
                      منتجات · {order.emirate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                  <div className="text-right rtl:text-right ltr:text-left">
                    <div className="font-black text-foreground text-base">
                      {order.total.toFixed(2)} {CURRENCY}
                    </div>
                    <span className="text-xs text-primary font-bold inline-flex items-center gap-0.5">
                      عرض الإيصال <ChevronLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold disabled:opacity-40"
          >
            السابق
          </button>
          <span className="text-sm text-muted-foreground">
            صفحة {current} من {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold disabled:opacity-40"
          >
            التالي
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          العودة للمتجر
        </Link>
      </div>
    </main>
  );
}
