-- ============================================================================
-- Seed data — badge catalog (universal) + demo data for local dev
-- Demo user: demo@skillforge.app / password: SkillForge123!
-- Run automatically by `supabase db reset` in local dev.
-- ============================================================================

-- Badge catalog (safe to run in any environment)
insert into badges (code, name, description, icon, rarity, xp_reward, criteria) values
  ('first_steps', 'First Steps', 'Complete your first task', 'footprints', 'common', 10, '{"type":"task_count","threshold":1}'),
  ('task_master_25', 'Task Master', 'Complete 25 tasks', 'check-circle', 'rare', 50, '{"type":"task_count","threshold":25}'),
  ('task_master_100', 'Centurion', 'Complete 100 tasks', 'trophy', 'epic', 150, '{"type":"task_count","threshold":100}'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day activity streak', 'flame', 'rare', 40, '{"type":"streak","threshold":7}'),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day activity streak', 'flame', 'epic', 200, '{"type":"streak","threshold":30}'),
  ('streak_100', 'Legendary Streak', 'Maintain a 100-day activity streak', 'flame', 'legendary', 500, '{"type":"streak","threshold":100}'),
  ('skill_hours_50', 'Dedicated Learner', 'Log 50 hours of skill practice', 'clock', 'rare', 60, '{"type":"skill_hours","threshold":50}'),
  ('skill_hours_200', 'Deep Practitioner', 'Log 200 hours of skill practice', 'clock', 'epic', 250, '{"type":"skill_hours","threshold":200}'),
  ('level_10', 'Rising Star', 'Reach level 10', 'star', 'rare', 0, '{"type":"level","threshold":10}'),
  ('level_25', 'SkillForge Master', 'Reach level 25', 'crown', 'legendary', 0, '{"type":"level","threshold":25}')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Demo data (local/dev only). Guarded so it never runs against production
-- unless a user with this fixed UUID actually exists (created via
-- `supabase/seed-demo-user.sql` or the Auth Admin API — see README).
-- ---------------------------------------------------------------------------
do $$
declare
  demo_id uuid := '00000000-0000-0000-0000-000000000001';
  s_ts uuid; s_react uuid; s_spanish uuid;
  p_portfolio uuid;
begin
  if not exists (select 1 from auth.users where id = demo_id) then
    raise notice 'Demo user not found, skipping demo data seed (see README for local setup)';
    return;
  end if;

  insert into skills (id, user_id, name, category, description, level, target_hours, color, icon)
  values
    (uuid_generate_v4(), demo_id, 'TypeScript', 'Programming', 'Deep dive into advanced types & tooling', 'intermediate', 100, '#3178c6', 'code')
    returning id into s_ts;
  insert into skills (id, user_id, name, category, description, level, target_hours, color, icon)
  values
    (uuid_generate_v4(), demo_id, 'React', 'Programming', 'Modern React patterns & performance', 'advanced', 150, '#61dafb', 'atom')
    returning id into s_react;
  insert into skills (id, user_id, name, category, description, level, target_hours, color, icon)
  values
    (uuid_generate_v4(), demo_id, 'Spanish', 'Language', 'Conversational fluency', 'novice', 200, '#f59e0b', 'languages')
    returning id into s_spanish;

  insert into skill_logs (skill_id, user_id, hours, note, logged_at) values
    (s_ts, demo_id, 2.5, 'Generics & utility types', current_date - 3),
    (s_ts, demo_id, 1.5, 'Reviewed discriminated unions', current_date - 1),
    (s_react, demo_id, 3, 'Server components deep dive', current_date - 2),
    (s_spanish, demo_id, 1, 'Duolingo + conversation practice', current_date);

  insert into projects (id, user_id, title, description, status, skill_id, start_date, deadline, progress)
  values (uuid_generate_v4(), demo_id, 'Portfolio Website Rebuild', 'Rebuild portfolio with Next.js + Tailwind', 'active', s_react, current_date - 10, current_date + 20, 40)
  returning id into p_portfolio;

  insert into project_milestones (project_id, title, is_complete, due_date, position) values
    (p_portfolio, 'Design mockups', true, current_date - 5, 1),
    (p_portfolio, 'Build homepage', true, current_date, 2),
    (p_portfolio, 'Build projects page', false, current_date + 7, 3),
    (p_portfolio, 'Deploy to production', false, current_date + 20, 4);

  insert into tasks (user_id, title, description, status, priority, scheduled_date, skill_id, project_id) values
    (demo_id, 'Review TS generics notes', 'Go over yesterday''s notes', 'todo', 'medium', current_date, s_ts, null),
    (demo_id, 'Build homepage hero section', null, 'in_progress', 'high', current_date, s_react, p_portfolio),
    (demo_id, 'Spanish flashcards', '20 minutes', 'done', 'low', current_date - 1, s_spanish, null),
    (demo_id, 'Plan next week', null, 'todo', 'medium', current_date + 1, null, null);

  insert into events (user_id, title, description, start_time, end_time, color) values
    (demo_id, 'Deep Work: React Project', 'Focus block', now()::date + interval '10 hours', now()::date + interval '12 hours', '#61dafb'),
    (demo_id, 'Spanish Tutor Session', 'Weekly conversation practice', now()::date + interval '1 day 15 hours', now()::date + interval '1 day 16 hours', '#f59e0b');

  insert into notes (user_id, title, content, tags, skill_id, pinned) values
    (demo_id, 'TypeScript Generics Cheatsheet', '# Generics\n\n- `T extends U ? X : Y` conditional types\n- Mapped types with `keyof`\n- Use `infer` to extract types', array['typescript','reference'], s_ts, true),
    (demo_id, 'React Server Components Notes', 'RSCs render on the server and stream HTML...', array['react'], s_react, false);

  insert into resources (user_id, title, url, type, skill_id, tags, is_favorite) values
    (demo_id, 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'documentation', s_ts, array['typescript','docs'], true),
    (demo_id, 'Epic React by Kent C. Dodds', 'https://epicreact.dev', 'course', s_react, array['react','course'], true),
    (demo_id, 'SpanishPod101', 'https://www.spanishpod101.com', 'course', s_spanish, array['spanish'], false);

end $$;
