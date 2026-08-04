"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables } from "@/types/database";
import { toast } from "sonner";

export function useSkillLogs(skillId: string) {
  return useQuery({
    queryKey: ["skill_logs", skillId],
    queryFn: () => api.get<{ data: Tables<"skill_logs">[] }>(`/api/skills/${skillId}/logs`).then((r) => r.data),
    enabled: !!skillId,
  });
}

export function useLogSkillHours(skillId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { hours: number; note?: string; logged_at?: string }) =>
      api.post(`/api/skills/${skillId}/logs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill_logs", skillId] });
      qc.invalidateQueries({ queryKey: ["skills"] });
      qc.invalidateQueries({ queryKey: ["gamification"] });
      toast.success("Practice logged! XP earned 🎉");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
