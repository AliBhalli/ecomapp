"use client";

import { useState } from "react";
import { Copy, Check, MapPin, CreditCard } from "lucide-react";

interface Address {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

function AdminAddressCard({
  title,
  icon: Icon,
  address,
  email,
}: {
  title: string;
  icon: any;
  address?: Address;
  email?: string;
}) {
  const [copied, setCopied] = useState(false);

  const formattedAddress = [
    address?.fullName,
    address?.addressLine1,
    address?.addressLine2,
    `${address?.city || ""}${address?.state ? `, ${address.state}` : ""} ${address?.postalCode || ""}`.trim(),
    address?.country,
    address?.phone ? `Phone: ${address.phone}` : "",
    email ? `Email: ${email}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const copyToClipboard = async () => {
    if (!formattedAddress) return;
    try {
      await navigator.clipboard.writeText(formattedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="panel p-5 relative flex flex-col justify-between border border-[var(--line)] rounded-lg">
      <div>
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-3">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted">
            <Icon size={16} /> {title}
          </div>
          <button
            onClick={copyToClipboard}
            type="button"
            className="text-xs py-1 px-2.5 inline-flex items-center gap-1.5 bg-[var(--subtle)] hover:bg-[var(--line)] rounded-md transition-colors"
            title="Copy eBay-style formatted address"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Address"}
          </button>
        </div>

        <div className="space-y-1 text-sm font-mono bg-[var(--subtle)] p-3 rounded-lg leading-relaxed text-foreground">
          {address?.fullName && <div className="font-semibold text-base font-sans">{address.fullName}</div>}
          {address?.addressLine1 && <div>{address.addressLine1}</div>}
          {address?.addressLine2 && <div>{address.addressLine2}</div>}
          <div>
            {address?.city}{address?.state ? `, ${address.state}` : ""} {address?.postalCode}
          </div>
          {address?.country && <div>{address.country}</div>}
          {address?.phone && <div className="pt-2 text-xs text-muted">Tel: {address.phone}</div>}
          {email && <div className="text-xs text-muted">Email: {email}</div>}
        </div>
      </div>
    </div>
  );
}

export function AdminOrderAddresses({ order }: { order: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <AdminAddressCard
        title="Delivery Address"
        icon={MapPin}
        address={order.shippingAddress}
        email={order.customerEmail}
      />
      <AdminAddressCard
        title="Billing Address"
        icon={CreditCard}
        address={order.billingAddress || order.shippingAddress}
        email={order.customerEmail}
      />
    </div>
  );
}