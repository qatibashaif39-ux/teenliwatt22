import { Hono } from "hono";
import { fetchServerProducts, type ProductItem } from "./products";

export const feedsApi = new Hono();

// Helper to escape XML special chars safely
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Map seed keys to known image filenames
const SEED_IMAGE_FILENAMES: Record<string, string> = {
  "red-fig": "red-fig.jpg",
  "yellow-fig": "hero-figs.jpg",
  dates: "dates.jpg",
  mulberry: "mulberry.jpg",
  cactus: "cactus.jpg",
  truffle: "truffle.jpg",
  almonds: "almonds.jpg",
};

// Google Product Category mapping for farm produce / food
const GOOGLE_CATEGORY = "Food, Beverages & Tobacco > Food Items > Fruits & Vegetables";

// Determine absolute base URL
function getBaseUrl(c: any): string {
  const env = (c.env as Record<string, string> | undefined) || {};
  const queryOrigin = c.req.query("origin");
  if (queryOrigin && queryOrigin.startsWith("http")) {
    return queryOrigin.replace(/\/+$/, "");
  }

  const envDomain = env.SITE_DOMAIN || process.env.SITE_DOMAIN;
  if (envDomain && envDomain.startsWith("http")) {
    return envDomain.replace(/\/+$/, "");
  }

  try {
    const url = new URL(c.req.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://teenliwatt2.katebashaif.workers.dev";
  }
}

// Resolve absolute image URL for Meta Catalog
function resolveFeedImageUrl(p: ProductItem, baseUrl: string): string {
  if (p.image_url && (p.image_url.startsWith("http://") || p.image_url.startsWith("https://"))) {
    return p.image_url;
  }
  if (p.image_url && p.image_url.startsWith("/")) {
    return `${baseUrl}${p.image_url}`;
  }
  if (p.seed_key && SEED_IMAGE_FILENAMES[p.seed_key]) {
    return `${baseUrl}/assets/${SEED_IMAGE_FILENAMES[p.seed_key]}`;
  }
  // Default fallback image
  return `${baseUrl}/assets/hero-figs.jpg`;
}

// Generate Meta / Facebook / Google Merchant RSS 2.0 XML
export function generateMetaCatalogRssXml(
  products: ProductItem[],
  options: {
    baseUrl: string;
    brand?: string;
    currency?: string;
    storeName?: string;
    description?: string;
    availableOnly?: boolean;
  },
): string {
  const {
    baseUrl,
    brand = "تين ليوا",
    currency = "AED",
    storeName = "متجر تين ليوا - Teen Liwa Catalog",
    description = "كتالوج المنتجات الرسمي لمتجر تين ليوا — متوافق مع إعلانات Meta و Facebook و Instagram Catalog",
    availableOnly = false,
  } = options;

  const filtered = availableOnly ? products.filter((p) => p.available !== false) : products;

  const itemsXml = filtered
    .map((p) => {
      const productLink = `${baseUrl}/products/${p.id}`;
      const imageLink = resolveFeedImageUrl(p, baseUrl);
      const isAvailable = p.available !== false;
      const availability = isAvailable ? "in stock" : "out of stock";
      const priceFormatted = `${Number(p.price).toFixed(2)} ${currency}`;
      const title = p.name || "منتج تين ليوا";
      const desc = p.description || p.name || "منتج طازج وفاخر من مزارع ليوا";
      const category = p.category || "فواكه طازجة";
      const itemBrand = p.brand || brand;
      const itemCondition = p.condition || "new";
      const googleCat = p.google_product_category || GOOGLE_CATEGORY;
      const cLabel0 = p.custom_label_0 || category;
      const cLabel1 = p.custom_label_1 || (isAvailable ? "available" : "unavailable");
      const cLabel2 = p.custom_label_2 || `min_qty_${p.minimum_order_quantity || 1}`;

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title><![CDATA[${title}]]></g:title>
      <g:description><![CDATA[${desc}]]></g:description>
      <g:link>${escapeXml(productLink)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:brand><![CDATA[${itemBrand}]]></g:brand>
      <g:condition>${itemCondition}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceFormatted}</g:price>
      <g:currency>${currency}</g:currency>
      <g:product_type><![CDATA[${category}]]></g:product_type>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:item_group_id>teenliwa_store</g:item_group_id>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ""}
      ${p.unit_weight ? `<g:unit_pricing_measure>${escapeXml(p.unit_weight)}</g:unit_pricing_measure>` : ""}
      <g:custom_label_0><![CDATA[${cLabel0}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${cLabel1}]]></g:custom_label_1>
      <g:custom_label_2><![CDATA[${cLabel2}]]></g:custom_label_2>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:c="http://base.google.com/cns/1.0">
  <channel>
    <title><![CDATA[${storeName}]]></title>
    <link>${escapeXml(baseUrl)}</link>
    <description><![CDATA[${description}]]></description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Teen Liwa Meta Catalog RSS Generator</generator>
${itemsXml}
  </channel>
</rss>`;
}

// Generate Meta Catalog CSV Feed (RFC-4180 standard)
export function generateMetaCatalogCsv(
  products: ProductItem[],
  options: {
    baseUrl: string;
    brand?: string;
    currency?: string;
    availableOnly?: boolean;
  },
): string {
  const { baseUrl, brand = "تين ليوا", currency = "AED", availableOnly = false } = options;
  const filtered = availableOnly ? products.filter((p) => p.available !== false) : products;

  const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "google_product_category",
    "product_type",
    "mpn",
    "custom_label_0",
    "custom_label_1",
    "custom_label_2",
  ];

  const rows = filtered.map((p) => {
    const isAvailable = p.available !== false;
    const itemBrand = p.brand || brand;
    const itemCondition = p.condition || "new";
    const googleCat = p.google_product_category || GOOGLE_CATEGORY;
    const cLabel0 = p.custom_label_0 || p.category || "فواكه طازجة";
    const cLabel1 = p.custom_label_1 || (isAvailable ? "in_stock" : "out_of_stock");
    const cLabel2 = p.custom_label_2 || `min_qty_${p.minimum_order_quantity || 1}`;

    return [
      escapeCsv(p.id),
      escapeCsv(p.name || ""),
      escapeCsv(p.description || p.name || ""),
      escapeCsv(isAvailable ? "in stock" : "out of stock"),
      escapeCsv(itemCondition),
      escapeCsv(`${Number(p.price).toFixed(2)} ${currency}`),
      escapeCsv(`${baseUrl}/products/${p.id}`),
      escapeCsv(resolveFeedImageUrl(p, baseUrl)),
      escapeCsv(itemBrand),
      escapeCsv(googleCat),
      escapeCsv(p.category || "فواكه طازجة"),
      escapeCsv(p.sku || p.id),
      escapeCsv(cLabel0),
      escapeCsv(cLabel1),
      escapeCsv(cLabel2),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// ---------------- ROUTES ----------------

// GET /api/feeds/meta.xml (and aliases)
const handleXmlFeed = async (c: any) => {
  const env = (c.env as any) || {};
  const baseUrl = getBaseUrl(c);
  const currency = (c.req.query("currency") || "AED").toUpperCase();
  const brand = c.req.query("brand") || "تين ليوا";
  const availableOnly =
    c.req.query("available_only") === "1" || c.req.query("available_only") === "true";

  const products = await fetchServerProducts(env);
  const xml = generateMetaCatalogRssXml(products, {
    baseUrl,
    currency,
    brand,
    availableOnly,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

feedsApi.get("/meta.xml", handleXmlFeed);
feedsApi.get("/facebook.xml", handleXmlFeed);
feedsApi.get("/rss.xml", handleXmlFeed);
feedsApi.get("/google.xml", handleXmlFeed);
feedsApi.get("/catalog.xml", handleXmlFeed);
feedsApi.get("/feed.xml", handleXmlFeed);

// GET /api/feeds/meta.csv (Meta Catalog CSV / TSV)
feedsApi.get("/meta.csv", async (c) => {
  const env = (c.env as any) || {};
  const baseUrl = getBaseUrl(c);
  const currency = (c.req.query("currency") || "AED").toUpperCase();
  const brand = c.req.query("brand") || "تين ليوا";
  const availableOnly =
    c.req.query("available_only") === "1" || c.req.query("available_only") === "true";

  const products = await fetchServerProducts(env);
  const csv = generateMetaCatalogCsv(products, {
    baseUrl,
    currency,
    brand,
    availableOnly,
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="meta_catalog_feed.csv"',
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

// GET /api/feeds/meta.json (Meta Catalog JSON payload)
feedsApi.get("/meta.json", async (c) => {
  const env = (c.env as any) || {};
  const baseUrl = getBaseUrl(c);
  const currency = (c.req.query("currency") || "AED").toUpperCase();
  const brand = c.req.query("brand") || "تين ليوا";
  const availableOnly =
    c.req.query("available_only") === "1" || c.req.query("available_only") === "true";

  const rawProducts = await fetchServerProducts(env);
  const products = availableOnly ? rawProducts.filter((p) => p.available !== false) : rawProducts;

  const items = products.map((p) => ({
    id: p.id,
    title: p.name,
    description: p.description,
    availability: p.available !== false ? "in stock" : "out of stock",
    condition: "new",
    price: `${Number(p.price).toFixed(2)} ${currency}`,
    link: `${baseUrl}/products/${p.id}`,
    image_link: resolveFeedImageUrl(p, baseUrl),
    brand,
    google_product_category: GOOGLE_CATEGORY,
    product_type: p.category || "فواكه طازجة",
    custom_label_0: p.category || "فواكه طازجة",
    custom_label_1: p.available !== false ? "available" : "unavailable",
  }));

  return c.json({
    success: true,
    total_items: items.length,
    currency,
    brand,
    base_url: baseUrl,
    items,
    meta_feed_urls: {
      rss_xml: `${baseUrl}/api/feeds/meta.xml`,
      csv: `${baseUrl}/api/feeds/meta.csv`,
      json: `${baseUrl}/api/feeds/meta.json`,
    },
  });
});

// GET /api/feeds/stats (Catalog Feed Health & Analytics)
feedsApi.get("/stats", async (c) => {
  const env = (c.env as any) || {};
  const baseUrl = getBaseUrl(c);
  const products = await fetchServerProducts(env);

  const total = products.length;
  const inStock = products.filter((p) => p.available !== false).length;
  const outOfStock = total - inStock;
  const withCustomImage = products.filter((p) => !!p.image_url).length;
  const withSeedImage = products.filter((p) => !p.image_url && !!p.seed_key).length;

  return c.json({
    success: true,
    feed_status: "active",
    last_updated: new Date().toISOString(),
    stats: {
      total_products: total,
      in_stock_products: inStock,
      out_of_stock_products: outOfStock,
      with_custom_image: withCustomImage,
      with_seed_image: withSeedImage,
    },
    feed_urls: {
      meta_rss_xml: `${baseUrl}/api/feeds/meta.xml`,
      meta_csv: `${baseUrl}/api/feeds/meta.csv`,
      meta_json: `${baseUrl}/api/feeds/meta.json`,
      facebook_xml: `${baseUrl}/api/feeds/facebook.xml`,
      google_xml: `${baseUrl}/api/feeds/google.xml`,
    },
    meta_catalog_quickstart_url:
      "https://developers.facebook.com/apps/1534037124662927/use_cases/customize/?use_case_enum=CATALOG_API&selected_tab=quickstart",
    meta_commerce_manager_url: "https://business.facebook.com/commerce_manager/",
  });
});
