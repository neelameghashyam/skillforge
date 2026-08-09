import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { buildMyTopicsPayload } from "@/lib/skills/my-topics";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id,name,description,category,level,progress,color,icon,curriculum_id")
    .eq("user_id", authUser.id)
    .not("curriculum_id", "is", null)
    .order("created_at", { ascending: false });

  if (skillsError) return NextResponse.json({ error: skillsError.message }, { status: 400 });
  if (!skills || skills.length === 0) return NextResponse.json({ data: [] });

  const curriculumIds = [...new Set(skills.map((skill) => skill.curriculum_id).filter(Boolean))] as string[];
  const skillIds = skills.map((skill) => skill.id);

  const [categoriesResult, progressResult] = await Promise.all([
    supabase
      .from("skill_curriculum_categories")
      .select("id,curriculum_id,name,position")
      .in("curriculum_id", curriculumIds)
      .order("position", { ascending: true }),
    supabase
      .from("skill_topic_progress")
      .select("id,skill_id,curriculum_topic_id,is_complete,completed_at")
      .in("skill_id", skillIds),
  ]);

  const { data: categories, error: categoriesError } = categoriesResult;
  const { data: progress, error: progressError } = progressResult;

  if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 400 });
  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 400 });

  const categoryIds = (categories ?? []).map((category) => category.id);

  let topics: any[] = [];
  if (categoryIds.length > 0) {
    const { data: topicData, error: topicsError } = await supabase
      .from("skill_curriculum_topics")
      .select("id,category_id,name,difficulty,description,position")
      .in("category_id", categoryIds)
      .order("position", { ascending: true });

    if (topicsError) return NextResponse.json({ error: topicsError.message }, { status: 400 });
    topics = topicData ?? [];
  }

  const topicIds = topics.map((topic) => topic.id);

  let resources: any[] = [];
  if (topicIds.length > 0) {
    const { data: resourceData, error: resourcesError } = await supabase
      .from("skill_curriculum_topic_resources")
      .select("id,topic_id,type,title,url,notes,estimated_hours,position")
      .in("topic_id", topicIds)
      .order("position", { ascending: true });

    if (resourcesError) return NextResponse.json({ error: resourcesError.message }, { status: 400 });
    resources = resourceData ?? [];
  }

  const output = buildMyTopicsPayload({ skills, categories: categories ?? [], topics, resources, progress: progress ?? [] });

  return NextResponse.json({ data: output });
}