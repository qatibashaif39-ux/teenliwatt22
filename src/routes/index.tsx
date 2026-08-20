import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ProductListSkeleton } from "@/components/ProductCardSkeleton";
import { QuickViewModal } from "@/components/QuickViewModal";
import { ShareModal } from "@/components/ShareModal";
import { fetchProducts, toProduct } from "@/lib/catalog";
import { useLanguage } from "@/context/LanguageContext";
import { type Product } from "@/data/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تين ليوا — تين وتمور وفواكه فاخرة بالتوصيل في نفس اليوم" },
      {
        name: "description",
        content:
          "متجر تين ليوا الرسمي بالإمارات. تين أحمر وأصفر طازج، تمور فاخرة، توت، صبار، فقع، لوز، ورطب. قطاف يومي وتوصيل مبرد سريع لجميع إمارات الدولة.",
      },
      { property: "og:title", content: "تين ليوا — متجر الفواكه والتمور الفاخرة بالإمارات" },
      {
        property: "og:description",
        content: "تين طازج عسلي وتمور فاخرة مع خدمة التوصيل في نفس اليوم داخل الإمارات.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_AE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "تين ليوا — قطاف وتوصيل فواكه وتمور فاخرة" },
      {
        name: "twitter:description",
        content: "أشهى أنواع التين والتمور الطبيعية 100% مع ضمان الجودة والطزاجة والتوصيل الفوري.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const qc = useQueryClient();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const ALL = t("filter.all");
  const [active, setActive] = useState<string>("__all__");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  useEffect(() => {
    const handleUpdate = () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    };
    window.addEventListener("products_updated", handleUpdate);
    return () => window.removeEventListener("products_updated", handleUpdate);
  }, [qc]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => r.category && seen.add(r.category));
    return [...seen];
  }, [rows]);

  const visible = useMemo(
    () => (active === "__all__" ? rows : rows.filter((p) => p.category === active)),
    [active, rows],
  );

  // Check URL query param for direct product links (?product=xyz)
  useEffect(() => {
    if (typeof window !== "undefined" && rows.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = urlParams.get("product");
      if (prodId) {
        const found = rows.find((r) => r.id === prodId || String(r.id) === String(prodId));
        if (found) {
          setSelectedProduct(toProduct(found));
        }
      }
    }
  }, [rows]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleShare = (product: Product) => {
    setShareProduct(product);
  };

  // Structured Data Schema for Local Business and Online Store
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "تين ليوا - Teen Liwa",
    description:
      "متجر متخصص في التين الطبيعي الطازج والتمور والفواكه الفاخرة في دولة الإمارات العربية المتحدة.",
    url: "https://teenliwa.ae",
    currenciesAccepted: "AED",
    paymentAccepted: "Credit Card, Apple Pay, Debit Card",
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Fresh Fruits & Dates Catalog",
      itemListElement: rows.slice(0, 10).map((item, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: item.name,
          description: item.description,
          image: item.image,
          sku: `TL-${item.id}`,
        },
        price: item.price,
        priceCurrency: "AED",
        position: index + 1,
      })),
    },
  };

  return (
    <main className="min-h-screen pb-16">
      {/* Search Engine Optimization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />

      <Hero />
      <div className="mx-auto max-w-6xl px-4">
        {/* Filter Navigation Bar */}
        <div className="sticky top-16 z-30 -mx-4 flex gap-2 overflow-x-auto border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-lg">
          <button
            onClick={() => setActive("__all__")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active === "__all__"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {ALL}
          </button>
          {categories.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Product Grid or Skeleton Loading or Empty State */}
        {isLoading ? (
          <ProductListSkeleton count={8} />
        ) : visible.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40">
            <Package className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">لا توجد منتجات معروضة حالياً</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              يمكنك إضافة وتخصيص منتجات متجرك والأسعار بكل سهولة من لوحة التحكم.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => {
              const productObj = toProduct(p);
              return (
                <ProductCard
                  key={p.id}
                  product={productObj}
                  onQuickView={handleQuickView}
                  onShare={handleShare}
                />
              );
            })}
          </div>
        )}

        <section
          id="about"
          className="mt-16 rounded-2xl border border-border/60 bg-card p-6 text-center"
        >
          <h2 className="text-xl font-bold">{t("about.title")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("about.body")}</p>
        </section>
      </div>

      {/* Product Quick View & Reviews Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenShare={handleShare}
      />

      {/* Social Media Share Modal */}
      <ShareModal
        product={shareProduct}
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
      />
    </main>
  );
}
