import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { ok, created, fail, handleRouteError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/security";
import { ObjectId } from "mongodb";

export async function GET(){
  try{const db=await database(); const cats=await db.collection("categories").find({active:true}).sort({name:1}).toArray();return ok(cats.map(c=>({id:c._id.toHexString(),name:c.name,slug:c.slug,description:c.description})));}catch(e){return handleRouteError(e);}
}
export async function POST(req:NextRequest){
  try{await requireAdmin(); const b=await req.json(); const name=String(b.name||"").trim(); if(!name)return fail("Category name is required."); const slug=slugify(String(b.slug||name)); const db=await database(); if(await db.collection("categories").findOne({slug}))return fail("Category already exists.",409); const doc={_id:new ObjectId(),name,slug,description:String(b.description||""),active:true,createdAt:new Date(),updatedAt:new Date()}; await db.collection("categories").insertOne(doc); return created({id:doc._id.toHexString(),...doc});}catch(e){return handleRouteError(e);}
}