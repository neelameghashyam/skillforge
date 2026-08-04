"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/fetcher";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

export function useEvents(query?: string) {
  return useQuery({
    queryKey: ["events", query],
    queryFn: () => api.get<{ data: Tables<"events">[] }>(`/api/events${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TablesInsert<"events">) => api.post<{ data: Tables<"events"> }>("/api/events", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<"events"> }) => api.patch(`/api/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
