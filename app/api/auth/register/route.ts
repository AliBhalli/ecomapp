import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { created, fail, handleRouteError } from "@/lib/http";
import { hashPassword, isValidEmail } from "@/lib/security";
import { setSession } from "@/lib/auth";
import { mergeGuestCartToUser } from "@/lib/cart";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (name.length < 2) return fail("Please enter your full name.");
    if (!isValidEmail(email)) return fail("Enter a valid email address.");
    if (password.length < 8) return fail("Password must be at least 8 characters.");
    const db = await database();
    const existing = await db.collection("users").findOne({ email });
    if (existing) return fail("An account with that email already exists.", 409);
    const user = { _id: new ObjectId(), name, email, passwordHash: hashPassword(password), role: "customer" as const, status:"active", createdAt:new Date(), updatedAt:new Date() };
    await db.collection("users").insertOne(user);
    await setSession(user);
    await mergeGuestCartToUser(user._id);
    return created({ id: user._id.toHexString(), name, email, role:user.role });
  } catch (e) { return handleRouteError(e); }
}