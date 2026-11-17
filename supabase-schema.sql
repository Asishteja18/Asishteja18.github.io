-- AIM (was PyML): accounts, progress, doubts, points, certificates.
-- Run in Supabase → SQL editor. Safe to re-run top to bottom.
-- Streak reminder emails live in supabase-reminders.sql (needs pg_cron + pg_net).
-- Everyone who verifies their email code gets in; admins can block accounts
-- by setting approved = false.

-- ------------------------------------------------------------------ tables
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text not null default '',
  reason      text not null default '',
  approved    boolean not null default true,   -- false = blocked by an admin
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table profiles add column if not exists full_name text not null default '';
alter table profiles add column if not exists reason    text not null default '';
alter table profiles alter column approved set default true;

-- Lessons ship inside the page, so lesson_id is just the lesson's id string.
create table if not exists progress (
  user_id    uuid not null references auth.users on delete cascade,
  lesson_id  text not null,
  completed  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table profiles enable row level security;
alter table progress enable row level security;

-- ------------------------------------------------------------------ helpers
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;


-- ------------------------------------------------------------------ signup
-- A profile row appears for every new signup, active by default.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, reason)
  values (new.id, new.email,
          left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120),
          left(coalesce(new.raw_user_meta_data->>'reason', ''), 300))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- Approval emails were removed when sign-up stopped needing approval.
drop trigger if exists on_auth_user_confirmed on auth.users;
drop function if exists notify_admins_new_request();
drop trigger if exists on_profile_approved on profiles;
drop function if exists notify_user_approved();
drop function if exists send_email(text, text, text, text);
drop function if exists esc(text);

-- ------------------------------------------------------------------ policies
-- profiles: you see yourself; admins see and edit everyone
drop policy if exists p_self   on profiles;
drop policy if exists p_admin  on profiles;
drop policy if exists p_update on profiles;
create policy p_self   on profiles for select using (id = auth.uid() or is_admin());
create policy p_update on profiles for update using (is_admin()) with check (is_admin());

-- progress: your own rows; the admin can read everyone's for the stats table
drop policy if exists g_own on progress;
drop policy if exists g_admin_read on progress;
create policy g_own on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy g_admin_read on progress for select using (is_admin());


-- ================================================================== v2
-- Stats in the database (streak, how far the snake has crawled, last seen),
-- one fixed admin, code names, and the doubts section.

alter table profiles add column if not exists handle     text;
alter table profiles add column if not exists streak     int  not null default 0;
alter table profiles add column if not exists streak_day date;
alter table profiles add column if not exists reach      jsonb not null default '{}';
alter table profiles add column if not exists last_seen  timestamptz;
create unique index if not exists profiles_handle_key on profiles (lower(handle));
alter table profiles drop constraint if exists handle_format;
alter table profiles add constraint handle_format
  check (handle is null or handle ~ '^AIM-[A-Za-z0-9_]{3,16}$');

-- Exactly one admin, decided by the database from the auth email. Nobody,
-- including the admin, can grant admin to another account.
create or replace function lock_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.is_admin := exists (select 1 from auth.users u
                          where u.id = new.id and lower(u.email) = 'asishtejavinnakota@gmail.com');
  if new.is_admin then new.approved := true; end if;   -- the admin can never block themself
  return new;
end $$;
drop trigger if exists profiles_lock_admin on profiles;
create trigger profiles_lock_admin before insert or update on profiles
  for each row execute function lock_admin();
update profiles set is_admin = is_admin;   -- re-check every existing row

create or replace function is_active() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select approved from profiles where id = auth.uid()), false)
$$;

-- Streak: the browser sends its local date (clamped to ±1 day of the server).
create or replace function touch_streak(today date) returns int
language plpgsql security definer set search_path = public as $$
declare s int; d date;
begin
  if auth.uid() is null then return 0; end if;
  if today is null or today > current_date + 1 or today < current_date - 1 then today := current_date; end if;
  select streak, streak_day into s, d from profiles where id = auth.uid();
  if d is null or d < today - 1 then s := 1;
  elsif d = today - 1 then s := coalesce(s, 0) + 1;
  end if;  -- same day (or a timezone wobble ahead): unchanged
  update profiles set streak = s, streak_day = greatest(coalesce(d, today), today), last_seen = now()
   where id = auth.uid();
  return s;
end $$;

-- How far the snake has crawled per section; only ever grows.
create or replace function set_reach(k text, n int) returns void
language sql security definer set search_path = public as $$
  update profiles
     set reach = jsonb_set(reach, array[left(k, 120)],
                           to_jsonb(greatest(least(n, 500), coalesce((reach->>left(k, 120))::int, 0))))
   where id = auth.uid() and n >= 0
$$;

-- Code name: always "AIM-" + what the learner picks.
create or replace function set_handle(name text) returns text
language plpgsql security definer set search_path = public as $$
declare h text := 'AIM-' || coalesce(name, '');
begin
  if h !~ '^AIM-[A-Za-z0-9_]{3,16}$' then
    raise exception 'Use 3 to 16 letters, numbers or underscores.';
  end if;
  update profiles set handle = h where id = auth.uid();
  return h;
exception when unique_violation then
  raise exception 'That code name is taken. Try another.';
end $$;

-- ------------------------------------------------------------------ doubts
create table if not exists doubts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 5 and 140),
  body       text not null default '' check (char_length(body) <= 4000),
  lesson_id  text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists doubt_replies (
  id         bigint generated always as identity primary key,
  doubt_id   bigint not null references doubts(id) on delete cascade,
  user_id    uuid not null default auth.uid() references profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists doubt_replies_by_doubt on doubt_replies (doubt_id, created_at);
alter table doubts        enable row level security;
alter table doubt_replies enable row level security;

-- people may only write the columns that are theirs to write
revoke insert, update on doubts        from anon, authenticated;
revoke insert, update on doubt_replies from anon, authenticated;
grant insert (title, body, lesson_id) on doubts        to authenticated;
grant update (resolved)               on doubts        to authenticated;
grant insert (doubt_id, body)         on doubt_replies to authenticated;

create or replace function has_handle() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and handle is not null)
$$;

drop policy if exists d_read   on doubts;
drop policy if exists d_write  on doubts;
drop policy if exists d_update on doubts;
drop policy if exists d_delete on doubts;
create policy d_read   on doubts for select using (is_active());
create policy d_write  on doubts for insert with check (user_id = auth.uid() and is_active() and has_handle());
create policy d_update on doubts for update using (user_id = auth.uid() or is_admin())
                                           with check (user_id = auth.uid() or is_admin());
create policy d_delete on doubts for delete using (user_id = auth.uid() or is_admin());

drop policy if exists r_read   on doubt_replies;
drop policy if exists r_write  on doubt_replies;
drop policy if exists r_delete on doubt_replies;
create policy r_read   on doubt_replies for select using (is_active());
create policy r_write  on doubt_replies for insert with check (user_id = auth.uid() and is_active() and has_handle());
create policy r_delete on doubt_replies for delete using (user_id = auth.uid() or is_admin());

-- A doubt goes to the admin when nobody but its author has replied for 12 hours.
-- (Dropped first: later versions change the return columns, and Postgres won't
-- replace a function whose result type changed. Keeps this file re-runnable.)
drop function if exists doubts_feed();
drop function if exists doubt_thread(bigint);
create or replace function doubts_feed() returns table (
  id bigint, title text, body text, lesson_id text, resolved boolean, created_at timestamptz,
  user_id uuid, handle text, replies int, last_reply_at timestamptz,
  needs_admin boolean, admin_replied boolean)
language sql stable security definer set search_path = public as $$
  select d.id, d.title, d.body, d.lesson_id, d.resolved, d.created_at, d.user_id, p.handle,
         (select count(*)::int from doubt_replies r where r.doubt_id = d.id),
         (select max(r.created_at) from doubt_replies r where r.doubt_id = d.id),
         (not d.resolved and d.created_at < now() - interval '12 hours'
            and not exists (select 1 from doubt_replies r
                             where r.doubt_id = d.id and r.user_id <> d.user_id)),
         exists (select 1 from doubt_replies r join profiles a on a.id = r.user_id
                  where r.doubt_id = d.id and a.is_admin)
    from doubts d join profiles p on p.id = d.user_id
   where is_active()
   order by d.created_at desc
   limit 300
$$;

create or replace function doubt_thread(did bigint) returns table (
  id bigint, user_id uuid, handle text, is_admin boolean, body text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.user_id, p.handle, p.is_admin, r.body, r.created_at
    from doubt_replies r join profiles p on p.id = r.user_id
   where r.doubt_id = did and is_active()
   order by r.created_at
$$;

-- ================================================================== v3
-- Points for solving doubts (separate from the streak), levels, learning time,
-- and a day-by-day activity calendar.

alter table profiles add column if not exists points       int not null default 0;
alter table profiles add column if not exists solved_count int not null default 0;
alter table profiles add column if not exists best_streak  int not null default 0;
alter table doubts   add column if not exists solved_reply_id bigint references doubt_replies(id) on delete set null;

-- One row per learner per day: seconds spent learning. A row with 0 seconds
-- still marks the day as visited, which is what the streak counts.
create table if not exists activity (
  user_id uuid not null references profiles(id) on delete cascade,
  day     date not null,
  seconds int  not null default 0 check (seconds between 0 and 57600),
  primary key (user_id, day)
);
alter table activity enable row level security;
revoke insert, update, delete on activity from anon, authenticated;
drop policy if exists a_read on activity;
create policy a_read on activity for select using (user_id = auth.uid() or is_admin());

create or replace function clamp_day(d date) returns date
language sql immutable as $$
  select case when d is null or d > current_date + 1 or d < current_date - 1 then current_date else d end
$$;

-- The browser reports learning time in small chunks (at most 2 minutes per call,
-- 16 hours per day), so a tampered client can't claim much.
create or replace function log_time(today date, secs int) returns int
language plpgsql security definer set search_path = public as $$
declare total int;
begin
  if auth.uid() is null or secs is null or secs < 1 then return 0; end if;
  today := clamp_day(today);
  insert into activity (user_id, day, seconds) values (auth.uid(), today, least(secs, 120))
  on conflict (user_id, day) do update set seconds = least(activity.seconds + least(secs, 120), 57600)
  returning seconds into total;
  return total;
end $$;

create or replace function touch_streak(today date) returns int
language plpgsql security definer set search_path = public as $$
declare s int; d date;
begin
  if auth.uid() is null then return 0; end if;
  today := clamp_day(today);
  select streak, streak_day into s, d from profiles where id = auth.uid();
  if d is null or d < today - 1 then s := 1;
  elsif d = today - 1 then s := coalesce(s, 0) + 1;
  end if;
  update profiles set streak = s, best_streak = greatest(best_streak, s),
         streak_day = greatest(coalesce(d, today), today), last_seen = now()
   where id = auth.uid();
  insert into activity (user_id, day) values (auth.uid(), today) on conflict do nothing;
  return s;
end $$;

-- The asker (or the admin) marks one reply as the solution. Its author gets
-- 2 points (see recalc_points). Switching the solution moves them; nobody earns
-- points on their own doubt.
create or replace function accept_answer(did bigint, rid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare d doubts; r doubt_replies; prev uuid;
begin
  select * into d from doubts where id = did for update;
  if d.id is null then raise exception 'Doubt not found.'; end if;
  if d.user_id <> auth.uid() and not is_admin() then raise exception 'Only the person who asked can pick the solution.'; end if;
  select * into r from doubt_replies where id = rid and doubt_id = did;
  if r.id is null then raise exception 'That reply is not on this doubt.'; end if;
  if r.user_id = d.user_id or r.user_id = auth.uid() then
    raise exception 'You cannot mark your own reply as the solution.';
  end if;
  if d.solved_reply_id = rid then return; end if;
  if d.solved_reply_id is not null then
    select user_id into prev from doubt_replies where id = d.solved_reply_id;
    update profiles set solved_count = greatest(solved_count - 1, 0) where id = prev;
    perform recalc_points(prev);
  end if;
  update doubts set solved_reply_id = rid, resolved = true where id = did;
  update profiles set solved_count = solved_count + 1 where id = r.user_id;
  perform recalc_points(r.user_id);
end $$;

-- Deleting a solved doubt takes its points back, so solve-and-delete can't farm.
create or replace function revoke_points_on_delete() returns trigger
language plpgsql security definer set search_path = public as $$
declare prev uuid;
begin
  if old.solved_reply_id is not null then
    select user_id into prev from doubt_replies where id = old.solved_reply_id;
    update profiles set solved_count = greatest(solved_count - 1, 0) where id = prev;
    perform recalc_points(prev);
  end if;
  return old;
end $$;
drop trigger if exists doubts_revoke_points on doubts;
create trigger doubts_revoke_points before delete on doubts
  for each row execute function revoke_points_on_delete();

-- feed + thread now carry points (for badges) and which reply solved it
drop function if exists doubts_feed();
create or replace function doubts_feed() returns table (
  id bigint, title text, body text, lesson_id text, resolved boolean, created_at timestamptz,
  user_id uuid, handle text, points int, replies int, last_reply_at timestamptz,
  needs_admin boolean, admin_replied boolean, solved_reply_id bigint)
language sql stable security definer set search_path = public as $$
  select d.id, d.title, d.body, d.lesson_id, d.resolved, d.created_at, d.user_id, p.handle, p.points,
         (select count(*)::int from doubt_replies r where r.doubt_id = d.id),
         (select max(r.created_at) from doubt_replies r where r.doubt_id = d.id),
         (not d.resolved and d.created_at < now() - interval '12 hours'
            and not exists (select 1 from doubt_replies r
                             where r.doubt_id = d.id and r.user_id <> d.user_id)),
         exists (select 1 from doubt_replies r join profiles a on a.id = r.user_id
                  where r.doubt_id = d.id and a.is_admin),
         d.solved_reply_id
    from doubts d join profiles p on p.id = d.user_id
   where is_active()
   order by d.created_at desc
   limit 300
$$;

drop function if exists doubt_thread(bigint);
create or replace function doubt_thread(did bigint) returns table (
  id bigint, user_id uuid, handle text, points int, is_admin boolean, body text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.user_id, p.handle, p.points, p.is_admin, r.body, r.created_at
    from doubt_replies r join profiles p on p.id = r.user_id
   where r.doubt_id = did and is_active()
   order by r.created_at
$$;

create or replace function top_solvers() returns table (user_id uuid, handle text, points int, solved_count int)
language sql stable security definer set search_path = public as $$
  select id, handle, points, solved_count from profiles
   where is_active() and handle is not null and points > 0 and approved
   order by points desc, solved_count desc limit 10
$$;

-- Deleting the reply that solved a doubt takes its points back too.
create or replace function revoke_points_on_reply_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from doubts where solved_reply_id = old.id) then
    update profiles set solved_count = greatest(solved_count - 1, 0) where id = old.user_id;
    perform recalc_points(old.user_id);
    update doubts set resolved = false where solved_reply_id = old.id;
  end if;
  return old;
end $$;
drop trigger if exists replies_revoke_points on doubt_replies;
create trigger replies_revoke_points before delete on doubt_replies
  for each row execute function revoke_points_on_reply_delete();

-- ===================================================================== v4
-- Points (17 Nov 2026): +5 for every lesson or AI-90 day cleared, +2 for each
-- doubt you solve. Points are always recomputed from the facts (progress rows
-- + solved_count), never incremented blindly, so they can't drift or be farmed.
-- Only real lesson ids count: the 24 warm-ups and days d01..d90.
create or replace function recalc_points(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid is null then return; end if;
  update profiles p set points =
      5 * (select count(distinct g.lesson_id) from progress g
            where g.user_id = uid and g.completed
              and g.lesson_id ~ '^(d(0[1-9]|[1-8][0-9]|90)|x(0[1-9]|1[0-3])|mc(0[1-9]|1[0-9]|2[0-8])|py-0[1-8]|py-intro|py-what|ml-0[1-8]|ai-0[1-6])$')
    + 2 * p.solved_count
   where p.id = uid;
end $$;
revoke all on function recalc_points(uuid) from public, anon, authenticated;

create or replace function points_on_progress() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recalc_points(coalesce(new.user_id, old.user_id));
  return null;
end $$;
drop trigger if exists progress_points on progress;
create trigger progress_points after insert or update or delete on progress
  for each row execute function points_on_progress();

-- Top solvers ranks by doubts solved, now that points also come from lessons.
create or replace function top_solvers() returns table (user_id uuid, handle text, points int, solved_count int)
language sql stable security definer set search_path = public as $$
  select id, handle, points, solved_count from profiles
   where is_active() and handle is not null and solved_count > 0 and approved
   order by solved_count desc, points desc limit 10
$$;

-- backfill everyone onto the new scale
do $$ declare u uuid; begin
  for u in select id from profiles loop perform recalc_points(u); end loop;
end $$;

-- ===================================================================== v5
-- Spot checks, weekly challenge + board, certificates, Telugu videos, reminders.

-- Progress keeps the code that passed (admin spot checks, portfolio export) and
-- when the lesson was first cleared (stamped by the server, never the browser).
alter table progress add column if not exists code text;
alter table progress drop constraint if exists progress_code_size;
alter table progress add constraint progress_code_size check (code is null or char_length(code) <= 60000);
alter table progress add column if not exists completed_at timestamptz;
drop trigger if exists progress_stamp on progress;
update progress set completed_at = updated_at where completed and completed_at is null;
create or replace function progress_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then new.completed_at := old.completed_at; else new.completed_at := null; end if;
  if new.completed and new.completed_at is null then new.completed_at := now(); end if;
  return new;
end $$;
create trigger progress_stamp before insert or update on progress
  for each row execute function progress_stamp();

-- When a doubt got its solution (weekly board counts this week's solves).
alter table doubts add column if not exists solved_at timestamptz;
update doubts set solved_at = created_at where solved_reply_id is not null and solved_at is null;

-- Weekly challenge: one AI-90 day per week (Monday start), cycling through all
-- 90 (37 is coprime with 90). Clearing it during its week is worth +10 extra.
create or replace function challenge_lesson(d date) returns text
language sql immutable as $$
  select 'd' || lpad((((((d - date '2026-11-16') / 7) * 37) % 90 + 90) % 90 + 1)::text, 2, '0')
$$;

create or replace function recalc_points(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid is null then return; end if;
  update profiles p set points =
      5 * (select count(distinct g.lesson_id) from progress g
            where g.user_id = uid and g.completed
              and g.lesson_id ~ '^(d(0[1-9]|[1-8][0-9]|90)|x(0[1-9]|1[0-3])|mc(0[1-9]|1[0-9]|2[0-8])|py-0[1-8]|py-intro|py-what|ml-0[1-8]|ai-0[1-6])$')
    + 10 * (select count(*) from progress g
             where g.user_id = uid and g.completed and g.completed_at is not null
               and g.lesson_id = challenge_lesson(g.completed_at::date))
    + 2 * p.solved_count
   where p.id = uid;
end $$;
revoke all on function recalc_points(uuid) from public, anon, authenticated;

create or replace function accept_answer(did bigint, rid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare d doubts; r doubt_replies; prev uuid;
begin
  select * into d from doubts where id = did for update;
  if d.id is null then raise exception 'Doubt not found.'; end if;
  if d.user_id <> auth.uid() and not is_admin() then raise exception 'Only the person who asked can pick the solution.'; end if;
  select * into r from doubt_replies where id = rid and doubt_id = did;
  if r.id is null then raise exception 'That reply is not on this doubt.'; end if;
  if r.user_id = d.user_id or r.user_id = auth.uid() then
    raise exception 'You cannot mark your own reply as the solution.';
  end if;
  if d.solved_reply_id = rid then return; end if;
  if d.solved_reply_id is not null then
    select user_id into prev from doubt_replies where id = d.solved_reply_id;
    update profiles set solved_count = greatest(solved_count - 1, 0) where id = prev;
    perform recalc_points(prev);
  end if;
  update doubts set solved_reply_id = rid, resolved = true, solved_at = now() where id = did;
  update profiles set solved_count = solved_count + 1 where id = r.user_id;
  perform recalc_points(r.user_id);
end $$;

-- This week's board: 5 per lesson cleared + 10 for the challenge + 2 per solve,
-- counting only what happened since Monday. Top 10, plus you if you're lower.
create or replace function weekly_board() returns table (
  user_id uuid, handle text, week_points int, rank int, is_me boolean, challenge text)
language sql stable security definer set search_path = public as $$
  with wk as (select date_trunc('week', now()) as start),
  pts as (
    select p.id, p.handle,
      (5 * (select count(*) from progress g, wk where g.user_id = p.id and g.completed and g.completed_at >= wk.start
             and g.lesson_id ~ '^(d(0[1-9]|[1-8][0-9]|90)|x(0[1-9]|1[0-3])|mc(0[1-9]|1[0-9]|2[0-8])|py-0[1-8]|py-intro|py-what|ml-0[1-8]|ai-0[1-6])$')
     + 10 * (select count(*) from progress g, wk where g.user_id = p.id and g.completed and g.completed_at >= wk.start
             and g.lesson_id = challenge_lesson(g.completed_at::date))
     + 2 * (select count(*) from doubts d join doubt_replies r on r.id = d.solved_reply_id, wk
             where r.user_id = p.id and d.solved_at >= wk.start))::int as week_points
    from profiles p where p.approved and (p.handle is not null or p.id = auth.uid())),
  ranked as (select id, handle, week_points, rank() over (order by week_points desc)::int as rnk from pts where week_points > 0)
  select id, coalesce(handle, 'You'), week_points, rnk, id = auth.uid(), challenge_lesson(current_date)
    from ranked
   where is_active() and (rnk <= 10 or id = auth.uid())
   order by rnk, handle
$$;

-- Certificates: issued by the server only when every day of the block is cleared.
create table if not exists certificates (
  id        text primary key default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  user_id   uuid not null references profiles(id) on delete cascade,
  track     text not null check (track in ('python', 'ml', 'ai')),
  name      text not null check (char_length(name) between 2 and 60),
  issued_at timestamptz not null default now(),
  unique (user_id, track)
);
-- v6: the Advanced ML stage (x01–x13) can be certified too
alter table certificates drop constraint if exists certificates_track_check;
alter table certificates add constraint certificates_track_check check (track in ('python', 'ml', 'adv', 'ai', 'medcode'));
alter table certificates enable row level security;
revoke insert, update, delete on certificates from anon, authenticated;
drop policy if exists c_own on certificates;
create policy c_own on certificates for select using (user_id = auth.uid() or is_admin());

create or replace function claim_certificate(trk text, display_name text) returns text
language plpgsql security definer set search_path = public as $$
declare ids text[]; n int; cid text; nm text := btrim(regexp_replace(coalesce(display_name, ''), '[^[:alpha:][:digit:] .''-]', '', 'g'));
begin
  if auth.uid() is null or not is_active() then raise exception 'Sign in first.'; end if;
  ids := case trk
    when 'python' then array(select 'd' || lpad(i::text, 2, '0') from generate_series(1, 30) i)
    when 'ml'     then array(select 'd' || lpad(i::text, 2, '0') from generate_series(31, 60) i)
    when 'adv'    then array(select 'x' || lpad(i::text, 2, '0') from generate_series(1, 13) i)
    when 'ai'     then array(select 'd' || lpad(i::text, 2, '0') from generate_series(61, 90) i)
    when 'medcode' then array(select 'mc' || lpad(i::text, 2, '0') from generate_series(1, 28) i)
  end;
  if ids is null then raise exception 'Unknown stage.'; end if;
  select count(distinct lesson_id) into n from progress
   where user_id = auth.uid() and completed and lesson_id = any(ids);
  if n < cardinality(ids) then
    raise exception 'Clear every lesson of this stage first (% of % done).', n, cardinality(ids);
  end if;
  if char_length(nm) < 2 then raise exception 'Put the name you want on the certificate.'; end if;
  select id into cid from certificates where user_id = auth.uid() and track = trk;
  if cid is not null then return cid; end if;
  insert into certificates (user_id, track, name) values (auth.uid(), trk, left(nm, 60)) returning id into cid;
  return cid;
end $$;

-- Anyone with the code (an employer, LinkedIn) can check a certificate is real.
create or replace function verify_certificate(cid text) returns table (name text, track text, issued_at timestamptz, handle text)
language sql stable security definer set search_path = public as $$
  select c.name, c.track, c.issued_at, p.handle from certificates c join profiles p on p.id = c.user_id
   where c.id = upper(btrim(cid))
$$;
grant execute on function verify_certificate(text) to anon, authenticated;

-- Telugu explainer videos: the admin pastes a YouTube link on any lesson.
create table if not exists lesson_videos (
  lesson_id  text primary key check (char_length(lesson_id) <= 40),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  updated_at timestamptz not null default now()
);
alter table lesson_videos enable row level security;
grant select on lesson_videos to anon, authenticated;
grant insert, update, delete on lesson_videos to authenticated;
drop policy if exists v_read on lesson_videos;
drop policy if exists v_admin on lesson_videos;
create policy v_read  on lesson_videos for select using (true);
create policy v_admin on lesson_videos for all using (is_admin()) with check (is_admin());

-- Streak reminder emails are opt-out; learners flip this from their menu.
alter table profiles add column if not exists reminders boolean not null default true;
create or replace function set_reminders(enabled boolean) returns boolean
language sql security definer set search_path = public as $$
  update profiles set reminders = coalesce(enabled, true) where id = auth.uid() returning reminders
$$;

-- backfill points with the challenge bonus
do $$ declare u uuid; begin
  for u in select id from profiles loop perform recalc_points(u); end loop;
end $$;

-- ================================================================== v7
-- Two paths: Digital (AI-90) and Biological (medical coding, lessons mc01–mc28).
-- The learner's choice lives on their profile so it follows them across devices.
alter table profiles add column if not exists path text;
alter table profiles drop constraint if exists profiles_path_check;
alter table profiles add constraint profiles_path_check check (path is null or path in ('digital', 'bio'));

create or replace function set_path(p text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if p not in ('digital', 'bio') then raise exception 'Unknown path.'; end if;
  update profiles set path = p where id = auth.uid();
  return p;
end $$;
revoke all on function set_path(text) from public, anon;
grant execute on function set_path(text) to authenticated;
