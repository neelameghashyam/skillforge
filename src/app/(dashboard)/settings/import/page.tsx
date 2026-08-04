"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useSkills } from "@/hooks/queries/use-skills";
import { api } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { SkillCurriculum } from "@/lib/validations/schemas";

function parseWorkbook(file: File) {
  return new Promise<XLSX.WorkBook>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return reject(new Error("Failed to read file"));
      const workbook = XLSX.read(data, { type: "binary" });
      resolve(workbook);
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsBinaryString(file);
  });
}

function buildJsonFromSheet(sheet: XLSX.WorkSheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const rows = rawRows as unknown as string[][];
  const headers = (rows[0] || []).map((value) => String(value).trim());
  const dataRows = rows.slice(1);
  const skills: Record<string, any> = {};

  for (const row of dataRows) {
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = String(row[index] ?? "").trim();
    });
    if (!rowData.Skill) continue;

    const skillName = rowData.Skill;
    const categoryName = rowData.Category || "General";
    const topicName = rowData.Topic || "Untitled";

    skills[skillName] ??= { skill: skillName, description: rowData.SkillDescription || "", categories: [] };
    const skill = skills[skillName];
    let category = skill.categories.find((c: any) => c.name === categoryName);
    if (!category) {
      category = { name: categoryName, topics: [] };
      skill.categories.push(category);
    }

    const topic: any = {
      name: topicName,
      difficulty: (rowData.Difficulty || "beginner").toLowerCase(),
      description: rowData.TopicDescription || "",
    };

    const resources = [];
    if (rowData.YouTube) resources.push({ type: "video", title: "YouTube", url: rowData.YouTube, notes: rowData.ResourceNotes || undefined, estimated_hours: Number(rowData.EstimatedHours) || undefined });
    if (rowData.Article) resources.push({ type: "article", title: "Article", url: rowData.Article, notes: rowData.ResourceNotes || undefined, estimated_hours: Number(rowData.EstimatedHours) || undefined });
    if (rowData.Practice) resources.push({ type: "practice", title: "Practice", url: rowData.Practice, notes: rowData.ResourceNotes || undefined, estimated_hours: Number(rowData.EstimatedHours) || undefined });
    if (resources.length) topic.resources = resources;

    category.topics.push(topic);
  }

  return Object.values(skills) as SkillCurriculum[];
}

export default function SettingsImportPage() {
  const { data: skills } = useSkills();
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<SkillCurriculum[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedCurriculum = preview.find((skill) => skill.skill === selectedSkill);
  const matchedSkill = skills?.find((skill) => skill.name.toLowerCase() === selectedSkill.toLowerCase());

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const workbook = await parseWorkbook(file);
      const firstSheetName = workbook.SheetNames[0];
      const payload = buildJsonFromSheet(workbook.Sheets[firstSheetName]);
      setPreview(payload);
      setSelectedSkill(payload[0]?.skill ?? "");
    } catch (error) {
      console.error(error);
      toast.error("Unable to parse Excel file.");
    }
  }

  async function handleImport() {
    const file = document.querySelector<HTMLInputElement>("#settings-import-file")?.files?.[0];
    if (!file) {
      toast.error("No file selected.");
      return;
    }

    setLoading(true);
    try {
      const workbook = await parseWorkbook(file);
      const payload = buildJsonFromSheet(workbook.Sheets[workbook.SheetNames[0]]);
      if (payload.length === 0) {
        toast.error("No skills found in the selected file.");
        return;
      }
      await api.post("/api/skills/import", { skills: payload });
      toast.success("Skills imported successfully.");
      setPreview(payload);
      setSelectedSkill(payload[0]?.skill ?? "");
      setFileName(null);
      const input = document.querySelector<HTMLInputElement>("#settings-import-file");
      if (input) input.value = "";
    } catch (error: any) {
      toast.error(error?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Curriculum import</h1>
          <p className="text-muted-foreground">Upload a single Excel file with multiple skill rows, then select a skill to preview the default topics.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /> Back to settings</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Excel</CardTitle>
          <CardDescription>Use a sheet with headers: Skill, Category, Topic, Difficulty, TopicDescription, SkillDescription, YouTube, Article, Practice, ResourceNotes, EstimatedHours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input id="settings-import-file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
          {fileName && <p className="text-sm text-muted-foreground">Selected file: {fileName}</p>}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <div className="space-y-2">
                  <Label>Skill to preview</Label>
                  <Select value={selectedSkill} onValueChange={(value) => setSelectedSkill(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {preview.map((skill) => (
                        <SelectItem key={skill.skill} value={skill.skill}>{skill.skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Database match</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSkill
                      ? matchedSkill
                        ? `Matched existing skill: ${matchedSkill.name} (${matchedSkill.category})`
                        : "No matching skill found in your database."
                      : "Select a skill above to preview topics."}
                  </p>
                </div>
              </div>

              {selectedCurriculum ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm font-semibold">Preview topics for {selectedCurriculum.skill}</p>
                    <p className="text-sm text-muted-foreground">{selectedCurriculum.description ?? "No skill description provided."}</p>
                  </div>
                  <div className="space-y-4">
                    {selectedCurriculum.categories.map((category) => (
                      <div key={category.name} className="rounded-lg border border-border bg-muted p-4">
                        <p className="font-semibold">{category.name}</p>
                        <div className="mt-3 space-y-3">
                          {category.topics.map((topic) => (
                            <div key={topic.name} className="rounded-lg border border-border bg-background p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{topic.name}</p>
                                <span className="text-xs uppercase text-muted-foreground">{topic.difficulty}</span>
                              </div>
                              {topic.description && <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Upload a file and pick a skill to preview its imported topics.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleImport} disabled={loading || !fileName}>
            {loading ? "Importing…" : "Import Excel"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
