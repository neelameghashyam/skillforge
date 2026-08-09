"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTasks } from "@/hooks/queries/use-tasks";
import { useProjects } from "@/hooks/queries/use-projects";
import { useGamification } from "@/hooks/queries/use-gamification";
import { useSkills } from "@/hooks/queries/use-skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Flame, FolderKanban, Target, ArrowRight, Trophy } from "lucide-react";
import { toDateInputValue, cn } from "@/lib/utils";
import { useUpdateTask } from "@/hooks/queries/use-tasks";

export default function DashboardPage() {
  const today = toDateInputValue(new Date());
  const { data: tasks, isLoading: tasksLoading } = useTasks({ from: today, to: today });
  const { data: projects } = useProjects();
  const { data: gamification } = useGamification();
  const { data: skills } = useSkills();
  const updateTask = useUpdateTask();

  const topSkills = useMemo(() => (skills ?? []).slice(0, 4), [skills]);

  const activeProjects = projects?.filter((p) => p.status === "active") ?? [];
  const upcomingDeadlines = activeProjects
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}{gamification?.profile.full_name ? `, ${gamification.profile.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">{"Here's what's happening today."}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Level" value={gamification?.levelInfo.level ?? "—"} sub={`${gamification?.profile.xp ?? 0} XP`} />
        <StatCard icon={Flame} label="Streak" value={gamification?.profile.current_streak ?? "—"} sub="days active" accent="text-orange-500" />
        <StatCard icon={Target} label="Skills" value={skills?.length ?? "—"} sub="tracked" accent="text-indigo-500" />
        <StatCard icon={FolderKanban} label="Active projects" value={activeProjects.length} sub="in progress" accent="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{"Today's Tasks"}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/planner">Open planner <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasksLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {tasks?.length === 0 && <p className="text-sm text-muted-foreground">No tasks scheduled for today. Enjoy the calm 🌤️</p>}
            {tasks?.map((task) => (
              <button
                key={task.id}
                onClick={() => updateTask.mutate({ id: task.id, data: { status: task.status === "done" ? "todo" : "done" } })}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors"
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={cn("flex-1 text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <Badge variant="outline" className="capitalize">{task.priority}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/projects">All projects</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines. 🎉</p>}
            {upcomingDeadlines.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">Due {p.deadline}</p>
                </div>
                <Badge>{p.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skill Progress</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/skills">Manage</Link></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {topSkills.map((skill) => (
            <div key={skill.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{skill.name}</span>
                <span className="text-muted-foreground">{skill.progress}%</span>
              </div>
              <Progress value={skill.progress} indicatorClassName="bg-[--skill-color]" style={{ ["--skill-color" as string]: skill.color }} />
            </div>
          ))}
          {(!skills || skills.length === 0) && <p className="text-sm text-muted-foreground">Add your first skill to start tracking progress.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("rounded-lg bg-primary/10 p-2.5", accent)}>
          <Icon className={cn("h-5 w-5 text-primary", accent)} />
        </div>
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label} · {sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}