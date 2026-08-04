"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useNotes(query?: string) {
  return useQuery({
    queryKey: ["notes", query],
    queryFn: () => api.get<{ data: Tables<"notes">[] }>(`/api/notes${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"notes">) => api.post<{ data: Tables<"notes"> }>("/api/notes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"notes"> }) => api.patch(`/api/notes/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/notes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
