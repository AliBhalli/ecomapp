 "use client";
import { createContext,useCallback,useContext,useEffect,useMemo,useState } from "react";
import { apiFetch } from "./api";
import { toast } from "./toaster";

type Cart={items:any[];subtotal:number;discount:number;shipping:number;tax:number;total:number;couponCode?:string};
type User={id:string;name:string;email:string;role:"customer"|"admin";status:string};
type StoreContext={user:User|null;cart:Cart|null;wishlist:Set<string>;cartOpen:boolean;setCartOpen:(v:boolean)=>void;refresh:()=>Promise<void>;addToCart:(productId:string,variantId?:string,quantity?:number)=>Promise<boolean>;updateCart:(productId:string,variantId:string|undefined,quantity:number)=>Promise<void>;removeCart:(productId:string,variantId?:string)=>Promise<void>;toggleWishlist:(productId:string)=>Promise<void>;isWishlisted:(productId:string)=>boolean;logout:()=>Promise<void>};
const C=createContext<StoreContext|null>(null);
const guestKey="ecom_guest_wishlist";

export function StoreProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [cart,setCart]=useState<Cart|null>(null); const [wishlist,setWishlist]=useState<Set<string>>(new Set()); const [cartOpen,setCartOpen]=useState(false);
 const refresh=useCallback(async()=>{
   const me=await apiFetch<User|null>("/api/auth/me");
   if(me.ok)setUser(me.data);
   if(me.ok&&me.data){
     try{
       const guest:string[]=JSON.parse(localStorage.getItem(guestKey)||"[]");
       for(const id of guest) await apiFetch("/api/wishlist",{method:"POST",body:JSON.stringify({productId:id})});
       if(guest.length) localStorage.removeItem(guestKey);
     }catch{}
   }
   const [ca,wl]=await Promise.all([apiFetch<Cart>("/api/cart"),apiFetch<string[]>("/api/wishlist")]);
   if(ca.ok)setCart(ca.data);
   if(wl.ok)setWishlist(new Set(wl.data));
   else try{setWishlist(new Set(JSON.parse(localStorage.getItem(guestKey)||"[]")))}catch{}
 },[]);
 useEffect(()=>{refresh()},[refresh]);
 const addToCart=useCallback(async(pid:string,vid?:string,qty=1)=>{
   const r=await apiFetch<Cart>("/api/cart",{method:"POST",body:JSON.stringify({productId:pid,variantId:vid,quantity:qty})});
   if(!r.ok){toast(r.error,"error");return false;}setCart(r.data);setCartOpen(true);toast("Added to cart.");return true;
 },[]);
 const updateCart=useCallback(async(pid:string,vid:string|undefined,qty:number)=>{
   const r=await apiFetch<Cart>("/api/cart",{method:"PATCH",body:JSON.stringify({productId:pid,variantId:vid,quantity:qty})});
   if(!r.ok){toast(r.error,"error");return;}setCart(r.data);
 },[]);
 const removeCart=useCallback(async(pid:string,vid?:string)=>{
   const r=await apiFetch<Cart>("/api/cart",{method:"DELETE",body:JSON.stringify({productId:pid,variantId:vid})});
   if(!r.ok){toast(r.error,"error");return;}setCart(r.data);toast("Removed from cart.","info");
 },[]);
 const toggleWishlist=useCallback(async(pid:string)=>{
   const active=wishlist.has(pid);const r=await apiFetch("/api/wishlist",{method:active?"DELETE":"POST",body:JSON.stringify({productId:pid})});
   if(r.ok){setWishlist(prev=>{const n=new Set(prev);active?n.delete(pid):n.add(pid);return n});if(!user){try{const n=[...wishlist];const next=active?n.filter(x=>x!==pid):[...n,pid];localStorage.setItem(guestKey,JSON.stringify(next))}catch{}}toast(active?"Removed from wishlist.":"Saved to wishlist.","success");}
   else if(r.error==="Authentication required."){try{const current=new Set(JSON.parse(localStorage.getItem(guestKey)||"[]"));active?current.delete(pid):current.add(pid);localStorage.setItem(guestKey,JSON.stringify([...current]));setWishlist(current);toast("Saved locally. Sign in to sync your wishlist.","info")}catch{}}
   else toast(r.error,"error");
 },[wishlist,user]);
 const logout=useCallback(async()=>{await apiFetch("/api/auth/logout",{method:"POST"});setUser(null);await refresh();window.location.href="/"},[refresh]);
 const value=useMemo(()=>({user,cart,wishlist,cartOpen,setCartOpen,refresh,addToCart,updateCart,removeCart,toggleWishlist,isWishlisted:(id:string)=>wishlist.has(id),logout}),[user,cart,wishlist,cartOpen,refresh,addToCart,updateCart,removeCart,toggleWishlist,logout]);
 return <C.Provider value={value}>{children}</C.Provider>;
}
export function useStore(){const c=useContext(C);if(!c)throw new Error("useStore must be inside StoreProvider");return c;}
