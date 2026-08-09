import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { buildCurriculumPayload } from "@/lib/skills/curricula";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const queryText = url.searchParams.get("q");

  if (slug) {
    const { data: curriculum, error: curriculumError } = await supabase
      .from("skill_curriculums")
      .select("id,name,slug,description,generated_by")
      .eq("slug", slug)
      .single();

    if (curriculumError) return NextResponse.json({ error: curriculumError.message }, { status: 400 });
    if (!curriculum) return NextResponse.json({ data: null });

    const { data: categories, error: categoriesError } = await supabase
      .from("skill_curriculum_categories")
      .select("id,curriculum_id,name,position")
      .eq("curriculum_id", curriculum.id)
      .order("position", { ascending: true });

    if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 400 });

    const categoryIds = categories?.map((category) => category.id) ?? [];
    const topicsResult = categoryIds.length > 0
      ? await supabase
          .from("skill_curriculum_topics")
          .select("id,category_id,name,difficulty,description,position")
          .in("category_id", categoryIds)
          .order("position", { ascending: true })
      : { data: [], error: null };

    if (topicsResult.error) return NextResponse.json({ error: topicsResult.error.message }, { status: 400 });
    const topics = topicsResult.data ?? [];

    const topicIds = topics.map((topic) => topic.id);
    const resourcesResult = topicIds.length > 0
      ? await supabase
          .from("skill_curriculum_topic_resources")
          .select("id,topic_id,type,title,url,notes,estimated_hours,position")
          .in("topic_id", topicIds)
          .order("position", { ascending: true })
      : { data: [], error: null };

    if (resourcesResult.error) return NextResponse.json({ error: resourcesResult.error.message }, { status: 400 });
    const resources = resourcesResult.data ?? [];

    const categoriesByCurriculum = buildCurriculumPayload({ curriculumId: curriculum.id, categories: categories ?? [], topics, resources });

    return NextResponse.json({ data: { ...curriculum, categories: categoriesByCurriculum[curriculum.id] ?? [] } });
  }

  const { data: curricula, error } = await supabase
    .from("skill_curriculums")
    .select("id,name,slug,description,generated_by")
    .order("name", { ascending: true })
    .ilike("name", queryText ? `%${queryText}%` : "%");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = curricula ?? [];
  if (result.length === 0) return NextResponse.json({ data: [] });

  const curriculumIds = result.map((curriculum: any) => curriculum.id);
  const { data: categories, error: categoriesError } = await supabase
    .from("skill_curriculum_categories")
    .select("id,curriculum_id,name,position")
    .in("curriculum_id", curriculumIds)
    .order("position", { ascending: true });

  if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 400 });

  const categoryIds = (categories ?? []).map((category: any) => category.id);
  const topicsResult = categoryIds.length > 0
    ? await supabase
        .from("skill_curriculum_topics")
        .select("id,category_id,name,difficulty,description,position")
        .in("category_id", categoryIds)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (topicsResult.error) return NextResponse.json({ error: topicsResult.error.message }, { status: 400 });
  const topics = topicsResult.data ?? [];

  const topicIds = topics.map((topic: any) => topic.id);
  const resourcesResult = topicIds.length > 0
    ? await supabase
        .from("skill_curriculum_topic_resources")
        .select("id,topic_id,type,title,url,notes,estimated_hours,position")
        .in("topic_id", topicIds)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (resourcesResult.error) return NextResponse.json({ error: resourcesResult.error.message }, { status: 400 });
  const resources = resourcesResult.data ?? [];

  const categoriesByCurriculum = buildCurriculumPayload({ curriculumId: "", categories: categories ?? [], topics, resources });

  const output = result.map((curriculum: any) => ({
    ...curriculum,
    categories: categoriesByCurriculum[curriculum.id] ?? [],
  }));

  return NextResponse.json({ data: output });
}