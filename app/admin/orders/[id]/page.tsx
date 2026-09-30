import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "@/lib/db";
import { ObjectId } from "mongodb";
import { ArrowLeft } from "lucide-react";
import { AdminOrderAddresses } from "./address-cards";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await database();
  let order = null;

  try {
    order = await db.collection("orders").findOne({
      _id: new ObjectId(id),
    });
  } catch {
    order = null;
  }

  if (!order) {
    notFound();
  }

  const o = {
    ...order,
    id: order._id.toHexString(),
    items: order.items || [],
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{o.orderNumber || o.id}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed on {new Date(o.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase">
            {o.paymentStatus || "pending"}
          </span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full uppercase">
            {o.status || "pending"}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Order Items */}
          <div className="panel p-5 border border-[var(--line)] rounded-lg">
            <h2 className="text-xl font-bold mb-4">Items</h2>
            <div className="divide-y divide-[var(--line)]">
              {o.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"}
                    alt={item.title || "Product"}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.title || "Product"}</div>
                    <div className="text-xs text-muted mt-1">
                      Qty: {item.quantity || 1}
                    </div>
                  </div>
                  <div className="font-semibold">
                    ${Number(item.lineTotal || item.unitPrice * item.quantity || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Address Cards with Copy Feature */}
          <AdminOrderAddresses order={o} />
        </div>

        {/* Financial Summary */}
        <aside className="panel p-5 h-fit border border-[var(--line)] rounded-lg">
          <h2 className="text-xl font-bold mb-5">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>${Number(o.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span>−${Number(o.discount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>${Number(o.shipping || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span>${Number(o.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--line)] pt-4 mt-4 font-bold text-base">
              <span>Total</span>
              <span>${Number(o.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}