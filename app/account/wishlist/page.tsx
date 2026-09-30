 "use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { apiFetch } from "@/components/api";
import { useStore } from "@/components/store-provider";
export default function Wishlist(){const {wishlist}=useStore();const [items,setItems]=useState<any[]|null>(null);useEffect(()=>{if(!wishlist.size){setItems([]);return;}apiFetch<any[]>(`/api/wishlist/products?ids=${encodeURIComponent([...wishlist].join(","))}`).then(r=>setItems(r.ok?r.data:[]))},[wishlist]);return <div><div className="kicker">Account</div><h1 className="display-serif mt-2 text-4xl font-bold">Wishlist</h1><p className="mt-3 text-sm text-muted">Keep the pieces you’re considering close.</p><div className="mt-8">{items?.length?<ProductGrid items={items}/>:<div className="panel p-10 text-center">{items?<><div className="display-serif text-2xl font-bold">Nothing saved yet.</div><p className="mt-2 text-sm text-muted">Tap the heart on any product to keep it here.</p><Link href="/shop" className="btn btn-dark mt-5">Browse products</Link></>:<div className="skeleton h-80 rounded-2xl"/>}</div>}</div></div>}
