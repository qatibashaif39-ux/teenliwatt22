import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Save,
  KeyRound,
  Info,
  Globe,
  Activity,
  ShoppingCart,
  Share2,
  Receipt,
  Percent,
  Rss,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENCY } from "@/data/products";

export const Route = createFileRoute("/dashboard/settings")({
  component: DashboardSettings,
});

const KEYS = [
  "ziina_api_key",
  "ziina_test_mode",
  "site_domain",
  "meta_pixel_id",
  "meta_access_token",
  "tiktok_pixel_id",
  "tiktok_access_token",
  "min_order_qty",
  "tax_enabled",
  "tax_rate",
  "tax_label",
  "social_whatsapp",
  "social_facebook",
  "social_snapchat",
  "social_instagram",
] as const;

type SettingsMap = Record<(typeof KEYS)[number], string>;
const SETTINGS_STORAGE_KEY = "d1_app_settings_store";

async function fetchSettings(): Promise<SettingsMap> {
  const map: SettingsMap = {
    ziina_api_key: "",
    ziina_test_mode: "true",
    site_domain: "",
    meta_pixel_id: "",
    meta_access_token: "",
    tiktok_pixel_id: "",
    tiktok_access_token: "",
    min_order_qty: "2",
    tax_enabled: "false",
    tax_rate: "5",
    tax_label: "ضريبة القيمة المضافة (VAT)",
    social_whatsapp: "",
    social_facebook: "",
    social_snapchat: "",
    social_instagram: "",
  };
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...map, ...parsed };
    }
  } catch {
    // fallback
  }
  return map;
}

async function upsertSetting(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    const current = await fetchSettings();
    current[key as keyof SettingsMap] = value;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("[Settings] Save setting failed:", err);
  }
}

function DashboardSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["app_settings"], queryFn: fetchSettings });

  const [apiKey, setApiKey] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [domain, setDomain] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [ttToken, setTtToken] = useState("");
  const [showTt, setShowTt] = useState(false);
  const [minQty, setMinQty] = useState("2");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState("5");
  const [taxLabel, setTaxLabel] = useState("ضريبة القيمة المضافة (VAT)");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    if (data) {
      setApiKey(data.ziina_api_key);
      setTestMode(data.ziina_test_mode !== "false");
      setDomain(data.site_domain);
      setMetaPixelId(data.meta_pixel_id);
      setMetaToken(data.meta_access_token);
      setPixelId(data.tiktok_pixel_id);
      setTtToken(data.tiktok_access_token);
      setMinQty(data.min_order_qty || "2");
      setTaxEnabled(data.tax_enabled === "true");
      setTaxRate(data.tax_rate || "5");
      setTaxLabel(data.tax_label || "ضريبة القيمة المضافة (VAT)");
      setWhatsapp(data.social_whatsapp);
      setFacebook(data.social_facebook);
      setSnapchat(data.social_snapchat);
      setInstagram(data.social_instagram);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await upsertSetting("ziina_api_key", apiKey.trim());
      await upsertSetting("ziina_test_mode", testMode ? "true" : "false");
      await upsertSetting("site_domain", domain.trim().replace(/\/+$/, ""));
      await upsertSetting("meta_pixel_id", metaPixelId.trim());
      await upsertSetting("meta_access_token", metaToken.trim());
      await upsertSetting("tiktok_pixel_id", pixelId.trim());
      await upsertSetting("tiktok_access_token", ttToken.trim());
      const n = Math.max(1, parseInt(minQty, 10) || 1);
      await upsertSetting("min_order_qty", String(n));
      await upsertSetting("tax_enabled", taxEnabled ? "true" : "false");
      const r = Math.max(0, parseFloat(taxRate) || 0);
      await upsertSetting("tax_rate", String(r));
      await upsertSetting("tax_label", taxLabel.trim() || "ضريبة القيمة المضافة (VAT)");
      await upsertSetting("social_whatsapp", whatsapp.trim());
      await upsertSetting("social_facebook", facebook.trim());
      await upsertSetting("social_snapchat", snapchat.trim());
      await upsertSetting("social_instagram", instagram.trim());
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("تعذّر حفظ الإعدادات");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors";
  const numTaxRate = Math.max(0, parseFloat(taxRate) || 0);
  const sampleOrderSubtotal = 100;
  const sampleTax = taxEnabled ? sampleOrderSubtotal * (numTaxRate / 100) : 0;
  const sampleTotal = sampleOrderSubtotal + sampleTax;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">الإعدادات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة بوابة الدفع، الضرائب، إعلانات Meta وTikTok، والحدود التشغيلية للمتجر.
        </p>
      </div>

      {/* Tax and VAT Section */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h2 className="font-bold">إعدادات الضريبة والقيمة المضافة (Tax & VAT)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          تحكم في حساب وتطبيق ضريبة القيمة المضافة على طلبات المتجر مع إظهارها بشكل منفصل ومفصل في
          صفحة الدفع والفاتورة.
        </p>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm pt-2">
          <input
            type="checkbox"
            checked={taxEnabled}
            onChange={(e) => setTaxEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-primary cursor-pointer"
          />
          <span className="font-bold text-foreground">
            تفعيل احتساب الضريبة في صفحة إتمام الطلب (Enable Tax Calculation)
          </span>
        </label>

        {taxEnabled && (
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-foreground flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-primary" /> نسبة الضريبة المئوية (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="مثال: 5"
                  className={field}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-foreground">
                  مسمى الضريبة بالفاتورة
                </label>
                <input
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                  placeholder="ضريبة القيمة المضافة (VAT)"
                  className={field}
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-xs space-y-1.5">
              <div className="font-bold text-foreground mb-1">معاينة مباشرة لتطبيق الضريبة:</div>
              <div className="flex justify-between text-muted-foreground">
                <span>طلب تجريبي بقيمة:</span>
                <span>
                  {sampleOrderSubtotal.toFixed(2)} {CURRENCY}
                </span>
              </div>
              <div className="flex justify-between text-primary font-semibold">
                <span>
                  {taxLabel} ({numTaxRate}%):
                </span>
                <span>
                  +{sampleTax.toFixed(2)} {CURRENCY}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1.5 font-bold text-foreground">
                <span>الإجمالي المحتسب للعميل:</span>
                <span>
                  {sampleTotal.toFixed(2)} {CURRENCY}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="font-bold">دومين الموقع</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          الدومين الكامل المستخدم في روابط نجاح/إلغاء الدفع. مثال:{" "}
          <span dir="ltr" className="font-mono">
            https://teenliwa.com
          </span>
        </p>
        <input
          dir="ltr"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="https://yourdomain.com"
          className={`${field} mt-3 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-bold">بوابة الدفع — Ziina</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          أدخل مفتاح API من{" "}
          <a
            href="https://docs.ziina.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            docs.ziina.com
          </a>
          .
        </p>
        <label className="mt-4 block text-sm font-semibold">مفتاح Ziina API</label>
        <div className="mt-2 flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="ZIINA_API_KEY"
            className={`${field} font-mono`}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="rounded-xl border border-border px-3 text-xs font-bold hover:bg-secondary"
          >
            {showKey ? "إخفاء" : "إظهار"}
          </button>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="font-semibold">وضع الاختبار (Test Mode)</span>
        </label>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>عند تفعيله، يتم استخدام مدفوعات تجريبية. أوقفه عند الاستعداد للإنتاج.</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-bold">تتبع Meta Ads Pixel (Facebook & Instagram)</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          معرّف بكسل فيسبوك لتتبع الزيارات، إضافة للسلة، وبدء وإتمام الطلب (PageView, AddToCart,
          InitiateCheckout, Purchase).
        </p>

        <label className="mt-4 block text-sm font-semibold">Meta Pixel ID</label>
        <input
          dir="ltr"
          value={metaPixelId}
          onChange={(e) => setMetaPixelId(e.target.value)}
          placeholder="123456789012345"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-semibold">
          Meta Conversions API Token (اختياري)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            dir="ltr"
            type={showMeta ? "text" : "password"}
            value={metaToken}
            onChange={(e) => setMetaToken(e.target.value)}
            placeholder="EAAGxxxxxxxxxxxxxxxxxx"
            className={`${field} font-mono`}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowMeta((v) => !v)}
            className="rounded-xl border border-border px-3 text-xs font-bold hover:bg-secondary"
          >
            {showMeta ? "إخفاء" : "إظهار"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Rss className="h-4 w-4 text-orange-500 shrink-0" />
            <div>
              <span className="font-bold text-foreground">كتالوج منتجات Meta (RSS / XML Feed)</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                تغذية منتجات مباشرة متزامنة تلقائياً مع Meta Commerce Manager لإعلانات الكتالوج
                الديناميكية.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/ads"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            إدارة الكتالوج
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-bold">تتبع إعلانات TikTok (TikTok Ads Pixel)</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          بكسل TikTok يعمل في المتصفح مع Advanced Matching لربط الهواتف والبريد الإلكتروني وأحداث
          InitiateCheckout و CompletePayment.
        </p>

        <label className="mt-4 block text-sm font-semibold">TikTok Pixel ID</label>
        <input
          dir="ltr"
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          placeholder="C4XXXXXXXXXXXXXXXXXX"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-semibold">
          TikTok Events API Access Token (اختياري)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            dir="ltr"
            type={showTt ? "text" : "password"}
            value={ttToken}
            onChange={(e) => setTtToken(e.target.value)}
            placeholder="EAxxxxxxxxxxxxxxxxxx"
            className={`${field} font-mono`}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowTt((v) => !v)}
            className="rounded-xl border border-border px-3 text-xs font-bold hover:bg-secondary"
          >
            {showTt ? "إخفاء" : "إظهار"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-bold">الحد الأدنى للطلب العام</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          أقل كمية إجمالية مسموح بها لتسجيل الطلب. مثال: عند ضبطه على 2، لن يُقبل طلب بكمية إجمالية
          أقل من 2.
        </p>
        <label className="mt-4 block text-sm font-semibold">أدنى كمية</label>
        <input
          type="number"
          min={1}
          step={1}
          value={minQty}
          onChange={(e) => setMinQty(e.target.value)}
          className={`${field} mt-2 w-32`}
        />
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <h2 className="font-bold">روابط التواصل الاجتماعي</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          تظهر كأيقونات في الفوتر. اترك الحقل فارغاً لإخفاء الأيقونة.
        </p>

        <label className="mt-4 block text-sm font-semibold">واتساب (رقم أو رابط)</label>
        <input
          dir="ltr"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="971501234567 أو https://wa.me/971501234567"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-semibold">إنستغرام</label>
        <input
          dir="ltr"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="https://instagram.com/username"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-semibold">فيسبوك</label>
        <input
          dir="ltr"
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
          placeholder="https://facebook.com/page"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-semibold">سناب شات</label>
        <input
          dir="ltr"
          value={snapchat}
          onChange={(e) => setSnapchat(e.target.value)}
          placeholder="https://snapchat.com/add/username"
          className={`${field} mt-2 font-mono`}
          autoComplete="off"
          spellCheck={false}
        />
      </section>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-sm"
      >
        {save.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        حفظ الإعدادات
      </button>
    </div>
  );
}
