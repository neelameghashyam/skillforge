"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, milestoneSchema } from "@/lib/validations/schemas";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/queries/use-projects";
import { useMilestones, useCreateMilestone, useToggleMilestone, useDeleteMilestone } from "@/hooks/queries/use-milestones";
import { useSkills } from "@/hooks/queries/use-skills";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FolderKanban, CalendarClock } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { z } from "zod";

const STATUS_COLORS: Record<string, string> = {
  planning: "secondary", active: "default", on_hold: "outline", completed: "success", cancelled: "destructive",
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Reminders</h1>
          <p className="text-muted-foreground">Track projects, milestones, and upcoming deadlines.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New project</Button></DialogTrigger>
          <CreateProjectDialog onDone={() => setCreateOpen(false)} />
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {projects?.length === 0 && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No projects yet.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects?.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const { data: milestones } = useMilestones(project.id);
  const toggleMilestone = useToggleMilestone(project.id);
  const createMilestone = useCreateMilestone(project.id);
  const deleteMilestone = useDeleteMilestone(project.id);
  const deleteProject = useDeleteProject();
  const [newMilestone, setNewMilestone] = useState("");

  const daysLeft = project.deadline ? differenceInCalendarDays(new Date(project.deadline), new Date()) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" style={{ color: project.color }} />
            <CardTitle className="text-base">{project.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProject.mutate(project.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {project.description && <CardDescription>{project.description}</CardDescription>}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Badge variant={STATUS_COLORS[project.status] as any} className="capitalize">{project.status.replace("_", " ")}</Badge>
          {project.deadline && (
            <Badge variant="outline" className={cn("gap-1", daysLeft !== null && daysLeft <= 3 && "border-destructive text-destructive")}>
              <CalendarClock className="h-3 w-3" />
              {daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d left` : "Overdue"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span><span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        <div className="space-y-2">
          {milestones?.map((m) => (
            <div key={m.id} className="flex items-center gap-2 group">
              <Checkbox checked={m.is_complete} onCheckedChange={(v) => toggleMilestone.mutate({ milestoneId: m.id, is_complete: !!v })} />
              <span className={cn("flex-1 text-sm", m.is_complete && "line-through text-muted-foreground")}>{m.title}</span>
              {m.due_date && <span className="text-xs text-muted-foreground">{m.due_date}</span>}
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteMilestone.mutate(m.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMilestone.trim()) return;
            createMilestone.mutate({ title: newMilestone });
            setNewMilestone("");
          }}
          className="flex gap-2"
        >
          <Input placeholder="Add milestone..." value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} className="h-8 text-sm" />
          <Button type="submit" size="sm" variant="outline">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateProjectDialog({ onDone }: { onDone: () => void }) {
  const createProject = useCreateProject();
  const { data: skills } = useSkills();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", status: "planning", color: "#f59e0b" },
  });

  async function onSubmit(values: z.infer<typeof projectSchema>) {
    await createProject.mutateAsync({ ...values, skill_id: values.skill_id || null } as any);
    reset();
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" type="date" {...register("start_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="date" {...register("deadline")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Related skill</Label>
          <Select value={watch("skill_id") ?? "none"} onValueChange={(v) => setValue("skill_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {skills?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter><Button type="submit">Create project</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
