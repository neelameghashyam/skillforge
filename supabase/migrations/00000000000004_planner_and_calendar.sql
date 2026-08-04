-- ============================================================================
-- Weekly Planner (tasks) + Calendar (events)
-- ============================================================================

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  scheduled_date date,
  scheduled_time time,
  duration_minutes integer,
  skill_id uuid references skills(id) on delete set null,
  project_id uuid,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  color text not null default '#6366f1',
  recurrence_rule text,
  source_type text not null default 'manual',
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_check check (end_time > start_time)
);

create index idx_tasks_user_date on tasks(user_id, scheduled_date);
create index idx_tasks_status on tasks(user_id, status);
create index idx_events_user_range on events(user_id, start_time, end_time);

create trigger tasks_touch_updated_at before update on tasks
  for each row execute procedure touch_updated_at();
create trigger events_touch_updated_at before update on events
  for each row execute procedure touch_updated_at();

create or replace function mark_task_completed()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_task_completed
  before update on tasks
  for each row execute procedure mark_task_completed();
