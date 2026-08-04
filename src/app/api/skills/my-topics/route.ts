import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  // Get the user's skills that are linked to a curriculum
  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id,name,description,category,level,progress,color,icon,curriculum_id")
    .eq("user_id", authUser.id)
    .not("curriculum_id", "is", null)
    .order("created_at", { ascending: false });

  if (skillsError) return NextResponse.json({ error: skillsError.message }, { status: 400 });
  if (!skills || skills.length === 0) return NextResponse.json({ data: [] });

  const curriculumIds = skills.map((s) => s.curriculum_id) as string[];

  const { data: categories, error: categoriesError } = await supabase
    .from("skill_curriculum_categories")
    .select("id,curriculum_id,name,position")
    .in("curriculum_id", curriculumIds)
    .order("position", { ascending: true });

  if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 400 });

  const categoryIds = (categories ?? []).map((c) => c.id);

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

  const topicIds = topics.map((t) => t.id);

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

  const skillIds = skills.map((s) => s.id);
  const { data: progress, error: progressError } = await supabase
    .from("skill_topic_progress")
    .select("id,skill_id,curriculum_topic_id,is_complete,completed_at")
    .in("skill_id", skillIds);

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 400 });

  const resourcesByTopic = (resources ?? []).reduce<Record<string, any[]>>((acc, r) => {
    if (!acc[r.topic_id]) acc[r.topic_id] = [];
    acc[r.topic_id].push(r);
    return acc;
  }, {});

  const topicsByCategory = topics.reduce<Record<string, any[]>>((acc, t) => {
    if (!acc[t.category_id]) acc[t.category_id] = [];
    acc[t.category_id].push({ ...t, resources: resourcesByTopic[t.id] ?? [] });
    return acc;
  }, {});

  const categoriesByCurriculum = (categories ?? []).reduce<Record<string, any[]>>((acc, c) => {
    if (!acc[c.curriculum_id]) acc[c.curriculum_id] = [];
    acc[c.curriculum_id].push({ ...c, topics: topicsByCategory[c.id] ?? [] });
    return acc;
  }, {});

  const progressMap = new Map<string, boolean>();
  (progress ?? []).forEach((p) => {
    progressMap.set(`${p.skill_id}:${p.curriculum_topic_id}`, p.is_complete);
  });

  const output = skills.map((skill) => {
    const categories = categoriesByCurriculum[skill.curriculum_id as string] ?? [];
    const annotatedCategories = categories.map((cat: any) => ({
      ...cat,
      topics: (cat.topics ?? []).map((topic: any) => ({
        ...topic,
        is_complete: progressMap.get(`${skill.id}:${topic.id}`) ?? false,
      })),
    }));
    return { ...skill, categories: annotatedCategories };
  });

  return NextResponse.json({ data: output });
}