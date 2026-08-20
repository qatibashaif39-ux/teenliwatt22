import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Eye,
  Truck,
  CreditCard,
  BellRing,
  Phone,
  Mail,
  CheckCircle2,
  Cookie,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { openCookieSettings } from "@/components/CookieConsentBanner";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border/80 text-foreground p-6 sm:p-8 rounded-3xl shadow-2xl">
        <DialogHeader className={isAr ? "text-right" : "text-left"}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-foreground">
                {isAr ? "سياسة الخصوصية وحماية البيانات" : "Privacy & Data Protection Policy"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "آخر تحديث: أغسطس 2026 — متجر تين ليوا (الإمارات العربية المتحدة)"
                  : "Last updated: August 2026 — Teen Liwa Store (UAE)"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className={`space-y-6 my-3 text-sm leading-relaxed ${isAr ? "text-right" : "text-left"}`}
        >
          {/* Summary Box */}
          <div className="rounded-2xl bg-secondary/50 border border-border/60 p-4 space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <Lock className="h-4 w-4" />
              {isAr ? "التزامنا تجاه خصوصيتك وأمان بياناتك" : "Our Privacy & Security Commitment"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "في متجر 'تين ليوا'، نولي أهمية قصوى لسرية وخصوصية بيانات عملائنا الكرام. نلتزم بأعلى معايير الأمان وحماية البيانات المعمول بها في دولة الإمارات العربية المتحدة."
                : "At 'Teen Liwa', we place the highest priority on your confidentiality and data privacy, adhering strictly to UAE data protection standards and secure practices."}
            </p>
          </div>

          {/* Section 1: Data Collection */}
          <section className="space-y-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary shrink-0" />
              {isAr ? "1. البيانات التي نجمعها" : "1. Information We Collect"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "نقوم بجمع المعلومات اللازمة فقط لتقديم خدماتنا وتنفيذ وتوصيل الطلبات بدقة:"
                : "We collect only essential details necessary to deliver our products and fulfill orders accurately:"}
            </p>
            <ul className="grid grid-cols-1 gap-2 text-xs text-muted-foreground pr-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">
                    {isAr ? "بيانات التواصل والتوصيل:" : "Contact & Delivery Details:"}
                  </strong>{" "}
                  {isAr
                    ? "الاسم، رقم الهاتف، عنوان التوصيل التفصيلي والإمارة."
                    : "Full name, phone number, detailed delivery address, and Emirate."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">
                    {isAr ? "تفاصيل الطلب:" : "Order Details:"}
                  </strong>{" "}
                  {isAr
                    ? "المنتجات المختارة، الكميات، وتاريخ ووقت الطلب."
                    : "Selected items, quantities, and order timestamps."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">
                    {isAr ? "التقييمات والبريد الإلكتروني:" : "Reviews & Email:"}
                  </strong>{" "}
                  {isAr
                    ? "التقييمات والتعليقات والبريد الإلكتروني الذي تدخله اختيارياً عند تقييم المنتجات."
                    : "Optional product reviews, comments, and email entered voluntarily."}
                </span>
              </li>
            </ul>
          </section>

          {/* Section 2: Payments */}
          <section className="space-y-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary shrink-0" />
              {isAr ? "2. أمان المدفوعات والبطاقات البنكية" : "2. Payment Security & Processing"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "تتم معالجة جميع المدفوعات الإلكترونية عبر بوابة الدفع المرخصة Ziina وفق أعلى معايير التشفير والأمان المالي (PCI-DSS). نحن لا نقوم بتخزين أو الاطلاع على بيانات البطاقات الائتمانية أو أرقام الحسابات على خوادمنا نهائياً."
                : "All electronic transactions are processed through authorized payment gateway Ziina using top-tier encryption (PCI-DSS). We never store or access your credit/debit card numbers on our servers."}
            </p>
          </section>

          {/* Section 3: Delivery Partners */}
          <section className="space-y-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              {isAr ? "3. التوصيل ومشاركة البيانات" : "3. Delivery & Third-Party Disclosure"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "نشارك فقط بيانات التوصيل الأساسية (الاسم، العنوان، ورقم الهاتف) مع مندوب التوصيل أو أسطول الشحن المعتمد لضمان إيصال المنتجات الطازجة إلى باب منزلك في نفس اليوم داخل الإمارات. لا نقوم ببيع أو تأجير بياناتك لأي طرف ثالث."
                : "We share only necessary delivery info (name, address, and phone number) with trusted delivery drivers to ensure same-day fruit delivery across the UAE. We never sell or rent your data."}
            </p>
          </section>

          {/* Section 4: Cookies & Tracking Technologies */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Cookie className="h-4 w-4 text-amber-400 shrink-0" />
                {isAr
                  ? "4. ملفات تعريف الارتباط وبكسل التتبع (Cookies)"
                  : "4. Cookies & Tracking Pixels"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openCookieSettings();
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <SlidersHorizontal className="h-3 w-3" />
                {isAr ? "إدارة التفضيلات" : "Manage"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "نستخدم ملفات تعريف الارتباط الضرورية لعمل السلة، والتحليلات لتحسين الأداء، وبكسل ميتا وتيك توك لعرض الإعلانات المخصصة (ولا تعمل إلا بموافقتك)."
                : "We use essential cookies for cart persistence, analytics for site health, and Meta/TikTok pixels for personalized ads (subject to your explicit consent)."}
            </p>
          </section>

          {/* Section 5: Customer Rights & Contact */}
          <section className="space-y-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary shrink-0" />
              {isAr ? "5. حقوقك والتواصل معنا" : "5. Your Rights & Inquiries"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "يحق لك في أي وقت طلب مراجعة، تحديث أو حذف بياناتك المسجلة لدينا عن طريق التواصل المباشر مع فريق الدعم."
                : "You have the right to request review, modification, or deletion of your stored records at any time by contacting our support team."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-foreground">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border/50">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>
                  {isAr
                    ? "خدمة العملاء والواتساب: متوفر على مدار الساعة"
                    : "WhatsApp Customer Support: 24/7"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border/50">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>support@teenliwa.ae</span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex justify-end">
          <Button onClick={onClose} className="rounded-xl px-6 font-bold text-xs">
            {isAr ? "فهمت وموافق" : "Got it"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
