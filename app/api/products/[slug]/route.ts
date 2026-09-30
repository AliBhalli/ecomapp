import { NextRequest } from "next/server";
import { database, Product } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { serializeProduct } from "@/lib/serialize";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = await database();
    const p = await db.collection<Product>("products").findOne({ slug, active: true });
    if (!p) return fail("Product not found.", 404);
    const category = p.categoryId
      ? await db.collection("categories").findOne({ _id: p.categoryId }, { projection: { name: 1, slug: 1 } })
      : null;
    return ok(serializeProduct(p, { category: category ? { name: category.name, slug: category.slug } : null }));
  } catch (e) {
    return handleRouteError(e);
  }
}
