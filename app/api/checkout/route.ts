import { NextRequest } from "next/server";
import { database } from "@/lib/db";
import { ensureCart } from "@/lib/cart";
import { ok, fail, handleRouteError } from "@/lib/http";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const db = await database();
    const cart = await ensureCart();

    if (!cart.items || !cart.items.length) {
      return fail("Your cart is empty.", 400);
    }

    const session = await (await import("@/lib/auth")).getSession().catch(() => null);
    const body = await req.json().catch(() => ({}));

    // Fetch live product data
    const productIds = cart.items.map((i: any) => new ObjectId(i.productId || i.item?.productId));
    const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray();
    const productMap = new Map(products.map((p: any) => [p._id.toHexString(), p]));

    let calculatedSubtotal = 0;
    const orderItems = cart.items.map((i: any) => {
      const pId = String(i.productId || i.item?.productId || "");
      const product = productMap.get(pId) || {};
      const qty = Number(i.quantity || i.item?.quantity || 1);
      const unitPrice = Number(i.unitPrice ?? product.price ?? 0);
      const lineTotal = Number(i.lineTotal ?? (unitPrice * qty));

      calculatedSubtotal += lineTotal;

      return {
        productId: pId,
        title: i.title || product.name || "Product",
        image: i.image || product.images?.[0] || "",
        variantId: i.variantId || "",
        variantLabel: i.variantLabel || "Standard",
        sku: i.sku || product.sku || "",
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

    const subtotal = Number(cart.subtotal ?? calculatedSubtotal);
    const discount = Number(cart.discount ?? 0);
    const shipping = Number(cart.shipping ?? 0);
    const tax = Number(cart.tax ?? (subtotal * 0.08));
    const total = Number(cart.total ?? Math.max(0, subtotal - discount + shipping + tax));

    // Flexible address parsing (supports flat form fields or nested objects)
    const shippingAddress = {
      fullName: body.fullName || body.shippingAddress?.fullName || session?.name || cart.shippingAddress?.fullName || "Guest",
      addressLine1: body.addressLine1 || body.street || body.shippingAddress?.addressLine1 || cart.shippingAddress?.addressLine1 || "",
      addressLine2: body.addressLine2 || body.shippingAddress?.addressLine2 || cart.shippingAddress?.addressLine2 || "",
      city: body.city || body.shippingAddress?.city || cart.shippingAddress?.city || "",
      state: body.state || body.shippingAddress?.state || cart.shippingAddress?.state || "",
      postalCode: body.postalCode || body.zip || body.shippingAddress?.postalCode || cart.shippingAddress?.postalCode || "",
      country: body.country || body.shippingAddress?.country || cart.shippingAddress?.country || "US",
      phone: body.phone || body.shippingAddress?.phone || cart.shippingAddress?.phone || "",
    };

    const billingAddress = body.billingAddress || shippingAddress;
    const customerEmail = body.email || body.customerEmail || session?.email || "";

    const order = {
      userId: session?.sub ? new ObjectId(session.sub) : null,
      customerName: shippingAddress.fullName,
      customerEmail: customerEmail,
      shippingAddress,
      billingAddress,
      items: orderItems,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      status: "pending",
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",
      orderNumber: `ORD-${Date.now()}`,
      timeline: [{ status: "pending", at: new Date(), note: "Order placed successfully" }],
      createdAt: new Date(),
    };

    const res = await db.collection("orders").insertOne(order);

    await db.collection("carts").updateOne(
      { _id: cart._id },
      { $set: { items: [] },$unset: { couponCode: "" } }
    );

    return ok({ orderId: res.insertedId.toHexString() });
  } catch (e) {
    return handleRouteError(e);
  }
}