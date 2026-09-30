import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
export async function GET(req:NextRequest){try{await requireAdmin();const sp=req.nextUrl.searchParams;const status=sp.get("status");const q=sp.get("q");const filter:any={};if(status)filter.fulfillmentStatus=status;if(q)filter.$or=[{orderNumber:{$regex:q,$options:"i"}},{email:{$regex:q,$options:"i"}},{customerName:{$regex:q,$options:"i"}}];const db=await database();const xs=await db.collection("orders").find(filter).sort({createdAt:-1}).limit(200).toArray();return ok(xs.map(x=>({...x,id:x._id.toHexString()})));}catch(e){return handleRouteError(e);}}
