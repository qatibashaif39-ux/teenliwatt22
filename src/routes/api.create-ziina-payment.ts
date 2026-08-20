import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/create-ziina-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { orderId, tracking, amount, customerName, customerEmail, customerPhone, origin } =
            body ?? {};

          if (!orderId || !tracking || !amount || !customerName || !origin) {
            return new Response(JSON.stringify({ error: "Missing fields" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const apiKey = (process.env.ZIINA_API_KEY || process.env.VITE_ZIINA_API_KEY || "").trim();
          const testMode = (process.env.ZIINA_TEST_MODE || "true").trim() !== "false";
          const siteDomain = (process.env.SITE_DOMAIN || "").trim().replace(/\/+$/, "");
          const baseUrl = siteDomain || origin;

          const successUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=success&payment_intent_id={PAYMENT_INTENT_ID}`;
          const cancelUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=cancelled`;
          const failureUrl = `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=failed`;

          if (!apiKey) {
            // Ziina API key is optional/not configured yet, return simulation redirect
            const mockPaymentId = `ziina_mock_${Date.now()}`;
            return new Response(
              JSON.stringify({
                id: mockPaymentId,
                redirect_url: `${baseUrl}/orders/${encodeURIComponent(tracking)}?payment=success&payment_intent_id=${mockPaymentId}&simulated=true`,
                message: "Ziina payment intent created (mock mode)",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const amountInFils = Math.round(Number(amount) * 100);

          const res = await fetch("https://api-v2.ziina.com/api/payment_intent", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: amountInFils,
              currency_code: "AED",
              message: `طلب رقم ${tracking} - تين ليوا`,
              success_url: successUrl,
              cancel_url: cancelUrl,
              failure_url: failureUrl,
              test: testMode,
              transaction_source: "directApi",
              metadata: {
                order_id: orderId,
                tracking,
                customer_name: customerName,
                customer_email: customerEmail || "",
                customer_phone: customerPhone || "",
              },
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("[ziina] create payment failed", res.status, text);
            return new Response(
              JSON.stringify({ error: "ziina_error", status: res.status, detail: text }),
              {
                status: 502,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const json = await res.json();

          return new Response(JSON.stringify({ id: json.id, redirect_url: json.redirect_url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[ziina] unexpected error", err);
          return new Response(JSON.stringify({ error: "unexpected", message: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
