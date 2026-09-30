import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
import { slugify } from "@/lib/security";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();const {id}=await params;const b=await req.json();const db=await database();const set:any={updatedAt:new Date()};if(b.name!==undefined){set.name=String(b.name).trim();set.slug=slugify(set.name);}if(b.description!==undefined)set.description=String(b.description);if(b.active!==undefined)set.active=Boolean(b.active);const r=await db.collection("categories").findOneAndUpdate({_id:new ObjectId(id)},{$set:set},{returnDocument:"after",includeResultMetadata:false});if(!r)return fail("Category not found.",404);return ok({...r,id:r._id.toHexString()});}catch(e){return handleRouteError(e);}
}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{await requireAdmin();const {id}=await params;const db=await database();const count=await db.collection("products").countDocuments({categoryId:new ObjectId(id)});if(count)return fail("Move products out of this category before deleting it.",409);const r=await db.collection("categories").deleteOne({_id:new ObjectId(id)});if(!r.deletedCount)return fail("Category not found.",404);return ok({deleted:true});}catch(e){return handleRouteError(e);}
}