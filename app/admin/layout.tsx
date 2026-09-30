import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();if(!user)redirect("/login?next=/admin");if(user.role!=="admin")return <div className="container-shell py-24 text-center"><div className="display-serif text-3xl font-bold">Administrator access required.</div><p className="mt-2 text-sm text-muted">Your account does not have admin permissions.</p></div>;return <AdminShell>{children}</AdminShell>;}