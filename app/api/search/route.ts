import { NextRequest } from "next/server";
import { database, Product } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
import { escapeRegex } from "@/lib/security";
export async function GET(req:NextRequest){
  try{
    const q=req.nextUrl.searchParams.get("q")?.trim()||"";
    if(!q) return ok([]);
    const db=await database();
    const rx=escapeRegex(q);
    const items=await db.collection<Product>("products").find({active:true,$or:[{name:{$regex:rx,$options:"i"}},{tags:{$regex:rx,$options:"i"}},{description:{$regex:rx,$options:"i"}}]},{projection:{name:1,slug:1,images:{$slice:1},price:1,compareAt:1}}).limit(8).toArray();
    return ok(items.map(x=>({id:x._id!.toHexString(),slug:x.slug,name:x.name,images:x.images,price:x.price,compareAt:x.compareAt})));
  }catch(e){return handleRouteError(e);}
}