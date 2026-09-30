import { ProductClient } from "@/components/product-client";
export const dynamic="force-dynamic";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <ProductClient slug={slug}/>;}