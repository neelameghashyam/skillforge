"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useProjects(query?: string) {
  return useQuery({
    queryKey: ["projects", query],
    queryFn: () => api.get<{ data: Tables<"projects">[] }>(`/api/projects${query ? `?${query}` : ""}`).then((r) => r.data),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"projects">) => api.post<{ data: Tables<"projects"> }>("/api/projects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"projects"> }) => api.patch(`/api/projects/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
