"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables } from "@/types/database";
import { toast } from "sonner";

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ["project_milestones", projectId],
    queryFn: () => api.get<{ data: Tables<"project_milestones">[] }>(`/api/projects/${projectId}/milestones`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; due_date?: string }) => api.post(`/api/projects/${projectId}/milestones`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, is_complete }: { milestoneId: string; is_complete: boolean }) =>
      api.patch(`/api/projects/milestones/${milestoneId}`, { is_complete }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["gamification"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) => api.delete(`/api/projects/milestones/${milestoneId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_milestones", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
