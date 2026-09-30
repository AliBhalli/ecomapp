import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";
import { ok, fail } from "@/lib/http";
import { ObjectId } from "mongodb";

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

    if (orderNumber) {
      if (type === "checkout.session.completed" && obj.payment_status === "paid") {
        await db.collection("orders").updateOne(
          { orderNumber },
          {
            $set: { paymentStatus: "paid", fulfillmentStatus: "confirmed", updatedAt: new Date() },
            $push: { timeline: { status: "confirmed", at: new Date(), note: "Payment confirmed" } }
          }
        );
      } else if (type === "checkout.session.expired" || type === "payment_intent.payment_failed") {
        const order = await db.collection("orders").findOne({ orderNumber });
        
        // Only restore inventory and update status if the order is still pending payment
        if (order && order.paymentStatus === "pending") {
          // Restore stock for each item in the order
          for (const item of order.items) {
            const productId = item.productId ? new ObjectId(item.productId) : null;
            const quantity = Number(item.quantity || 0);

            if (productId && quantity > 0) {
              if (item.variantSku) {
                await db.collection("products").updateOne(
                  { _id: productId, "variants.sku": item.variantSku },
                  { $inc: { "variants.$.inventory": quantity, inventory: quantity } }
                );
              } else {
                await db.collection("products").updateOne(
                  { _id: productId },
                  { $inc: { inventory: quantity } }
                );
              }
            }
          }

          // Update order status to failed/cancelled
          await db.collection("orders").updateOne(
            { orderNumber },
            {
              $set: { 
                paymentStatus: "failed", 
                fulfillmentStatus: "cancelled", 
                updatedAt: new Date() 
              },
              $push: { 
                timeline: { 
                  status: "cancelled", 
                  at: new Date(), 
                  note: "Payment failed or session expired; inventory restored." 
                } 
              }
            }
          );
        }
      }
    }

    return ok({ received: true });
  } catch {
    return fail("Webhook processing failed.", 500);
  }
}