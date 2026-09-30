import { NextRequest } from "next/server";
import { database, OrderDoc } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";
import { restoreInventory } from "@/lib/commerce";
import { ok, fail } from "@/lib/http";

/**
 * The single, canonical Stripe webhook endpoint. Point Stripe's dashboard
 * (or `stripe listen --forward-to`) at /api/payments/webhook — the old
 * duplicate handler at /api/checkout/route.ts has been replaced with the
 * order-creation endpoint and no longer processes Stripe events.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature") || "";
  const payload = await req.text();
  if (!secret || !verifyStripeSignature(payload, signature, secret)) {
    return fail("Invalid webhook signature.", 400);
  }

  try {
    const event = JSON.parse(payload);
    const db = await database();
    const type = event.type as string;
    const obj = event.data?.object;
    const orderNumber = obj?.metadata?.orderNumber || obj?.client_reference_id;
    if (!orderNumber) return ok({ received: true });

    const order = await db.collection<OrderDoc>("orders").findOne({ orderNumber });
    if (!order) return ok({ received: true });

    if (type === "checkout.session.completed" && obj.payment_status === "paid") {
      // Idempotency: only transition orders that are still awaiting payment,
      // so a redelivered webhook event can't push a duplicate timeline entry
      // or re-run side effects.
      if (order.paymentStatus === "pending") {
        await db.collection("orders").updateOne(
          { orderNumber, paymentStatus: "pending" },
          {
            $set: { paymentStatus: "paid", fulfillmentStatus: "confirmed", stripeSessionId: obj.id, updatedAt: new Date() },
            $push: { timeline: { status: "confirmed", at: new Date(), note: "Payment confirmed." } },
          }
        );
      }
    } else if (type === "checkout.session.expired" || type === "payment_intent.payment_failed") {
      // Only restore inventory and cancel if the order is still pending —
      // guards against a late "expired" event arriving after a "completed"
      // event already confirmed the order, and against processing the same
      // failure twice.
      if (order.paymentStatus === "pending") {
        const result = await db.collection("orders").updateOne(
          { orderNumber, paymentStatus: "pending" },
          {
            $set: { paymentStatus: "failed", fulfillmentStatus: "cancelled", updatedAt: new Date() },
            $push: { timeline: { status: "cancelled", at: new Date(), note: "Payment failed or checkout session expired; inventory restored." } },
          }
        );
        // Only restore stock if this call actually won the state transition
        // (protects against a race with a concurrent webhook delivery).
        if (result.modifiedCount) {
          await restoreInventory(order.items);
        }
      }
    }

    return ok({ received: true });
  } catch {
    return fail("Webhook processing failed.", 500);
  }
}
