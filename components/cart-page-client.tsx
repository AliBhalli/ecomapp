"use client";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { QuantitySelector } from "./quantity-selector";
import { apiFetch } from "./api";
import { toast } from "./toaster";

export function CartPageClient() {
  const { cart, updateCart, removeCart } = useStore();
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!coupon) return;
    setBusy(true);
    const r = await apiFetch<any>("/api/cart/coupon", { method: "POST", body: JSON.stringify({ code: coupon }) });
    setBusy(false);
    if (!r.ok) { toast(r.error, "error"); return; }
    window.location.reload();
    toast("Coupon applied.");
  };

  if (!cart) return <div className="container-shell py-20 text-center"><div className="skeleton mx-auto h-8 w-40 rounded" /></div>;
  if (!cart.items.length) return <div className="container-shell py-24 text-center"><div className="kicker">Your bag</div><h1 className="display-serif mt-3 text-4xl font-bold">Nothing here yet.</h1><p className="mt-3 text-sm text-muted">Start with something useful.</p><Link href="/shop" className="btn btn-dark mt-6">Continue shopping</Link></div>;

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="kicker">Your bag</div>
      <h1 className="display-serif mt-2 text-4xl font-bold md:text-5xl">Ready when you are.</h1>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-3">
          {cart.items.map((i: any) =>
            <div key={`${i.productId}:${i.variantId || ""}`} className="panel p-4 flex gap-4">
              <img 
                src={i.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"} 
                alt={i.title || "Product image"} 
                className="h-28 w-24 rounded-xl object-cover" 
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{i.title}</div>
                <div className="mt-1 text-sm text-muted">{i.variantLabel || "Standard"} · {i.sku}</div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <QuantitySelector value={i.quantity} onChange={n => updateCart(i.productId, i.variantId, n)} max={Math.max(1, Math.min(99, i.inventory))} />
                  <div className="text-right">
                    <div className="font-semibold">${i.lineTotal.toFixed(2)}</div>
                    <button onClick={() => removeCart(i.productId, i.variantId)} className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><Trash2 size={13} /> Remove</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <aside className="panel h-fit p-5 lg:sticky lg:top-24">
          <div className="display-serif text-2xl font-bold">Summary</div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-[var(--accent)]"><span>Discount</span><span>−${cart.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{cart.shipping ? `$${cart.shipping.toFixed(2)}` : "Free"}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
            <div className="my-3 border-t border-[var(--line)] pt-3 flex justify-between text-base font-bold"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
          </div>
          <div className="mt-5 flex gap-2">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} className="input" placeholder="Coupon code" />
            <button disabled={busy} onClick={apply} className="btn btn-secondary">Apply</button>
          </div>
          {cart.couponCode && <div className="mt-2 text-xs text-[var(--accent)]">Applied: {cart.couponCode}</div>}
          <Link href="/checkout" className="btn btn-dark mt-5 w-full">Checkout <ArrowRight size={16} /></Link>
          <Link href="/shop" className="mt-3 block text-center text-xs text-muted underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}