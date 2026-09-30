import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/http";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok(null);
  return ok({ id:user._id?.toHexString(), name:user.name, email:user.email, role:user.role, status:user.status });
}