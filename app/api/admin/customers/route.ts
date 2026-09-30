import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
export async function GET(req:NextRequest){try{await requireAdmin();const q=req.nextUrl.searchParams.get("q")?.trim();const filter:any={};if(q)filter.$or=[{name:{$regex:q,$options:"i"}},{email:{$regex:q,$options:"i"}}];const db=await database();const xs=await db.collection("users").find(filter,{projection:{passwordHash:0}}).sort({createdAt:-1}).limit(200).toArray();return ok(xs.map(x=>({...x,id:x._id.toHexString()})));}catch(e){return handleRouteError(e);}}
