-- ============================================================================
-- Profiles (extends auth.users) + Gamification core
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  daily_digest_time time not null default '08:00:00',
  notification_prefs jsonb not null default '{"push": true, "email": true, "in_app": true}'::jsonb,
  xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Extended user profile, 1:1 with auth.users';

create table badges (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null default 'award',
  rarity badge_rarity not null default 'common',
  xp_reward integer not null default 0,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index idx_xp_events_user on xp_events(user_id, created_at desc);
create index idx_user_badges_user on user_badges(user_id);

-- Level curve: level N requires N*N*50 total XP
create or replace function xp_to_level(total_xp integer)
returns integer language sql immutable as $$
  select greatest(1, floor(sqrt(greatest(total_xp,0) / 50.0))::integer + 1);
$$;

create function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute procedure touch_updated_at();
