export default function errorHandler(error: any, event: any) {
  console.error("[Nitro Custom Error Handler]:", error);
  const message = error?.stack || error?.message || String(error);
  return new Response(`500 Nitro Internal Error:\n\n${message}`, {
    status: 500,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
