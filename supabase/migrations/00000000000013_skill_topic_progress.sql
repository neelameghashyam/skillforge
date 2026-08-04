-- Track user's progress on curriculum topics for their tracked skills

-- Link a skill to the curriculum it was added from
alter table skills add column if not exists curriculum_id uuid references skill_curriculums(id) on delete set null;

create table if not exists skill_topic_progress (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references skills(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  curriculum_topic_id uuid not null references skill_curriculum_topics(id) on delete cascade,
  is_complete boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(skill_id, curriculum_topic_id)
);

create index if not exists idx_skill_topic_progress_skill on skill_topic_progress(skill_id);
create index if not exists idx_skill_topic_progress_user on skill_topic_progress(user_id);

-- Row Level Security
alter table skill_topic_progress enable row level security;

drop policy if exists "skill_topic_progress_select_own" on skill_topic_progress;
create policy "skill_topic_progress_select_own" on skill_topic_progress for select using (auth.uid() = user_id);

drop policy if exists "skill_topic_progress_insert_own" on skill_topic_progress;
create policy "skill_topic_progress_insert_own" on skill_topic_progress for insert with check (auth.uid() = user_id);

drop policy if exists "skill_topic_progress_update_own" on skill_topic_progress;
create policy "skill_topic_progress_update_own" on skill_topic_progress for update using (auth.uid() = user_id);

drop policy if exists "skill_topic_progress_delete_own" on skill_topic_progress;
create policy "skill_topic_progress_delete_own" on skill_topic_progress for delete using (auth.uid() = user_id);