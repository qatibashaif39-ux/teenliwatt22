export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorEmail?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

const STORAGE_KEY = "store_product_reviews_v1";

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    authorName: "سالم المنصوري",
    rating: 5,
    comment: "جودة ممتازة جداً وطازجة والتوصيل كان سريعاً في نفس اليوم في أبوظبي. أنصح به بشدة!",
    createdAt: "2026-08-10T14:30:00.000Z",
    verifiedPurchase: true,
  },
  {
    id: "rev-2",
    productId: "prod-1",
    authorName: "فاطمة الكعبي",
    rating: 5,
    comment: "طعم رائع وتغليف أنيق ونظيف. سأطلب مرة أخرى بالتأكيد.",
    createdAt: "2026-08-12T09:15:00.000Z",
    verifiedPurchase: true,
  },
  {
    id: "rev-3",
    productId: "prod-2",
    authorName: "محمد الهاشمي",
    rating: 4,
    comment: "تين أصفر لذيذ جداً وحلو المذاق، تجربة ممتازة.",
    createdAt: "2026-08-08T18:20:00.000Z",
    verifiedPurchase: true,
  },
  {
    id: "rev-4",
    productId: "prod-3",
    authorName: "راشد الشامسي",
    rating: 5,
    comment: "تمور فاخرة وأصلية وطازجة، بارك الله لكم.",
    createdAt: "2026-08-11T11:00:00.000Z",
    verifiedPurchase: true,
  },
];

export function getProductReviews(productId: string): Review[] {
  if (typeof window === "undefined")
    return INITIAL_REVIEWS.filter((r) => r.productId === productId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored: Review[] = raw ? JSON.parse(raw) : INITIAL_REVIEWS;
    return stored.filter((r) => r.productId === productId);
  } catch {
    return INITIAL_REVIEWS.filter((r) => r.productId === productId);
  }
}

export function getAllReviews(): Review[] {
  if (typeof window === "undefined") return INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
  } catch {
    return INITIAL_REVIEWS;
  }
}

export function addProductReview(review: Omit<Review, "id" | "createdAt">): Review {
  const current = getAllReviews();
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
  };
  const updated = [newReview, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newReview;
}

export function calculateAverageRating(reviews: Review[]): { average: number; total: number } {
  if (!reviews.length) return { average: 5, total: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    total: reviews.length,
  };
}
