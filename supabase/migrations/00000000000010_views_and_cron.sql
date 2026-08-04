-- ============================================================================
-- Analytics views + pg_cron schedules (calls Edge Functions via pg_net)
-- ============================================================================

create extension if not exists pg_net;

create view v_daily_activity as
select
  user_id,
  day,
  count(*) filter (where kind = 'task') as tasks_done,
  count(*) filter (where kind = 'skill') as skill_sessions
from (
  select user_id, completed_at::date as day, 'task' as kind from tasks where completed_at is not null
  union all
  select user_id, logged_at as day, 'skill' as kind from skill_logs
) x
group by user_id, day;

create view v_weekly_summary as
select
  user_id,
  date_trunc('week', day)::date as week_start,
  sum(tasks_done) as tasks_done,
  sum(skill_sessions) as skill_sessions
from v_daily_activity
group by user_id, date_trunc('week', day);

create view v_skill_distribution as
select user_id, category, count(*) as skill_count, sum(logged_hours) as total_hours, avg(progress) as avg_progress
from skills
where not archived
group by user_id, category;

-- Note: pg_cron jobs below call Edge Functions via pg_net using the project's
-- service role key stored as a Postgres setting (set via `supabase secrets set`
-- and referenced in the function body, or configured post-deploy through the
-- Supabase dashboard SQL editor with the real project URL substituted in).
-- Placeholders are intentionally left for the deploying team to fill via
-- `supabase db remote commit` or the dashboard, since project ref/URL/keys are
-- environment-specific and unavailable at migration-authoring time.

do $$
begin
  perform cron.schedule(
    'daily-notifications-dispatch',
    '0 * * * *', -- hourly; the function itself filters by each user's local digest hour
    $job$
    select net.http_post(
      url := current_setting('app.settings.edge_function_url', true) || '/daily-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
    $job$
  );
exception when others then
  raise notice 'pg_cron job daily-notifications-dispatch not scheduled: %', sqlerrm;
end $$;

