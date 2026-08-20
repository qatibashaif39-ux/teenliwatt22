import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Share2,
  Check,
  Sparkles,
  ShieldCheck,
  Truck,
  Heart,
} from "lucide-react";
import { fetchProducts, toProduct } from "@/lib/catalog";
import { CURRENCY, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { ReviewsSection } from "@/components/ReviewsSection";
import { ShareModal } from "@/components/ShareModal";
import { ProductDetailSkeleton } from "@/components/ProductDetailSkeleton";
import { getProductReviews, calculateAverageRating } from "@/lib/reviews";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `تين ليوا — تفاصيل المنتج | منتجات طازجة بالتوصيل الفوري` },
      {
        name: "description",
        content:
          "اطلب أفخر أنواع التين والتمور والفواكه الطازجة مباشرة من متجر تين ليوا مع التوصيل في نفس اليوم داخل الإمارات العربية المتحدة.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "تين ليوا — فواكه وتمور فاخرة" },
      {
        property: "og:description",
        content: "جودة استثنائية، مذاق عسلي طازج، وتوصيل سريع ومبرد لجميع إمارات الدولة.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `https://teenliwa.com/products/${params.id}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://teenliwa.com/products/${params.id}` }],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [shareOpen, setShareOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const rawProduct = rows.find((r) => String(r.id) === String(id));
  const product: Product | null = rawProduct ? toProduct(rawProduct) : null;

  const minQty = product?.minimum_order_quantity ?? 1;
  const maxQty = product?.maximum_order_quantity ?? null;
  const [qty, setQty] = useState(minQty);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <main className="min-h-screen py-16 px-4">
        <div className="mx-auto max-w-lg text-center space-y-4 rounded-3xl bg-card border border-border/80 p-8 shadow-xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isAr ? "المنتج غير متوفر أو تم نقله" : "Product Not Found"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "عذراً، لم نتمكن من العثور على هذا المنتج. يمكنك استعراض باقي تشكيلة التين والتمور والفواكه الطازجة."
              : "Sorry, this item is unavailable or might have been removed. Explore our other fresh fruits and dates."}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <BackIcon className="h-4 w-4" />
              {isAr ? "العودة للمتجر الرئيسي" : "Back to Home"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const revs = getProductReviews(product.id);
  const reviewsSummary = calculateAverageRating(revs);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    sku: `TL-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "Teen Liwa",
    },
    offers: {
      "@type": "Offer",
      url:
        typeof window !== "undefined"
          ? window.location.href
          : `https://teenliwa.ae/products/${product.id}`,
      priceCurrency: "AED",
      price: product.price,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating:
      reviewsSummary.total > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: reviewsSummary.average,
            reviewCount: reviewsSummary.total,
          }
        : undefined,
  };

  return (
    <main className="min-h-screen py-8 px-4">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <BackIcon className="h-4 w-4" />
            {isAr ? "العودة لجميع المنتجات" : "Back to Products"}
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {product.category || (isAr ? "فاكهة طازجة" : "Fresh Fruit")}
          </span>
        </div>

        {/* Main Product Details Card */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Product Image Section */}
            <div className="relative aspect-square md:aspect-auto md:h-full bg-secondary/30 min-h-[350px]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-t-3xl md:rounded-tr-none md:rounded-r-3xl"
              />
              {!product.available && (
                <span className="absolute top-4 right-4 rounded-full bg-background/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-muted-foreground shadow-md">
                  {t("product.upcoming")}
                </span>
              )}
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => setShareOpen(true)}
                className="absolute top-4 left-4 h-10 w-10 rounded-full shadow-lg bg-background/80 hover:bg-background backdrop-blur-md text-foreground transition-all hover:scale-110"
                aria-label="مشاركة المنتج"
              >
                <Share2 className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Product Info & Purchase Actions */}
            <div className="p-6 md:p-10 flex flex-col justify-between text-right">
              <div className="space-y-4">
                {/* Category & Rating summary */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {product.category || (isAr ? "منتج ليوا الفاخر" : "Premium Product")}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span>{reviewsSummary.average > 0 ? reviewsSummary.average : 5}</span>
                    <span className="text-muted-foreground font-normal">
                      ({reviewsSummary.total} {isAr ? "تقييم" : "reviews"})
                    </span>
                  </div>
                </div>

                {/* Title & Price */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {product.name}
                  </h1>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {product.price}
                    </span>
                    <span className="text-lg font-bold text-foreground">{CURRENCY}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {isAr ? "قص طازج في نفس اليوم" : "Harvested Fresh Same-Day"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                    <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-foreground">
                      {isAr ? "توصيل سريع ومبرد لكافة الإمارات" : "Fast Chilled UAE Delivery"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-foreground">
                      {isAr ? "طبيعي وخالي من المواد الحافظة" : "100% Organic & Natural"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {isAr ? "ضمان الجودة والطزاجة" : "Freshness Guaranteed"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Controls */}
              <div className="mt-8 pt-6 border-t border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-foreground">
                      {isAr ? "الكمية المطلوبة:" : "Select Quantity:"}
                    </span>
                    {(minQty > 1 || maxQty) && (
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {minQty > 1
                          ? isAr
                            ? `أقل كمية للطلب: ${minQty}`
                            : `Min order: ${minQty}`
                          : ""}
                        {minQty > 1 && maxQty ? " | " : ""}
                        {maxQty
                          ? isAr
                            ? `أقصى كمية للطلب: ${maxQty}`
                            : `Max order: ${maxQty}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 rounded-full bg-secondary p-1.5 border border-border/50">
                    <button
                      onClick={() => setQty((q) => (maxQty ? Math.min(maxQty, q + 1) : q + 1))}
                      disabled={maxQty !== null && qty >= maxQty}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-base font-extrabold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                      disabled={qty <= minQty}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
                      aria-label="إنقاص الكمية"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    disabled={!product.available}
                    onClick={() => add(product, qty)}
                    className="flex-1 py-6 rounded-2xl font-black text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {product.available ? t("product.add") : t("product.upcoming")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShareOpen(true)}
                    className="h-auto py-3 px-5 rounded-2xl border-border/80 hover:bg-secondary flex items-center justify-center"
                    title="مشاركة المنتج"
                  >
                    <Share2 className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Reviews Section */}
          <div className="p-6 md:p-10 bg-card border-t border-border/60">
            <ReviewsSection productId={product.id} productName={product.name} />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal product={product} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </main>
  );
}
