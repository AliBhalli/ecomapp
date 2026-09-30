import { AccountShell } from "@/components/account-shell";
export const dynamic="force-dynamic";
export default function Layout({children}:{children:React.ReactNode}){return <AccountShell>{children}</AccountShell>;}