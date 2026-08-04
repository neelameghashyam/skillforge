-- ============================================================================
-- Gamification engine: XP awarding + level-up + streak + badge checks
-- ============================================================================

create or replace function award_xp(p_user_id uuid, p_amount integer, p_reason text, p_source_type text default null, p_source_id uuid default null)
returns void language plpgsql security definer as $$
declare
  v_old_level integer;
  v_new_total integer;
  v_new_level integer;
begin
  insert into xp_events(user_id, amount, reason, source_type, source_id)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id);

  select level into v_old_level from profiles where id = p_user_id;

  update profiles set xp = xp + p_amount where id = p_user_id
  returning xp into v_new_total;

  v_new_level := xp_to_level(v_new_total);

  if v_new_level > v_old_level then
    update profiles set level = v_new_level where id = p_user_id;
    insert into notifications(user_id, type, channel, title, body, data)
    values (p_user_id, 'level_up', 'in_app', 'Level Up! 🎉',
      format('You reached level %s!', v_new_level), jsonb_build_object('level', v_new_level));
  end if;
end;
$$;

create or replace function touch_daily_streak(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_last date;
  v_cur integer;
  v_longest integer;
begin
  select last_active_date, current_streak, longest_streak
    into v_last, v_cur, v_longest from profiles where id = p_user_id;

  if v_last is null or v_last < current_date - 1 then
    v_cur := 1;
  elsif v_last = current_date - 1 then
    v_cur := v_cur + 1;
  end if; -- if v_last = current_date, no-op (already counted today)

  if v_last is distinct from current_date then
    update profiles
      set last_active_date = current_date,
          current_streak = v_cur,
          longest_streak = greatest(v_longest, v_cur)
      where id = p_user_id;
  end if;
end;
$$;

-- Award XP when a task is marked done
create or replace function on_task_done()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    perform award_xp(new.user_id, 10, 'Task completed: ' || new.title, 'task', new.id);
    perform touch_daily_streak(new.user_id);
  end if;
  return new;
end;
$$;

create trigger trg_task_xp after update on tasks
  for each row execute procedure on_task_done();

-- Award XP + notification when a project reaches 100%
create or replace function on_project_completed()
returns trigger language plpgsql security definer as $$
begin
  if new.progress = 100 and old.progress < 100 then
    perform award_xp(new.user_id, 50, 'Project completed: ' || new.title, 'project', new.id);
    update projects set status = 'completed' where id = new.id and status <> 'completed';
  end if;
  return new;
end;
$$;

create trigger trg_project_xp after update on projects
  for each row execute procedure on_project_completed();

-- Award XP for skill hours logged
create or replace function on_skill_log_added()
returns trigger language plpgsql security definer as $$
begin
  perform award_xp(new.user_id, least(20, greatest(1, floor(new.hours * 4)::int)), 'Skill practice logged', 'skill', new.skill_id);
  perform touch_daily_streak(new.user_id);
  return new;
end;
$$;

create trigger trg_skill_log_xp after insert on skill_logs
  for each row execute procedure on_skill_log_added();

-- Badge checking: run after any xp_event, check simple criteria
create or replace function check_and_award_badges(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  b record;
  v_count integer;
  v_meets boolean;
begin
  for b in select * from badges loop
    if exists (select 1 from user_badges where user_id = p_user_id and badge_id = b.id) then
      continue;
    end if;

    v_meets := false;

    if b.criteria->>'type' = 'task_count' then
      select count(*) into v_count from tasks where user_id = p_user_id and status = 'done';
      v_meets := v_count >= (b.criteria->>'threshold')::int;
    elsif b.criteria->>'type' = 'streak' then
      select current_streak into v_count from profiles where id = p_user_id;
      v_meets := v_count >= (b.criteria->>'threshold')::int;
    elsif b.criteria->>'type' = 'skill_hours' then
      select coalesce(sum(logged_hours),0)::int into v_count from skills where user_id = p_user_id;
      v_meets := v_count >= (b.criteria->>'threshold')::int;
    elsif b.criteria->>'type' = 'level' then
      select level into v_count from profiles where id = p_user_id;
      v_meets := v_count >= (b.criteria->>'threshold')::int;
    end if;

    if v_meets then
      insert into user_badges(user_id, badge_id) values (p_user_id, b.id)
      on conflict do nothing;
      if b.xp_reward > 0 then
        perform award_xp(p_user_id, b.xp_reward, 'Badge earned: ' || b.name, 'badge', b.id);
      end if;
      insert into notifications(user_id, type, channel, title, body, data)
      values (p_user_id, 'badge_earned', 'in_app', 'Badge earned: ' || b.name, b.description, jsonb_build_object('badge_code', b.code));
    end if;
  end loop;
end;
$$;

-- Trigger badge checks after xp_events insert (debounced by nature of trigger-per-row, acceptable for this scale)
create or replace function trg_check_badges_fn()
returns trigger language plpgsql security definer as $$
begin
  perform check_and_award_badges(new.user_id);
  return new;
end;
$$;

create trigger trg_check_badges after insert on xp_events
  for each row execute procedure trg_check_badges_fn();
