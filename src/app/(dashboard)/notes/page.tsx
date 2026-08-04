"use client";

import { useState } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/queries/use-notes";
import { useSkills } from "@/hooks/queries/use-skills";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pin, Trash2, StickyNote as NoteIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatDate } from "@/lib/utils";
import type { Tables } from "@/types/database";

export default function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Tables<"notes"> | undefined>();
  const [search, setSearch] = useState("");

  const filtered = notes?.filter(
    (n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered?.filter((n) => n.pinned) ?? [];
  const rest = filtered?.filter((n) => !n.pinned) ?? [];

  function openNew() {
    setEditingNote(undefined);
    setDialogOpen(true);
  }
  function openEdit(note: Tables<"notes">) {
    setEditingNote(note);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Markdown notes linked to your skills.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Button onClick={openNew}><Plus className="h-4 w-4" /> New note</Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {pinned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pinned</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinned.map((n) => <NoteCard key={n.id} note={n} onClick={() => openEdit(n)} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rest.map((n) => <NoteCard key={n.id} note={n} onClick={() => openEdit(n)} />)}
      </div>
      {filtered?.length === 0 && !isLoading && <p className="text-muted-foreground">No notes found.</p>}

      <NoteDialog key={editingNote?.id ?? "new"} open={dialogOpen} onOpenChange={setDialogOpen} note={editingNote} />
    </div>
  );
}

function NoteCard({ note, onClick }: { note: Tables<"notes">; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <NoteIcon className="h-4 w-4 text-primary shrink-0" />
            <p className="font-semibold text-sm line-clamp-1">{note.title}</p>
          </div>
          {note.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{note.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
          </div>
          <span className="text-[10px] text-muted-foreground">{formatDate(note.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteDialog({ open, onOpenChange, note }: { open: boolean; onOpenChange: (o: boolean) => void; note?: Tables<"notes"> }) {
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { data: skills } = useSkills();

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [skillId, setSkillId] = useState(note?.skill_id ?? "none");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [preview, setPreview] = useState(false);

  async function handleSave() {
    const payload = {
      title: title || "Untitled",
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      skill_id: skillId === "none" ? null : skillId,
      pinned,
    };
    if (note) {
      await updateNote.mutateAsync({ id: note.id, data: payload });
    } else {
      await createNote.mutateAsync(payload as any);
      setTitle(""); setContent(""); setTags(""); setSkillId("none"); setPinned(false);
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!note) return;
    await deleteNote.mutateAsync(note.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant={preview ? "outline" : "secondary"} onClick={() => setPreview(false)}>Write</Button>
            <Button type="button" size="sm" variant={preview ? "secondary" : "outline"} onClick={() => setPreview(true)}>Preview</Button>
            <Button
              type="button"
              size="sm"
              variant={pinned ? "secondary" : "outline"}
              className="ml-auto gap-1"
              onClick={() => setPinned((p) => !p)}
            >
              <Pin className="h-3.5 w-3.5" /> {pinned ? "Pinned" : "Pin note"}
            </Button>
          </div>
          {!preview ? (
            <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write in Markdown..." />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 min-h-[220px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*Nothing to preview yet*"}</ReactMarkdown>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger><SelectValue placeholder="Related skill" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No related skill</SelectItem>
                {skills?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {note && (
            <Button type="button" variant="destructive" className="sm:mr-auto" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button onClick={handleSave}>{note ? "Save changes" : "Create note"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
