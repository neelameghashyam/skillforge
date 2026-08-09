import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getProfileUserId } from "@/lib/supabase/get-auth-user";
import { nowIsoString } from "@/lib/utils";
import { z } from "zod";

const bodySchema = z.object({
  skill_id: z.string().uuid(),
  curriculum_topic_id: z.string().uuid(),
  is_complete: z.boolean(),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profileUserId = await getProfileUserId(req);
  if (!profileUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    .eq("user_id", profileUserId)
    .maybeSingle();

  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const { error: upsertError } = await supabase
    .from("skill_topic_progress")
    .upsert(
      {
        skill_id,
        user_id: profileUserId,
        curriculum_topic_id,
        is_complete,
        completed_at: is_complete ? nowIsoString() : null,
      },
      { onConflict: "skill_id,curriculum_topic_id" }
    );

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  const { data: progressRows, error: progressRowsError } = await supabase
    .from("skill_topic_progress")
    .select("is_complete")
    .eq("skill_id", skill_id);

  if (progressRowsError) return NextResponse.json({ error: progressRowsError.message }, { status: 400 });

  const total = progressRows?.length ?? 0;
  const completed = progressRows?.filter((entry) => entry.is_complete).length ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { error: updateError } = await supabase
    .from("skills")
    .update({ progress })
    .eq("id", skill_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ data: { skill_id, curriculum_topic_id, is_complete, progress, completed, total } });
}