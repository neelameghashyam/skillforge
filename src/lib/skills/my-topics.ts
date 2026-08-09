type SkillRecord = Record<string, any>;
type CategoryRecord = Record<string, any>;
type TopicRecord = Record<string, any>;
type ResourceRecord = Record<string, any>;
type ProgressRecord = Record<string, any>;

export function buildMyTopicsPayload(opts: {
  skills: SkillRecord[];
  categories: CategoryRecord[];
  topics: TopicRecord[];
  resources: ResourceRecord[];
  progress: ProgressRecord[];
}) {
  const { skills, categories, topics, resources, progress } = opts;

  if (!skills.length) return [];

  const resourcesByTopic = (resources ?? []).reduce<Record<string, ResourceRecord[]>>((acc, resource) => {
    const topicId = resource.topic_id;
    if (!acc[topicId]) acc[topicId] = [];
    acc[topicId].push(resource);
    return acc;
  }, {});

  const topicsByCategory = (topics ?? []).reduce<Record<string, TopicRecord[]>>((acc, topic) => {
    const categoryId = topic.category_id;
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push({ ...topic, resources: resourcesByTopic[topic.id] ?? [] });
    return acc;
  }, {});

  const categoriesByCurriculum = (categories ?? []).reduce<Record<string, CategoryRecord[]>>((acc, category) => {
    const curriculumId = category.curriculum_id;
    if (!acc[curriculumId]) acc[curriculumId] = [];
    acc[curriculumId].push({ ...category, topics: topicsByCategory[category.id] ?? [] });
    return acc;
  }, {});

  const progressMap = new Map<string, boolean>();
  (progress ?? []).forEach((entry) => {
    progressMap.set(`${entry.skill_id}:${entry.curriculum_topic_id}`, entry.is_complete);
  });

  return skills.map((skill) => {
    const curriculumCategories = categoriesByCurriculum[skill.curriculum_id as string] ?? [];
    const annotatedCategories = curriculumCategories.map((category: CategoryRecord) => ({
      ...category,
      topics: (category.topics ?? []).map((topic: TopicRecord) => ({
        ...topic,
        is_complete: progressMap.get(`${skill.id}:${topic.id}`) ?? false,
      })),
    }));

    return { ...skill, categories: annotatedCategories };
  });
}
