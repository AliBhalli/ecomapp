import { database, Product } from "./db";
import { hashPassword, slugify } from "./security";
import { ObjectId } from "mongodb";

const images = {
  chair: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=86",
  lamp: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=86",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=86",
  watch: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=86",
  sneaker: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=86",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=86",
  jacket: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=86",
  mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1200&q=86",
};

function product(name: string, categoryId: ObjectId, price: number, sku: string, image: string, extra: Partial<Product> = {}): Omit<Product, "_id"> {
  return {
    name, slug: slugify(name), description: `${name} is designed with quiet details, durable materials and everyday utility in mind. A considered upgrade for modern routines, built to look better with time.`,
    shortDescription: "A considered everyday essential with refined materials and lasting utility.",
    price, compareAt: price > 80 ? Math.round(price * 1.18) : undefined, sku,
    images: [image], categoryId, tags: ["new", "editorial", "everyday"], variants: [], inventory: 24,
    featured: false, active: true, ratingAverage: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date(), ...extra
  };
}

const CATEGORY_SEED = [
  { name: "Home", slug: "home", description: "Objects that make home feel considered.", active: true },
  { name: "Wear", slug: "wear", description: "Everyday pieces designed to be lived in.", active: true },
  { name: "Accessories", slug: "accessories", description: "Quiet details that finish the day.", active: true },
  { name: "Travel", slug: "travel", description: "Useful companions for movement.", active: true },
];

/**
 * Deterministic, idempotent seed. Safe to run repeatedly against a live
 * database — it upserts by natural key (slug / sku / email / code) rather
 * than inserting, so it will not create duplicates and will not touch
 * unrelated data (orders, carts, wishlists, reviews).
 */
export async function seedDatabase() {
  const db = await database();
  const now = new Date();

  const catIds: Record<string, ObjectId> = {};
  for (const c of CATEGORY_SEED) {
    const existing = await db.collection("categories").findOne({ slug: c.slug });
    const id = existing?._id || new ObjectId();
    catIds[c.slug] = id;
    await db.collection("categories").updateOne({ _id: id }, { $set: { ...c, _id: id, createdAt: existing?.createdAt || now, updatedAt: now } }, { upsert: true });
  }

  const products: Omit<Product, "_id">[] = [
    product("Arc Lounge Chair", catIds.home, 420, "ARC-001", images.chair, { featured: true, tags: ["best-seller", "home"] }),
    product("No. 7 Table Lamp", catIds.home, 148, "LAMP-007", images.lamp, { featured: true, tags: ["new", "home"] }),
    product("Field Carryall", catIds.travel, 125, "BAG-021", images.bag, { featured: true, tags: ["travel", "best-seller"] }),
    product("Index Steel Watch", catIds.accessories, 210, "WATCH-014", images.watch, { tags: ["accessories", "new"] }),
    product("Studio Runner", catIds.wear, 110, "RUN-009", images.sneaker, { featured: true, tags: ["wear", "best-seller"] }),
    product("Daily Bottle", catIds.travel, 38, "BOT-003", images.bottle, { tags: ["travel", "new"] }),
    product("Transit Jacket", catIds.wear, 240, "JKT-031", images.jacket, { tags: ["wear", "outerwear"] }),
    product("Stoneware Mug", catIds.home, 34, "MUG-008", images.mug, { tags: ["home", "gift"] }),
  ];
  for (const p of products) {
    const existing = await db.collection<Product>("products").findOne({ sku: p.sku });
    const variants = p.name === "Studio Runner" || p.name === "Transit Jacket" ? [
      { id: "small", label: "Small", options: { size: "S" }, sku: `${p.sku}-S`, price: p.price, compareAt: p.compareAt, inventory: 12, active: true },
      { id: "medium", label: "Medium", options: { size: "M" }, sku: `${p.sku}-M`, price: p.price, compareAt: p.compareAt, inventory: 18, active: true },
      { id: "large", label: "Large", options: { size: "L" }, sku: `${p.sku}-L`, price: p.price, compareAt: p.compareAt, inventory: 9, active: true },
    ] : p.variants;
    await db.collection<Product>("products").updateOne({ sku: p.sku }, { $set: { ...p, variants, _id: existing?._id || new ObjectId(), updatedAt: now, createdAt: existing?.createdAt || now } }, { upsert: true });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const customerEmail = (process.env.SEED_CUSTOMER_EMAIL || "customer@example.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD;
  const userSpecs = [
    { name: "Store Admin", email: adminEmail, role: "admin" as const, password: adminPassword },
    { name: "Demo Customer", email: customerEmail, role: "customer" as const, password: customerPassword },
  ];
  for (const u of userSpecs) {
    if (!u.password) continue;
    // Preserve original semantics: never overwrite an existing user's
    // password on a routine (non-destructive) seed run. resetAndSeedDatabase()
    // deletes these users first, so this insert always fires cleanly there.
    const existing = await db.collection("users").findOne({ email: u.email });
    if (!existing) {
      await db.collection("users").insertOne({ name: u.name, email: u.email, passwordHash: hashPassword(u.password), role: u.role, status: "active", createdAt: now, updatedAt: now });
    }
  }

  await db.collection("coupons").updateOne({ code: "WELCOME10" }, { $set: { code: "WELCOME10", type: "percentage", value: 10, minSubtotal: 50, active: true, updatedAt: now }, $setOnInsert: { usageCount: 0 } }, { upsert: true });
  await db.collection("coupons").updateOne({ code: "SAVE25" }, { $set: { code: "SAVE25", type: "fixed", value: 25, minSubtotal: 150, active: true, updatedAt: now }, $setOnInsert: { usageCount: 0 } }, { upsert: true });

  await ensureIndexes();

  return { categories: CATEGORY_SEED.length, products: products.length, users: userSpecs.filter(u => u.password).length };
}

/**
 * Destructive reset: wipes catalog + coupon + admin/demo-user collections
 * (never `orders` — order history is never dropped by a seed run) and then
 * calls seedDatabase() against the now-empty collections. Use this when the
 * catalog itself is suspected to be corrupted/stale (orphaned categoryIds,
 * duplicate skus from earlier manual edits, drifted inventory counts) and
 * an idempotent upsert pass isn't enough to get back to a known-good state.
 *
 * `carts` is also cleared, because a cart can hold a productId that no
 * longer exists after a catalog wipe, and recalcCart()/calculateTotals()
 * would otherwise just silently drop those lines on the next request.
 */
export async function resetAndSeedDatabase() {
  const db = await database();
  const collectionsToWipe = ["products", "categories", "coupons", "carts", "reviews", "wishlists"];
  const existing = new Set((await db.listCollections().toArray()).map(c => c.name));
  for (const name of collectionsToWipe) {
    if (existing.has(name)) await db.collection(name).deleteMany({});
  }
  // Also drop the admin/demo users so they get recreated cleanly with
  // whatever SEED_ADMIN_PASSWORD / SEED_CUSTOMER_PASSWORD is currently set,
  // rather than silently keeping a stale password hash from a prior seed.
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const customerEmail = (process.env.SEED_CUSTOMER_EMAIL || "customer@example.com").toLowerCase();
  if (existing.has("users")) {
    await db.collection("users").deleteMany({ email: { $in: [adminEmail, customerEmail] } });
  }
  return seedDatabase();
}

async function ensureIndexes() {
  const db = await database();
  await db.collection("products").createIndex({ slug: 1 }, { unique: true });
  await db.collection("products").createIndex({ sku: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("categories").createIndex({ slug: 1 }, { unique: true });
  await db.collection("carts").createIndex({ userId: 1 }, { unique: true, sparse: true });
  await db.collection("carts").createIndex({ sessionId: 1 }, { unique: true, sparse: true });
  await db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true });
  await db.collection("orders").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("reviews").createIndex({ productId: 1, createdAt: -1 });
  await db.collection("coupons").createIndex({ code: 1 }, { unique: true });
}
