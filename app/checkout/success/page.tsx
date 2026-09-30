import { Suspense } from "react";
import { OrderSuccessClient } from "@/components/order-success-client";
export default function Success(){return <Suspense fallback={<div className="container-shell py-24 text-center">Loading…</div>}><OrderSuccessClient/></Suspense>}