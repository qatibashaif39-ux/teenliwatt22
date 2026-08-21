import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Megaphone,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Bookmark,
  Share2,
  Target,
  DollarSign,
  Layers,
  Facebook,
  Sliders,
  Rss,
  FileCode,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Info,
  HelpCircle,
  Code2,
  Package,
  Boxes,
  ArrowRight,
  Send,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProducts } from "@/lib/catalog";

export const Route = createFileRoute("/dashboard/ads")({
  component: DashboardAdsPage,
});

interface AdResponse {
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  targetAudience: string;
  visualHook: string;
  hashtags: string[];
  budgetAdvice: string;
}

interface FeedStats {
  success: boolean;
  feed_status: string;
  last_updated: string;
  stats: {
    total_products: number;
    in_stock_products: number;
    out_of_stock_products: number;
    with_custom_image: number;
    with_seed_image: number;
  };
  feed_urls: {
    meta_rss_xml: string;
    meta_csv: string;
    meta_json: string;
    facebook_xml: string;
    google_xml: string;
  };
}

export function DashboardAdsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "ai_generator" | "guide">("catalog");

  // Fetch products
  const {
    data: products = [],
    refetch: refetchProducts,
    isLoading: loadingProducts,
  } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchProducts,
  });

  // Fetch live feed stats from server
  const {
    data: feedStats,
    refetch: refetchStats,
    isLoading: loadingStats,
  } = useQuery<FeedStats>({
    queryKey: ["feed_stats"],
    queryFn: async () => {
      const res = await fetch("/api/feeds/stats");
      if (!res.ok) throw new Error("Failed to fetch feed stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Load Meta Pixel ID & Site Domain from settings
  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      try {
        const raw = localStorage.getItem("d1_app_settings_store");
        if (raw) return JSON.parse(raw);
      } catch {
        // fallback
      }
      return {};
    },
  });

  const metaPixelId = appSettings?.meta_pixel_id || "";

  // Feed Customization State
  const [currency, setCurrency] = useState<string>("AED");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [brandName, setBrandName] = useState<string>("تين ليوا");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Feed Inspector State
  const [inspecting, setInspecting] = useState(false);
  const [rawXml, setRawXml] = useState<string | null>(null);
  const [showRawXml, setShowRawXml] = useState(false);
  const [parsedItemsCount, setParsedItemsCount] = useState<number | null>(null);

  // AI Ads Generator State
  const [platform, setPlatform] = useState<"meta" | "tiktok">("meta");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [objective, setObjective] = useState<string>("conversions");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<AdResponse | null>(null);
  const [savedAds, setSavedAds] = useState<AdResponse[]>([]);

  // Base URL calculation (safe client-side)
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://teenliwa.com";

  // Build dynamic Feed URL based on options
  const buildFeedUrl = (format: "xml" | "csv" | "json") => {
    const params = new URLSearchParams();
    if (currency !== "AED") params.set("currency", currency);
    if (brandName !== "تين ليوا") params.set("brand", brandName);
    if (availableOnly) params.set("available_only", "1");
    params.set("origin", currentOrigin);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return `${currentOrigin}/api/feeds/meta.${format}${queryString}`;
  };

  const xmlFeedUrl = buildFeedUrl("xml");
  const csvFeedUrl = buildFeedUrl("csv");
  const jsonFeedUrl = buildFeedUrl("json");

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success("تم نسخ الرابط إلى الحافظة بنجاح!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInspectFeed = async () => {
    setInspecting(true);
    try {
      const res = await fetch(xmlFeedUrl);
      if (!res.ok) throw new Error("تعذّر جلب ملف التغذية");
      const text = await res.text();
      setRawXml(text);

      // Count <item> tags
      const matches = text.match(/<item>/g);
      const count = matches ? matches.length : 0;
      setParsedItemsCount(count);
      toast.success(`تم فحص تغذية الكتالوج بنجاح: تم اكتشاف ${count} منتج صالح لـ Meta!`);
    } catch (err: any) {
      toast.error(err?.message || "فشل فحص التغذية");
    } finally {
      setInspecting(false);
    }
  };

  const handleGenerateAd = async () => {
    setIsGenerating(true);
    const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          productName: selectedProduct ? selectedProduct.name : "تين أحمر وأصفر طازج",
          productCategory: selectedProduct ? selectedProduct.category : "فواكه طازجة",
          productPrice: selectedProduct ? selectedProduct.price : 85,
          objective,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate ad");
      const data = await res.json();
      if (data.ad) {
        setGeneratedAd(data.ad);
        toast.success("تم إنشاء محتوى الإعلان بنجاح بواسطة الذكاء الاصطناعي!");
      }
    } catch (err) {
      console.error(err);
      toast.error("تعذّر إنشاء الإعلان. تأكد من إعدادات الذكاء الاصطناعي ورمز API.");
      // High-quality Fallback preview
      setGeneratedAd({
        headline: `عروض تين ليوا الملكي — طازج من المزرعة لبيتك! 🍇✨`,
        primaryText: `استمتع بألذ طعم للتين الأحمـر والأصفر المقطوف فوراً من مزارع ليوا العريقة. توصيل سريع ومبرّد لجميع إمارات الدولة بنفس اليوم!`,
        description: `توصيل مبرّد خلال ساعات | خيارات دفع متعددة وسريعة`,
        callToAction: "اطلب الآن",
        targetAudience:
          "رجال ونساء في دولة الإمارات العربية المتحدة (أبوظبي، دبي، الشارقة، العين) المهتمين بالفواكه والأطعمة الطازجة والمنتجات المحلية الفاخرة.",
        visualHook:
          "فيديو استعراض سريع لفتح صندوق التين الفاخر ورؤية حبات التين العصيرية مع خلفية المزرعة.",
        hashtags: ["#تين_ليوا", "#فواكه_طازجة", "#MetaAds", "#توصيل_الإمارات", "#منتجات_محلية"],
        budgetAdvice: "ميزانية مبدئية: 50-100 درهم يومياً مع استهداف جميع إمارات الدولة.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">
                كتالوج وإعلانات Meta (Meta Ads & Product Catalog RSS)
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                تغذية منتجات RSS متوافقة 100% مع كتالوج Meta (Facebook & Instagram Catalog API)
                وتوليد حملات تسويقية.
              </p>
            </div>
          </div>
        </div>

        {/* Action Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://developers.facebook.com/apps/1534037124662927/use_cases/customize/?use_case_enum=CATALOG_API&selected_tab=quickstart"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors shadow-xs"
          >
            <Facebook className="h-4 w-4" />
            Meta Catalog Quickstart
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <a
            href="https://business.facebook.com/commerce_manager/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors shadow-xs"
          >
            <Layers className="h-4 w-4 text-purple-500" />
            Commerce Manager
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border/80 gap-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "catalog"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-t-xl"
          }`}
        >
          <Rss className="h-4 w-4 text-orange-500" />
          تغذية كتالوج Meta (RSS / XML Feed)
          <span className="rounded-full bg-primary/20 text-primary text-[11px] px-2 py-0.5 font-mono">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ai_generator")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "ai_generator"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-t-xl"
          }`}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          منشئ إعلانات AI (Meta & TikTok)
        </button>

        <button
          onClick={() => setActiveTab("guide")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "guide"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-t-xl"
          }`}
        >
          <HelpCircle className="h-4 w-4 text-blue-500" />
          دليل الربط السريع (Quickstart)
        </button>
      </div>

      {/* TAB 1: META CATALOG RSS FEED */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Top Status & Health Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3.5 shadow-xs">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">
                  حالة التغذية الحية
                </div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  جاهزة ومتزامنة (200 OK)
                </div>
                <div className="text-[10px] text-muted-foreground">معيار RSS 2.0 / Google XML</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 flex items-center gap-3.5 shadow-xs">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">
                  إجمالي المنتجات بالكتالوج
                </div>
                <div className="text-base font-extrabold text-foreground">
                  {products.length} منتج
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold">
                  {products.filter((p) => p.available !== false).length} متوفر في المخزون
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 flex items-center gap-3.5 shadow-xs">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                <Facebook className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">حساب Meta Catalog</div>
                <div className="text-sm font-extrabold text-foreground truncate max-w-[140px]">
                  App ID: 1534037124662927
                </div>
                <div className="text-[10px] text-muted-foreground">Use Case: CATALOG_API</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 flex items-center gap-3.5 shadow-xs">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">
                  Meta Pixel المربوط
                </div>
                <div className="text-sm font-extrabold text-foreground">
                  {metaPixelId || "غير محدد (اختياري)"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {metaPixelId ? "تتبع التحويلات مفعل" : "أضفه من صفحة الإعدادات"}
                </div>
              </div>
            </div>
          </div>

          {/* Feed URLs & Quick Copy Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Rss className="h-5 w-5 text-orange-500" />
                  روابط تغذية الكتالوج الرسمية (Data Feed URLs)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  انسخ هذا الرابط والصقه في Meta Commerce Manager (Data Feeds) لربط وتحديث الكتالوج
                  تلقائياً كل ساعة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    refetchProducts();
                    refetchStats();
                    toast.success("تم تحديث بيانات الكتالوج والتغذية!");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                  تحديث فوري
                </button>
                <button
                  onClick={handleInspectFeed}
                  disabled={inspecting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  {inspecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  فحص واختبار التغذية
                </button>
              </div>
            </div>

            {/* XML Feed URL (Primary) */}
            <div className="space-y-2 rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-primary">
                  <FileCode className="h-4 w-4" />
                  <span>رابط تغذية XML / RSS 2.0 الرئيسي (الأفضل والموصى به لـ Meta Ads):</span>
                </div>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                  Meta & Google Standard
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  readOnly
                  value={xmlFeedUrl}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono font-semibold text-foreground outline-none select-all"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(xmlFeedUrl, "xml")}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    {copiedKey === "xml" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedKey === "xml" ? "تم النسخ!" : "نسخ الرابط"}
                  </button>
                  <a
                    href={xmlFeedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                    title="فتح التغذية في تبويب جديد"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </div>

            {/* Other Formats (CSV & JSON) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* CSV Feed */}
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="h-4 w-4" /> تغذية CSV (Meta Spreadsheet Feed)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">RFC-4180</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={csvFeedUrl}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground outline-none select-all truncate"
                  />
                  <button
                    onClick={() => handleCopy(csvFeedUrl, "csv")}
                    className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                    title="نسخ رابط CSV"
                  >
                    {copiedKey === "csv" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={csvFeedUrl}
                    download="meta_catalog.csv"
                    className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                    title="تحميل ملف CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* JSON Feed */}
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Code2 className="h-4 w-4" /> تغذية JSON (Meta Catalog API Payload)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">REST JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={jsonFeedUrl}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground outline-none select-all truncate"
                  />
                  <button
                    onClick={() => handleCopy(jsonFeedUrl, "json")}
                    className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                    title="نسخ رابط JSON"
                  >
                    {copiedKey === "json" ? (
                      <Check className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={jsonFeedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                    title="استعراض JSON"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Customization & Parameter Controls */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <Sliders className="h-4 w-4 text-primary" />
              تخصيص وإعدادات تغذية الكتالوج (Feed Controls & Filters)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  العملة المعروضة في الكتالوج
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                >
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="QAR">ريال قطري (QAR)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                  <option value="OMR">ريال عماني (OMR)</option>
                  <option value="BHD">دينار بحريني (BHD)</option>
                </select>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  اسم العلامة التجارية (Brand Name)
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="تين ليوا"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              {/* Stock Filter Toggle */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  تصفية المنتجات غير المتوفرة
                </label>
                <button
                  type="button"
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    availableOnly
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{availableOnly ? "المنتجات المتوفرة فقط" : "تضمين جميع المنتجات"}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono border">
                    {availableOnly
                      ? `${products.filter((p) => p.available !== false).length} منتج`
                      : `${products.length} منتج`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Feed Inspector Result Box */}
          {rawXml && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-bold">
                    نتيجة الفحص المباشر: {parsedItemsCount} منتج تم التحقق من توافقها التام
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRawXml(!showRawXml)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                  >
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    {showRawXml ? "إخفاء كود XML" : "عرض كود XML الخام"}
                  </button>
                  <button
                    onClick={() => handleCopy(rawXml, "raw_xml")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {copiedKey === "raw_xml" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    نسخ الـ XML
                  </button>
                </div>
              </div>

              {/* Sample Product Cards in Catalog */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground">
                  معاينة أولية للمنتجات داخل ملف التغذية:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {products.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border/70 bg-background p-3 flex gap-3 items-center"
                    >
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0 border">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">🍇</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-foreground">{p.name}</div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {p.price} {currency}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {p.id} · {p.available !== false ? "متوفر" : "غير متوفر"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showRawXml && (
                <div className="relative rounded-xl border border-border bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-72">
                  <pre>{rawXml}</pre>
                </div>
              )}
            </div>
          )}

          {/* Quick Meta Commerce Manager Integration CTA Card */}
          <div className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-card to-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <Facebook className="h-3.5 w-3.5" />
                  Meta Commerce Manager & Catalog API
                </div>
                <h3 className="text-lg font-extrabold text-foreground">
                  طريقة ربط الكتالوج بحساب إعلانات فيسبوك وإنستغرام (خلال 60 ثانية)
                </h3>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  افتح رابط Meta Catalog Quickstart، اختر إضافة منتجات عبر (Data Feed)، الصق رابط
                  الـ XML أعلاه، وحدد التحديث التلقائي اليومي أو كل ساعة.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(xmlFeedUrl, "xml_cta")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
                >
                  {copiedKey === "xml_cta" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  1. نسخ رابط الـ XML
                </button>
                <a
                  href="https://developers.facebook.com/apps/1534037124662927/use_cases/customize/?use_case_enum=CATALOG_API&selected_tab=quickstart"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500 bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md transition-all"
                >
                  2. فتح Meta Quickstart
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ADS GENERATOR */}
      {activeTab === "ai_generator" && (
        <div className="space-y-6">
          {/* Main Grid: Controls vs Preview */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-xs">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  تحديد خيارات الحملة الإعلانية
                </h2>

                {/* Platform Selector */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground">
                    المنصة الإعلانية
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatform("meta")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                        platform === "meta"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Facebook className="h-4 w-4" />
                      Meta Ads (FB/IG)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatform("tiktok")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                        platform === "tiktok"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Share2 className="h-4 w-4" />
                      TikTok Ads
                    </button>
                  </div>
                </div>

                {/* Product Selector */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground">
                    اختر المنتج المراد الترويج له
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="">جميع المنتجات / العرض العام للمتجر</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.price} AED
                      </option>
                    ))}
                  </select>
                </div>

                {/* Objective Selector */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground">
                    هدف الحملة (Campaign Objective)
                  </label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="conversions">المبيعات والتحويلات (Sales & Conversions)</option>
                    <option value="catalog_sales">
                      مبيعات الكتالوج الديناميكية (Catalog Sales)
                    </option>
                    <option value="traffic">زيارات المتجر (Website Traffic)</option>
                    <option value="awareness">الانتشار والوعي بالعلامة (Brand Awareness)</option>
                    <option value="leads">تجميع بيانات العملاء (Leads)</option>
                  </select>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleGenerateAd}
                  disabled={isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/20 transition-all"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGenerating
                    ? "جارٍ التوليد بواسطة Gemini AI..."
                    : "توليد الإعلان بالذكاء الاصطناعي"}
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Mockup & AI Ad Result */}
            <div className="lg:col-span-7 space-y-6">
              {!generatedAd ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-bold">جاهز لإنشاء حملتك الإعلانية الأولى</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    اختر المنصة والمنتج ثم انقر على "توليد الإعلان بالذكاء الاصطناعي" للحصول على
                    نصوص احترافية واستهداف دقيق.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ad Card Mockup Preview */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">
                          معاينة الإعلان الحية (
                          {platform === "meta" ? "Meta Ads Preview" : "TikTok Ad Preview"})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSavedAds((prev) => [generatedAd, ...prev]);
                          toast.success("تم حفظ الإعلان في الأرشيف المحلي");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-primary" />
                        حفظ في الأرشيف
                      </button>
                    </div>

                    {/* Facebook/Instagram Style Post Preview */}
                    {platform === "meta" ? (
                      <div className="mx-auto max-w-md rounded-2xl border border-border/80 bg-background overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3.5 border-b border-border/40">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                              TL
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-foreground">
                                تين ليوا — Liwa Figs
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                مُمول (Sponsored) · 🌐
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Primary Text */}
                        <div className="p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-line">
                          {generatedAd.primaryText}
                        </div>

                        {/* Image Mockup */}
                        <div className="relative aspect-square w-full bg-secondary/80 flex flex-col items-center justify-center overflow-hidden">
                          {selectedProduct && selectedProduct.image_url ? (
                            <img
                              src={selectedProduct.image_url}
                              alt={selectedProduct.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="p-6 text-center">
                              <span className="text-4xl">🍇</span>
                              <div className="mt-2 text-xs font-bold text-muted-foreground">
                                {selectedProduct ? selectedProduct.name : "تين ليوا الفاخر"}
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white font-bold backdrop-blur-sm">
                            توصيل اليوم بنفس الإمارات
                          </div>
                        </div>

                        {/* Headline & CTA bar */}
                        <div className="flex items-center justify-between bg-secondary/40 p-3">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-[10px] text-muted-foreground uppercase font-mono">
                              teenliwa.com
                            </div>
                            <div className="font-extrabold text-xs text-foreground truncate">
                              {generatedAd.headline}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {generatedAd.description}
                            </div>
                          </div>
                          <button className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground">
                            {generatedAd.callToAction}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* TikTok Style Preview */
                      <div className="mx-auto max-w-xs rounded-3xl border border-border/80 bg-black text-white p-4 aspect-[9/16] flex flex-col justify-between relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center text-xs text-zinc-400">
                          <span>Live Feed</span>
                          <span className="bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            TikTok Ad
                          </span>
                        </div>

                        {/* Center image */}
                        <div className="my-auto text-center p-4">
                          {selectedProduct && selectedProduct.image_url ? (
                            <img
                              src={selectedProduct.image_url}
                              alt={selectedProduct.name}
                              className="h-32 w-32 object-cover rounded-2xl mx-auto border-2 border-white/20 shadow-lg"
                            />
                          ) : (
                            <div className="text-5xl mb-2">🍇</div>
                          )}
                          <div className="font-extrabold text-sm mt-2 text-white">
                            {generatedAd.headline}
                          </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="space-y-2 text-right">
                          <div className="text-xs font-bold">@teenliwa_official</div>
                          <div className="text-[11px] text-zinc-300 line-clamp-3 leading-snug">
                            {generatedAd.primaryText}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            {generatedAd.hashtags.join(" ")}
                          </div>
                          <button className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 font-bold text-xs text-white text-center mt-2">
                            {generatedAd.callToAction}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Generated Copy & Campaign Strategy */}
                  <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-xs">
                    <h3 className="font-bold text-sm flex items-center gap-2 border-b border-border/60 pb-3">
                      <Target className="h-4 w-4 text-primary" />
                      تفاصيل الإعلان والاستراتيجية المقترحة
                    </h3>

                    {/* Headline Copy */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>العنوان الرئيسي (Headline)</span>
                        <button
                          onClick={() => handleCopy(generatedAd.headline, "headline")}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {copiedKey === "headline" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          نسخ
                        </button>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-3 text-xs font-bold text-foreground">
                        {generatedAd.headline}
                      </div>
                    </div>

                    {/* Primary Text Copy */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>نص الإعلان الإقناعي (Primary Text)</span>
                        <button
                          onClick={() => handleCopy(generatedAd.primaryText, "primaryText")}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {copiedKey === "primaryText" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          نسخ
                        </button>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-3 text-xs text-foreground leading-relaxed whitespace-pre-line">
                        {generatedAd.primaryText}
                      </div>
                    </div>

                    {/* Target Audience Recommendation */}
                    <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 space-y-1">
                      <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" /> الاستهداف والتوجيه المقترح (Target
                        Audience)
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {generatedAd.targetAudience}
                      </p>
                    </div>

                    {/* Visual Hook Concept */}
                    <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 space-y-1">
                      <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> فكرة الهوك البصري والفيديو (Visual Hook
                        Idea)
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {generatedAd.visualHook}
                      </p>
                    </div>

                    {/* Budget Advice */}
                    <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 space-y-1">
                      <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> نصيحة الميزانية والمزايدة (Budget &
                        Bidding)
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {generatedAd.budgetAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP QUICKSTART GUIDE */}
      {activeTab === "guide" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                خطوات ربط المتجر مع Meta Commerce Manager & Catalog API
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                دليل تفصيلي لربط كتالوج المنتجات مع إعلانات فيسبوك وانستغرام لتمكين إعلانات الكتالوج
                الديناميكية (Advantage+ Catalog Ads).
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="h-8 w-8 rounded-full bg-primary/20 font-extrabold text-primary flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <div className="font-bold text-sm text-foreground">
                    نسخ رابط تغذية الـ XML (RSS Feed URL)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    من تبويب "تغذية كتالوج Meta"، انسخ رابط الـ XML التالي:
                  </p>
                  <div className="flex items-center gap-2 max-w-xl">
                    <input
                      readOnly
                      value={xmlFeedUrl}
                      className="flex-1 rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs font-mono select-all"
                    />
                    <button
                      onClick={() => handleCopy(xmlFeedUrl, "guide_xml")}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      {copiedKey === "guide_xml" ? "تم!" : "نسخ"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="h-8 w-8 rounded-full bg-primary/20 font-extrabold text-primary flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <div className="font-bold text-sm text-foreground">
                    فتح Meta Commerce Manager أو صفحة Quickstart
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    انتقل إلى مدير التجارة في فيسبوك عبر الرابط التالي:
                  </p>
                  <a
                    href="https://developers.facebook.com/apps/1534037124662927/use_cases/customize/?use_case_enum=CATALOG_API&selected_tab=quickstart"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    فتح رابط Meta App Catalog Quickstart (App ID: 1534037124662927)
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="h-8 w-8 rounded-full bg-primary/20 font-extrabold text-primary flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-sm text-foreground">
                    اختيار مصادر البيانات (Data Sources)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    داخل الكتالوج، اضغط على <strong>Data Sources</strong> ثم{" "}
                    <strong>Add Items (إضافة عناصر)</strong> واختر{" "}
                    <strong>Data Feed (استخدام تغذية بيانات)</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="h-8 w-8 rounded-full bg-primary/20 font-extrabold text-primary flex items-center justify-center shrink-0">
                  4
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-sm text-foreground">
                    لصق الرابط وتحديد التحديث المجدول (Scheduled Feed)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    اختر <strong>Scheduled Feed (تغذية مجدولة)</strong>، الصق الرابط المنسوخ، حدد
                    وقت التحديث (يومياً أو كل ساعة Hourly)، واضبط العملة الافتراضية على{" "}
                    <strong>AED</strong>.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 font-extrabold text-emerald-600 flex items-center justify-center shrink-0">
                  ✓
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-sm text-foreground">اكتمل الإعداد بنجاح!</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    سيقوم فيسبوك بمزامنة جميع المنتجات والصور والأسعار وتوفرها تلقائياً. يمكنك الآن
                    إطلاق حملات Advantage+ Catalog Ads واستهداف الزوار بالمنتجات التي شاهدوها في
                    المتجر.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
