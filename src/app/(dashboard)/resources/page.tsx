"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceSchema } from "@/lib/validations/schemas";
import { useResources, useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/queries/use-resources";
import { useSkills } from "@/hooks/queries/use-skills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Star, ExternalLink, CheckCircle2, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { z } from "zod";

const TYPES = ["article", "video", "course", "book", "documentation", "tool", "other"];

export default function ResourcesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: resources, isLoading } = useResources(typeFilter !== "all" ? `type=${typeFilter}` : undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Resource Manager</h1>
          <p className="text-muted-foreground">Curate articles, courses, books, and tools for your learning.</p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add resource</Button></DialogTrigger>
            <CreateResourceDialog onDone={() => setCreateOpen(false)} />
          </Dialog>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {resources?.length === 0 && <Card><CardContent className="p-10 text-center text-muted-foreground">No resources yet.</CardContent></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resources?.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-primary shrink-0" />
                  <p className="font-medium text-sm line-clamp-1">{r.title}</p>
                </div>
                <button onClick={() => updateResource.mutate({ id: r.id, data: { is_favorite: !r.is_favorite } })}>
                  <Star className={cn("h-4 w-4", r.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                </button>
              </div>
              {r.notes && <p className="text-xs text-muted-foreground line-clamp-2">{r.notes}</p>}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="capitalize">{r.type}</Badge>
                {r.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                  )}
                  <button
                    onClick={() => updateResource.mutate({ id: r.id, data: { completed: !r.completed } })}
                    className={cn("text-xs flex items-center gap-1", r.completed ? "text-success" : "text-muted-foreground")}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {r.completed ? "Completed" : "Mark done"}
                  </button>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteResource.mutate(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateResourceDialog({ onDone }: { onDone: () => void }) {
  const createResource = useCreateResource();
  const { data: skills } = useSkills();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: "", type: "article", tags: [] },
  });

  async function onSubmit(values: z.infer<typeof resourceSchema>) {
    await createResource.mutateAsync({ ...values, skill_id: values.skill_id || null, url: values.url || null } as any);
    reset();
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add resource</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input id="url" placeholder="https://..." {...register("url")} />
          {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
        <DialogFooter><Button type="submit">Add resource</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
