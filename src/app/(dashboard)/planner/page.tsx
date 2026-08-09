"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { usePlannerStore } from "@/store/planner-store";
import { useTasks, useUpdateTask } from "@/hooks/queries/use-tasks";
import { toDateInputValue, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, CalendarClock } from "lucide-react";
import type { Tables } from "@/types/database";

const TaskDialog = dynamic(() => import("@/components/planner/task-dialog").then((mod) => mod.TaskDialog), { ssr: false });

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function PlannerPage() {
  const { weekStart, goToToday, goToNextWeek, goToPrevWeek } = usePlannerStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tables<"tasks"> | undefined>();
  const [newTaskDate, setNewTaskDate] = useState<string | undefined>();

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const { data: tasks, isLoading } = useTasks({
    from: toDateInputValue(weekStart),
    to: toDateInputValue(weekEnd),
  });
  const updateTask = useUpdateTask();

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Tables<"tasks">[]>();
    for (const task of tasks ?? []) {
      const key = task.scheduled_date ?? "";
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    }
    return map;
  }, [tasks]);

  const openNewTask = (date: Date) => {
    setEditingTask(undefined);
    setNewTaskDate(toDateInputValue(date));
    setDialogOpen(true);
  };

  const openEditTask = (task: Tables<"tasks">) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Planner</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayStr = toDateInputValue(day);
          const dayTasks = tasksByDay.get(dayStr) ?? [];
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={dayStr} className={cn(isToday && "border-primary shadow-md")}>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className={cn(isToday && "text-primary")}>{format(day, "EEE d")}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openNewTask(day)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2 min-h-[120px]">
                {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
                {dayTasks.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground">No tasks</p>
                )}
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-lg border p-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openEditTask(task)}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTask.mutate({ id: task.id, data: { status: task.status === "done" ? "todo" : "done" } });
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className={cn("flex-1", task.status === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge className={cn("text-[10px] px-1.5 py-0", PRIORITY_COLOR[task.priority])} variant="outline">
                        {task.priority}
                      </Badge>
                      {task.scheduled_time && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <CalendarClock className="h-3 w-3" /> {task.scheduled_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultDate={newTaskDate} task={editingTask} />
    </div>
  );
}
