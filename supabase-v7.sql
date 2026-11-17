-- AIM v7: the Biological path (Medical Coding, lessons mc01–mc28) + the learner's path choice.
-- Re-runnable. The full supabase-schema.sql already includes all of this.

-- +5 points per Medical Coding lesson cleared (totals and weekly board)
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

-- Medical Coding certificate (all 28 lessons)
alter table certificates drop constraint if exists certificates_track_check;
alter table certificates add constraint certificates_track_check check (track in ('python', 'ml', 'adv', 'ai', 'medcode'));
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

do $$ declare u uuid; begin
  for u in select id from profiles loop perform recalc_points(u); end loop;
end $$;

select 'v7 ok' as status,
  (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'path') as path_col,
  (select count(*) from pg_constraint where conname = 'certificates_track_check' and pg_get_constraintdef(oid) like '%medcode%') as med_cert;
