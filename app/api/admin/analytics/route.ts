import { requireAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { ok, handleRouteError } from "@/lib/http";
export async function GET(){try{await requireAdmin();const db=await database();const [sales,orders,customers,products,low,latestOrders,latestCustomers,best] = await Promise.all([
 db.collection("orders").aggregate([{$match:{fulfillmentStatus:{$nin:["cancelled","refunded"]}}},{$group:{_id:null,total:{$sum:"$total"}}}]).toArray(),
 db.collection("orders").countDocuments(),db.collection("users").countDocuments({role:"customer"}),db.collection("products").countDocuments({active:true}),
 db.collection("products").aggregate([{$project:{name:1,sku:1,stock:{$cond:[{$gt:[{$size:{$ifNull:["$variants",[]]}},0]},{$sum:"$variants.inventory"},{$ifNull:["$inventory",0]}]}}},{$match:{stock:{$lte:10}}},{$sort:{stock:1}},{$limit:8}]).toArray(),
 db.collection("orders").find({},{projection:{orderNumber:1,customerName:1,email:1,total:1,fulfillmentStatus:1,createdAt:1}}).sort({createdAt:-1}).limit(8).toArray(),
 db.collection("users").find({role:"customer"},{projection:{name:1,email:1,createdAt:1}}).sort({createdAt:-1}).limit(8).toArray(),
 db.collection("orders").aggregate([{$unwind:"$items"},{$group:{_id:"$items.title",qty:{$sum:"$items.quantity"},revenue:{$sum:"$items.lineTotal"}}},{$sort:{qty:-1}},{$limit:8}]).toArray()
 ]); const trend=await db.collection("orders").aggregate([{$match:{createdAt:{$gte:new Date(Date.now()-1000*60*60*24*30)},fulfillmentStatus:{$nin:["cancelled","refunded"]}}},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}},revenue:{$sum:"$total"}}},{$sort:{_id:1}}]).toArray();return ok({sales:sales[0]?.total||0,orders,customers,products,lowStock:low.map(x=>({...x,id:x._id?.toHexString()})),latestOrders,latestCustomers,bestSelling:best,trend});}catch(e){return handleRouteError(e);}}
