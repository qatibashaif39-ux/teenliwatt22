import { useEffect, useState } from "react";
import { getAppSetting } from "@/lib/settings";
import { isMarketingAllowed, COOKIE_CONSENT_EVENT } from "@/lib/cookies";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export function MetaPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const val = getAppSetting("meta_pixel_id").trim();
    if (val) {
      setPixelId(val);
    }
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
    if (!pixelId || !hasConsent || typeof window === "undefined") return;

    if (window.fbq) {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      return;
    }

    // Initialize Meta Pixel script
    const fbq = function (...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, args);
      } else {
        fbq.queue.push(args);
      }
    };

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }, [pixelId, hasConsent]);

  return null;
}

export function metaTrack(event: string, payload?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq || !isMarketingAllowed()) return;
  try {
    if (eventId) {
      window.fbq("track", event, payload ?? {}, { eventID: eventId });
    } else {
      window.fbq("track", event, payload ?? {});
    }
  } catch (err) {
    console.warn("[Meta Pixel] Event tracking failed:", err);
  }
}

export function metaSetUser(userData: { em?: string; ph?: string; fn?: string; ln?: string }) {
  if (typeof window === "undefined" || !window.fbq || !isMarketingAllowed()) return;
  try {
    window.fbq("setUserProperties", userData);
  } catch {
    // fallback
  }
}
