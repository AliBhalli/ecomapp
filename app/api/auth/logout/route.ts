import { clearSession } from "@/lib/auth";
import { ok, handleRouteError } from "@/lib/http";
export async function POST() {
  try { await clearSession(); return ok({ loggedOut:true }); } catch(e) { return handleRouteError(e); }
}