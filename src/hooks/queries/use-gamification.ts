"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables } from "@/types/database";
import type { LevelInfo } from "@/lib/gamification/levels";

export interface GamificationSummary {
  profile: Tables<"profiles">;
  levelInfo: LevelInfo;
  earnedBadges: (Tables<"user_badges"> & { badges: Tables<"badges"> })[];
  lockedBadges: Tables<"badges">[];
  recentXp: Tables<"xp_events">[];
}

export function useGamification() {
  return useQuery({
    queryKey: ["gamification"],
    queryFn: () => api.get<{ data: GamificationSummary }>("/api/gamification/summary").then((r) => r.data),    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,  });
}
