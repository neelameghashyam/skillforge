"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskFormValues } from "@/lib/validations/schemas";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/queries/use-tasks";
import { useSkills } from "@/hooks/queries/use-skills";
import { useProjects } from "@/hooks/queries/use-projects";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/types/database";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  task?: Tables<"tasks">;
}

export function TaskDialog({ open, onOpenChange, defaultDate, task }: TaskDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: skills } = useSkills();
  const { data: projects } = useProjects();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title, description: task.description ?? "", status: task.status, priority: task.priority,
          scheduled_date: task.scheduled_date ?? undefined, scheduled_time: task.scheduled_time ?? undefined,
          skill_id: task.skill_id ?? undefined, project_id: task.project_id ?? undefined,
        }
      : { title: "", status: "todo", priority: "medium", scheduled_date: defaultDate },
  });

  async function onSubmit(values: TaskFormValues) {
    const payload = {
      ...values,
      skill_id: values.skill_id || null,
      project_id: values.project_id || null,
      scheduled_date: values.scheduled_date || null,
    };
    if (task) {
      await updateTask.mutateAsync({ id: task.id, data: payload });
    } else {
      await createTask.mutateAsync(payload as any);
      reset();
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!task) return;
    await deleteTask.mutateAsync(task.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["todo", "in_progress", "done", "archived"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date</Label>
              <Input id="scheduled_date" type="date" {...register("scheduled_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time</Label>
              <Input id="scheduled_time" type="time" {...register("scheduled_time")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Skill</Label>
              <Select value={watch("skill_id") ?? "none"} onValueChange={(v) => setValue("skill_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {skills?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={watch("project_id") ?? "none"} onValueChange={(v) => setValue("project_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            {task && (
              <Button type="button" variant="destructive" className="sm:mr-auto" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button type="submit">{task ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
