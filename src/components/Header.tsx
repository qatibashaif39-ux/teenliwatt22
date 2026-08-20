import { Link } from "@tanstack/react-router";
import { ShoppingCart, Languages } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();
  const { t, toggle } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-1 text-xl font-extrabold tracking-tight">
          <span className="text-foreground">{t("brand.teen")}</span>
          <span className="text-primary">{t("brand.liwa")}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground sm:flex">
          <Link to="/" className="transition-colors hover:text-foreground">
            {t("nav.shop")}
          </Link>
          <Link to="/orders" className="transition-colors hover:text-foreground">
            {t("nav.orders")}
          </Link>
          {/*<Link to="/track" search={{ code: undefined }}
          className="transition-colors
          hover:text-foreground">{t("nav.track")}</Link>*/}
          {/*<Link to="/dashboard" className="transition-colors
          hover:text-foreground">{t("nav.dashboard")}</Link>*/}
          <a href="#about" className="transition-colors hover:text-foreground">
            {t("nav.about")}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-secondary px-3 text-sm font-bold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            {t("lang.toggle")}
          </button>
          <button
            onClick={onCartClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label={t("cart.title")}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
