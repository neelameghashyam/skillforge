-- Skill curriculum storage for OpenAI-generated learning content
create table skill_curriculums (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  curriculum jsonb not null,
  generated_by text not null default 'openai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_skill_curriculums_slug on skill_curriculums(slug);
