import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "seller" | "admin";

type AuthState = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export async function fetchRole(userId: string): Promise<Role> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as Role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("seller")) return "seller";
  return "customer";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apply = async (u: User | null) => {
      setUser(u);
      setRole(u ? await fetchRole(u.id) : null);
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => {
          void apply(session?.user ?? null);
          if (event !== "SIGNED_OUT") qc.invalidateQueries();
        }, 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function friendlyAuthError(msg: string) {
  if (/Database error saving new user/i.test(msg)) return "That username is already taken.";
  if (/Invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/Email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox.";
  return msg;
}
