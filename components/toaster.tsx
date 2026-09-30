 "use client";
import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

type Toast={id:number;message:string;kind:"success"|"error"|"info"};
let toastId=0;
export function toast(message:string,kind:Toast["kind"]="success"){window.dispatchEvent(new CustomEvent("ecom:toast",{detail:{message,kind}}));}
export function Toaster(){
 const [items,setItems]=useState<Toast[]>([]);
 useEffect(()=>{const on=(e:Event)=>{const d=(e as CustomEvent).detail as Omit<Toast,"id">;const id=++toastId;setItems(x=>[...x,{...d,id}]);setTimeout(()=>setItems(x=>x.filter(t=>t.id!==id)),3800)};window.addEventListener("ecom:toast",on);return()=>window.removeEventListener("ecom:toast",on)},[]);
 return <div className="fixed right-4 top-20 z-[70] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">{items.map(t=><div key={t.id} className="panel shadow-soft fade-in flex items-center gap-3 p-4 text-sm">
  {t.kind==="success"?<CheckCircle2 size={19} className="text-[var(--accent)]"/>:<AlertCircle size={19}/>}<span className="flex-1">{t.message}</span><button aria-label="Dismiss" onClick={()=>setItems(x=>x.filter(i=>i.id!==t.id))}><X size={17}/></button>
 </div>)}</div>
}