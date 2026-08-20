import { Link } from "@tanstack/react-router";
import { Home, ShoppingBag, Info } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function BottomNav() {
  const { t } = useLanguage();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-center justify-around px-4">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary [&.active]:text-primary"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t("nav.shop")}</span>
        </Link>
        <Link
          to="/orders"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary [&.active]:text-primary"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t("nav.orders")}</span>
        </Link>
        <a
          href="#about"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        >
          <Info className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t("nav.about")}</span>
        </a>
      </div>
    </nav>
  );
}
