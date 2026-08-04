import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { skillCurriculumSchema } from "@/lib/validations/schemas";

const importSchema = z.object({
  skills: z.array(skillCurriculumSchema),
});

function normalizeSlug(skill: string) {
  return skill
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const results: Array<{ skill: string; slug: string }> = [];

  for (const skill of parsed.data.skills) {
    const slug = normalizeSlug(skill.skill);
    if (!slug) {
      return NextResponse.json({ error: `Invalid skill name: ${skill.skill}` }, { status: 422 });
    }

    const { data: curriculum, error: curriculumError } = await supabase
      .from("skill_curriculums")
      .upsert(
        {
          name: skill.skill,
          slug,
          description: skill.description,
          generated_by: "imported",
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (curriculumError || !curriculum?.id) {
      return NextResponse.json({ error: curriculumError?.message ?? "Failed to import skill curriculum" }, { status: 400 });
    }

    const curriculumId = curriculum.id;

    const { error: deleteError } = await supabase
      .from("skill_curriculum_categories")
      .delete()
      .eq("curriculum_id", curriculumId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    if (skill.categories.length > 0) {
      const categoriesPayload = skill.categories.map((category, index) => ({
        curriculum_id: curriculumId,
        name: category.name,
        position: index,
      }));

      const { data: insertedCategories, error: categoriesError } = await supabase
        .from("skill_curriculum_categories")
        .insert(categoriesPayload)
        .select("id");

      if (categoriesError || !insertedCategories) {
        return NextResponse.json({ error: categoriesError?.message ?? "Failed to create curriculum categories" }, { status: 400 });
      }

      for (const [categoryIndex, insertedCategory] of insertedCategories.entries()) {
        const category = skill.categories[categoryIndex];
        if (!category || category.topics.length === 0) continue;

        const topicsPayload = category.topics.map((topic, topicIndex) => ({
          category_id: insertedCategory.id,
          name: topic.name,
          difficulty: topic.difficulty,
          description: topic.description ?? null,
          position: topicIndex,
        }));

        const { data: insertedTopics, error: topicsError } = await supabase
          .from("skill_curriculum_topics")
          .insert(topicsPayload)
          .select("id");

        if (topicsError || !insertedTopics) {
          return NextResponse.json({ error: topicsError?.message ?? "Failed to create curriculum topics" }, { status: 400 });
        }

        for (const [topicIndex, insertedTopic] of insertedTopics.entries()) {
          const topic = category.topics[topicIndex];
          if (!topic || !topic.resources?.length) continue;

          const resourcesPayload = topic.resources.map((resource, resourceIndex) => ({
            topic_id: insertedTopic.id,
            type: resource.type,
            title: resource.title,
            url: resource.url,
            notes: resource.notes ?? null,
            estimated_hours: resource.estimated_hours ?? null,
            position: resourceIndex,
          }));

          const { error: resourcesError } = await supabase
            .from("skill_curriculum_topic_resources")
            .insert(resourcesPayload);

          if (resourcesError) {
            return NextResponse.json({ error: resourcesError.message }, { status: 400 });
          }
        }
      }
    }

    results.push({ skill: skill.skill, slug });
  }

  return NextResponse.json({ data: results }, { status: 201 });
}