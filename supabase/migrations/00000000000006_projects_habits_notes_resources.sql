-- ============================================================================
-- Project Reminders, Notes, Resource Manager
-- ============================================================================

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status project_status not null default 'planning',
  skill_id uuid references skills(id) on delete set null,
  start_date date,
  deadline date,
  progress integer not null default 0 check (progress between 0 and 100),
  reminder_days_before integer[] not null default '{7,3,1}',
  color text not null default '#f59e0b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks
  add constraint tasks_project_fk foreign key (project_id) references projects(id) on delete set null;

create table project_milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  is_complete boolean not null default false,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  tags text[] not null default '{}',
  skill_id uuid references skills(id) on delete set null,
  pinned boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  url text,
  type resource_type not null default 'article',
  skill_id uuid references skills(id) on delete set null,
  tags text[] not null default '{}',
  notes text,
  is_favorite boolean not null default false,
  completed boolean not null default false,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_user on projects(user_id);
create index idx_milestones_project on project_milestones(project_id, position);
create index idx_notes_user on notes(user_id) where not archived;
create index idx_notes_tags on notes using gin(tags);
create index idx_resources_user on resources(user_id);
create index idx_resources_tags on resources using gin(tags);

create trigger projects_touch_updated_at before update on projects
  for each row execute procedure touch_updated_at();
create trigger notes_touch_updated_at before update on notes
  for each row execute procedure touch_updated_at();
create trigger resources_touch_updated_at before update on resources
  for each row execute procedure touch_updated_at();

-- Project progress auto-derived from milestones if any exist
create or replace function recalc_project_progress()
returns trigger language plpgsql as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
  v_total integer;
  v_done integer;
begin
  select count(*), count(*) filter (where is_complete) into v_total, v_done
  from project_milestones where project_id = v_project_id;
  if v_total > 0 then
    update projects set progress = floor(v_done::numeric / v_total * 100)::int where id = v_project_id;
  end if;
  return null;
end;
$$;

create trigger trg_recalc_project_progress
  after insert or update or delete on project_milestones
  for each row execute procedure recalc_project_progress();
