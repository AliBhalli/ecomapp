import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const db = await database();
  let order = null;

  try {
    if (ObjectId.isValid(id)) {
      order = await db.collection("orders").findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(session.sub),
      });
    }

    if (!order) {
      order = await db.collection("orders").findOne({
        orderNumber: id,
        userId: new ObjectId(session.sub),
      });
    }
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
    timeline: order.timeline || [
      {
        status: order.status || "pending",
        at: order.createdAt || new Date(),
        note: "Order placed",
      },
    ],
  };

  return (
    <div className="container-shell py-10 md:py-14">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="kicker">Order details</div>
          <h1 className="display-serif mt-1 text-3xl font-bold md:text-4xl">
            {o.orderNumber || o.id}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed on {new Date(o.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="pill uppercase">{o.paymentStatus || "pending"}</span>
          <span className="pill uppercase">{o.status || "pending"}</span>
        </div>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          {/* Order Items */}
          <div className="panel p-5">
            <h2 className="display-serif text-xl font-bold">Items</h2>
            <div className="mt-4 divide-y divide-[var(--line)]">
              {o.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={item.title || "Product"}
                    className="h-20 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.title || "Product"}</div>
                    <div className="mt-1 text-xs text-muted">
                      {item.variantLabel || "Standard"} · Qty: {item.quantity || 1}
                    </div>
                  </div>
                  <div className="font-semibold">
                    $
                    {Number(
                      item.lineTotal || item.unitPrice * item.quantity || 0
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="panel p-5">
            <h2 className="display-serif text-xl font-bold">Order timeline</h2>
            <div className="mt-5 space-y-4">
              {o.timeline.map((t: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className={
                      i === o.timeline.length - 1
                        ? "text-[var(--accent)]"
                        : "text-muted"
                    }
                  />
                  <div>
                    <div className="text-sm font-semibold capitalize">
                      {t.status}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {new Date(t.at).toLocaleString()} · {t.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="panel h-fit p-5">
          <div className="display-serif text-2xl font-bold">Summary</div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(o.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>−${Number(o.discount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${Number(o.shipping || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${Number(o.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--line)] pt-4 font-bold">
              <span>Total</span>
              <span>${Number(o.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}