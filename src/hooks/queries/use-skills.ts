"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useSkills(query?: string) {
  return useQuery({
    queryKey: ["skills", query],
    queryFn: () => api.get<{ data: Tables<"skills">[] }>(`/api/skills${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"skills">) => api.post<{ data: Tables<"skills"> }>("/api/skills", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCurricula(search?: string) {
  return useQuery({
    queryKey: ["skillCurricula", search],
    queryFn: () => api.get<{ data: any[] }>(`/api/skills/curricula${search ? `?q=${encodeURIComponent(search)}` : ""}`).then((r) => r.data),
    enabled: !!search,
  });
}

export function useCurriculumBySlug(slug: string) {
  return useQuery({
    queryKey: ["skillCurricula", slug],
    queryFn: () => api.get<{ data: any }>(`/api/skills/curricula?slug=${encodeURIComponent(slug)}`).then((r) => r.data),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"skills"> }) => api.patch(`/api/skills/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/skills/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills"] });
      qc.invalidateQueries({ queryKey: ["myTopicSkills"] });
      toast.success("Skill deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddSkillFromCurriculum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { curriculum_id: string; name: string; description?: string | null; category?: string; level?: string; color?: string; icon?: string }) =>
      api.post<{ data: Tables<"skills"> }>("/api/skills/add-from-curriculum", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills"] });
      qc.invalidateQueries({ queryKey: ["myTopicSkills"] });
      toast.success("Skill added to your list");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyTopicSkills() {
  return useQuery({
    queryKey: ["myTopicSkills"],
    queryFn: () => api.get<{ data: any[] }>("/api/skills/my-topics").then((r) => r.data),
  });
}

export function useToggleTopicProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { skill_id: string; curriculum_topic_id: string; is_complete: boolean }) =>
      api.post<{ data: any }>("/api/skills/topic-progress", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myTopicSkills"] });
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
