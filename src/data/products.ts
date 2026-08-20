import redFig from "@/assets/red-fig.jpg";
import yellowFig from "@/assets/hero-figs.jpg";
import dates from "@/assets/dates.jpg";
import mulberry from "@/assets/mulberry.jpg";
import cactus from "@/assets/cactus.jpg";
import truffle from "@/assets/truffle.jpg";
import almonds from "@/assets/almonds.jpg";

export const CURRENCY = "د.إ";

// Unified product shape used across the storefront and cart.
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  minimum_order_quantity: number;
  maximum_order_quantity?: number | null;
}

// Bundled fallback images for the originally-seeded products (keyed by seed_key).
export const SEED_IMAGES: Record<string, string> = {
  "red-fig": redFig,
  "yellow-fig": yellowFig,
  dates,
  mulberry,
  cactus,
  truffle,
  almonds,
};

// Neutral placeholder for products without an image.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%231f1f1f'/%3E%3Ctext x='50%25' y='50%25' fill='%23777' font-size='28' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3E%D9%84%D8%A7 %D8%AA%D9%88%D8%AC%D8%AF %D8%B5%D9%88%D8%B1%D8%A9%3C/text%3E%3C/svg%3E";

export function resolveProductImage(opts: {
  image_url?: string | null;
  seed_key?: string | null;
}): string {
  if (opts.image_url) return opts.image_url;
  if (opts.seed_key && SEED_IMAGES[opts.seed_key]) return SEED_IMAGES[opts.seed_key];
  return PLACEHOLDER_IMAGE;
}
