import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Share2,
  ShoppingBag,
  Star,
  Check,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import { type Product, CURRENCY } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { ReviewsSection } from "@/components/ReviewsSection";
import { ShareModal } from "@/components/ShareModal";
import { getProductReviews, calculateAverageRating } from "@/lib/reviews";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenShare?: (product: Product) => void;
}

export function QuickViewModal({ product, isOpen, onClose, onOpenShare }: QuickViewModalProps) {
  const { add } = useCart();
  const { t } = useLanguage();
  const minQty = product?.minimum_order_quantity ?? 1;
  const maxQty = product?.maximum_order_quantity ?? null;
  const [qty, setQty] = useState(minQty);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 5, total: 0 });

  useEffect(() => {
    if (product) {
      setQty(product.minimum_order_quantity ?? 1);
      const revs = getProductReviews(product.id);
      setReviewsSummary(calculateAverageRating(revs));
    }
  }, [product, isOpen]);

  if (!product) return null;

  const handleAddToCart = () => {
    add(product, qty);
  };

  const handleShareClick = () => {
    if (onOpenShare) {
      onOpenShare(product);
    } else {
      setShareOpen(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border/80 text-foreground p-0 rounded-3xl shadow-2xl">
          {/* Close button handled by dialog or custom header */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Product Image Section */}
              <div className="relative aspect-square md:aspect-auto md:h-full bg-secondary/30 min-h-[280px]">
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
                  onClick={handleShareClick}
                  className="absolute top-4 left-4 h-10 w-10 rounded-full shadow-lg bg-background/80 hover:bg-background backdrop-blur-md text-foreground transition-all hover:scale-110"
                  aria-label="مشاركة المنتج"
                >
                  <Share2 className="h-4 w-4 text-primary" />
                </Button>
              </div>

              {/* Product Info Section */}
              <div className="p-6 md:p-8 flex flex-col justify-between text-right">
                <div className="space-y-4">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                      {product.category || "منتج طازج"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{reviewsSummary.average > 0 ? reviewsSummary.average : 5}</span>
                      <span className="text-muted-foreground font-normal">
                        ({reviewsSummary.total} تقييم)
                      </span>
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                        {product.name}
                      </h2>
                      <Link
                        to="/products/$id"
                        params={{ id: product.id }}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        title="فتح الصفحة المخصصة للمنتج"
                      >
                        <span>صفحة المنتج</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-primary">{product.price}</span>
                      <span className="text-base font-bold text-foreground">{CURRENCY}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  {/* Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/40">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <span>طبيعي وطازج 100%</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/40">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>توصيل سريع بالإمارات</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Quantity & Add to Cart */}
                <div className="mt-6 pt-6 border-t border-border/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-foreground">الكمية المطلوبة:</span>
                      {(minQty > 1 || maxQty) && (
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {minQty > 1 ? `أقل كمية: ${minQty}` : ""}
                          {minQty > 1 && maxQty ? " | " : ""}
                          {maxQty ? `أقصى كمية: ${maxQty}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 rounded-full bg-secondary p-1 border border-border/50">
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

                  <div className="flex gap-2">
                    <Button
                      disabled={!product.available}
                      onClick={handleAddToCart}
                      className="flex-1 py-6 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {product.available ? t("product.add") : t("product.upcoming")}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShareClick}
                      className="h-auto py-3 px-4 rounded-2xl border-border hover:bg-secondary flex items-center justify-center"
                      title="مشاركة المنتج"
                    >
                      <Share2 className="h-5 w-5 text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Full Reviews & Comments Section */}
            <div className="p-6 md:p-8 bg-card">
              <ReviewsSection productId={product.id} productName={product.name} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Internal Share Modal fallback */}
      <ShareModal product={product} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
