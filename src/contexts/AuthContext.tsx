import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme, getStoredTheme, ThemeName } from "@/lib/theme";

export type AccessPlan = "free" | "days_30" | "days_60" | "days_90" | "days_180" | "premium";

interface Profile {
  id: string;
  email: string;
  theme: ThemeName;
  current_topic: string | null;
  current_topic_unlocked: boolean;
  last_score: number;
  show_in_ranking: boolean;
  plan: AccessPlan;
  access_expires_at: string | null;
  chat_unlocked: boolean;
  created_at: string;
  days_30_renewals_count: number;
  terms_accepted_at: string | null;
  expert_unlocked_until: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data: p } = await supabase
      .from("profiles")
      .select("id,email,theme,current_topic,current_topic_unlocked,last_score,show_in_ranking,plan,access_expires_at,chat_unlocked,created_at,days_30_renewals_count,terms_accepted_at,expert_unlocked_until")
      .eq("id", uid)
      .maybeSingle();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const admin = !!roles?.some((r) => r.role === "admin");
    setIsAdmin(admin);

    if (p) {
      if (!admin && p.access_expires_at && new Date(p.access_expires_at) < new Date()) {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        if (typeof window !== "undefined") window.location.href = "/login?expired=1";
        return;
      }
      setProfile(p as Profile);
      applyTheme((p.theme as ThemeName) || getStoredTheme());
    }
  };

  useEffect(() => {
    // Apply stored theme immediately
    applyTheme(getStoredTheme());

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
