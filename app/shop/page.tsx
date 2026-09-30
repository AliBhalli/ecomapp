import { Suspense } from "react";
import { ShopClient } from "@/components/shop-client";
export const dynamic="force-dynamic";
export default function Shop(){return <Suspense fallback={<div className="container-shell py-16">Loading collection…</div>}><ShopClient/></Suspense>;}