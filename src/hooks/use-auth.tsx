import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "client" | "vendor" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  is_banned: boolean;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [roles, setRoles] = React.useState<AppRole[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadAux = React.useCallback(async (userId: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(p as Profile | null);
    setRoles(((r as { role: AppRole }[] | null) ?? []).map((x) => x.role));
  }, []);

  React.useEffect(() => {
    // Listener FIRST, then getSession
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer to avoid deadlock
        setTimeout(() => { void loadAux(s.user.id); }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) void loadAux(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadAux]);

  const value: AuthCtx = {
    user,
    session,
    profile,
    roles,
    loading,
    isAuthenticated: !!user,
    isVendor: roles.includes("vendor"),
    isAdmin: roles.includes("admin"),
    signOut: async () => { await supabase.auth.signOut(); },
    refresh: async () => { if (user) await loadAux(user.id); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
