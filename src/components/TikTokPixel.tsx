import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { getAppSetting } from "@/lib/settings";
import { isMarketingAllowed, COOKIE_CONSENT_EVENT } from "@/lib/cookies";

declare global {
  interface Window {
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

async function fetchPixelId(): Promise<string> {
  return getAppSetting("tiktok_pixel_id").trim();
}

function loadPixel(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.ttq && window.ttq._loaded) return;
  /* eslint-disable */
  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    var ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: any) {
      var e = ttq._i[t] || [];
      for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: any, n: any) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      var o = n && n.partner;
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.async = !0;
      s.src = r + "?sdkid=" + e + "&lib=" + t;
      var a = document.getElementsByTagName("script")[0];
      a.parentNode!.insertBefore(s, a);
    };
    ttq.load(pixelId);
    ttq.page();
    ttq._loaded = true;
  })(window, document, "ttq");
  /* eslint-enable */
}

export function TikTokPixel() {
  const { data: pixelId } = useQuery({
    queryKey: ["tiktok_pixel_id"],
    queryFn: fetchPixelId,
    staleTime: 5 * 60 * 1000,
  });
  const router = useRouter();
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setHasConsent(isMarketingAllowed());
    const handleConsentUpdate = () => {
      setHasConsent(isMarketingAllowed());
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentUpdate);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    if (pixelId && hasConsent) loadPixel(pixelId);
  }, [pixelId, hasConsent]);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      if (typeof window !== "undefined" && window.ttq?.page && isMarketingAllowed()) {
        window.ttq.page();
      }
    });
    return () => unsub();
  }, [router]);

  return null;
}

export function tiktokTrack(event: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.ttq?.track || !isMarketingAllowed()) return;
  try {
    window.ttq.track(event, payload ?? {});
  } catch (err) {
    console.warn("[TikTok Pixel] Track error:", err);
  }
}

export function tiktokIdentify(userData: {
  email?: string;
  phone_number?: string;
  external_id?: string;
}) {
  if (typeof window === "undefined" || !window.ttq?.identify || !isMarketingAllowed()) return;
  try {
    const clean: Record<string, string> = {};
    if (userData.email) clean.email = userData.email.trim().toLowerCase();
    if (userData.phone_number) clean.phone_number = userData.phone_number.trim();
    if (userData.external_id) clean.external_id = userData.external_id.trim();
    window.ttq.identify(clean);
  } catch (err) {
    console.warn("[TikTok Pixel] Identify error:", err);
  }
}
