import { ObjectId } from "mongodb";

/**
 * Single source of truth for turning a raw MongoDB `products` document into
 * the shape every API route should return to the client.
 *
 * Root cause this fixes: every route that returned a product built its own
 * ad-hoc shape.
 *   - app/api/products/route.ts        -> stripped `_id`, added `id`
 *   - app/api/products/[slug]/route.ts -> spread `_id` AND added `id` (both present)
 *   - app/api/admin/products/route.ts  -> spread `_id` AND added `id` (both present)
 *   - app/api/wishlist/products/route.ts -> spread `_id` AND added `id` (both present)
 *
 * Because `ObjectId` has a `toJSON()` that returns its hex string, the raw
 * `_id` field silently serialized as a *string that looks just like* `id`,
 * so the bug never threw — it just meant every consumer of the "detail",
 * "admin list" and "wishlist" endpoints got an extra, redundant `_id` field
 * that the product list endpoint never sent, and any code (or generated
 * TS type) written against one endpoint's shape didn't match another's.
 *
 * Use this everywhere a `Product` document leaves the server.
 */
export function serializeProduct(doc: any, extra?: { categoryName?: string; category?: { name: string; slug: string } | null }) {
  const { _id, categoryId, ...rest } = doc;
  return {
    id: _id.toHexString(),
    categoryId: categoryId instanceof ObjectId ? categoryId.toHexString() : categoryId,
    ...rest,
    variants: (rest.variants || []).map((v: any) => ({ ...v })),
    ...(extra?.categoryName !== undefined ? { categoryName: extra.categoryName } : {}),
    ...(extra?.category !== undefined ? { category: extra.category } : {}),
  };
}

export function serializeOrder(doc: any) {
  const { _id, userId, items, ...rest } = doc;
  return {
    id: _id.toHexString(),
    userId: userId instanceof ObjectId ? userId.toHexString() : userId,
    items: (items || []).map((i: any) => ({
      ...i,
      productId: i.productId instanceof ObjectId ? i.productId.toHexString() : i.productId,
    })),
    ...rest,
  };
}

export function serializeUser(doc: any) {
  const { _id, passwordHash, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}
