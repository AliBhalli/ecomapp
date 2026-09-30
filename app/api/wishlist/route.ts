import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";

export async function GET(){try{const user=await requireUser();const db=await database();const list=await db.collection("wishlists").findOne({userId:user._id});return ok((list?.productIds||[]).map((x:ObjectId)=>x.toHexString()));}catch(e){return handleRouteError(e);}}
export async function POST(req:NextRequest){try{const user=await requireUser();const b=await req.json();const id=String(b.productId||"");if(!/^[a-f\d]{24}$/i.test(id))return fail("Invalid product.");const db=await database();await db.collection("wishlists").updateOne({userId:user._id},{$addToSet:{productIds:new ObjectId(id)},$set:{updatedAt:new Date()}}, {upsert:true});return ok({added:id});}catch(e){return handleRouteError(e);}}
export async function DELETE(req:NextRequest){try{const user=await requireUser();const b=await req.json();const id=String(b.productId||"");const db=await database();await db.collection("wishlists").updateOne({userId:user._id},{$pull:{productIds:new ObjectId(id)},$set:{updatedAt:new Date()}},{upsert:true});return ok({removed:id});}catch(e){return handleRouteError(e);}}
