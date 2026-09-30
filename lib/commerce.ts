import { ObjectId } from "mongodb";
import { database, CartDoc, Product, OrderDoc, OrderItem } from "./db";
import { validateCoupon } from "./cart";
import { checksum } from "./security";

export const TAX_RATE = 0.0825;
export function shippingFor(subtotal: number) { return subtotal >= 150 ? 0 : 14; }

export async function calculateTotals(cart: CartDoc, userId?: ObjectId) {
  const db = await database();
  const products = await db.collection<Product>("products").find({ _id: { $in: cart.items.map(x => x.productId) }, active: true }).toArray();
  const byId = new Map(products.map(p => [String(p._id), p]));
  const items: OrderItem[] = [];
  let subtotal = 0;
  const inventoryFailures: string[] = [];
  for (const ci of cart.items) {
    const p = byId.get(String(ci.productId));
    if (!p) continue;
    const v = ci.variantId ? p.variants.find(v => v.id === ci.variantId && v.active) : undefined;
    if (ci.variantId && !v) { inventoryFailures.push(p.name); continue; }
    const inventory = v ? v.inventory : (p.variants.length ? p.variants.reduce((sum, x) => sum + Math.max(x.inventory,0), 0) : Math.max(p.inventory ?? 0, 0));
    if (ci.quantity > inventory) inventoryFailures.push(`${p.name}${v ? ` (${v.label})` : ""}`);
    const unitPrice = v?.price ?? p.price;
    const qty = Math.max(1, Math.min(99, ci.quantity));
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    items.push({ productId: p._id!, title: p.name, image: p.images[0], variantId: v?.id, variantLabel: v?.label, sku: v?.sku || p.sku, quantity: qty, unitPrice, lineTotal });
  }
  let discount = 0;
  let couponMessage: string | undefined;
  let coupon: any;
  if (cart.couponCode) {
    const check = await validateCoupon(cart.couponCode, subtotal, userId);
    if (check.ok) { discount = check.discount; coupon = check.coupon; }
    else couponMessage = check.message;
  }
  const shipping = shippingFor(Math.max(0, subtotal - discount));
  const tax = Math.max(0, subtotal - discount) * TAX_RATE;
  const total = Math.max(0, subtotal - discount + shipping + tax);
  return { items, subtotal, discount, shipping, tax, total, coupon, couponMessage, inventoryFailures };
}

/**
 * Atomically decrements stock for each order line, using the same
 * conditional-update-or-throw pattern for both variant and base-inventory
 * products. If any line fails (e.g. lost a stock race with another
 * checkout), every line already decremented in this call is rolled back
 * via restoreInventory() before the error propagates.
 */
export async function decrementInventory(items: OrderItem[]) {
  const db = await database();
  const changed: OrderItem[] = [];
  try {
    for (const item of items) {
      if (item.variantId) {
        const result = await db.collection<Product>("products").updateOne(
          { _id: item.productId, "variants.id": item.variantId, "variants.inventory": { $gte: item.quantity } },
          { $inc: { "variants.$.inventory": -item.quantity }, $set: { updatedAt: new Date() } }
        );
        if (!result.modifiedCount) throw new Error(`INVENTORY_CHANGED:${item.title}`);
      } else {
        const result = await db.collection<Product>("products").updateOne(
          { _id: item.productId, variants: { $size: 0 }, inventory: { $gte: item.quantity } },
          { $inc: { inventory: -item.quantity }, $set: { updatedAt: new Date() } }
        );
        if (!result.modifiedCount) throw new Error(`INVENTORY_CHANGED:${item.title}`);
      }
      changed.push(item);
    }
  } catch (error) {
    if (changed.length) await restoreInventory(changed);
    throw error;
  }
}

/**
 * The inverse of decrementInventory(). This is the single place stock gets
 * put back — called from:
 *   - decrementInventory()'s own rollback path (partial-checkout failure)
 *   - the Stripe webhook, when a session expires or payment fails
 *   - the admin order-status route, when an order is manually cancelled/refunded
 *
 * IMPORTANT: this keys off `item.variantId` (the field that actually exists
 * on OrderItem — see lib/db.ts). The previous webhook implementation read
 * `item.variantSku`, a field that has never existed on OrderItem, so that
 * check was always falsy and every restore — variant or not — hit the
 * "else" branch and incremented the product's top-level `inventory` field
 * instead of `variants.$.inventory`. For variant-based products that field
 * isn't read by anything (availability and cart/checkout math both derive
 * stock from `variants[].inventory` for those products), so the increments
 * silently piled up in a field nothing displays, while the variant that was
 * actually sold never got its stock back. That is the primary source of the
 * "database out of sync" symptom for variant products (sizes, etc).
 */
export async function restoreInventory(items: OrderItem[]) {
  const db = await database();
  for (const item of items) {
    if (item.variantId) {
      await db.collection<Product>("products").updateOne(
        { _id: item.productId, "variants.id": item.variantId },
        { $inc: { "variants.$.inventory": item.quantity }, $set: { updatedAt: new Date() } }
      );
    } else {
      await db.collection<Product>("products").updateOne(
        { _id: item.productId },
        { $inc: { inventory: item.quantity }, $set: { updatedAt: new Date() } }
      );
    }
  }
}

export function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = checksum(`${now.getTime()}:${Math.random()}`).toUpperCase();
  return `ORD-${y}${m}${d}-${random}`;
}
