import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database, OrderDoc } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
import type { OrderStatus } from "@/lib/db";
import { restoreInventory } from "@/lib/commerce";
import { serializeOrder } from "@/lib/serialize";

const allowed = new Set<OrderStatus>(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]);
const STOCK_RELEASING = new Set<OrderStatus>(["cancelled", "refunded"]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();
    const status = String(b.status) as OrderStatus;
    if (!allowed.has(status)) return fail("Invalid order status.");
    const db = await database();
    const order = await db.collection<OrderDoc>("orders").findOne({ _id: new ObjectId(id) });
    if (!order) return fail("Order not found.", 404);

    const timeline = [...(order.timeline || []), { status, at: new Date(), note: String(b.note || "Status updated by administrator") }];
    const paymentStatus = status === "refunded" ? "refunded" : order.paymentStatus;

    // Root cause fix: previously this route only ever wrote the status
    // fields — it never touched inventory. Cancelling or refunding an order
    // from the admin panel (as opposed to a Stripe webhook expiry/failure)
    // left the reserved stock permanently decremented, even though the
    // customer never received the goods. We now restore inventory exactly
    // once, guarded by the order's *previous* status so re-saving an
    // already-cancelled/refunded order (or a race between two admin tabs)
    // can't double-credit stock.
    const alreadyReleased = STOCK_RELEASING.has(order.fulfillmentStatus);
    const shouldRelease = STOCK_RELEASING.has(status) && !alreadyReleased;

    const r = await db.collection<OrderDoc>("orders").findOneAndUpdate(
      { _id: order._id, fulfillmentStatus: order.fulfillmentStatus },
      { $set: { fulfillmentStatus: status, paymentStatus, updatedAt: new Date(), timeline } },
      { returnDocument: "after", includeResultMetadata: false }
    );
    if (!r) return fail("Order was updated by someone else — please retry.", 409);

    if (shouldRelease) {
      await restoreInventory(order.items);
    }

    return ok(serializeOrder(r));
  } catch (e) {
    return handleRouteError(e);
  }
}
