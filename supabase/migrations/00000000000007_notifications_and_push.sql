-- ============================================================================
-- Daily Notification Engine: push subscriptions + notification log
-- ============================================================================

create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  channel notification_channel not null default 'in_app',
  title text not null,
  body text not null,
  link text,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_push_subs_user on push_subscriptions(user_id);
create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where not is_read;
