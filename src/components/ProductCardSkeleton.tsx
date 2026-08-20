import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-secondary/40 overflow-hidden">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute right-3 bottom-3 h-5 w-14 rounded-full bg-secondary/80" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
        </div>

        {/* Price & Counter */}
        <div className="mt-2 flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2 pt-1">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
