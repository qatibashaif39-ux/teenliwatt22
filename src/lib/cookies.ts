export interface CookiePreferences {
  necessary: boolean; // Always true (Cart, Language, Session, Essential Security)
  analytics: boolean; // Site traffic & performance metrics
  marketing: boolean; // Meta Pixel, TikTok Pixel, Social Ads tracking
  updatedAt: string;
  version: string;
}

const STORAGE_KEY = "teenliwa_cookie_consent_v1";
export const COOKIE_CONSENT_EVENT = "teenliwa_cookie_consent_updated";

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  marketing: true,
  updatedAt: new Date().toISOString(),
  version: "1.0",
};

export function getStoredCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: Partial<CookiePreferences>): CookiePreferences {
  const finalPrefs: CookiePreferences = {
    necessary: true,
    analytics: prefs.analytics ?? true,
    marketing: prefs.marketing ?? true,
    updatedAt: new Date().toISOString(),
    version: "1.0",
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPrefs));
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: finalPrefs }));
    } catch (e) {
      console.warn("Failed to save cookie consent", e);
    }
  }

  return finalPrefs;
}

export function acceptAllCookies(): CookiePreferences {
  return saveCookieConsent({ necessary: true, analytics: true, marketing: true });
}

export function acceptEssentialOnly(): CookiePreferences {
  return saveCookieConsent({ necessary: true, analytics: false, marketing: false });
}

export function isMarketingAllowed(): boolean {
  const consent = getStoredCookieConsent();
  // If user hasn't made a choice yet, default to false until consented or accepted
  if (!consent) return false;
  return !!consent.marketing;
}

export function isAnalyticsAllowed(): boolean {
  const consent = getStoredCookieConsent();
  if (!consent) return false;
  return !!consent.analytics;
}
