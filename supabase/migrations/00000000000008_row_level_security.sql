-- ============================================================================
-- Row Level Security — every table is owner-scoped by user_id
-- ============================================================================

alter table profiles enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table xp_events enable row level security;
alter table skills enable row level security;
alter table skill_logs enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table project_milestones enable row level security;
alter table notes enable row level security;
alter table resources enable row level security;
alter table push_subscriptions enable row level security;
alter table notifications enable row level security;

-- profiles: user can read/update only their own row
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- badges: public catalog, readable by all authenticated users
create policy "badges_select_all" on badges for select using (auth.role() = 'authenticated');

-- user_badges / xp_events: owner only
create policy "user_badges_select_own" on user_badges for select using (auth.uid() = user_id);
create policy "xp_events_select_own" on xp_events for select using (auth.uid() = user_id);

-- Generic owner-scoped CRUD policy generator for the remaining tables
do $$
declare
  t text;
  owner_tables text[] := array[
    'skills','skill_logs','tasks','events',
    'projects',
    'notes','resources','push_subscriptions','notifications'
  ];
begin
  foreach t in array owner_tables loop
    execute format('create policy "%1$s_select_own" on %1$s for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_insert_own" on %1$s for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_update_own" on %1$s for update using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_delete_own" on %1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- project_milestones: owned indirectly via parent projects
create policy "milestones_select_own" on project_milestones for select
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "milestones_insert_own" on project_milestones for insert
  with check (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "milestones_update_own" on project_milestones for update
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "milestones_delete_own" on project_milestones for delete
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
