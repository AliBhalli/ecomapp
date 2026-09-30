import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, created, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";

export async function GET(req:NextRequest){
  try{const pid=String(req.nextUrl.searchParams.get("productId")||"");if(!/^[a-f\d]{24}$/i.test(pid))return fail("Invalid product.");const db=await database();const rs=await db.collection("reviews").find({productId:new ObjectId(pid)}).sort({createdAt:-1}).limit(50).toArray();const dist=[5,4,3,2,1].map(star=>({star,count:rs.filter(r=>r.rating===star).length}));return ok({items:rs.map(r=>({...r,id:r._id.toHexString(),productId:r.productId.toHexString(),userId:undefined})),distribution:dist});}catch(e){return handleRouteError(e);}
}
export async function POST(req:NextRequest){
  try{const u=await requireUser();const b=await req.json();const productId=String(b.productId||"");const rating=Number(b.rating);const body=String(b.body||"").trim();if(!/^[a-f\d]{24}$/i.test(productId)||rating<1||rating>5||!Number.isInteger(rating)||body.length<10)return fail("Add a rating and a review of at least 10 characters.");
    const db=await database();const existing=await db.collection("reviews").findOne({productId:new ObjectId(productId),userId:u._id});if(existing)return fail("You have already reviewed this product.",409);
    const purchased=await db.collection("orders").findOne({userId:u._id,"items.productId":new ObjectId(productId),fulfillmentStatus:{$nin:["cancelled","refunded"]}});
    if(!purchased)return fail("Reviews are available after you have purchased this product.",403);
    const doc={_id:new ObjectId(),productId:new ObjectId(productId),userId:u._id,customerName:u.name,rating,body,verifiedPurchase:Boolean(purchased),createdAt:new Date(),updatedAt:new Date()};
    await db.collection("reviews").insertOne(doc);const all=await db.collection("reviews").find({productId:doc.productId}).toArray();const avg=all.reduce((s,r)=>s+r.rating,0)/(all.length||1);await db.collection("products").updateOne({_id:doc.productId},{$set:{ratingAverage:Math.round(avg*10)/10,reviewCount:all.length,updatedAt:new Date()}});return created({...doc,id:doc._id.toHexString()});
  }catch(e){return handleRouteError(e);}
}