"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useTasks(params?: { from?: string; to?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params?.from) { search.set("from", params.from); search.set("dateColumn", "scheduled_date"); }
  if (params?.to) search.set("to", params.to);
  if (params?.status) search.set("status", params.status);

  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.get<{ data: Tables<"tasks">[] }>(`/api/tasks?${search.toString()}`).then((r) => r.data),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"tasks">) => api.post<{ data: Tables<"tasks"> }>("/api/tasks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"tasks"> }) => api.patch(`/api/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
