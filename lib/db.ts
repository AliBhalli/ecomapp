import { ObjectId } from "mongodb";
import { getClientPromise } from "./mongodb";

export type Role = "customer" | "admin";
export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type Variant = {
  id: string;
  label: string;
  options: Record<string, string>;
  sku: string;
  price: number;
  compareAt?: number;
  inventory: number;
  images?: string[];
  active: boolean;
};

export type Product = {
  _id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAt?: number;
  cost?: number;
  sku: string;
  images: string[];
  categoryId: ObjectId;
  categoryName?: string;
  tags: string[];
  variants: Variant[];
  inventory?: number;
  featured: boolean;
  active: boolean;
  ratingAverage: number;
  reviewCount: number;
  seo?: { title?: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
};

export type CartItem = { productId: ObjectId; variantId?: string; quantity: number };
export type CartDoc = {
  _id?: ObjectId;
  userId?: ObjectId;
  sessionId?: string;
  items: CartItem[];
  couponCode?: string;
  updatedAt: Date;
  createdAt: Date;
};

export type CouponDoc = {
  _id?: ObjectId;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  active: boolean;
};

export type Address = {
  _id?: ObjectId;
  userId: ObjectId;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
};

export type OrderItem = {
  productId: ObjectId;
  title: string;
  image?: string;
  variantId?: string;
  variantLabel?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderDoc = {
  _id?: ObjectId;
  orderNumber: string;
  userId?: ObjectId;
  email: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: "USD";
  couponCode?: string;
  paymentMethod: "cod" | "card";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: OrderStatus;
  shippingAddress: Omit<Address, "_id" | "userId" | "createdAt" | "isDefault" | "label">;
  billingAddress?: Omit<Address, "_id" | "userId" | "createdAt" | "isDefault" | "label">;
  shippingMethod: "standard";
  estimatedDelivery: string;
  timeline: { status: OrderStatus; at: Date; note?: string }[];
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function database() {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "ecomapp");
}
export { ObjectId };
