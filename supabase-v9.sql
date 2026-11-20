-- AIM v9: AIM AI tutor (open-source DeepSeek on Cloudflare Workers AI, optional web search).
-- Chats and daily usage live here; the ai-chat Edge Function is the only writer.
-- Re-runnable. The full supabase-schema.sql already includes all of this.

create table if not exists ai_messages (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null check (char_length(content) <= 12000),
  sources    jsonb not null default '[]'::jsonb,
  lesson_id  text,
  model      text,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_idx on ai_messages (user_id, id desc);
alter table ai_messages enable row level security;

-- learners read and clear their own chat; only the Edge Function (service role) writes
drop policy if exists "ai own read" on ai_messages;
create policy "ai own read" on ai_messages for select to authenticated using (user_id = auth.uid());
drop policy if exists "ai own delete" on ai_messages;
create policy "ai own delete" on ai_messages for delete to authenticated using (user_id = auth.uid());
revoke insert, update on ai_messages from anon, authenticated;

create table if not exists ai_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default (now() at time zone 'utc')::date,
  asks     int  not null default 0,
  searches int  not null default 0,
  primary key (user_id, day)
);
alter table ai_usage enable row level security;
drop policy if exists "ai usage own read" on ai_usage;
create policy "ai usage own read" on ai_usage for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on ai_usage from anon, authenticated;

-- Atomically spend one ask (and one search if wanted). Daily caps keep everyone
-- inside the free model allowance: 20 asks / 5 web searches per learner, more for admins.
create or replace function ai_take_quota(uid uuid, want_search boolean)
returns table (ok boolean, search_ok boolean, asks_left int, searches_left int)
language plpgsql security definer set search_path = public as $$
declare
  adm boolean; cap_a int; cap_s int; a int; s int; d date := (now() at time zone 'utc')::date;
begin
  select coalesce(p.is_admin, false) into adm from profiles p where p.id = uid and p.approved;
  if adm is null then return query select false, false, 0, 0; return; end if;
  cap_a := case when adm then 200 else 20 end;
  cap_s := case when adm then 50 else 5 end;
  insert into ai_usage (user_id, day) values (uid, d) on conflict do nothing;
  select u.asks, u.searches into a, s from ai_usage u where u.user_id = uid and u.day = d for update;
  if a >= cap_a then return query select false, false, 0, greatest(cap_s - s, 0); return; end if;
  update ai_usage u set asks = u.asks + 1,
         searches = u.searches + case when want_search and s < cap_s then 1 else 0 end
   where u.user_id = uid and u.day = d;
  return query select true, (want_search and s < cap_s), cap_a - a - 1,
                      greatest(cap_s - s - case when want_search and s < cap_s then 1 else 0 end, 0);
end $$;
revoke all on function ai_take_quota(uuid, boolean) from public, anon, authenticated;

-- hand an ask back when the model failed, so outages don't burn the day's questions
create or replace function ai_refund(uid uuid, was_search boolean)
returns void language sql security definer set search_path = public as $$
  update ai_usage set asks = greatest(asks - 1, 0),
         searches = greatest(searches - case when was_search then 1 else 0 end, 0)
   where user_id = uid and day = (now() at time zone 'utc')::date
$$;
revoke all on function ai_refund(uuid, boolean) from public, anon, authenticated;

-- what the panel shows before the first question of the day
create or replace function ai_quota() returns table (asks_left int, searches_left int)
language sql stable security definer set search_path = public as $$
  select greatest((case when p.is_admin then 200 else 20 end) - coalesce(u.asks, 0), 0),
         greatest((case when p.is_admin then 50 else 5 end) - coalesce(u.searches, 0), 0)
    from profiles p
    left join ai_usage u on u.user_id = p.id and u.day = (now() at time zone 'utc')::date
   where p.id = auth.uid()
$$;
grant execute on function ai_quota() to authenticated;

select 'v9 ok' as status,
  (select count(*) from information_schema.tables where table_name in ('ai_messages','ai_usage')) as ai_tables;
