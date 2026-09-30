import { NextRequest } from "next/server";
import { ensureCart, getCartIdentity, validateCoupon } from "@/lib/cart";
import { calculateTotals } from "@/lib/commerce";
import { database } from "@/lib/db";
import { fail, ok, handleRouteError } from "@/lib/http";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req:NextRequest){
  try{
    const b=await req.json(); const code=String(b.code||"").trim().toUpperCase(); if(!code)return fail("Enter a coupon code.");
    const cart=await ensureCart(); const session=await getSession(); const totals=await calculateTotals({...cart,couponCode:undefined},session?new ObjectId(session.sub):undefined);
    const check=await validateCoupon(code,totals.subtotal,session?new ObjectId(session.sub):undefined); if(!check.ok)return fail(check.message);
    const db=await database(); await db.collection("carts").updateOne({_id:cart._id},{$set:{couponCode:check.coupon.code,updatedAt:new Date()}}); return ok(await calculateTotals({...cart,couponCode:check.coupon.code},session?new ObjectId(session.sub):undefined));
  }catch(e){return handleRouteError(e);}
}
export async function DELETE(){
  try{const cart=await ensureCart();const db=await database();await db.collection("carts").updateOne({_id:cart._id},{$unset:{couponCode:""},$set:{updatedAt:new Date()}});return ok(await calculateTotals({...cart,couponCode:undefined}));}catch(e){return handleRouteError(e);}
}