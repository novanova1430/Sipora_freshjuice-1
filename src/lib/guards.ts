import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchRole, type Role } from "@/lib/auth";

/** Client-side route gate (routes using it must set ssr: false). Data access is enforced by database rules. */
export async function requireRole(role: Role) {
  const { data } = await supabase.auth.getUser();
  const loginTo = role === "seller" ? "/seller-login" : "/login";
  if (!data.user) throw redirect({ to: loginTo });
  const actual = await fetchRole(data.user.id);
  if (actual !== role) throw redirect({ to: actual === "seller" ? "/seller" : "/account" });
  return { user: data.user };
}
