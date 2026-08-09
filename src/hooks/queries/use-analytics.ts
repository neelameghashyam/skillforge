"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";

export interface AnalyticsData {
  dailyActivity: { day: string; tasks_done: number; skill_sessions: number }[];
  skillDistribution: { category: string; skill_count: number; total_hours: number; avg_progress: number }[];
  tasksByStatus: Record<string, number>;
  skills: { name: string; progress: number; logged_hours: number; target_hours: number; category: string }[];
}

export function useAnalytics(days = 30) {
  return useQuery({
    queryKey: ["analytics", days],
    queryFn: () => api.get<{ data: AnalyticsData }>(`/api/analytics?days=${days}`).then((r) => r.data),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
