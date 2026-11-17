-- PyML: accounts, progress, and the admin block switch.
-- Run once in Supabase → SQL editor. Safe to re-run.
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
