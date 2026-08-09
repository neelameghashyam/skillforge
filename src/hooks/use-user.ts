"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/types/database";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function initializeUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (isMounted) {
        setUser(sessionData.session?.user ?? null);
        setLoading(false);
      }
    }

    void initializeUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return { user, loading };
}

export function useProfile() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Tables<"profiles">> => {
      if (!user) throw new Error("User not available");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
