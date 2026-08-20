import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReceiptText,
  Search,
  FileText,
  CheckCircle2,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { CURRENCY } from "@/data/products";
import { findOrder, formatDateTime, getPaymentStatusInfo } from "@/lib/orders";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  head: () => ({
    meta: [
      { title: "استعراض إيصال الطلب — تين ليوا" },
      { name: "description", content: "استعرض إيصال طلبك وحالة الدفع عبر رقم الإيصال." },
    ],
  }),
  component: TrackReceipt,
});

function TrackReceipt() {
  const { code } = useSearch({ from: "/track" });
  const [query, setQuery] = useState(code ?? "");
  const [active, setActive] = useState(code ?? "");

  useEffect(() => {
    if (code) setActive(code);
  }, [code]);

  const { data: order, isFetching } = useQuery({
    queryKey: ["order", active],
    queryFn: () => findOrder(active),
    enabled: !!active,
  });

  const searched = !!active && !isFetching;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold">
        <ReceiptText className="h-6 w-6 text-primary" /> استعراض إيصال الطلب
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        أدخل رقم الإيصال أو الطلب (مثال: TL-XXXXXX) للاطلاع على الفاتورة وحالة الدفع.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActive(query.trim());
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثال: TL-1234ABCDEF"
          className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Search className="h-4 w-4" /> بحث
        </button>
      </form>

      {searched && !order && (
        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          لم نجد إيصالاً بهذا الرقم. يرجى التأكد من الرمز والمحاولة مجدداً.
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-5">
          {/* Payment Status Banner */}
          {(() => {
            const paymentInfo = getPaymentStatusInfo(order);
            const isPaid = order.status === "paid";
            const isCod = (order as any).paymentMethod === "cod" || !(order as any).paymentMethod;
            const isCancelled = order.status === "cancelled";

            return (
              <div
                className={`rounded-2xl border p-5 transition-all ${
                  isPaid
                    ? "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20"
                    : isCancelled
                      ? "border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20"
                      : isCod
                        ? "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20"
                        : "border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isPaid
                          ? "bg-emerald-600 text-white"
                          : isCancelled
                            ? "bg-rose-600 text-white"
                            : isCod
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
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
                      <div className="text-xs font-semibold text-muted-foreground">حالة الدفع</div>
                      <div className="text-sm font-bold text-foreground">{paymentInfo.label}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${paymentInfo.badgeClass}`}
                  >
                    {paymentInfo.label}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Receipt Info Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-xs text-muted-foreground">رقم الإيصال</span>
              <span className="font-extrabold text-primary font-mono">{order.tracking}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">اسم العميل:</span>
              <span className="font-bold text-foreground">{order.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الإمارة والتوصيل:</span>
              <span className="font-semibold text-foreground">{order.emirate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">تاريخ وتوقيت الطلب:</span>
              <span className="font-medium text-foreground">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>

          {/* Summary & View Full Receipt Button */}
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 font-bold text-sm text-muted-foreground">أصناف الفاتورة</h2>
            <div className="space-y-2">
              {order.items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {i.name} × {i.qty}
                  </span>
                  <span className="font-semibold">
                    {(i.price * i.qty).toFixed(2)} {CURRENCY}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span>
                  {order.subtotal?.toFixed(2) || (order.total - order.deliveryFee).toFixed(2)}{" "}
                  {CURRENCY}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>رسوم التوصيل ({order.emirate})</span>
                <span>
                  {order.deliveryFee?.toFixed(2) || "0.00"} {CURRENCY}
                </span>
              </div>
              {order.tax && order.tax > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>ضريبة القيمة المضافة {order.taxRate ? `(${order.taxRate}%)` : ""}</span>
                  <span>
                    {order.tax.toFixed(2)} {CURRENCY}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border/60 pt-2 text-base font-black">
                <span>المبلغ الكلي</span>
                <span className="text-primary text-lg">
                  {order.total.toFixed(2)} {CURRENCY}
                </span>
              </div>
            </div>

            <Link
              to="/orders/$tracking"
              params={{ tracking: order.tracking }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <FileText className="h-4 w-4" />
              عرض وطباعة الإيصال الرسمي
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
