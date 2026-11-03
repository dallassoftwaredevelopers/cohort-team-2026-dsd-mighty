"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/user";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("user_id, full_name, email, role, status")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          if (active) setProfile(null);
          return;
        }

        if (!active) return;

        setProfile(data);
      } catch (error) {
        console.error("Unexpected error loading profile:", error);
      }
    }

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      setUser(user);

      if (user) {
        await loadProfile(user.id);
      }

      if (active) setLoading(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session?.user) {
          queueMicrotask(() => {
            if (active) loadProfile(session.user.id);
          });
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
