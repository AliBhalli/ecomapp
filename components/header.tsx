 "use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Heart, UserRound, Menu, X, ArrowRight } from "lucide-react";
import { useEffect,useState } from "react";
import { useStore } from "./store-provider";
import { apiFetch } from "./api";

export function Header(){
 const path=usePathname();const router=useRouter();const {user,cart,wishlist,setCartOpen}=useStore();const [open,setOpen]=useState(false);const [q,setQ]=useState("");const [results,setResults]=useState<any[]>([]);const [searchOpen,setSearchOpen]=useState(false);
 useEffect(()=>{const id=setTimeout(async()=>{if(q.trim().length>1){const r=await apiFetch<any[]>(`/api/search?q=${encodeURIComponent(q.trim())}`);if(r.ok)setResults(r.data)}else setResults([])},220);return()=>clearTimeout(id)},[q]);
 const nav=[["Shop","/shop"],["New arrivals","/shop?sort=newest"],["Best sellers","/shop?tag=best-seller"],["About","/#story"]];
 return <header className="sticky top-0 z-50 header-blur border-b border-[var(--line)]">
  <div className="container-shell h-[74px] flex items-center gap-5">
   <button className="md:hidden" aria-label="Open menu" onClick={()=>setOpen(true)}><Menu size={23}/></button>
   <Link href="/" className="mr-auto md:mr-3"><span className="display-serif text-[24px] font-bold tracking-[-.04em]">Maison<span className="text-[var(--accent)]">&</span>Market</span></Link>
   <nav className="hidden md:flex items-center gap-5 text-sm font-semibold">{nav.map(([n,u])=><Link key={u} href={u} className={path===u?"text-[var(--accent)]":""}>{n}</Link>)}</nav>
   <div className="hidden md:flex relative ml-auto w-[250px]">
     <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input aria-label="Search products" value={q} onChange={e=>{setQ(e.target.value);setSearchOpen(true)}} onFocus={()=>setSearchOpen(true)} onKeyDown={e=>{if(e.key==="Enter"&&q.trim()){setSearchOpen(false);router.push(`/shop?q=${encodeURIComponent(q.trim())}`)}}} className="input !min-h-[40px] !rounded-full pl-10 pr-3 text-sm" placeholder="Search the collection"/>
     {searchOpen&&q&&results.length>0&&<div className="panel shadow-soft absolute top-12 left-0 right-0 overflow-hidden bg-white">{results.map(r=><Link onClick={()=>setSearchOpen(false)} href={`/product/${r.slug}`} key={r.id} className="flex items-center gap-3 p-3 hover:bg-[var(--soft)]"><img src={r.images?.[0]} alt="" className="h-12 w-10 rounded-lg object-cover"/><div className="min-w-0"><div className="truncate text-sm font-semibold">{r.name}</div><div className="text-xs text-muted">${r.price.toFixed(2)}</div></div><ArrowRight size={15} className="ml-auto"/></Link>)}</div>}
   </div>
   <Link href={user?"/account":"/login"} aria-label="Account"><UserRound size={20}/></Link>
   <Link href="/account/wishlist" aria-label="Wishlist" className="relative"><Heart size={20}/>{wishlist.size>0&&<span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[var(--accent)] px-1 text-center text-[9px] leading-4 text-white">{wishlist.size}</span>}</Link>
   <button onClick={()=>setCartOpen(true)} aria-label="Open cart" className="relative"><ShoppingBag size={20}/>{(cart?.items.length||0)>0&&<span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#171717] px-1 text-center text-[9px] leading-4 text-white">{cart?.items.length}</span>}</button>
  </div>
  {open&&<div className="fixed inset-0 z-[80] bg-black/30 md:hidden" onClick={()=>setOpen(false)}><aside onClick={e=>e.stopPropagation()} className="h-full w-[86%] max-w-[360px] bg-[var(--paper)] p-6"><div className="flex items-center justify-between"><span className="display-serif text-2xl font-bold">Maison&Market</span><button onClick={()=>setOpen(false)} aria-label="Close menu"><X/></button></div><div className="mt-8 space-y-1">{nav.map(([n,u])=><Link onClick={()=>setOpen(false)} key={u} href={u} className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">{n}</Link>)}<Link onClick={()=>setOpen(false)} href="/account" className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">Account</Link><Link onClick={()=>setOpen(false)} href="/cart" className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">Cart</Link></div></aside></div>}
 </header>;
}