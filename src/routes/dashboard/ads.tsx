import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

export function DashboardAdsPage() {
  const { data: products = [] } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchProducts,
  });

  // Load Meta Pixel ID
  const { data: metaPixelId } = useQuery({
    queryKey: ["app_settings", "meta_pixel_id"],
    queryFn: async () => {
      try {
        const raw = localStorage.getItem("d1_app_settings_store");
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.meta_pixel_id || "";
        }
      } catch {
        // fallback
      }
      return "";
    },
  });

  const [platform, setPlatform] = useState<"meta" | "tiktok">("meta");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [objective, setObjective] = useState<string>("conversions");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<AdResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedAds, setSavedAds] = useState<AdResponse[]>([]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleGenerateAd = async () => {
    setIsGenerating(true);
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
      // Fallback preview
      setGeneratedAd({
        headline: `عروض تين ليوا الممتازة — طازج من المزرعة لبيتك! 🍇✨`,
        primaryText: `استمتع بألذ طعم للتين الأحمـر والأصفر المقطوف فوراً من مزارع ليوا العريقة. توصيل سريع ومبرّد لجميع إمارات الدولة بنفس اليوم!`,
        description: `توصيل مبرّد خلال ساعات | خيارات دفع متعددة وسريعة`,
        callToAction: "اطلب الآن",
        targetAudience:
          "رجال ونساء في دولة الإمارات العربية المتحدة (أبوظبي، دبي، الشارقة...) المهتمين بالفواكه والأطعمة الطازجة.",
        visualHook:
          "فيديو استعراض سريع لفتح صندوق التين الفاخر ورؤية حبات التين العصيرية مع خلفية المزرعة.",
        hashtags: ["#تين_ليوا", "#فواكه_طازجة", "#MetaAds", "#توصيل_الإمارات"],
        budgetAdvice: "ميزانية مبدئية: 50-100 درهم يومياً مع استهداف جميع إمارات الدولة.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success("تم النسخ للحافظة");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveAd = (ad: AdResponse) => {
    setSavedAds((prev) => [ad, ...prev]);
    toast.success("تم حفظ الإعلان في الأرشيف المحلي");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-extrabold">
              منشئ الحملات الإعلانية بالذكاء الاصطناعي — AI Ads Manager
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            توليد نصوص وحملات Meta Ads (Facebook & Instagram) و TikTok Ads مخصصة للمتجر بلمسة واحدة.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2">
          <a
            href="https://adsmanager.facebook.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold transition-colors hover:bg-secondary"
          >
            <Facebook className="h-4 w-4 text-blue-500" />
            Meta Ads Manager
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
          <a
            href="https://ads.tiktok.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold transition-colors hover:bg-secondary"
          >
            <Share2 className="h-4 w-4 text-emerald-400" />
            TikTok Ads
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Meta Pixel Live Status Badge */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2.5 ${metaPixelId ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
          >
            {metaPixelId ? <CheckCircle2 className="h-5 w-5" /> : <Sliders className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-sm font-bold">
              {metaPixelId ? `Meta Ads Pixel متصل: ${metaPixelId}` : "لم يتم ربط Meta Pixel ID بعد"}
            </div>
            <div className="text-xs text-muted-foreground">
              {metaPixelId
                ? "يتم تسجيل أحداث PageView, InitiateCheckout, و Purchase تلقائياً في المتجر."
                : "يمكنك إضافة Pixel ID في صفحة الإعدادات لتتبع التحويلات بفعالية."}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
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
                      ? "bg-primary text-primary-foreground border-primary"
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
                      ? "bg-primary text-primary-foreground border-primary"
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
                <option value="traffic">زيارات المتجر (Website Traffic)</option>
                <option value="awareness">الانتشار والوعي بالعلامة (Brand Awareness)</option>
                <option value="leads">تجميع بيانات العملاء (Leads)</option>
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerateAd}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/20"
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
                اختر المنصة والمنتج ثم انقر على "توليد الإعلان بالذكاء الاصطناعي" للحصول على نصوص
                احترافية واستهداف دقيق.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ad Card Mockup Preview */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">
                      معاينة الإعلان الحية (
                      {platform === "meta" ? "Meta Ads Preview" : "TikTok Ad Preview"})
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveAd(generatedAd)}
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
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
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
                    <Target className="h-3.5 w-3.5" /> الاستهداف والتوجيه المقترح (Target Audience)
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

          {/* Saved Ads Archive */}
          {savedAds.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                أرشيف الإعلانات المحفوظة ({savedAds.length})
              </h3>
              <div className="space-y-2">
                {savedAds.map((ad, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-background p-3 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground">{ad.headline}</div>
                      <div className="text-muted-foreground text-[11px] truncate max-w-md">
                        {ad.primaryText}
                      </div>
                    </div>
                    <button
                      onClick={() => setGeneratedAd(ad)}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold hover:bg-primary hover:text-primary-foreground"
                    >
                      استعراض
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
