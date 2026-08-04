"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useResources(query?: string) {
  return useQuery({
    queryKey: ["resources", query],
    queryFn: () => api.get<{ data: Tables<"resources">[] }>(`/api/resources${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"resources">) => api.post<{ data: Tables<"resources"> }>("/api/resources", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"resources"> }) => api.patch(`/api/resources/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/resources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
