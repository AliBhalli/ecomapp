import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{const u=await requireUser();const {id}=await params;if(!/^[a-f\d]{24}$/i.test(id))return fail("Invalid order.",400);const db=await database();const q:any={_id:new ObjectId(id)};if(u.role!=="admin")q.userId=u._id;const o=await db.collection("orders").findOne(q);if(!o)return fail("Order not found.",404);return ok({...o,id:o._id.toHexString()});}catch(e){return handleRouteError(e);}
}