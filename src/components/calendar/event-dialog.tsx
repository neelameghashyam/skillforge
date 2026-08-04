"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormValues } from "@/lib/validations/schemas";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/queries/use-events";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/types/database";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"];

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Tables<"events">;
  defaultSlot?: { start: Date; end: Date };
}

export function EventDialog({ open, onOpenChange, event, defaultSlot }: EventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    values: event
      ? {
          title: event.title, description: event.description ?? "", location: event.location ?? "",
          start_time: toLocalInput(new Date(event.start_time)), end_time: toLocalInput(new Date(event.end_time)),
          all_day: event.all_day, color: event.color,
        }
      : {
          title: "", description: "", location: "",
          start_time: defaultSlot ? toLocalInput(defaultSlot.start) : toLocalInput(new Date()),
          end_time: defaultSlot ? toLocalInput(defaultSlot.end) : toLocalInput(new Date(Date.now() + 3600000)),
          all_day: false, color: "#6366f1",
        },
  });

  async function onSubmit(values: EventFormValues) {
    const payload = {
      ...values,
      start_time: new Date(values.start_time).toISOString(),
      end_time: new Date(values.end_time).toISOString(),
    };
    if (event) {
      await updateEvent.mutateAsync({ id: event.id, data: payload });
    } else {
      await createEvent.mutateAsync(payload as any);
      reset();
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!event) return;
    await deleteEvent.mutateAsync(event.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start</Label>
              <Input id="start_time" type="datetime-local" {...register("start_time")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End</Label>
              <Input id="end_time" type="datetime-local" {...register("end_time")} />
              {errors.end_time && <p className="text-sm text-destructive">{errors.end_time.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className="h-7 w-7 rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: watch("color") === c ? "hsl(var(--foreground))" : "transparent" }}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="pt-2">
            {event && (
              <Button type="button" variant="destructive" className="sm:mr-auto" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button type="submit">{event ? "Save changes" : "Create event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
