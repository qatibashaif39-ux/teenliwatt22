import { useState, useEffect } from "react";
import {
  Cookie,
  ShieldCheck,
  SlidersHorizontal,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  getStoredCookieConsent,
  acceptAllCookies,
  acceptEssentialOnly,
  saveCookieConsent,
  type CookiePreferences,
  COOKIE_CONSENT_EVENT,
} from "@/lib/cookies";
import { useLanguage } from "@/context/LanguageContext";
import { CookiePolicyModal } from "@/components/CookiePolicyModal";

export function CookieConsentBanner() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  // Customization state
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    // Check if consent has already been given
    const stored = getStoredCookieConsent();
    if (!stored) {
      // Show banner after brief natural entrance delay
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    }

    // Listen for custom trigger to reopen banner (e.g. from footer)
    const handleReopen = (e: CustomEvent<any>) => {
      if (e.detail?.forceOpen) {
        const curr = getStoredCookieConsent();
        if (curr) {
          setAnalytics(curr.analytics);
          setMarketing(curr.marketing);
        }
        setShowCustomize(true);
        setVisible(true);
      }
    };

    window.addEventListener("teenliwa_open_cookie_settings", handleReopen as EventListener);
    return () => {
      window.removeEventListener("teenliwa_open_cookie_settings", handleReopen as EventListener);
    };
  }, []);

  if (!visible)
    return <CookiePolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />;

  const handleAcceptAll = () => {
    acceptAllCookies();
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    acceptEssentialOnly();
    setVisible(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent({
      necessary: true,
      analytics,
      marketing,
    });
    setVisible(false);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Cookie consent agreement"
        className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5 pointer-events-none"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl pointer-events-auto text-foreground">
          {/* Main Top Banner Content */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 text-right flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Cookie className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-foreground">
                    {isAr
                      ? "ملفات تعريف الارتباط وتفضيلات الخصوصية"
                      : "Cookie Preferences & Privacy Agreement"}
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {isAr ? "حماية الخصوصية" : "Privacy First"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? "نستخدم ملفات تعريف الارتباط وتقنيات التتبع المعتمدة لتحسين تجربة تصفحك وتخصيص العروض وتحليل أداء المتجر. يمكنك اختيار قبول جميع الملفات أو تخصيص تفضيلاتك بما يناسبك."
                    : "We use essential cookies and tracking technologies to optimize your shopping experience, secure your cart, and deliver personalized fruit offers."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPolicyOpen(true)}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isAr ? "سياسة ملفات الارتباط والتتبع" : "Cookie & Tracking Policy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end pt-2 md:pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomize(!showCustomize)}
                className="rounded-xl text-xs font-bold border-border/80 hover:bg-secondary flex items-center gap-1.5 py-5"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {isAr ? "تخصيص الخيارات" : "Customize"}
                {showCustomize ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleRejectNonEssential}
                className="rounded-xl text-xs font-bold py-5 hover:bg-secondary/80"
              >
                {isAr ? "الضرورية فقط" : "Essential Only"}
              </Button>

              <Button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-xl text-xs font-black py-5 px-5 shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4 mr-1 ml-1" />
                {isAr ? "قبول الكل والمتابعة" : "Accept All"}
              </Button>
            </div>
          </div>

          {/* Expandable Customization Panel */}
          {showCustomize && (
            <div className="mt-5 border-t border-border/60 pt-4 space-y-3 animate-in fade-in duration-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground text-right">
                {isAr
                  ? "إدارة وتخصيص أذونات التتبع وملفات الارتباط"
                  : "Manage Specific Cookie Categories"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Necessary / Essential */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <span>{isAr ? "الملفات الضرورية" : "Essential Cookies"}</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {isAr ? "دائماً نشطة" : "Always Active"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isAr
                      ? "ضرورية لتشغيل المتجر، سلة المشتريات، جلسة الأمان، واختيار اللغة والعملة."
                      : "Required for core functionality like shopping cart, currency, and secure checkout."}
                  </p>
                </div>

                {/* 2. Analytics */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{isAr ? "التحليلات والأداء" : "Analytics & Performance"}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isAr
                      ? "تساعدنا على فهم كيفية استخدام المتجر لتحسين سرعة التصفح وتجربة التسوق."
                      : "Helps us analyze store traffic and enhance site speed and browsing navigation."}
                  </p>
                </div>

                {/* 3. Marketing & Tracking Pixels */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <Target className="h-3.5 w-3.5 text-amber-400" />
                      <span>{isAr ? "التتبع والإعلانات" : "Marketing & Pixels"}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isAr
                      ? "بكسل ميتا وتيك توك لعرض منتجات التين والتمور المخصصة لك على منصات التواصل."
                      : "Meta & TikTok pixels to present relevant fruit discounts on social media platforms."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCustomize(false)}
                  className="rounded-xl text-xs"
                >
                  {isAr ? "إغلاق التفاصيل" : "Close"}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCustom}
                  className="rounded-xl text-xs font-bold px-6"
                >
                  {isAr ? "حفظ خياراتي" : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CookiePolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("teenliwa_open_cookie_settings", { detail: { forceOpen: true } }),
    );
  }
}
