"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { useCurricula, useMyTopicSkills, useAddSkillFromCurriculum, useDeleteSkill, useToggleTopicProgress } from "@/hooks/queries/use-skills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SEARCH_CHARS = 3;

export default function SkillsPage() {
  const [query, setQuery] = useState("");
  const searchedQuery = query.trim().length >= MIN_SEARCH_CHARS ? query.trim() : "";
  const deferredQuery = useDeferredValue(searchedQuery);
  const { data: curriculaData, isFetching } = useCurricula(deferredQuery);
  const { data: myTopicSkills } = useMyTopicSkills();
  const curricula = useMemo(() => (Array.isArray(curriculaData) ? curriculaData : []), [curriculaData]);
  const mySkills = useMemo(() => (Array.isArray(myTopicSkills) ? myTopicSkills : []), [myTopicSkills]);
  const addedCurriculumIds = useMemo(() => new Set(mySkills.map((s: any) => s.curriculum_id)), [mySkills]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Skills</h1>
        <p className="text-muted-foreground">Search imported skills and add them to your list. Track progress by completing topics.</p>
      </div>

      {mySkills.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Skills</h2>
          {mySkills.map((skill: any) => <MySkillAccordion key={skill.id} skill={skill} />)}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search imported skills</CardTitle>
          <CardDescription>{"Upload from Settings > Import, then search here. Add a skill to your list to track its topics."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="curriculum-search">Search by skill name</Label>
              <Input
                id="curriculum-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter skill name"
              />
            </div>
            <Button className="h-12 self-end" onClick={() => setQuery(query.trim())} disabled={query.trim().length < MIN_SEARCH_CHARS}>
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>

          {query.trim().length > 0 && query.trim().length < MIN_SEARCH_CHARS ? (
            <p className="text-sm text-muted-foreground">Type at least {MIN_SEARCH_CHARS} characters to search.</p>
          ) : isFetching && deferredQuery ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : searchedQuery && curricula.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imported skills found for that search term.</p>
          ) : null}
        </CardContent>
      </Card>

      {curricula.length > 0 && (
        <div className="space-y-4">
          {curricula.map((curriculum: any) => (
            <Card key={curriculum.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{curriculum.name}</CardTitle>
                    <CardDescription>{curriculum.description ?? "No description provided."}</CardDescription>
                  </div>
                  <AddFromCurriculumButton
                    curriculumId={curriculum.id}
                    name={curriculum.name}
                    description={curriculum.description}
                    alreadyAdded={addedCurriculumIds.has(curriculum.id)}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const MySkillAccordion = memo(function MySkillAccordion({ skill }: { skill: any }) {
  const [open, setOpen] = useState(false);
  const deleteSkill = useDeleteSkill();

  const allTopics = (skill.categories ?? []).flatMap((cat: any) => cat.topics ?? []);
  const completedCount = allTopics.filter((t: any) => t.is_complete).length;
  const totalCount = allTopics.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-3 text-left">
            {open ? <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />}
            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{skill.name}</p>
              </div>
              {skill.description && <p className="text-xs text-muted-foreground truncate">{skill.description}</p>}
            </div>
          </button>
          <Button variant="ghost" size="icon" onClick={() => deleteSkill.mutate(skill.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 pl-8">
          <Progress value={skill.progress} className="h-2" indicatorClassName="bg-[--skill-color]" style={{ ["--skill-color" as string]: skill.color }} />
          <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
            {completedCount}/{totalCount} topics · {skill.progress}%
          </span>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-4">
          {(skill.categories ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics available for this skill.</p>
          ) : (
            (skill.categories ?? []).map((category: any) => (
              <div key={category.id} className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {category.name}
                  </p>
                  <span className="text-xs uppercase text-muted-foreground">Category</span>
                </div>
                <div className="space-y-2">
                  {(category.topics ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No topics in this category.</p>
                  ) : (
                    category.topics.map((topic: any) => <TopicRow key={topic.id} skillId={skill.id} topic={topic} />)
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
});

const TopicRow = memo(function TopicRow({ skillId, topic }: { skillId: string; topic: any }) {
  const toggle = useToggleTopicProgress();
  const [expanded, setExpanded] = useState(false);
  const hasResources = Array.isArray(topic.resources) && topic.resources.length > 0;

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={topic.is_complete}
          onCheckedChange={(checked) => toggle.mutate({ skill_id: skillId, curriculum_topic_id: topic.id, is_complete: checked === true })}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => hasResources && setExpanded((v) => !v)}
              className={cn("flex items-center gap-1.5 text-left", hasResources && "hover:underline")}
            >
              {hasResources && (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
              <span className={cn("font-medium", topic.is_complete && "line-through text-muted-foreground")}>{topic.name}</span>
            </button>
            <span className="text-xs uppercase text-muted-foreground shrink-0">{topic.difficulty}</span>
          </div>
          {topic.description && <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>}
          {hasResources && expanded && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Resources</p>
              {topic.resources.map((resource: any) => (
                <div key={resource.id} className="rounded-md border border-border bg-slate-50 p-3">
                  <p className="font-medium text-sm">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">{resource.type}</p>
                  <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Open link</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const AddFromCurriculumButton = memo(function AddFromCurriculumButton({ curriculumId, name, description, alreadyAdded }: { curriculumId: string; name: string; description: string | null; alreadyAdded: boolean }) {
  const addSkill = useAddSkillFromCurriculum();
  if (alreadyAdded) {
    return (
      <Badge variant="secondary" className="shrink-0 gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" /> Added
      </Badge>
    );
  }
  return (
    <Button
      size="sm"
      className="shrink-0"
      disabled={addSkill.isPending}
      onClick={() => addSkill.mutate({ curriculum_id: curriculumId, name, description: description ?? undefined })}
    >
      <Plus className="h-3.5 w-3.5" /> Add to my skills
    </Button>
  );
});