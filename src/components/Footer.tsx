import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, MessageCircle, Ghost, ShieldCheck, Cookie, Map } from "lucide-react";
import { getAppSettings } from "@/lib/settings";
import { useLanguage } from "@/context/LanguageContext";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { openCookieSettings } from "@/components/CookieConsentBanner";

async function fetchSocials() {
  const settings = getAppSettings();
  return {
    social_whatsapp: settings.social_whatsapp,
    social_facebook: settings.social_facebook,
    social_snapchat: settings.social_snapchat,
    social_instagram: settings.social_instagram,
  };
}

function normalizeWhatsapp(v: string) {
  if (!v) return "";
  if (v.startsWith("http")) return v;
  const digits = v.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function normalizeUrl(v: string) {
  if (!v) return "";
  if (v.startsWith("http")) return v;
  return `https://${v}`;
}

export function Footer() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["app_settings", "socials"],
    queryFn: fetchSocials,
  });

  const socials = [
    {
      key: "whatsapp",
      label: "واتساب",
      href: normalizeWhatsapp(data?.social_whatsapp ?? ""),
      Icon: MessageCircle,
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/10 hover:bg-[#25D366]/20",
    },
    {
      key: "instagram",
      label: "إنستغرام",
      href: normalizeUrl(data?.social_instagram ?? ""),
      Icon: Instagram,
      color: "text-[#E4405F]",
      bg: "bg-[#E4405F]/10 hover:bg-[#E4405F]/20",
    },
    {
      key: "facebook",
      label: "فيسبوك",
      href: normalizeUrl(data?.social_facebook ?? ""),
      Icon: Facebook,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
    },
    {
      key: "snapchat",
      label: "سناب شات",
      href: normalizeUrl(data?.social_snapchat ?? ""),
      Icon: Ghost,
      color: "text-[#FFFC00]",
      bg: "bg-yellow-400/10 hover:bg-yellow-400/20",
    },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 pb-20 backdrop-blur-lg md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {socials.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socials.map(({ key, label, href, Icon, color, bg }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${bg} ${color}`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs text-muted-foreground">
          <Link
            to="/privacy"
            className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            {isAr ? "سياسة الخصوصية وحماية البيانات" : "Privacy Policy"}
          </Link>

          <button
            type="button"
            onClick={openCookieSettings}
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
          >
            <Cookie className="h-4 w-4 text-amber-400" />
            {isAr ? "إعدادات ملفات الارتباط (Cookies)" : "Cookie Settings"}
          </button>

          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {isAr ? "معاينة سريعة للخصوصية" : "Quick Privacy Overview"}
          </button>

          <Link to="/orders" className="hover:text-primary transition-colors">
            {t("nav.orders")}
          </Link>

          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
          >
            <Map className="h-3.5 w-3.5 text-emerald-400" />
            {isAr ? "خريطة الموقع (Sitemap)" : "Sitemap (XML)"}
          </a>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          <p>جميع الحقوق محفوظة © 2026 teenliwa.com</p>
          <a
            href="https://gigatopx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>gigatopx.com</span>
          </a>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </footer>
  );
}
