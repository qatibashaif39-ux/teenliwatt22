import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  PhoneCall,
  Mail,
  User,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENCY } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/lib/orders";
import { EMIRATES, EMIRATE_DELIVERY_FEE } from "@/lib/emirates";
import { getAppSetting, getTaxConfig } from "@/lib/settings";
import { d1 } from "@/lib/d1";
import { metaTrack, metaSetUser } from "@/components/MetaPixel";
import { tiktokTrack, tiktokIdentify } from "@/components/TikTokPixel";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "تسجيل الطلب — تين ليوا" },
      { name: "description", content: "أكمل بيانات التوصيل والدفع لتسجيل طلبك من تين ليوا." },
    ],
  }),
  component: Checkout,
});

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const cleaned = email.trim();
  if (!cleaned) {
    return { valid: false, message: "الرجاء إدخال البريد الإلكتروني" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return {
      valid: false,
      message: "البريد الإلكتروني غير صحيح (مثال: name@example.com)",
    };
  }
  return { valid: true };
}

export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (!cleaned) {
    return { valid: false, message: "الرجاء إدخال رقم الهاتف" };
  }
  // Standard phone format validation: 8 to 15 digits with optional + prefix
  const phoneRegex = /^(\+?|00?)[0-9]{8,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      message: "رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف صحيح (مثال: 0501234567 أو +971501234567)",
    };
  }
  return { valid: true };
}

function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [tracking, setTracking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    emirate: "",
  });

  const taxConfig = useMemo(() => getTaxConfig(), []);
  const deliveryFee = form.emirate ? EMIRATE_DELIVERY_FEE : 0;

  const taxAmount = useMemo(() => {
    if (!taxConfig.enabled || taxConfig.rate <= 0) return 0;
    return Number(((total * taxConfig.rate) / 100).toFixed(2));
  }, [total, taxConfig]);

  const grandTotal = useMemo(
    () => total + deliveryFee + taxAmount,
    [total, deliveryFee, taxAmount],
  );
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const [minQty, setMinQty] = useState(2);

  useEffect(() => {
    const minQtyVal = getAppSetting("min_order_qty");
    if (minQtyVal) {
      const n = parseInt(minQtyVal, 10);
      if (!isNaN(n) && n > 0) setMinQty(n);
    }

    if (items.length > 0) {
      // Trigger Meta Pixel InitiateCheckout event
      metaTrack("InitiateCheckout", {
        content_type: "product",
        value: total,
        currency: "AED",
        num_items: totalQty,
        content_ids: items.map((i) => i.product.id),
        contents: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          quantity: i.qty,
          item_price: i.product.price,
        })),
      });

      // Trigger TikTok Pixel InitiateCheckout event
      tiktokTrack("InitiateCheckout", {
        contents: items.map((i) => ({
          content_id: i.product.id,
          content_name: i.product.name,
          quantity: i.qty,
          price: i.product.price,
        })),
        value: total,
        currency: "AED",
      });
    }
  }, [items, total, totalQty]);

  const belowItems = useMemo(
    () => items.filter((i) => i.qty < (i.product.minimum_order_quantity ?? 1)),
    [items],
  );

  const handlePhoneChange = (val: string) => {
    setForm((prev) => ({ ...prev, phone: val }));
    if (phoneError) setPhoneError(null);
  };

  const handleEmailChange = (val: string) => {
    setForm((prev) => ({ ...prev, email: val }));
    if (emailError) setEmailError(null);
  };

  const handleBlurUserIdentification = () => {
    if (form.email || form.phone) {
      const parts = form.fullName.trim().split(/\s+/);
      const fname = parts[0] || "";
      const lname = parts.slice(1).join(" ") || "";

      tiktokIdentify({
        email: form.email,
        phone_number: form.phone,
      });
      metaSetUser({
        em: form.email,
        ph: form.phone,
        fn: fname,
        ln: lname,
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("الرجاء إدخال الاسم الكامل");
      return;
    }

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) {
      setEmailError(emailCheck.message || "البريد الإلكتروني غير صحيح");
      toast.error(emailCheck.message || "البريد الإلكتروني غير صحيح");
      return;
    }

    const phoneCheck = validatePhoneNumber(form.phone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.message || "رقم الهاتف غير صحيح");
      toast.error(phoneCheck.message || "رقم الهاتف غير صحيح");
      return;
    }

    if (belowItems.length > 0) {
      const first = belowItems[0];
      toast.error(
        `الحد الأدنى لـ "${first.product.name}" هو ${first.product.minimum_order_quantity}.`,
      );
      return;
    }
    if (totalQty < minQty) {
      toast.error(`الحد الأدنى لتسجيل الطلب هو ${minQty}. الرجاء زيادة الكمية.`);
      return;
    }
    if (!form.emirate) {
      toast.error("الرجاء اختيار الإمارة");
      return;
    }

    setSubmitting(true);
    const fullName = form.fullName.trim();

    // Advanced match for pixels
    handleBlurUserIdentification();

    try {
      const order = await createOrder({
        name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address,
        emirate: form.emirate,
        items,
        subtotal: total,
        deliveryFee,
        tax: taxAmount,
        taxRate: taxConfig.enabled ? taxConfig.rate : undefined,
        total: grandTotal,
      });

      // Save customer record immediately to ensure registration
      d1.saveCustomerData({
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        phone: form.phone,
        address: form.address,
        emirate: form.emirate,
        amount: grandTotal,
        tracking: order.tracking,
      }).catch((e) => console.warn("Customer local sync:", e));

      // Track Meta & TikTok Ads Purchase and Payment Events
      metaTrack("AddPaymentInfo", {
        value: grandTotal,
        currency: "AED",
        content_ids: items.map((i) => i.product.id),
      });

      metaTrack("Purchase", {
        content_type: "product",
        value: grandTotal,
        currency: "AED",
        num_items: totalQty,
        order_id: order.tracking,
        contents: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          quantity: i.qty,
          item_price: i.product.price,
        })),
      });

      tiktokTrack("AddPaymentInfo", {
        value: grandTotal,
        currency: "AED",
      });

      tiktokTrack("PlaceAnOrder", {
        content_id: order.tracking,
        value: grandTotal,
        currency: "AED",
        contents: items.map((i) => ({
          content_id: i.product.id,
          content_name: i.product.name,
          quantity: i.qty,
          price: i.product.price,
        })),
      });

      tiktokTrack("CompletePayment", {
        content_id: order.tracking,
        value: grandTotal,
        currency: "AED",
        contents: items.map((i) => ({
          content_id: i.product.id,
          content_name: i.product.name,
          quantity: i.qty,
          price: i.product.price,
        })),
      });

      // Create Ziina payment session or finish order
      try {
        const response = await fetch("/api/create-ziina-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            tracking: order.tracking,
            amount: grandTotal,
            customerName: fullName,
            customerEmail: form.email.trim(),
            customerPhone: form.phone.trim(),
            origin: window.location.origin,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.redirect_url) {
            clear();
            window.location.href = data.redirect_url as string;
            return;
          }
        }
        setTracking(order.tracking);
        setDone(true);
        clear();
      } catch (payErr) {
        console.error(payErr);
        toast.error("تم حفظ الطلب، لكن تعذّر فتح بوابة الدفع. سنتواصل معك قريباً.");
        setTracking(order.tracking);
        setDone(true);
        clear();
      }
    } catch (err) {
      console.error(err);
      toast.error("تعذّر تسجيل الطلب. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h1 className="mt-4 text-2xl font-extrabold">تم تسجيل طلبك بنجاح!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          سنتواصل معك قريباً لتأكيد التوصيل. شكراً لثقتك بـ تين ليوا.
        </p>
        <div className="mt-6 w-full rounded-2xl border border-border/60 bg-card p-5">
          <span className="text-xs font-bold text-muted-foreground">
            رقم الإيصال والطلب الخاص بك
          </span>
          <div className="mt-1.5 text-2xl font-black tracking-wider text-primary font-mono">
            {tracking}
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="h-4 w-4" /> تم توثيق الطلب وتسجيل بيانات العميل بنجاح
          </div>
        </div>
        <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
          <Link
            to="/orders/$tracking"
            params={{ tracking: tracking || "" }}
            className="flex-1 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            عرض إيصال الدفع والطلب
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-xl border border-border/80 bg-secondary/60 px-6 py-3.5 text-sm font-bold hover:bg-secondary transition-colors"
          >
            العودة للمتجر
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold">سلة التسوق فارغة</h1>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          تصفح المنتجات
        </button>
      </main>
    );
  }

  const field =
    "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-center placeholder:text-center outline-none focus:border-primary transition-all";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-center sm:text-right">تسجيل الطلب</h1>
      <p className="mt-1 text-sm text-muted-foreground text-center sm:text-right">
        سيتم تحويلك إلى بوابة الدفع <span className="font-bold text-foreground">Ziina</span> بعد
        تأكيد البيانات.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={submit} className="space-y-3.5">
          {/* Full Name Field */}
          <div>
            <label className="block mb-1 text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1">
              <User className="h-3.5 w-3.5 text-primary" /> الاسم الكامل (Full Name) *
            </label>
            <div className="relative">
              <input
                required
                placeholder="الاسم الكامل / Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                onBlur={handleBlurUserIdentification}
                className={field}
                maxLength={100}
              />
              <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none hidden sm:block" />
            </div>
          </div>

          {/* Email Address Field */}
          <div>
            <label className="block mb-1 text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1">
              <Mail className="h-3.5 w-3.5 text-primary" /> البريد الإلكتروني (Email) *
            </label>
            <div className="relative">
              <input
                required
                type="email"
                dir="ltr"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleBlurUserIdentification}
                className={`${field} ${emailError ? "border-destructive bg-destructive/5" : ""}`}
                maxLength={100}
              />
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none hidden sm:block" />
            </div>
            {emailError && (
              <p className="mt-1 text-xs font-semibold text-destructive text-center">
                {emailError}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground text-center">
              سنرسل لك تفاصيل الفاتورة ورابط التتبع عبر البريد.
            </p>
          </div>

          {/* Phone Field with Validation Feedback */}
          <div>
            <label className="block mb-1 text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1">
              <PhoneCall className="h-3.5 w-3.5 text-primary" /> رقم الهاتف (Phone Number) *
            </label>
            <div className="relative">
              <input
                required
                type="tel"
                dir="ltr"
                placeholder="050 123 4567 أو +971501234567"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handleBlurUserIdentification}
                className={`${field} ${phoneError ? "border-destructive bg-destructive/5" : ""}`}
                maxLength={20}
              />
              <PhoneCall className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none hidden sm:block" />
            </div>
            {phoneError && (
              <p className="mt-1 text-xs font-semibold text-destructive text-center">
                {phoneError}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> عنوان التوصيل التفصيلي (Address) *
            </label>
            <textarea
              required
              placeholder="العنوان (المنطقة، الشارع، رقم المبنى/الفيلا...)"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={field}
              maxLength={500}
            />
          </div>

          {/* Emirate */}
          <div>
            <label className="block mb-1 text-xs font-bold text-foreground flex items-center justify-center sm:justify-start">
              الإمارة (Emirate) *
            </label>
            <select
              required
              value={form.emirate}
              onChange={(e) => setForm({ ...form, emirate: e.target.value })}
              className={`${field} text-center text-center-last`}
            >
              <option value="" className="text-center">
                -- اختر الإمارة --
              </option>
              {EMIRATES.map((em) => (
                <option key={em} value={em} className="text-center">
                  {em} — {EMIRATE_DELIVERY_FEE} {CURRENCY}
                </option>
              ))}
            </select>
          </div>

          {belowItems.length > 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive space-y-1">
              {belowItems.map((i) => (
                <div key={i.product.id}>
                  الحد الأدنى لـ "{i.product.name}" هو {i.product.minimum_order_quantity} (لديك{" "}
                  {i.qty}).
                </div>
              ))}
            </div>
          )}
          {totalQty < minQty && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              الحد الأدنى لتسجيل الطلب هو {minQty}. كميتك الحالية: {totalQty}.
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || totalQty < minQty || belowItems.length > 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-sm"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? "جارٍ تجهيز الدفع..."
              : `الدفع عبر Ziina — ${grandTotal.toFixed(2)} ${CURRENCY}`}
          </button>
        </form>

        <div className="h-fit rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">ملخص الطلب</h2>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.product.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium text-foreground">{i.product.name}</span>
                  <span className="text-xs text-muted-foreground mr-1">× {i.qty}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {(i.product.price * i.qty).toFixed(2)} {CURRENCY}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي (Subtotal)</span>
              <span className="font-medium text-foreground">
                {total.toFixed(2)} {CURRENCY}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>رسوم التوصيل{form.emirate ? ` (${form.emirate})` : ""}</span>
              <span className="font-medium text-foreground">
                {form.emirate ? `${deliveryFee.toFixed(2)} ${CURRENCY}` : "—"}
              </span>
            </div>

            {taxConfig.enabled && taxConfig.rate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>{taxConfig.label}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    %{taxConfig.rate}
                  </span>
                </span>
                <span className="font-medium text-foreground">
                  {taxAmount.toFixed(2)} {CURRENCY}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-border/60 pt-3 text-base font-extrabold">
              <span className="text-foreground">الإجمالي النهائي</span>
              <span className="text-primary text-lg">
                {grandTotal.toFixed(2)} {CURRENCY}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>مدفوعات مشفرة وآمنة بنسبة 100% عبر Ziina Payment Gateway.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
