import { createHmac, timingSafeEqual } from "crypto";
import { cents } from "./security";

export async function createStripeCheckout(
  orderNumber: string,
  email: string,
  items: { title: string; quantity: number; unitPrice: number }[],
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number },
  successUrl: string,
  cancelUrl: string
) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  const params = new URLSearchParams();
  params.set("mode","payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("customer_email", email);
  params.set("client_reference_id", orderNumber);
  params.set("metadata[orderNumber]", orderNumber);

  // Charge the server-authoritative net merchandise amount as one line.
  // This avoids applying discounts to shipping/tax accidentally in Stripe Checkout.
  const merchandiseCents = cents(Math.max(0, totals.subtotal - totals.discount));
  const shippingCents = cents(Math.max(0, totals.shipping));
  const targetTotalCents = cents(totals.total);
  const taxCents = Math.max(0, targetTotalCents - merchandiseCents - shippingCents);

  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][product_data][name]", `Merchandise · ${items.length} line items`);
  params.set("line_items[0][price_data][unit_amount]", String(merchandiseCents));
  params.set("line_items[0][quantity]", "1");

  let index = 1;
  if (shippingCents > 0) {
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][product_data][name]`, "Standard shipping");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(shippingCents));
    params.set(`line_items[${index}][quantity]`, "1");
    index++;
  }
  if (taxCents > 0) {
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][product_data][name]`, "Sales tax");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(taxCents));
    params.set(`line_items[${index}][quantity]`, "1");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("STRIPE_CHECKOUT_FAILED");
  return (await response.json()) as { id: string; url: string };
}

export function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const timestamp = signature.match(/t=(\d+)/)?.[1];
  const v1 = signature.match(/v1=([a-f0-9]+)/)?.[1];
  if (!timestamp || !v1) return false;
  if (Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false;
  const signed = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const a = Buffer.from(expected, "utf8"), b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}