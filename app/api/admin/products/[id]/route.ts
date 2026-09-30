import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
import { slugify } from "@/lib/security";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();const {id}=await params;if(!/^[a-f\d]{24}$/i.test(id))return fail("Invalid product.");const b=await req.json();const db=await database();const set:any={updatedAt:new Date()};for(const k of ["name","description","shortDescription","sku","images","tags","variants","inventory","featured","active","price","compareAt","cost","categoryId"]){if(b[k]!==undefined)set[k]=k==="categoryId"?new ObjectId(String(b[k])):b[k];}if(set.name&&!set.slug)set.slug=slugify(set.name);if(set.slug===undefined&&b.name)set.slug=slugify(b.name);const r=await db.collection("products").findOneAndUpdate({_id:new ObjectId(id)},{$set:set},{returnDocument:"after",includeResultMetadata:false});if(!r)return fail("Product not found.",404);return ok({...r,id:r._id.toHexString(),categoryId:r.categoryId?.toHexString()});}catch(e){return handleRouteError(e);}
}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();const {id}=await params;const db=await database();const r=await db.collection("products").updateOne({_id:new ObjectId(id)},{$set:{active:false,updatedAt:new Date()}});if(!r.modifiedCount)return fail("Product not found.",404);return ok({archived:true});}catch(e){return handleRouteError(e);}
}