import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { database, CartDoc, CouponDoc, Product, Variant } from "./db";

const CART_COOKIE = "ecom_cart_session";

export async function getCartIdentity() {
  const store = await cookies();
  const userToken = store.get("ecom_session")?.value;
  if (userToken) {
    const { getSession } = await import("./auth");
    const s = await getSession();
    if (s) return { userId: new ObjectId(s.sub), sessionId: undefined as string | undefined };
  }
  let sessionId = store.get(CART_COOKIE)?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    store.set(CART_COOKIE, sessionId, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 90,
    });
  }
  return { userId: undefined as ObjectId | undefined, sessionId };
}
export async function findCart() {
  const db = await database();
  const identity = await getCartIdentity();
  return db.collection<CartDoc>("carts").findOne(identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId });
}
export async function ensureCart() {
  const db = await database();
  const identity = await getCartIdentity();
  const filter = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
  const existing = await db.collection<CartDoc>("carts").findOne(filter);
  if (existing) return existing;

  const cart: CartDoc = {
    ...(identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId }),
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection<CartDoc>("carts").insertOne(cart);
  return cart;
}
export async function mergeGuestCartToUser(userId: ObjectId) {
  const db = await database();
  const store = await cookies();
  const sessionId = store.get(CART_COOKIE)?.value;
  if (!sessionId) return;
  const guest = await db.collection<CartDoc>("carts").findOne({ sessionId });
  if (!guest || !guest.items.length) return;
  const userCart = await db.collection<CartDoc>("carts").findOne({ userId });
  const items = [...(userCart?.items || [])];
  for (const incoming of guest.items) {
    const idx = items.findIndex((x) => String(x.productId) === String(incoming.productId) && x.variantId === incoming.variantId);
    if (idx >= 0) items[idx].quantity += incoming.quantity;
    else items.push(incoming);
  }
  const now = new Date();
  if (userCart) await db.collection<CartDoc>("carts").updateOne({ _id: userCart._id }, { $set: { items, updatedAt: now } });
  else await db.collection<CartDoc>("carts").insertOne({ userId, items, createdAt: now, updatedAt: now });
  await db.collection<CartDoc>("carts").deleteOne({ sessionId });
}
export async function recalcCart(cart: CartDoc) {
  const db = await database();
  const ids = cart.items.map(i => i.productId);
  const products = await db.collection<Product>("products").find({ _id: { $in: ids }, active: true }).toArray();
  const productById = new Map(products.map(p => [String(p._id), p]));
  const items = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = productById.get(String(item.productId));
    if (!product) continue;
    let variant: Variant | undefined;
    if (item.variantId) variant = product.variants.find(v => v.id === item.variantId && v.active);
    if (item.variantId && !variant) continue;
    const unitPrice = variant?.price ?? product.price;
    const inventory = variant?.inventory ?? (product.variants.length ? product.variants.reduce((n,v)=>n+Math.max(v.inventory,0),0) : Math.max(product.inventory ?? 0, 0));
    const quantity = Math.max(0, Math.min(99, item.quantity));
    items.push({ item, product, variant, unitPrice, inventory, quantity, lineTotal: unitPrice * quantity });
    subtotal += unitPrice * quantity;
  }
  return { items, subtotal };
}
export async function validateCoupon(code: string, subtotal: number, userId?: ObjectId) {
  const db = await database();
  const coupon = await db.collection<CouponDoc>("coupons").findOne({ code: code.trim().toUpperCase(), active: true });
  if (!coupon) return { ok: false, message: "That coupon code is not active." as const };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, message: "That coupon has expired." as const };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { ok: false, message: "That coupon has reached its usage limit." as const };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return { ok: false, message: `Minimum subtotal is $${coupon.minSubtotal.toFixed(2)}.` as const };
  if (userId && coupon.perUserLimit) {
    const used = await db.collection("orders").countDocuments({ userId, couponCode: coupon.code, fulfillmentStatus: { $ne: "cancelled" } });
    if (used >= coupon.perUserLimit) return { ok: false, message: "This coupon has already been used on your account." as const };
  }
  const discount = coupon.type === "percentage"
    ? subtotal * Math.min(coupon.value / 100, 1)
    : Math.min(coupon.value, subtotal);
  return { ok: true, discount, coupon } as const;
}
export const CART_COOKIE_NAME = CART_COOKIE;
