"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { apiFetch } from "./api";
import { toast } from "./toaster";

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function AdminOrders() {
  const [items, setItems] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  
  const load = () => apiFetch<any[]>(`/api/admin/orders?${q ? `q=${encodeURIComponent(q)}&` : ""}${status ? `status=${status}` : ""}`).then(r => r.ok && setItems(r.data));
  
  useEffect(() => { load() }, [status]);

  return (
    <div>
      <div className="kicker">Admin</div>
      <h1 className="display-serif mt-2 text-4xl font-bold">Orders</h1>
      <p className="mt-2 text-sm text-muted">Review payments, customer details and fulfillment status.</p>
      
      <div className="panel mt-7 p-3 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input className="input !min-h-[42px] pl-9" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} placeholder="Order number, name or email"/>
        </div>
        <select className="input !w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={load}>Search</button>
      </div>

      {!items ? (
        <div className="mt-4 skeleton h-96 rounded-2xl"/>
      ) : (
        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-[var(--line)] text-left text-xs text-muted">
              <tr>
                <th className="p-4">Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Placed</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {items.map(o => (
                <tr key={o.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-4 font-semibold">{o.orderNumber}</td>
                  <td>
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted">{o.email}</div>
                  </td>
                  <td>${Number(o.total || 0).toFixed(2)}</td>
                  <td>{o.paymentStatus}</td>
                  <td>
                    <select 
                      className="input !min-h-[38px] !w-[130px] text-xs" 
                      value={o.fulfillmentStatus} 
                      onChange={async e => {
                        const next = e.target.value;
                        const r = await apiFetch(`/api/admin/orders/${o.id}`, {
                          method: "PATCH", 
                          body: JSON.stringify({ status: next })
                        });
                        if (!r.ok) toast(r.error, "error");
                        else { toast("Order status updated."); load(); }
                      }}
                    >
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold underline">
                      View<ChevronRight size={13}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}