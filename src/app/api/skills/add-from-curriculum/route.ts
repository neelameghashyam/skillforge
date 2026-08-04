import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { z } from "zod";

const bodySchema = z.object({
  curriculum_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(50).default("General"),
  level: z.enum(["beginner", "novice", "intermediate", "advanced", "expert", "master"]).default("beginner"),
  color: z.string().default("#6366f1"),
  icon: z.string().default("sparkles"),
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

  const { curriculum_id, name, description, category, level, color, icon } = parsed.data;

  const { data: existing } = await supabase
    .from("skills")
    .select("id")
    .eq("user_id", authUser.id)
    .eq("curriculum_id", curriculum_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already added this skill from this curriculum." }, { status: 409 });
  }

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .insert({
      user_id: authUser.id,
      name,
      description: description ?? null,
      category,
      level,
      color,
      icon,
      curriculum_id,
      target_hours: 0,
      logged_hours: 0,
      progress: 0,
    })
    .select()
    .single();

  if (skillError) return NextResponse.json({ error: skillError.message }, { status: 400 });
  if (!skill) return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });

  const { data: categories } = await supabase
    .from("skill_curriculum_categories")
    .select("id")
    .eq("curriculum_id", curriculum_id);

  const categoryIds = (categories ?? []).map((c) => c.id);
  let topicRows: { skill_id: string; user_id: string; curriculum_topic_id: string }[] = [];

  if (categoryIds.length > 0) {
    const { data: topics } = await supabase
      .from("skill_curriculum_topics")
      .select("id")
      .in("category_id", categoryIds);

    topicRows = (topics ?? []).map((t) => ({
      skill_id: skill.id,
      user_id: authUser.id,
      curriculum_topic_id: t.id,
    }));
  }

  if (topicRows.length > 0) {
    const { error: progressError } = await supabase
      .from("skill_topic_progress")
      .insert(topicRows);

    if (progressError) {
      console.error("Failed to seed topic progress:", progressError.message);
    }
  }

  return NextResponse.json({ data: skill }, { status: 201 });
}