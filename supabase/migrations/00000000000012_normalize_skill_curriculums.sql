-- Normalize skill curriculum storage for imported curricula

alter table skill_curriculums
  drop column if exists curriculum;

create table skill_curriculum_categories (
  id uuid primary key default uuid_generate_v4(),
  curriculum_id uuid not null references skill_curriculums(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table skill_curriculum_topics (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references skill_curriculum_categories(id) on delete cascade,
  name text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table skill_curriculum_topic_resources (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references skill_curriculum_topics(id) on delete cascade,
  type text not null,
  title text not null,
  url text not null,
  notes text,
  estimated_hours numeric(8,2),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_skill_curriculum_categories_curriculum on skill_curriculum_categories(curriculum_id);
create index idx_skill_curriculum_topics_category on skill_curriculum_topics(category_id);
create index idx_skill_curriculum_topic_resources_topic on skill_curriculum_topic_resources(topic_id);
