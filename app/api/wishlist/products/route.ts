import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
import { serializeProduct } from "@/lib/serialize";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").filter(x => /^[a-f\d]{24}$/i.test(x)).map(x => new ObjectId(x));
    const db = await database();
    const ps = await db.collection("products").find({ _id: { $in: ids }, active: true }).toArray();
    return ok(ps.map(p => serializeProduct(p)));
  } catch (e) {
    return handleRouteError(e);
  }
}
