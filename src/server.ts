import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import api from "./api";
import { renderErrorPage } from "./lib/error-page";

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      const host = request.headers?.get?.("host") || "localhost:3000";
      const proto =
        request.headers?.get?.("x-forwarded-proto") ||
        (host.includes("localhost") ? "http" : "https");
      const origin = `${proto}://${host}`;
      const url = new URL(request.url, origin);

      // 1. Handle Hono API routes
      if (url.pathname.startsWith("/api/")) {
        return await api.fetch(request, env, ctx);
      }

      // 2. Handle static assets if ASSETS binding exists
      if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse && (assetResponse.status < 400 || assetResponse.status === 304)) {
          return assetResponse;
        }
      }

      // Ensure request has a valid absolute URL for TanStack Start SSR
      const fullRequest = request.url.startsWith("http")
        ? request
        : new Request(new URL(request.url, origin).toString(), request);

      // 3. TanStack Start SSR Handler
      return await handler(fullRequest);
    } catch (error: any) {
      console.error("[Cloudflare Worker Server Error]:", error);
      const isDev = process.env.NODE_ENV !== "production";
      const errorMsg = isDev ? error?.stack || error?.message || String(error) : undefined;
      return new Response(renderErrorPage(errorMsg), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
