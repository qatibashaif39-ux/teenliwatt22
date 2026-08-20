import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Cookie,
  ShieldCheck,
  Lock,
  BarChart3,
  Target,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CookiePolicyModal({ isOpen, onClose }: CookiePolicyModalProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border/80 text-foreground p-6 sm:p-8 rounded-3xl shadow-2xl">
        <DialogHeader className={isAr ? "text-right" : "text-left"}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-foreground">
                {isAr
                  ? "اتفاقية ملفات تعريف الارتباط وتقنيات التتبع"
                  : "Cookie & Tracking Technologies Agreement"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "متجر تين ليوا — دولة الإمارات العربية المتحدة"
                  : "Teen Liwa Store — United Arab Emirates"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className={`space-y-5 my-3 text-sm leading-relaxed ${isAr ? "text-right" : "text-left"}`}
        >
          {/* Overview */}
          <div className="rounded-2xl bg-secondary/40 border border-border/60 p-4 space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <Info className="h-4 w-4" />
              {isAr
                ? "ما هي ملفات تعريف الارتباط (Cookies) وكيف نستخدمها؟"
                : "What are cookies and how do we use them?"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "ملفات تعريف الارتباط هي ملفات نصية وتقنيات تخزين محلية صغيرة تُحفظ على جهازك عند زيارة المتجر. تساعدنا هذه التقنيات على تذكر سلة مشترياتك، الحفاظ على أمان جلستك، وتوفير تجربة تسوق مريحة وسريعة لطلب التين والتمور والفواكه الطازجة."
                : "Cookies are small text files and storage tokens placed on your device to remember your cart items, preserve your session security, and optimize your ordering experience."}
            </p>
          </div>

          {/* Table of Cookie Categories */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              {isAr
                ? "فئات وأنواع ملفات تعريف الارتباط المستخدمة:"
                : "Categories of Cookies We Use:"}
            </h3>

            {/* 1. Essential */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  {isAr
                    ? "1. ملفات تعريف الارتباط الضرورية جداً (Strictly Necessary)"
                    : "1. Strictly Necessary Cookies"}
                </span>
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                  {isAr ? "إلزامية" : "Mandatory"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "لا يمكن للمتجر العمل بدون هذه الملفات. تشمل حفظ المنتجات المضافة في سلة الشراء، رمز طلبات التوصيل، اختيار الإمارة، وتفضيلات اللغة."
                  : "Essential for core site functions, keeping track of items in your cart, delivery state, and selected language."}
              </p>
            </div>

            {/* 2. Performance & Analytics */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  {isAr
                    ? "2. ملفات الأداء والتحليلات (Performance & Analytics)"
                    : "2. Performance & Analytics"}
                </span>
                <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2.5 py-0.5 rounded-full">
                  {isAr ? "اختيارية" : "Optional"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "تساعدنا على قياس سرعة استجابة الصفحات، تتبع أوقات التحميل، وتحديد المنتجات الأكثر طلباً لتطوير جودة خدماتنا."
                  : "Helps us assess page load speeds, response times, and identify popular products to enhance overall service."}
              </p>
            </div>

            {/* 3. Marketing & Tracking Pixels */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  {isAr
                    ? "3. بكسل التتبع والإعلانات (Marketing & Ad Pixels)"
                    : "3. Tracking Pixels & Marketing"}
                </span>
                <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2.5 py-0.5 rounded-full">
                  {isAr ? "اختيارية" : "Optional"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "تشمل وحدات التتبع الإعلاني مثل Meta Pixel وTikTok Pixel لعرض إعلانات وعروض الخصومات الموسمية المهتم بها على منصات التواصل الاجتماعي. لا تعمل هذه البكسلات إلا بعد موافقتك الصريحة."
                  : "Includes Meta and TikTok pixels to deliver personalized seasonal fruit offers. These pixels only run upon your explicit consent."}
              </p>
            </div>
          </div>

          {/* User Control & Withdrawal */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {isAr ? "كيفية تعديل أو سحب موافقتك:" : "How to adjust or withdraw consent:"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "يمكنك في أي وقت إعادة فتح تفضيلات ملفات تعريف الارتباط عبر الرابط الموجود في أسفل المتجر (الفوتر)، أو مسح بيانات التخزين المؤقت من إعدادات متصفحك."
                : "You can modify or withdraw your preferences at any time by clicking 'Cookie Settings' in the store footer or by clearing your browser cache."}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex justify-end">
          <Button onClick={onClose} className="rounded-xl px-6 font-bold text-xs">
            {isAr ? "إغلاق" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
