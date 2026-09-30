 "use client";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useStore } from "./store-provider";
import { toast } from "./toaster";

export function ProductCard({product}:{product:any}){
 const {toggleWishlist,isWishlisted,addToCart}=useStore();const inStock=(product.variants?.length?product.variants.some((v:any)=>v.active&&v.inventory>0):true);
 const sale=product.compareAt&&product.compareAt>product.price;
 const quick=async()=>{if(product.variants?.length){toast("Choose a variant on the product page.","info");return;}await addToCart(product.id)}
 return <article className="group">
  <div className="relative overflow-hidden rounded-[18px] bg-[#efede8]">
   <Link href={`/product/${product.slug}`} className="block"><img src={product.images?.[0]} alt={product.name} className="product-image transition duration-500 group-hover:scale-[1.025]"/>{product.images?.[1]&&<img src={product.images[1]} alt="" className="product-image absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-[1.025]"/>}</Link>
   <div className="absolute left-3 top-3 flex gap-2">{sale&&<span className="pill bg-white/90">Sale</span>}{product.tags?.includes("new")&&<span className="pill bg-white/90">New</span>}</div>
   <button onClick={()=>toggleWishlist(product.id)} aria-label="Toggle wishlist" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm">{isWishlisted(product.id)?<Heart size={18} fill="currentColor"/>:<Heart size={18}/>}</button>
   {inStock&&<button onClick={quick} className="absolute bottom-3 left-3 right-3 flex h-11 translate-y-2 items-center justify-center gap-2 rounded-full bg-white/95 font-semibold opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"><Plus size={17}/> Quick add</button>}
  </div>
  <div className="flex items-start gap-3 pt-3"><div className="min-w-0 flex-1"><div className="text-xs text-muted">{product.categoryName||"Collection"}</div><Link href={`/product/${product.slug}`} className="mt-1 block text-[15px] font-semibold">{product.name}</Link><div className="mt-1 flex items-center gap-2 text-sm"><span>${Number(product.price).toFixed(2)}</span>{sale&&<span className="text-muted line-through">${Number(product.compareAt).toFixed(2)}</span>}</div>{product.ratingAverage>0&&<div className="mt-1 text-xs text-muted">★ {product.ratingAverage.toFixed(1)} · {product.reviewCount} reviews</div>}</div></div>
 </article>
}