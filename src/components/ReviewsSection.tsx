import { useState, useEffect } from "react";
import { Star, MessageSquare, ShieldCheck, Plus, CheckCircle2, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  type Review,
  getProductReviews,
  addProductReview,
  calculateAverageRating,
} from "@/lib/reviews";

interface ReviewsSectionProps {
  productId: string;
  productName: string;
}

export function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReviews(getProductReviews(productId));
  }, [productId]);

  const { average, total } = calculateAverageRating(reviews);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      toast.error("يرجى كتابة اسمك");
      return;
    }
    if (!comment.trim()) {
      toast.error("يرجى كتابة تعليقك أو تقييمك للمنتج");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = addProductReview({
        productId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        rating,
        comment: comment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setAuthorName("");
      setAuthorEmail("");
      setComment("");
      setRating(5);
      setShowForm(false);
      toast.success("شكراً لك! تم إضافة تقييمك بنجاح.");
    } catch {
      toast.error("حدث خطأ أثناء حفظ التقييم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "مؤخراً";
    }
  };

  return (
    <div className="mt-8 border-t border-border/60 pt-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            تقييمات وآراء العملاء ({total})
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(average) ? "fill-amber-400" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-sm">{average > 0 ? average : 5} من 5</span>
            <span className="text-xs text-muted-foreground">({total} تقييم)</span>
          </div>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "default"}
          className="rounded-xl flex items-center gap-2 font-bold"
        >
          <Plus className={`h-4 w-4 transition-transform ${showForm ? "rotate-45" : ""}`} />
          {showForm ? "إلغاء كتابة تقييم" : "أضف تقييمك الآن"}
        </Button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="my-6 p-5 rounded-2xl bg-secondary/40 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <h4 className="font-bold text-sm">شاركنا رأيك في {productName}</h4>

          {/* Star selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">التقييم:</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const currentRating = hoverRating || rating;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`${star} نجوم`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= currentRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-amber-400 mr-2">
                {rating === 5
                  ? "ممتاز جداً ⭐⭐⭐⭐⭐"
                  : rating === 4
                    ? "جيد جداً ⭐⭐⭐⭐"
                    : rating === 3
                      ? "متوسط ⭐⭐⭐"
                      : rating === 2
                        ? "مقبول ⭐⭐"
                        : "يحتاج تحسين ⭐"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">اسمك الكريم * :</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: عبد الله النعيمي"
                className="bg-background rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                البريد الإلكتروني (اختياري):
              </label>
              <Input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-background rounded-xl text-sm dir-ltr text-right"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">تعليقك وتجربتك:</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب تفاصيل تجربتك مع المنتج، جودة المذاق، التوصيل..."
              className="bg-background rounded-xl text-sm min-h-[90px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="rounded-xl text-xs"
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs">
              {isSubmitting ? "جاري النشر..." : "نشر التقييم"}
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border/60">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">
              لا توجد تقييمات لهذا المنتج حتى الآن.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              كن أول من يقيّم هذا المنتج ويشارك تجربته مع الآخرين!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-right space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {rev.authorName.charAt(0) || <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm flex items-center gap-1.5">
                      {rev.authorName}
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          <CheckCircle2 className="h-3 w-3" />
                          مشتري مؤكد
                        </span>
                      )}
                    </h5>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= rev.rating ? "fill-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed pr-10">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
