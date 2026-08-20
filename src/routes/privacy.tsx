import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  Eye,
  Truck,
  CreditCard,
  BellRing,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Cookie,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/CookieConsentBanner";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية وحماية البيانات — تين ليوا" },
      {
        name: "description",
        content:
          "سياسة الخصوصية وحماية البيانات في متجر تين ليوا. التزامنا بأمان وسرية بيانات عملائنا في دولة الإمارات العربية المتحدة.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "سياسة الخصوصية — تين ليوا" },
      {
        property: "og:description",
        content: "تعرف على سياسات الخصوصية وحماية البيانات وملفات الارتباط لمتجر تين ليوا.",
      },
      { property: "og:url", content: "https://teenliwa.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://teenliwa.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back to Shop Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <BackIcon className="h-4 w-4" />
            {isAr ? "العودة للمتجر الرئيسي" : "Back to Shop"}
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {isAr ? "الإمارات العربية المتحدة" : "United Arab Emirates"}
          </span>
        </div>

        {/* Page Hero Header */}
        <div className="text-center space-y-3 py-6 border-b border-border/60">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isAr ? "سياسة الخصوصية وحماية البيانات" : "Privacy & Data Protection Policy"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "نلتزم في متجر 'تين ليوا' بحماية خصوصيتك ومعلوماتك الشخصية وفق أعلى معايير الأمان المتبعة في التجارة الإلكترونية."
              : "At 'Teen Liwa', we are dedicated to safeguarding your personal privacy and sensitive data in full compliance with UAE e-commerce standards."}
          </p>
          <div className="text-xs text-muted-foreground pt-1">
            {isAr ? "تاريخ آخر تحديث: أغسطس 2026" : "Last updated: August 2026"}
          </div>
        </div>

        {/* Highlight Guarantee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-2 text-right">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {isAr ? "تشفير وأمان كامل" : "Full TLS Encryption"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "جميع الاتصالات والمعاملات مشفرة ومؤمنة بأحدث بروتوكولات الحماية."
                : "All connections and sessions are secured with top-tier TLS/SSL encryption."}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-2 text-right">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-foreground">
              {isAr ? "دفع آمن 100%" : "Secure Payments"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "معالجة المدفوعات عبر بوابات مرخصة (Ziina) ولا يتم تخزين البطاقات لدينا."
                : "Card processing via licensed Ziina gateway; no card numbers stored on our servers."}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-2 text-right">
            <Truck className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-sm text-foreground">
              {isAr ? "توصيل طازج وموثوق" : "Reliable Same-Day Delivery"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "توصيل مباشر في نفس اليوم داخل الإمارات وسرية تامة لعنوانك."
                : "Fast same-day delivery with complete confidentiality of customer addresses."}
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-6">
          {/* 1. Data Collection */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary font-black text-sm">
                1
              </span>
              {isAr ? "البيانات التي نقوم بجمعها" : "1. Information We Collect"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "نقوم بجمع البيانات الضرورية فقط لضمان تنفيذ طلبيتك وتسليم المنتجات الطازجة بدقة وسرعة:"
                : "We collect only necessary information required to process and deliver your fresh fruit and date orders:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? "بيانات العميل والتوصيل" : "Customer Contact & Delivery"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "الاسم الأول واسم العائلة، رقم الهاتف الإماراتي، الإمارة، والعنوان التفصيلي."
                    : "First and last name, UAE phone number, Emirate, and specific delivery address."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? "بيانات الطلب والشحنة" : "Order & Shipment Records"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "رمز التتبع الفريد، سلة المنتجات المشتراة، الكميات، وإجمالي الفاتورة."
                    : "Unique tracking code, purchased items, quantities, and total order invoice."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? "التقييمات والتعليقات" : "Reviews & Ratings"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "الآراء والتقييمات والبريد الإلكتروني الذي تدخله طواعية لتقييم المنتجات."
                    : "Product feedback, ratings, and optional email submitted when reviewing items."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? "بيانات الجلسة والتفضيلات" : "Session & Preferences"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "حفظ عناصر السلة وتفضيل اللغة (عربي / إنجليزي) على متصفحك محلياً."
                    : "Cart persistence and chosen language preference stored locally in your browser."}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Payment Security */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary font-black text-sm">
                2
              </span>
              {isAr ? "أمان العمليات المالية والمدفوعات" : "2. Payment Security & Financial Data"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "تتم جميع عمليات السداد الإلكتروني عبر بوابة الدفع المرخصة 'Ziina'. نحن نلتزم بالمعايير العالمية لحماية بيانات حاملي البطاقات (PCI DSS). جميع الاتصالات تتم عبر قنوات مشفرة بمعيار 256-bit SSL، ولا يحتفظ متجر تين ليوا بأي أرقام بطاقات بنكية أو رموز أمان على خوادمه نهائياً."
                : "All payments are routed securely through authorized gateway 'Ziina' adhering strictly to PCI DSS standards. All traffic is encrypted with 256-bit SSL, and Teen Liwa never retains card numbers or CVV codes on its database."}
            </p>
          </section>

          {/* 3. Delivery & Third Parties */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary font-black text-sm">
                3
              </span>
              {isAr ? "مشاركة البيانات والتوصيل" : "3. Delivery Logistics & Third Parties"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "يتم تزويد مندوب التوصيل المعتمد بالاسم ورقم الهاتف والعنوان فقط لإتمام تسليم المنتجات الطازجة في نفس اليوم. نحن لا نبيع ولا نؤجر ولا نشارك بيانات عملائنا مع أي جهات تسويقية أو أطراف خارجية غير مصرح بها."
                : "Delivery couriers receive only name, phone number, and address strictly for same-day delivery fulfillment. We never sell, rent, or trade your data to third-party marketing entities."}
            </p>
          </section>

          {/* 4. Cookies & Tracking Technologies */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary font-black text-sm">
                  4
                </span>
                {isAr
                  ? "اتفاقية ملفات تعريف الارتباط وتقنيات التتبع (Cookies)"
                  : "4. Cookies & Tracking Technologies"}
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={openCookieSettings}
                className="rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/10 gap-1.5 self-start sm:self-auto"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {isAr ? "تعديل تفضيلات الكوكيز" : "Adjust Cookie Settings"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "نستخدم ملفات تعريف الارتباط وتقنيات التتبع المعتمدة لتقديم تجربة تسوق آمنة وسلسة. تشمل هذه التقنيات:"
                : "We use cookies and authorized tracking technologies to deliver a secure and smooth shopping experience, including:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/40 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "الملفات الضرورية" : "Essential Cookies"}
                </div>
                <p className="text-muted-foreground">
                  {isAr
                    ? "لحفظ سلة المشتريات وجلسة الأمان واللغة (دائماً مفعلة)."
                    : "Maintains cart items, security session, and language preference."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/40 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {isAr ? "التحليلات والأداء" : "Performance & Analytics"}
                </div>
                <p className="text-muted-foreground">
                  {isAr
                    ? "لقياس سرعة التصفح وتطوير واجهة المتجر دون التعرف على الهوية الشخصية."
                    : "Measures browsing responsiveness without personal identification."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/40 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Cookie className="h-3.5 w-3.5 text-amber-400" />
                  {isAr ? "بكسل ميتا وتيك توك" : "Marketing Pixels"}
                </div>
                <p className="text-muted-foreground">
                  {isAr
                    ? "لتخصيص عروض الخصومات وتعمل فقط بناءً على موافقتك الصريحة."
                    : "Personalizes seasonal promotions and only runs upon explicit consent."}
                </p>
              </div>
            </div>
          </section>

          {/* 5. Customer Rights & Inquiries */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary font-black text-sm">
                5
              </span>
              {isAr ? "حقوقك والتواصل مع مسؤول الخصوصية" : "5. Your Rights & Privacy Inquiries"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "يحق لك في أي وقت مراجعة بياناتك المسجلة أو طلب تعديلها أو حذفها من سجلاتنا. لأي استفسار بخصوص سياسة الخصوصية أو طلبات الحذف، يرجى التواصل معنا:"
                : "You may request access to, correction, or deletion of your personal records at any time. For any privacy requests or inquiries:"}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="https://wa.me/971500000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-bold text-sm hover:bg-[#25D366]/20 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{isAr ? "تواصل معنا عبر واتساب" : "WhatsApp Privacy Support"}</span>
              </a>
              <a
                href="mailto:support@teenliwa.ae"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>support@teenliwa.ae</span>
              </a>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="text-center pt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            {isAr ? "تصفح وشراء المنتجات الآن" : "Browse & Order Products"}
          </Link>
        </div>
      </div>
    </main>
  );
}
