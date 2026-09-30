import { NextRequest } from "next/server";
import { database, CartDoc } from "@/lib/db";
import { ensureCart, findCart, recalcCart, getCartIdentity } from "@/lib/cart";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";
import { calculateTotals } from "@/lib/commerce";

function viewTotals(c:any){
  return {subtotal:c.subtotal,discount:c.discount,shipping:c.shipping,tax:c.tax,total:c.total,couponCode:c.coupon?.code,couponMessage:c.couponMessage};
}
async function response() {
  const cart = await ensureCart();
  const session = await (await import("@/lib/auth")).getSession();
  const totals = await calculateTotals(cart, session ? new ObjectId(session.sub) : undefined);

  const items = (totals.items || []).map((i: any) => {
    // Handles both nested (i.item) and flattened (i) item structures safely
    const itemObj = i.item || i;
    const prod = i.product || {};
    const rawProductId = itemObj.productId || i.productId || prod._id || "";

    return {
      id: String(rawProductId),
      productId: String(rawProductId),
      slug: prod.slug || "",
      title: prod.name || "",
      image: prod.images?.[0] || "",
      variantId: itemObj.variantId || i.variantId || i.variant?.id,
      variantLabel: i.variant?.label,
      sku: i.variant?.sku || prod.sku || "",
      quantity: Number(itemObj.quantity || i.quantity || 1),
      inventory: Number(i.inventory ?? prod.inventory ?? 0),
      unitPrice: Number(i.unitPrice ?? prod.price ?? 0),
      lineTotal: Number(i.lineTotal ?? 0),
    };
  });

  return { items, ...viewTotals(totals) };
}
export async function GET(){try{return ok(await response());}catch(e){return handleRouteError(e);}}
export async function POST(req:NextRequest){
  try{
    const b=await req.json(); const productId=String(b.productId||""); const qty=Math.max(1,Math.min(99,Number(b.quantity||1))); const variantId=b.variantId?String(b.variantId):undefined;
    if(!/^[a-f\d]{24}$/i.test(productId)) return fail("Invalid product.");
    const db=await database(); const p=await db.collection("products").findOne({_id:new ObjectId(productId),active:true});
    if(!p) return fail("Product not found.",404);
    const v=variantId?p.variants?.find((x:any)=>x.id===variantId&&x.active):undefined;
    const inventory=v?v.inventory:(p.variants?.length?p.variants.reduce((n:number,x:any)=>n+Math.max(0,x.inventory),0):p.inventory||0);
    if(!v && variantId) return fail("That variant is unavailable.",409);
    if(qty>inventory) return fail(`Only ${inventory} available.`,409);
    const cart=await ensureCart(); const idx=cart.items.findIndex((x:any)=>String(x.productId)===productId&&x.variantId===variantId);
    if(idx>=0) cart.items[idx].quantity=Math.min(99,cart.items[idx].quantity+qty); else cart.items.push({productId:new ObjectId(productId),variantId,quantity:qty});
    await db.collection<CartDoc>("carts").updateOne({_id:cart._id},{$set:{items:cart.items,updatedAt:new Date()}});
    return ok(await response());
  }catch(e){return handleRouteError(e);}
}
export async function PATCH(req:NextRequest){
  try{
    const b=await req.json(); const productId=String(b.productId||""); const quantity=Math.max(0,Math.min(99,Number(b.quantity||0))); const variantId=b.variantId?String(b.variantId):undefined;
    const cart=await ensureCart(); const idx=cart.items.findIndex(x=>String(x.productId)===productId&&x.variantId===variantId); if(idx<0)return fail("Cart item not found.",404);
    if(quantity===0) cart.items.splice(idx,1); else cart.items[idx].quantity=quantity;
    const db=await database(); await db.collection("carts").updateOne({_id:cart._id},{$set:{items:cart.items,updatedAt:new Date()}}); return ok(await response());
  }catch(e){return handleRouteError(e);}
}
export async function DELETE(req:NextRequest){
  try{
    const b=await req.json().catch(()=>({})); const cart=await ensureCart(); const db=await database();
    if(b.productId){cart.items=cart.items.filter(x=>!(String(x.productId)===String(b.productId)&&x.variantId===(b.variantId?String(b.variantId):undefined)));}
    else cart.items=[];
    cart.couponCode=undefined; await db.collection("carts").updateOne({_id:cart._id},{$set:{items:cart.items,updatedAt:new Date()},$unset:{couponCode:""}});
    return ok(await response());
  }catch(e){return handleRouteError(e);}
}