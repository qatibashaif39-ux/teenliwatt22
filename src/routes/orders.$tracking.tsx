import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  ShoppingBag,
  CreditCard,
  Banknote,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Calendar,
  User,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { CURRENCY } from "@/data/products";
import { findOrder, formatDateTime, getPaymentStatusInfo, confirmOrderPayment } from "@/lib/orders";
import { tiktokTrack } from "@/components/TikTokPixel";
import { metaTrack } from "@/components/MetaPixel";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$tracking")({
  head: () => ({
    meta: [
      { title: "إيصال الطلب وتأكيد الدفع — تين ليوا" },
      {
        name: "description",
        content: "إيصال الطلب الإلكتروني الرسمي وتفاصيل حالة الدفع عبر Ziina.",
      },
    ],
  }),
  component: OrderReceiptView,
});

function OrderReceiptView() {
  const { tracking } = useParams({ from: "/orders/$tracking" });
  const queryClient = useQueryClient();
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Parse URL search query params on client side
  const [urlParams, setUrlParams] = useState<{
    payment?: string;
    paymentIntentId?: string;
    simulated?: boolean;
  }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        payment: searchParams.get("payment") || undefined,
        paymentIntentId:
          searchParams.get("payment_intent_id") || searchParams.get("paymentIntentId") || undefined,
        simulated: searchParams.get("simulated") === "true",
      });
    }
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", tracking],
    queryFn: () => findOrder(tracking),
  });

  // Automatically confirm payment in D1 Database if returning from Ziina success URL
  useEffect(() => {
    if (!tracking) return;
    if (urlParams.payment === "success") {
      setPaymentConfirmed(true);
      confirmOrderPayment(tracking, urlParams.paymentIntentId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["order", tracking] });
        })
        .catch((e) => console.warn("Failed to confirm payment in D1:", e));
    }
  }, [tracking, urlParams.payment, urlParams.paymentIntentId, queryClient]);

  const firedRef = useRef(false);
  useEffect(() => {
    if (!order || firedRef.current) return;
    if (order.status === "paid" || urlParams.payment === "success") {
      firedRef.current = true;
      tiktokTrack("CompletePayment", {
        content_id: order.tracking,
        value: order.total,
        currency: "AED",
        contents: order.items.map((i) => ({
          content_id: i.id,
          content_name: i.name,
          quantity: i.qty,
          price: i.price,
        })),
      });

      metaTrack("Purchase", {
        content_type: "product",
        value: order.total,
        currency: "AED",
        order_id: order.tracking,
        num_items: order.items.reduce((s, i) => s + i.qty, 0),
        contents: order.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.qty,
          item_price: i.price,
        })),
      });
    }
  }, [order, urlParams.payment]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (!order) return;
    const shareText = `إيصال طلب من تين ليوا\nرقم الإيصال: ${order.tracking}\nالإجمالي: ${order.total.toFixed(2)} ${CURRENCY}\nحالة الدفع: ${
      order.status === "paid" || paymentConfirmed ? "تم الدفع بنجاح (Ziina)" : "الدفع عند الاستلام"
    }`;

    if (navigator.share) {
      navigator
        .share({
          title: `إيصال طلب ${order.tracking}`,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط الإيصال للحافظة");
    }
  };

  // Retry Ziina Payment
  const handleRetryZiinaPayment = async () => {
    if (!order) return;
    setRetryingPayment(true);
    try {
      const response = await fetch("/api/create-ziina-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          tracking: order.tracking,
          amount: order.total,
          customerName: order.name,
          customerEmail: order.email || "",
          customerPhone: order.phone || "",
          origin: window.location.origin,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.redirect_url) {
          window.location.href = data.redirect_url as string;
          return;
        }
      }
      toast.error("تعذّر فتح بوابة الدفع حالياً. يمكنك السداد عند الاستلام.");
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء فتح بوابة الدفع.");
    } finally {
      setRetryingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h1 className="mt-4 text-xl font-bold">لم نجد هذا الإيصال</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تأكد من صحة رقم الإيصال أو تواصل مع خدمة العملاء
        </p>
        <Link
          to="/orders"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لطلباتي
        </Link>
      </main>
    );
  }

  const isPaid = order.status === "paid" || paymentConfirmed || urlParams.payment === "success";
  const isCancelled = order.status === "cancelled" || urlParams.payment === "cancelled";
  const paymentInfo = getPaymentStatusInfo({
    status: isPaid ? "paid" : order.status,
    paymentMethod: isPaid ? "ziina" : (order as any).paymentMethod,
  });
  const isCod = (order as any).paymentMethod === "cod" && !isPaid;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      {/* Top Navigation Bar - Hidden on print */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> العودة لطلباتي
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
            title="مشاركة الإيصال"
          >
            <Share2 className="h-3.5 w-3.5" />
            مشاركة
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            طباعة الإيصال
          </button>
        </div>
      </div>

      {/* 1. Thank You & Payment Success Banner (Celebration Hero) */}
      {isPaid ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-6 md:p-8 text-foreground shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-right rtl:md:text-right ltr:md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-9 w-9 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" /> شكراً لطلبك — تم تأكيد الدفع بنجاح
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                شكراً لك، {order.name}! تم استلام دفعتك وتأكيد طلبك 🌿
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                تم استلام الدفعة بنجاح عبر بوابة{" "}
                <span className="font-bold text-foreground">Ziina</span> وتحديث قاعدة البيانات. طلبك
                قيد التجهيز الآن بأعلى معايير الجودة من مزارع ليوا.
              </p>
            </div>
          </div>
        </div>
      ) : isCancelled ? (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 md:p-7 text-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold">تم إلغاء جلسة الدفع</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  طلبك مسجل لدينا برقم{" "}
                  <span className="font-mono font-bold text-foreground">{order.tracking}</span>.
                  يمكنك إعادة محاولة الدفع الإلكتروني الآن أو المتابعة بالدفع عند الاستلام.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryZiinaPayment}
              disabled={retryingPayment}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0 shadow-sm"
            >
              {retryingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              إعادة محاولة الدفع عبر Ziina
            </button>
          </div>
        </div>
      ) : null}

      {/* 2. Payment Status Info Summary Box */}
      <div
        className={`mb-6 rounded-2xl border p-5 md:p-6 transition-all ${
          isPaid
            ? "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20"
            : isCancelled
              ? "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20"
              : isCod
                ? "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20"
                : "border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/20"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isPaid
                  ? "bg-emerald-600 text-white"
                  : isCancelled
                    ? "bg-amber-600 text-white"
                    : isCod
                      ? "bg-amber-600 text-white"
                      : "bg-blue-600 text-white"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : isCancelled ? (
                <AlertCircle className="h-6 w-6" />
              ) : isCod ? (
                <Banknote className="h-6 w-6" />
              ) : (
                <CreditCard className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  حالة الدفع
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isPaid ? "bg-emerald-600 text-white" : paymentInfo.badgeClass
                  }`}
                >
                  {isPaid ? "مدفوع بالكامل (Ziina)" : paymentInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {isPaid ? "تم استلام الدفعة وتأكيدها إلكترونياً بنجاح." : paymentInfo.description}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
            <span className="text-xs text-muted-foreground">المبلغ الإجمالي</span>
            <div className="text-xl md:text-2xl font-black text-foreground">
              {order.total.toFixed(2)}{" "}
              <span className="text-sm font-bold text-muted-foreground">{CURRENCY}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Electronic Receipt (Printable Card) */}
      <div
        id="order-receipt"
        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm print:border-none print:shadow-none"
      >
        {/* Receipt Header Banner */}
        <div className="border-b border-border/60 bg-muted/40 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-foreground">تين</span>
                <span className="text-2xl font-black tracking-tight text-primary">ليوا</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                تين وتمور وفواكه طبيعية فاخرة — دولة الإمارات العربية المتحدة
              </p>
            </div>

            <div className="text-right md:text-left rtl:md:text-left ltr:md:text-right">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                <ShieldCheck className="h-4 w-4" />
                إيصال إلكتروني معتمد
              </div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">
                رقم الإيصال: <span className="font-bold text-foreground">{order.tracking}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                التاريخ: {formatDateTime(order.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Information */}
        <div className="p-6 md:p-8 border-b border-border/60">
          <h2 className="text-sm font-bold text-muted-foreground mb-4">بيانات المشتري والتوصيل</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 rounded-xl bg-muted/20 p-3.5 border border-border/40">
              <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">اسم العميل</span>
                <span className="font-bold text-foreground">{order.name}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/20 p-3.5 border border-border/40">
              <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">رقم الهاتف</span>
                <span className="font-bold text-foreground" dir="ltr">
                  {order.phone}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/20 p-3.5 border border-border/40">
              <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">الإمارة</span>
                <span className="font-bold text-foreground">{order.emirate}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/20 p-3.5 border border-border/40">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">عنوان التوصيل</span>
                <span className="font-bold text-foreground">{order.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="p-6 md:p-8 border-b border-border/60">
          <h2 className="text-sm font-bold text-muted-foreground mb-4">تفاصيل الأصناف المشتراة</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-border/60 text-xs font-bold text-muted-foreground">
                  <th className="pb-3 text-right">الصنف</th>
                  <th className="pb-3 text-center px-4">الكمية</th>
                  <th className="pb-3 text-center px-4">سعر الوحدة</th>
                  <th className="pb-3 text-left">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 font-semibold text-foreground">{item.name}</td>
                    <td className="py-3.5 text-center px-4 text-muted-foreground font-medium">
                      {item.qty}
                    </td>
                    <td className="py-3.5 text-center px-4 text-muted-foreground font-medium">
                      {item.price.toFixed(2)} {CURRENCY}
                    </td>
                    <td className="py-3.5 text-left font-bold text-foreground">
                      {(item.price * item.qty).toFixed(2)} {CURRENCY}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-6 md:p-8 bg-muted/20">
          <div className="max-w-xs ms-auto space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي:</span>
              <span className="font-semibold text-foreground">
                {order.subtotal.toFixed(2)} {CURRENCY}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>رسوم التوصيل ({order.emirate}):</span>
              <span className="font-semibold text-foreground">
                {order.deliveryFee.toFixed(2)} {CURRENCY}
              </span>
            </div>

            {order.tax && order.tax > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>ضريبة القيمة المضافة {order.taxRate ? `(${order.taxRate}%)` : ""}:</span>
                <span className="font-semibold text-foreground">
                  {order.tax.toFixed(2)} {CURRENCY}
                </span>
              </div>
            ) : null}

            <div className="border-t border-border/80 pt-3 flex justify-between items-baseline text-base font-black text-foreground">
              <span>المبلغ الكلي:</span>
              <span className="text-xl text-primary font-black">
                {order.total.toFixed(2)} {CURRENCY}
              </span>
            </div>

            <div className="pt-2 text-xs text-muted-foreground flex justify-between items-center border-t border-border/40">
              <span>طريقة الدفع:</span>
              <span className="font-bold text-foreground">
                {isPaid
                  ? "دفع إلكتروني معتمد (Ziina / البطاقة)"
                  : isCod
                    ? "الدفع عند الاستلام (نقدي / بطاقة)"
                    : "دفع إلكتروني بطاقة / Ziina"}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Footer Note */}
        <div className="border-t border-border/60 p-5 text-center text-xs text-muted-foreground">
          شكراً لتسوقكم من تين ليوا. نسعى دائماً لتقديم أجود أنواع التين والتمور الطبيعية الطازجة من
          مزارع الإمارات.
        </div>
      </div>

      {/* Action Footer - Hidden on print */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          متابعة التسوق
        </Link>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Printer className="h-4 w-4" />
          طباعة الإيصال / حفظ كـ PDF
        </button>
      </div>
    </main>
  );
}
