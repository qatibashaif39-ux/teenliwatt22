import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const TRANSLATIONS: Dict = {
  // الكلمات الأصلية من الكود الثاني
  "brand.teen": { ar: "تين", en: "TEEN" },
  "brand.liwa": { ar: "ليوا", en: "LIWA" },
  "nav.shop": { ar: "المتجر", en: "Shop" },
  "nav.orders": { ar: "طلباتي", en: "Orders" },
  "nav.track": { ar: "تتبع الطلب", en: "Track" },
  "nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.about": { ar: "من نحن", en: "About" },
  "hero.title": {
    ar: "تين وتمور وفواكه فاخرة",
    en: "Premium figs, dates & fruits",
  },
  "hero.delivery": { ar: " بالتوصيل", en: " delivered" },
  "hero.subtitle": {
    ar: "القص والتوصيل في نفس اليوم داخل الإمارات — طبيعي 100% وطازج.",
    en: "Same-day picking & delivery across the UAE — 100% natural and fresh.",
  },
  "filter.all": { ar: "الكل", en: "All" },
  "products.loading": { ar: "جارٍ تحميل المنتجات…", en: "Loading products…" },
  "about.title": { ar: "من نحن", en: "About us" },
  "about.body": {
    ar: "تين ليوا متخصصون في توفير أجود أنواع التين والتمور والفواكه الطبيعية الطازجة، مع القص والتوصيل في نفس اليوم داخل دولة الإمارات. جودة فاخرة وطعم كالعسل.",
    en: "Teen Liwa specializes in the finest figs, dates and fresh natural fruits, with same-day picking and delivery across the UAE. Premium quality and a honey-like taste.",
  },
  "cart.title": { ar: "عربة التسوق", en: "Shopping cart" },
  "cart.empty": {
    ar: "لا توجد منتجات بعد، الرجاء اختيار منتج إلى السلة.",
    en: "No products yet, please add an item to your cart.",
  },
  "cart.total": { ar: "الإجمالي", en: "Total" },
  "cart.checkout": { ar: "تسجيل الطلب", en: "Checkout" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "lang.toggle": { ar: "EN", en: "ع" },

  // ✅ الكلمات المضافة من الكود الأول
  "footer.rights": {
    ar: "جميع الحقوق محفوظة © {year} م.بلال شائف",
    en: "All rights reserved © {year} Eng. Bilal Shaif",
  },
  "about.text": {
    ar: "تين ليوا متخصصون في توفير أجود أنواع التين والتمور والفواكه الطبيعية الطازجة، مع القص والتوصيل في نفس اليوم داخل دولة الإمارات. جودة فاخرة وطعم كالعسل.",
    en: "Teen Liwa specializes in providing the finest types of fresh natural figs, dates, and fruits, with same-day harvesting and delivery within the UAE. Premium quality and honey-like taste.",
  },
  "product.add": { ar: "أضف إلى السلة", en: "Add to Cart" },
  "product.upcoming": { ar: "قريباً", en: "Upcoming" },
  "privacy.title": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "privacy.subtitle": { ar: "حماية البيانات وسرية المعلومات", en: "Data Protection & Privacy" },
};

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "app-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Lang | null) : null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir,
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      t: (key: string, params?: Record<string, string | number>) => {
        let text = TRANSLATIONS[key]?.[lang] ?? key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
          });
        }
        return text;
      },
    }),
    [lang, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
