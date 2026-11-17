-- Run v2 schema + permission tests, then ROLLBACK. Any failed check aborts with "T<n> ...".
select set_config('t.a', (select id::text from profiles where email = 'asishtejavinnakota@gmail.com'), true),
       set_config('t.l', (select id::text from profiles where email <> 'asishtejavinnakota@gmail.com' order by created_at limit 1), true);

-- T1 nobody else can be made admin, even directly in the database
update profiles set is_admin = true where id = current_setting('t.l')::uuid;
do $$ begin
  if (select is_admin from profiles where id = current_setting('t.l')::uuid) then raise exception 'T1 learner became admin'; end if;
  if not (select is_admin from profiles where id = current_setting('t.a')::uuid) then raise exception 'T1 admin lost admin'; end if;
end $$;

-- act as the learner
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);

update profiles set is_admin = true, approved = true where id = current_setting('t.l')::uuid;   -- T2: RLS -> 0 rows
insert into progress (user_id, lesson_id, completed) values (current_setting('t.l')::uuid, 'zz-test-lesson', true)
  on conflict (user_id, lesson_id) do update set completed = excluded.completed;                   -- T3
select touch_streak(current_date);                                                                 -- T4
select set_reach('python|Introduction', 3);                                                        -- T5
select set_handle('ZZtest_l');                                                                     -- T6
insert into doubts (title, body) values ('ZZ test doubt title', 'body');                           -- T7
do $$ begin
  begin
    insert into doubts (title, created_at) values ('ZZ spoofed time', now() - interval '2 days');
    raise exception 'T8 could fake created_at';
  exception when insufficient_privilege then null; end;
  begin
    perform set_handle('x');
    raise exception 'T9 bad code name accepted';
  exception when raise_exception then
    if sqlerrm like 'T9%' then raise; end if;
  end;
  if (select count(*) from doubts_feed() where title = 'ZZ test doubt title') <> 1 then raise exception 'T10 feed'; end if;
  if (select count(*) from profiles) <> 1 then raise exception 'T11 learner can read % profiles', (select count(*) from profiles); end if;
  if (select count(*) from progress where lesson_id = 'zz-test-lesson') <> 1 then raise exception 'T12 progress not saved'; end if;
end $$;

reset role;
do $$ declare p profiles; begin
  select * into p from profiles where id = current_setting('t.l')::uuid;
  if p.is_admin then raise exception 'T2 learner made self admin'; end if;
  if p.handle is distinct from 'AIM-ZZtest_l' then raise exception 'T6 handle %', p.handle; end if;
  if coalesce(p.streak, 0) < 1 or p.last_seen is null then raise exception 'T4 streak/last_seen'; end if;
  if (p.reach->>'python|Introduction')::int <> 3 then raise exception 'T5 reach'; end if;
end $$;

-- T13 escalation after 12 hours
update doubts set created_at = now() - interval '13 hours' where title = 'ZZ test doubt title';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
do $$ begin
  if not (select needs_admin from doubts_feed() where title = 'ZZ test doubt title') then raise exception 'T13 not escalated'; end if;
end $$;
select set_handle('ZZtest_a');
insert into doubt_replies (doubt_id, body) select id, 'answer' from doubts where title = 'ZZ test doubt title';
do $$ begin
  if (select needs_admin or not admin_replied from doubts_feed() where title = 'ZZ test doubt title') then raise exception 'T14 admin reply not counted'; end if;
  if (select count(*) from profiles) < 2 then raise exception 'T15 admin cannot list users'; end if;
  if (select count(*) from progress where lesson_id = 'zz-test-lesson') <> 1 then raise exception 'T15 admin cannot read progress'; end if;
end $$;
update profiles set approved = false where id = current_setting('t.a')::uuid;   -- admin tries to block self
reset role;
do $$ begin
  if not (select approved from profiles where id = current_setting('t.a')::uuid) then raise exception 'T16 admin blocked self'; end if;
end $$;

-- T17 a blocked learner sees and posts nothing
update profiles set approved = false where id = current_setting('t.l')::uuid;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
do $$ begin
  if (select count(*) from doubts_feed()) <> 0 then raise exception 'T17 blocked user sees feed'; end if;
  begin
    insert into doubts (title) values ('ZZ blocked post');
    raise exception 'T17 blocked user can post';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ================================================================== v3 checks
-- learner asks, admin answers, learner marks the solution
update profiles set approved = true where id = current_setting('t.l')::uuid;
delete from progress where user_id in (current_setting('t.a')::uuid, current_setting('t.l')::uuid) and lesson_id <> 'zz-test-lesson';
update profiles set solved_count = 0 where id in (current_setting('t.a')::uuid, current_setting('t.l')::uuid);
select recalc_points(current_setting('t.a')::uuid), recalc_points(current_setting('t.l')::uuid);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
insert into doubts (title) values ('ZZ v3 doubt');
insert into doubt_replies (doubt_id, body) select id, 'learner own reply' from doubts where title = 'ZZ v3 doubt';
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into doubt_replies (doubt_id, body) select id, 'admin answer' from doubts where title = 'ZZ v3 doubt';
do $$ declare did bigint; rid bigint; begin
  -- T18 the admin cannot award their own reply
  select id into did from doubts where title = 'ZZ v3 doubt';
  select id into rid from doubt_replies where doubt_id = did and body = 'admin answer';
  begin perform accept_answer(did, rid); raise exception 'T18 admin awarded own reply';
  exception when raise_exception then if sqlerrm like 'T18%' then raise; end if; end;
end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
do $$ declare did bigint; rid bigint; own bigint; begin
  select id into did from doubts where title = 'ZZ v3 doubt';
  select id into rid from doubt_replies where doubt_id = did and body = 'admin answer';
  select id into own from doubt_replies where doubt_id = did and body = 'learner own reply';
  -- T19 the asker cannot mark their own reply
  begin perform accept_answer(did, own); raise exception 'T19 own reply accepted';
  exception when raise_exception then if sqlerrm like 'T19%' then raise; end if; end;
  -- T20 the asker marks the admin's reply: +2 to the admin, doubt resolved
  perform accept_answer(did, rid);
  perform accept_answer(did, rid);   -- twice is a no-op
  -- T21 learners cannot write points or activity directly
  begin
    insert into activity (user_id, day, seconds) values (auth.uid(), current_date, 99999);
    raise exception 'T21 wrote activity directly';
  exception when insufficient_privilege then null; end;
  -- T22 learning time is capped at 120 s per call
  perform log_time(current_date, 5000);
  if (select seconds from activity where user_id = auth.uid() and day = current_date) > 120 then
    raise exception 'T22 log_time not capped';
  end if;
end $$;
reset role;
do $$ begin
  if (select points from profiles where id = current_setting('t.a')::uuid) <> 2 then raise exception 'T20 solver points %', (select points from profiles where id = current_setting('t.a')::uuid); end if;
  if (select points from profiles where id = current_setting('t.l')::uuid) <> 0 then raise exception 'T20 asker got points'; end if;
  if not (select resolved from doubts where title = 'ZZ v3 doubt') then raise exception 'T20 not resolved'; end if;
  if (select best_streak from profiles where id = current_setting('t.l')::uuid) < 1 then raise exception 'T23 best streak'; end if;
end $$;
-- T24 deleting the solved doubt takes the points back
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
do $$ begin
  if (select count(*) from top_solvers() where points = 2 and solved_count = 1) <> 1 then raise exception 'T25 leaderboard'; end if;
end $$;
delete from doubts where title = 'ZZ v3 doubt';
reset role;
do $$ begin
  if (select points from profiles where id = current_setting('t.a')::uuid) <> 0 then raise exception 'T24 points not revoked'; end if;
end $$;

-- ================================================================== v4 points: +5 per lesson/day cleared
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
insert into progress (user_id, lesson_id, completed) values (auth.uid(), 'd01', true);
insert into progress (user_id, lesson_id, completed) values (auth.uid(), 'py-intro', true);
insert into progress (user_id, lesson_id, completed) values (auth.uid(), 'd01', true)
  on conflict (user_id, lesson_id) do update set completed = true;                     -- same day again
insert into progress (user_id, lesson_id, completed) values (auth.uid(), 'd91', true); -- not a real day
insert into progress (user_id, lesson_id, completed) values (auth.uid(), 'zz-farm-1', true);
update profiles set points = 99999 where id = auth.uid();                              -- T28: must not stick
do $$ begin
  -- T26 two real lessons cleared = 10; repeats and fake ids add nothing
  if (select points from profiles where id = auth.uid()) <> (10 + (case when challenge_lesson(current_date) = 'd01' then 10 else 0 end)) then raise exception 'T26 lesson points %', (select points from profiles where id = auth.uid()); end if;
end $$;
delete from progress where user_id = auth.uid() and lesson_id = 'd01';
do $$ begin
  -- T27 un-clearing takes the 5 back
  if (select points from profiles where id = auth.uid()) <> 5 then raise exception 'T27 points after delete %', (select points from profiles where id = auth.uid()); end if;
end $$;
reset role;
do $$ begin
  -- T28 a learner can't write points directly; T29 leaderboard ignores lesson-only points
  if (select points from profiles where id = current_setting('t.l')::uuid) <> 5 then raise exception 'T28 points written directly'; end if;
  if exists (select 1 from top_solvers() where user_id = current_setting('t.l')::uuid) then raise exception 'T29 non-solver on leaderboard'; end if;
end $$;

-- ================================================================== v5
delete from progress where user_id = current_setting('t.l')::uuid;
delete from certificates where user_id = current_setting('t.l')::uuid;
update profiles set solved_count = 0, handle = coalesce(handle, 'AIM-ZZtest_l') where id = current_setting('t.l')::uuid;
select recalc_points(current_setting('t.l')::uuid);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
-- T30 the browser can't backdate a completion
insert into progress (user_id, lesson_id, completed, completed_at, code)
  values (auth.uid(), 'd02', true, '2000-01-01', 'def f(): pass');
do $$ begin
  if (select completed_at from progress where user_id = auth.uid() and lesson_id = 'd02') < now() - interval '1 minute'
    then raise exception 'T30 backdated completion'; end if;
  if (select code from progress where user_id = auth.uid() and lesson_id = 'd02') <> 'def f(): pass' then raise exception 'T30 code not kept'; end if;
end $$;
-- T31 this week's challenge pays +10 on top of the 5
insert into progress (user_id, lesson_id, completed) values (auth.uid(), challenge_lesson(current_date), true)
  on conflict (user_id, lesson_id) do update set completed = true;
do $$ declare want int; begin
  want := case when challenge_lesson(current_date) = 'd02' then 15 else 20 end;
  if (select points from profiles where id = auth.uid()) <> want then
    raise exception 'T31 challenge points % (want %)', (select points from profiles where id = auth.uid()), want; end if;
  -- T32 the weekly board shows me with this week's points
  if (select week_points from weekly_board() where is_me) <> want then raise exception 'T32 weekly board'; end if;
  if (select challenge from weekly_board() limit 1) <> challenge_lesson(current_date) then raise exception 'T32 challenge id'; end if;
end $$;
-- T33 certificate only after all 30 days of the block
do $$ begin
  begin perform claim_certificate('python', 'Test Learner'); raise exception 'T33 cert issued early';
  exception when raise_exception then if sqlerrm like 'T33%' then raise; end if; end;
end $$;
insert into progress (user_id, lesson_id, completed)
  select auth.uid(), 'd' || lpad(i::text, 2, '0'), true from generate_series(1, 30) i
  on conflict (user_id, lesson_id) do update set completed = true;
select set_config('t.cert', claim_certificate('python', 'Test <b>Learner</b>'), true);
do $$ begin
  if claim_certificate('python', 'Other Name') <> current_setting('t.cert') then raise exception 'T33 second cert'; end if;
  -- T34 code too long is refused
  begin
    insert into progress (user_id, lesson_id, completed, code) values (auth.uid(), 'd40', true, repeat('x', 60001));
    raise exception 'T34 huge code accepted';
  exception when check_violation then null; end;
  -- T35 learners can't add lesson videos or write certificates
  begin
    insert into lesson_videos (lesson_id, youtube_id) values ('d01', 'dQw4w9WgXcQ');
    raise exception 'T35 learner added a video';
  exception when insufficient_privilege then null; end;
  begin
    insert into certificates (user_id, track, name) values (auth.uid(), 'ml', 'Fake');
    raise exception 'T35 learner forged a certificate';
  exception when insufficient_privilege then null; end;
  -- T36 reminders toggle through the RPC only
  if set_reminders(false) then raise exception 'T36 reminders still on'; end if;
end $$;
-- T37 anyone can verify a certificate (no login), and the name is sanitised
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$ declare r record; begin
  select * into r from verify_certificate(lower(current_setting('t.cert')));
  if r.name is null or r.track <> 'python' then raise exception 'T37 verify failed'; end if;
  if r.name like '%<%' then raise exception 'T37 name not sanitised: %', r.name; end if;
  if (select count(*) from lesson_videos) < 0 then raise exception 'T37 videos unreadable'; end if;
end $$;
-- T38 the admin can add a video
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, true);
insert into lesson_videos (lesson_id, youtube_id) values ('zz-test', 'dQw4w9WgXcQ')
  on conflict (lesson_id) do update set youtube_id = excluded.youtube_id;
reset role;
do $$ begin
  if not exists (select 1 from lesson_videos where lesson_id = 'zz-test') then raise exception 'T38 admin video'; end if;
  if (select reminders from profiles where id = current_setting('t.l')::uuid) then raise exception 'T36 reminders flag'; end if;
  if challenge_lesson(date '2026-11-16') <> 'd01' or challenge_lesson(date '2026-11-23') <> 'd38' then raise exception 'T39 challenge rotation'; end if;
end $$;
