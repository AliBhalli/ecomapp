import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { isValidEmail, verifyPassword } from "@/lib/security";
import { setSession } from "@/lib/auth";
import { mergeGuestCartToUser } from "@/lib/cart";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!isValidEmail(email) || !password) return fail("Enter your email and password.");
    const db = await database();
    const user = await db.collection("users").findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) return fail("Invalid email or password.", 401);
    if (user.status !== "active") return fail("This account is not active.", 403);
    await setSession(user as any);
    await mergeGuestCartToUser(user._id);
    return ok({ id:user._id.toHexString(), name:user.name, email:user.email, role:user.role });
  } catch (e) { return handleRouteError(e); }
}