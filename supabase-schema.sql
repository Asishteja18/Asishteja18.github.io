-- PyML: accounts, approval gate, progress, and email notifications.
-- Run once in Supabase → SQL editor. Safe to re-run.
--
-- Emails go out through Brevo's free plan (300/day). Before running, store
-- your Brevo API key and the sender address you verified in Brevo:
--
--   select vault.create_secret('xkeysib-…your key…', 'brevo_api_key');
--   select vault.create_secret('you@gmail.com',      'sender_email');
--
-- Without those two secrets everything still works; emails are just skipped.

create extension if not exists pg_net;

-- ------------------------------------------------------------------ tables
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text not null default '',
  reason      text not null default '',
  approved    boolean not null default false,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table profiles add column if not exists full_name text not null default '';
alter table profiles add column if not exists reason    text not null default '';

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

create or replace function esc(t text) returns text
language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- Fire-and-forget email through Brevo's API. Never blocks or fails a signup.
create or replace function send_email(to_email text, to_name text, subject text, html text)
returns void language plpgsql security definer set search_path = public as $$
declare k text; sender text;
begin
  select decrypted_secret into k      from vault.decrypted_secrets where name = 'brevo_api_key';
  select decrypted_secret into sender from vault.decrypted_secrets where name = 'sender_email';
  if k is null or sender is null then return; end if;
  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', k, 'content-type', 'application/json',
                                  'accept', 'application/json'),
    body    := jsonb_build_object(
      'sender',      jsonb_build_object('name', 'PyML', 'email', sender),
      'to',          jsonb_build_array(jsonb_build_object(
                       'email', to_email, 'name', coalesce(nullif(to_name, ''), to_email))),
      'subject',     subject,
      'htmlContent', html));
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end $$;
revoke execute on function send_email(text, text, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------------ signup
-- A profile row appears for every new signup, unapproved.
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

-- Email every admin once the new person has confirmed their address
-- (so unconfirmed junk signups never reach your inbox).
create or replace function notify_admins_new_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles; a record;
begin
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then return new; end if;
  select * into p from profiles where id = new.id;
  if p.approved then return new; end if;
  for a in select email, full_name from profiles where is_admin loop
    perform send_email(a.email, a.full_name,
      'New PyML access request: ' || coalesce(nullif(p.full_name, ''), p.email),
      '<p><b>' || esc(p.full_name) || '</b> (' || esc(p.email) || ') wants to join PyML.</p>' ||
      case when p.reason <> '' then '<p>They want to learn: <i>' || esc(p.reason) || '</i></p>' else '' end ||
      '<p><a href="https://asishteja18.github.io/#admin">Open the admin page to approve</a></p>');
  end loop;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function notify_admins_new_request();

-- Tell the learner the moment an admin approves them.
create or replace function notify_user_approved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not old.approved then
    perform send_email(new.email, new.full_name, 'You are in — PyML is unlocked',
      '<p>Hi ' || esc(coalesce(nullif(new.full_name, ''), 'there')) || ',</p>' ||
      '<p>Your PyML account has been approved. The lessons are open.</p>' ||
      '<p><a href="https://asishteja18.github.io/">Start learning</a></p>');
  end if;
  return new;
end $$;

drop trigger if exists on_profile_approved on profiles;
create trigger on_profile_approved
  after update of approved on profiles
  for each row execute function notify_user_approved();

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
--   update profiles set approved = true, is_admin = true where email = 'you@example.com';
