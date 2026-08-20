import { createFileRoute } from "@tanstack/react-router";
import { FALLBACK_PRODUCTS } from "@/lib/catalog";

const BASE_URL = "https://teenliwa.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/checkout", "/privacy", "/track"];
        const productPaths = FALLBACK_PRODUCTS.map((p) => `/products/${p.id}`);
        const allPaths = [...staticPaths, ...productPaths];

        const urls = allPaths
          .map(
            (p) =>
              `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === "/" ? "1.0" : p.startsWith("/products/") ? "0.8" : "0.5"}</priority>\n  </url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
