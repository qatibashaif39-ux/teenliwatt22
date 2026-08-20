import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { CURRENCY } from "@/data/products";
import {
  findOrder,
  formatDateTime,
  getTimeline,
  isCancelled,
  verifyZiinaOrderPayment,
} from "@/lib/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/orders/$tracking")({
  component: DashboardOrderDetail,
});

function DashboardOrderDetail() {
  const { tracking } = useParams({ from: "/dashboard/orders/$tracking" });
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", tracking],
    queryFn: () => findOrder(tracking),
  });

  const handleVerifyWithZiina = async () => {
    if (!order) return;
    setVerifying(true);
    try {
      const res = await verifyZiinaOrderPayment(order.tracking, order.ziinaPaymentId);
      setVerificationResult(res);
      if (res.success) {
        toast.success(res.message || "تم التحقق من حالة الدفع بنجاح");
        queryClient.invalidateQueries({ queryKey: ["order", tracking] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      } else {
        toast.error(res.error || res.message || "تعذر التحقق من خوادم Ziina");
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء الاتصال بخادم Ziina");
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h1 className="mt-4 text-xl font-bold">لم نجد هذا الطلب</h1>
        <Link
          to="/dashboard/orders"
          className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          العودة للطلبات
        </Link>
      </div>
    );
  }

  const cancelled = isCancelled(order.status);
  const isPaid = order.status === "paid";
  const isZiina = order.paymentMethod === "ziina" || Boolean(order.ziinaPaymentId);

  return (
    <div>
      <Link
        to="/dashboard/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> الطلبات
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">تفاصيل الطلب</h1>
          <div className="mt-1 font-bold text-primary">{order.tracking}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/orders/${order.tracking}` as any}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> عرض إيصال العميل
          </Link>
        </div>
      </div>

      {/* Ziina Verification & Audit Box */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isPaid
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isPaid ? <ShieldCheck className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">تدقيق بوابة الدفع (Ziina Gateway Audit)</h2>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> مدفوع ومؤكد
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> الدفع غير مؤكد أو عند الاستلام
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                فحص وتأكيد المعاملة مباشرة عبر استعلام خوادم{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]" dir="ltr">
                  GET https://api-v2.ziina.com/api/payment_intent/&#123;id&#125;
                </code>
              </p>
            </div>
          </div>

          <button
            onClick={handleVerifyWithZiina}
            disabled={verifying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0 shadow-sm"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            التحقق الحي من Ziina API
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
            <span className="text-muted-foreground block mb-1">طريقة الدفع المسجلة:</span>
            <span className="font-bold text-sm text-foreground">
              {order.paymentMethod === "ziina" || isZiina
                ? "بوابة Ziina (بطاقة بنكية / Apple Pay)"
                : "الدفع عند الاستلام (COD)"}
            </span>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
            <span className="text-muted-foreground block mb-1">
              معرّف الدفع (Payment Intent ID):
            </span>
            <span className="font-mono font-bold text-sm text-foreground break-all" dir="ltr">
              {order.ziinaPaymentId || "غير متوفر"}
            </span>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
            <span className="text-muted-foreground block mb-1">حالة الدفعة في قاعدة البيانات:</span>
            <span
              className={`font-bold text-sm ${
                isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {order.ziinaStatus || (isPaid ? "completed" : "pending")}
            </span>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
            <span className="text-muted-foreground block mb-1">تاريخ ووقت التحقق:</span>
            <span className="font-semibold text-foreground">
              {order.paidAt
                ? formatDateTime(order.paidAt)
                : order.ziinaVerifiedAt
                  ? formatDateTime(order.ziinaVerifiedAt)
                  : "بانتظار التحقق"}
            </span>
          </div>
        </div>

        {verificationResult && (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs font-medium ${
              verificationResult.verified || verificationResult.success
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30"
            }`}
          >
            {verificationResult.message}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="mb-3 font-bold">بيانات المستلم</h2>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">الاسم: </span>
              <span className="font-semibold">{order.name}</span>
            </div>
            {order.email && (
              <div>
                <span className="text-muted-foreground">البريد الإلكتروني: </span>
                <span className="font-semibold" dir="ltr">
                  {order.email}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">الهاتف: </span>
              <span className="font-semibold" dir="ltr">
                {order.phone}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">العنوان: </span>
              <span className="font-semibold">{order.address}</span>
            </div>
            <div>
              <span className="text-muted-foreground">الإمارة: </span>
              <span className="font-semibold">{order.emirate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">تاريخ الطلب: </span>
              <span className="font-semibold">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="mb-3 font-bold">حالة الطلب</h2>
          <ol className="space-y-3">
            {getTimeline(order).map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {step.reached ? (
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${cancelled ? "text-destructive" : "text-primary"}`}
                  />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <div>
                  <span
                    className={`text-sm ${step.reached ? "font-semibold" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </span>
                  {step.at && (
                    <div className="text-xs text-muted-foreground">{formatDateTime(step.at)}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 font-bold">العناصر</h2>
        <div className="space-y-2">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {i.name} × {i.qty}
              </span>
              <span className="font-semibold">
                {i.price * i.qty} {CURRENCY}
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
          <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold">
            <span>الإجمالي</span>
            <span className="text-primary">
              {order.total.toFixed(2)} {CURRENCY}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
