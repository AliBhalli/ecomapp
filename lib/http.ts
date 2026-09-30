import { NextResponse } from "next/server";
export function ok(data: unknown, init?: ResponseInit) { return NextResponse.json({ ok: true, data }, init); }
export function created(data: unknown) { return NextResponse.json({ ok: true, data }, { status: 201 }); }
export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, ...(details ? { details } : {}) }, { status });
}
// lib/http.ts

export function handleRouteError(error: unknown) {
  console.error("[ROUTE ERROR]", error);   // must be INSIDE the { }, right after this line
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (message === "UNAUTHORIZED") return fail("Authentication required.", 401);
  if (message === "FORBIDDEN") return fail("Administrator access required.", 403);
  return fail("Something went wrong. Please try again.", 500);
}