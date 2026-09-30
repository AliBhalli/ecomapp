import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { serializeProduct } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const db = await database();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const filter: any = {};
    if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }, { slug: { $regex: q, $options: "i" } }];
    const items = await db.collection("products").find(filter).sort({ updatedAt: -1 }).limit(200).toArray();
    return ok(items.map(x => serializeProduct(x)));
  } catch (e) {
    return handleRouteError(e);
  }
}
