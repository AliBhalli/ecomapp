import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
export async function GET(){try{await requireAdmin();const db=await database();const xs=await db.collection("categories").find({}).sort({name:1}).toArray();return ok(xs.map(x=>({...x,id:x._id.toHexString()})));}catch(e){return handleRouteError(e);}}
