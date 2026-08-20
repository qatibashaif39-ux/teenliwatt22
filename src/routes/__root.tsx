import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { useState } from "react";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { Header } from "../components/Header";
import { CartDrawer } from "../components/CartDrawer";
import { BottomNav } from "../components/BottomNav";
import { Toaster } from "../components/ui/sonner";
import { Footer } from "../components/Footer";
import { TikTokPixel } from "../components/TikTokPixel";
import { MetaPixel } from "../components/MetaPixel";
import { CookieConsentBanner } from "../components/CookieConsentBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[App Error]", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "theme-color", content: "#1a1612" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "تين ليوا" },
      { name: "application-name", content: "تين ليوا" },
      { name: "format-detection", content: "telephone=no" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "تين ليوا — تين وتمور وفواكه فاخرة بالتوصيل في نفس اليوم" },
      {
        name: "description",
        content:
          "أشهى أنواع التين الأحمر والأصفر الطازج، التمور الفاخرة، التوت البلدي، الصبار الحلو، الفقع، واللوز. قطاف يومي وتوصيل مبرد سريع لجميع إمارات الدولة.",
      },
      {
        name: "keywords",
        content:
          "تين ليوا, تين طازج, تمور فاخرة الإمارات, توصيل فواكه طازجة, تين أحمر, تين أصفر, تمر مجدول, فقع كمأة, صبار تين شوكي, مزارع ليوا",
      },
      {
        name: "author",
        content: "متجر تين ليوا الرسمي",
      },
      {
        property: "og:title",
        content: "تين ليوا — تين وتمور وفواكه فاخرة بالتوصيل في نفس اليوم",
      },
      {
        property: "og:description",
        content: "تين أحمر وأصفر طازج عسلي، تمور فاخرة، وفواكه موسمية مع ضمان الجودة والطزاجة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://teenliwa.com" },
      { property: "og:locale", content: "ar_AE" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:site_name", content: "تين ليوا — Teen Liwa" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "تين ليوا — قطاف وتوصيل فواكه وتمور فاخرة" },
      {
        name: "twitter:description",
        content: "فواكه وتمور طازجة من مزارع ليوا مع التوصيل المبرد في نفس اليوم داخل الإمارات.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://teenliwa.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Cairo:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Header onCartClick={() => setCartOpen(true)} />
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <Footer />
            <BottomNav />
            <Toaster position="top-center" richColors />
            <TikTokPixel />
            <MetaPixel />
            <CookieConsentBanner />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
