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

-- progress: your own rows only
drop policy if exists g_own on progress;
create policy g_own on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Make yourself admin after signing up (replace the address):
--   update profiles set is_admin = true where email = 'you@example.com';
