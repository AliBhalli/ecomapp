import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireAdmin();const {id}=await params;const b=await req.json();const set:any={updatedAt:new Date()};for(const k of ["active","value","minSubtotal","usageLimit","perUserLimit"])if(b[k]!==undefined)set[k]=k==="active"?Boolean(b[k]):Number(b[k]);if(b.expiresAt!==undefined)set.expiresAt=b.expiresAt?new Date(b.expiresAt):undefined;const r=await (await database()).collection("coupons").findOneAndUpdate({_id:new ObjectId(id)},{$set:set},{returnDocument:"after"});if(!r.value)return fail("Coupon not found.",404);return ok({...r.value,id:r.value._id.toHexString()});}catch(e){return handleRouteError(e);}}
