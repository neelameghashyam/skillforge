import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { z } from "zod";

const bodySchema = z.object({
  skill_id: z.string().uuid(),
  curriculum_topic_id: z.string().uuid(),
  is_complete: z.boolean(),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { skill_id, curriculum_topic_id, is_complete } = parsed.data;

  const { data: skill } = await supabase
    .from("skills")
    .select("id, curriculum_id")
    .eq("id", skill_id)
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const { error: upsertError } = await supabase
    .from("skill_topic_progress")
    .upsert(
      {
        skill_id,
        user_id: authUser.id,
        curriculum_topic_id,
        is_complete,
        completed_at: is_complete ? new Date().toISOString() : null,
      },
      { onConflict: "skill_id,curriculum_topic_id" }
    );

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  const { count: totalTopics } = await supabase
    .from("skill_topic_progress")
    .select("*", { count: "exact", head: true })
    .eq("skill_id", skill_id);

  const { count: completedTopics } = await supabase
    .from("skill_topic_progress")
    .select("*", { count: "exact", head: true })
    .eq("skill_id", skill_id)
    .eq("is_complete", true);

  const total = totalTopics ?? 0;
  const completed = completedTopics ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { error: updateError } = await supabase
    .from("skills")
    .update({ progress })
    .eq("id", skill_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ data: { skill_id, curriculum_topic_id, is_complete, progress, completed, total } });
}