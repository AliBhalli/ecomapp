import { NextRequest } from "next/server";
import { seedDatabase, resetAndSeedDatabase } from "@/lib/seed";
import { ok, fail, handleRouteError } from "@/lib/http";

export async function POST(req: NextRequest) {
  const expected = process.env.SEED_SECRET;
  const provided = req.headers.get("x-seed-secret") || "";
  if (!expected || provided !== expected) return fail("Seed access denied.", 403);
  try {
    const body = await req.json().catch(() => ({}));
    if (body.adminPassword) process.env.SEED_ADMIN_PASSWORD = String(body.adminPassword);
    if (body.customerPassword) process.env.SEED_CUSTOMER_PASSWORD = String(body.customerPassword);
    const result = body.reset === true ? await resetAndSeedDatabase() : await seedDatabase();
    return ok({ mode: body.reset === true ? "reset" : "upsert", ...result });
  } catch (e) {
    return handleRouteError(e);
  }
}
