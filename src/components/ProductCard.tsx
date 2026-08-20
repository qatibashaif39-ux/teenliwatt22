import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Eye, Share2, Star } from "lucide-react";
import { CURRENCY, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { getProductReviews, calculateAverageRating } from "@/lib/reviews";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView, onShare }: ProductCardProps) {
  const { add } = useCart();
  const { t } = useLanguage();
  const minQty = product.minimum_order_quantity ?? 1;
  const maxQty = product.maximum_order_quantity ?? null;
  const [qty, setQty] = useState(minQty);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 5, total: 0 });

  useEffect(() => {
    const revs = getProductReviews(product.id);
    setReviewsSummary(calculateAverageRating(revs));
  }, [product.id]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-black/30">
      <div className="relative aspect-square overflow-hidden bg-secondary/20">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Quick Action Floating Buttons */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              title="معاينة وتفاصيل المنتج"
              aria-label="عرض تفاصيل المنتج"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={() => onShare(product)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              title="مشاركة المنتج"
              aria-label="مشاركة المنتج"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {!product.available && (
          <span className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-bold text-muted-foreground">
            {t("product.upcoming")}
          </span>
        )}

        {/* Floating Rating Pill */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-amber-400 shadow-sm">
          <Star className="h-3 w-3 fill-amber-400" />
          <span>{reviewsSummary.average > 0 ? reviewsSummary.average : 5}</span>
          {reviewsSummary.total > 0 && (
            <span className="text-muted-foreground text-[10px]">({reviewsSummary.total})</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/products/$id"
            params={{ id: product.id }}
            className="text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors"
          >
            {product.name}
          </Link>
        </div>

        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-extrabold text-primary">
              {product.price} <span className="text-sm">{CURRENCY}</span>
            </span>
            {(minQty > 1 || maxQty) && (
              <div className="text-[10px] text-muted-foreground font-medium">
                {minQty > 1 ? `أقل كمية: ${minQty}` : ""}
                {minQty > 1 && maxQty ? " | " : ""}
                {maxQty ? `أقصى كمية: ${maxQty}` : ""}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
            <button
              onClick={() => setQty((q) => (maxQty ? Math.min(maxQty, q + 1) : q + 1))}
              disabled={maxQty !== null && qty >= maxQty}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="زيادة"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.max(minQty, q - 1))}
              disabled={qty <= minQty}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="إنقاص"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            disabled={!product.available}
            onClick={() => add(product, qty)}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
          >
            {product.available ? t("product.add") : t("product.upcoming")}
          </button>

          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              title="معاينة وتقييمات"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
