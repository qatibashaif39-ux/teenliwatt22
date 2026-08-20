import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen py-8 px-4 animate-pulse">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Main Product Details Card Skeleton */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image Skeleton */}
            <div className="relative aspect-square md:aspect-auto md:h-full bg-secondary/30 min-h-[350px]">
              <Skeleton className="w-full h-full rounded-t-3xl md:rounded-tr-none md:rounded-r-3xl" />
              <div className="absolute top-4 left-4 h-10 w-10 rounded-full bg-secondary/80" />
            </div>

            {/* Product Info Section Skeleton */}
            <div className="p-6 md:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Category & Rating */}
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>

                {/* Title & Price */}
                <div className="space-y-2">
                  <Skeleton className="h-8 w-3/4 rounded-xl" />
                  <Skeleton className="h-9 w-32 rounded-xl" />
                </div>

                {/* Description Lines */}
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-4/6 rounded-md" />
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                  <Skeleton className="h-12 rounded-2xl" />
                  <Skeleton className="h-12 rounded-2xl" />
                  <Skeleton className="h-12 rounded-2xl" />
                  <Skeleton className="h-12 rounded-2xl" />
                </div>
              </div>

              {/* Order Controls Skeleton */}
              <div className="mt-8 pt-6 border-t border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28 rounded-md" />
                  <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                <div className="flex gap-3">
                  <Skeleton className="h-14 flex-1 rounded-2xl" />
                  <Skeleton className="h-14 w-16 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section Skeleton */}
          <div className="p-6 md:p-10 bg-card border-t border-border/60 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-xl" />
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
