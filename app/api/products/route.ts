import { NextRequest } from "next/server";
import { database, Product } from "@/lib/db";
import { ok, fail, created, handleRouteError } from "@/lib/http";
import { getSession, requireAdmin } from "@/lib/auth";
import { slugify, escapeRegex } from "@/lib/security";
import { serializeProduct } from "@/lib/serialize";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await database(); const sp=req.nextUrl.searchParams;
    const q=sp.get("q")?.trim(); const category=sp.get("category"); const tag=sp.get("tag"); const featured=sp.get("featured"); const minRating=sp.get("minRating");
    const sort=sp.get("sort")||"featured"; const page=Math.max(1,Number(sp.get("page")||1)); const limit=Math.min(40,Math.max(1,Number(sp.get("limit")||12)));
    const min=sp.get("min") ? Number(sp.get("min")) : undefined; const max=sp.get("max") ? Number(sp.get("max")) : undefined;
    const availability=sp.get("availability");
    const filter:any={active:true};
    if(q) { const rx=escapeRegex(q); filter.$or=[{name:{$regex:rx,$options:"i"}},{description:{$regex:rx,$options:"i"}},{tags:{$regex:rx,$options:"i"}},{sku:{$regex:rx,$options:"i"}}]; }
    if(featured === "true") filter.featured=true;
    if(tag) filter.tags=tag;
    if(minRating && Number.isFinite(Number(minRating))) filter.ratingAverage={$gte:Number(minRating)};
    if(category) {
      const cat=await db.collection("categories").findOne({slug:category,active:true});
      if(cat) filter.categoryId=cat._id; else return ok({items:[],total:0,page,limit});
    }
    if(min!=null && Number.isFinite(min)) filter.price={$gte:min};
    if(max!=null && Number.isFinite(max)) filter.price={...(filter.price||{}),$lte:max};
    if(availability==="in-stock") filter.$and=[{ $or: [{variants:{$elemMatch:{active:true,inventory:{$gt:0}}}}, {variants:{$size:0},inventory:{$gt:0}}] }];
    const sortMap:any={featured:{featured:-1,createdAt:-1},newest:{createdAt:-1},priceAsc:{price:1},priceDesc:{price:-1},rating:{ratingAverage:-1}};
    const docs=await db.collection<Product>("products").find(filter).sort(sortMap[sort]||sortMap.featured).skip((page-1)*limit).limit(limit).toArray();
    const categoryIds=[...new Set(docs.map(d=>d.categoryId?.toHexString()).filter(Boolean))].map(x=>new ObjectId(x as string));
    const categories=await db.collection("categories").find({_id:{$in:categoryIds}}).toArray();
    const categoryMap=new Map(categories.map(c=>[c._id.toHexString(),c.name]));
    const total=await db.collection("products").countDocuments(filter);
    return ok({
      items: docs.map(d => serializeProduct(d, { categoryName: d.categoryId ? categoryMap.get(d.categoryId.toHexString()) : undefined })),
      total, page, limit, pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch(e){ return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body=await req.json(); const name=String(body.name||"").trim();
    if(name.length<2) return fail("Product name is required.");
    const db=await database(); const slug=slugify(String(body.slug||name));
    const categoryId=String(body.categoryId||""); if(!/^[a-f\d]{24}$/i.test(categoryId)) return fail("Choose a valid category.");
    const exists=await db.collection("products").findOne({$or:[{slug},{sku:String(body.sku||"").trim()}]});
    if(exists) return fail("A product with that slug or SKU already exists.",409);
    const doc:any={_id:new ObjectId(),name,slug,description:String(body.description||""),shortDescription:String(body.shortDescription||""),price:Number(body.price||0),compareAt:body.compareAt?Number(body.compareAt):undefined,cost:body.cost?Number(body.cost):undefined,sku:String(body.sku||"").trim(),images:Array.isArray(body.images)?body.images:[],categoryId:new ObjectId(categoryId),tags:Array.isArray(body.tags)?body.tags.map(String):[],variants:Array.isArray(body.variants)?body.variants:[],inventory:Math.max(0,Number(body.inventory||0)),featured:Boolean(body.featured),active:body.active!==false,ratingAverage:0,reviewCount:0,createdAt:new Date(),updatedAt:new Date()};
    if(!doc.sku) return fail("SKU is required.");
    if(!Number.isFinite(doc.price)||doc.price<0) return fail("Price must be a valid non-negative number.");
    await db.collection("products").insertOne(doc); return created(serializeProduct(doc));
  } catch(e){return handleRouteError(e);}
}
