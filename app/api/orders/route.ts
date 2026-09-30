import { NextRequest } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
export async function GET(){try{const u=await requireUser();const db=await database();const orders=await db.collection("orders").find({userId:u._id},{projection:{items:{$slice:20}}}).sort({createdAt:-1}).limit(50).toArray();return ok(orders.map(o=>({...o,id:o._id.toHexString()})));}catch(e){return handleRouteError(e);}}
