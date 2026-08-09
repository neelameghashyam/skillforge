type CurriculumCategory = Record<string, any>;
type CurriculumTopic = Record<string, any>;
type CurriculumResource = Record<string, any>;

type CurriculumTreePayload = {
  curriculumId: string;
  categories?: CurriculumCategory[];
  topics?: CurriculumTopic[];
  resources?: CurriculumResource[];
};

export function buildCurriculumPayload(opts: CurriculumTreePayload) {
  const { categories = [], topics = [], resources = [] } = opts;

  const resourcesByTopic = (resources ?? []).reduce<Record<string, CurriculumResource[]>>((acc, resource) => {
    const topicId = resource.topic_id;
    if (!acc[topicId]) acc[topicId] = [];
    acc[topicId].push(resource);
    return acc;
  }, {});

  const topicsByCategory = (topics ?? []).reduce<Record<string, CurriculumTopic[]>>((acc, topic) => {
    const categoryId = topic.category_id;
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push({
      ...topic,
      resources: resourcesByTopic[topic.id] ?? [],
    });
    return acc;
  }, {});

  return (categories ?? []).reduce<Record<string, any[]>>((acc, category) => {
    const curriculumId = category.curriculum_id;
    if (!acc[curriculumId]) acc[curriculumId] = [];
    acc[curriculumId].push({
      ...category,
      topics: topicsByCategory[category.id] ?? [],
    });
    return acc;
  }, {});
}
