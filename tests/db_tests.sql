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
update profiles set points = 0, solved_count = 0 where id in (current_setting('t.a')::uuid, current_setting('t.l')::uuid);
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
  -- T20 the asker marks the admin's reply: +20 to the admin, doubt resolved
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
  if (select points from profiles where id = current_setting('t.a')::uuid) <> 20 then raise exception 'T20 solver points %', (select points from profiles where id = current_setting('t.a')::uuid); end if;
  if (select points from profiles where id = current_setting('t.l')::uuid) <> 0 then raise exception 'T20 asker got points'; end if;
  if not (select resolved from doubts where title = 'ZZ v3 doubt') then raise exception 'T20 not resolved'; end if;
  if (select best_streak from profiles where id = current_setting('t.l')::uuid) < 1 then raise exception 'T23 best streak'; end if;
end $$;
-- T24 deleting the solved doubt takes the points back
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.l'), 'role', 'authenticated')::text, true);
do $$ begin
  if (select count(*) from top_solvers() where points = 20) <> 1 then raise exception 'T25 leaderboard'; end if;
end $$;
delete from doubts where title = 'ZZ v3 doubt';
reset role;
do $$ begin
  if (select points from profiles where id = current_setting('t.a')::uuid) <> 0 then raise exception 'T24 points not revoked'; end if;
end $$;
