-- ============================================================================
-- Skill Progress Tracker
-- ============================================================================

create table skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  description text,
  level skill_level not null default 'beginner',
  progress integer not null default 0 check (progress between 0 and 100),
  target_hours numeric(8,2) not null default 0,
  logged_hours numeric(8,2) not null default 0,
  color text not null default '#6366f1',
  icon text not null default 'sparkles',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table skill_logs (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references skills(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  hours numeric(6,2) not null check (hours > 0),
  note text,
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_skills_user on skills(user_id) where not archived;
create index idx_skill_logs_skill on skill_logs(skill_id, logged_at desc);

create trigger skills_touch_updated_at before update on skills
  for each row execute procedure touch_updated_at();

-- Auto-update skill.logged_hours and progress when a log is added/removed
create or replace function recalc_skill_hours()
returns trigger language plpgsql as $$
declare
  v_skill_id uuid := coalesce(new.skill_id, old.skill_id);
  v_total numeric;
  v_target numeric;
begin
  select coalesce(sum(hours),0) into v_total from skill_logs where skill_id = v_skill_id;
  select target_hours into v_target from skills where id = v_skill_id;
  update skills
    set logged_hours = v_total,
        progress = case when v_target > 0 then least(100, floor(v_total / v_target * 100)::int) else progress end
    where id = v_skill_id;
  return null;
end;
$$;

create trigger trg_recalc_skill_hours
  after insert or update or delete on skill_logs
  for each row execute procedure recalc_skill_hours();
