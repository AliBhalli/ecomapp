import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { database } from "./db";
import { sessionDecode, sessionEncode } from "./security";

const COOKIE = "ecom_session";
const SECRET = () => process.env.AUTH_SECRET || "";
const TTL = 1000 * 60 * 60 * 24 * 14;

type SessionPayload = { sub: string; role: "customer" | "admin"; email: string; exp: number };

export async function getSession() {
  const secret = SECRET();
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = sessionDecode<SessionPayload>(token, secret);
  if (!session || !/^[a-f\d]{24}$/i.test(session.sub)) return null;
  return session;
}
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const db = await database();
  return db.collection("users").findOne(
    { _id: new ObjectId(session.sub) },
    { projection: { passwordHash: 0 } }
  );
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
export async function setSession(user: { _id: ObjectId; role: "customer" | "admin"; email: string }) {
  const secret = SECRET();
  if (!secret) throw new Error("AUTH_SECRET_MISSING");
  const store = await cookies();
  const token = sessionEncode(
    { sub: user._id.toHexString(), role: user.role, email: user.email, exp: Date.now() + TTL },
    secret
  );
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL / 1000,
  });
}
export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}