-- AIM streak reminder emails (run after supabase-schema.sql).
--
-- Every evening at 18:00 UTC, anyone who learned yesterday but not yet today
-- (and hasn't turned reminders off) gets one short email through Brevo:
-- "Your N-day streak ends at midnight — Day X is waiting."
--
-- One-time setup, by the account owner (Claude never handles the key):
--   1. Brevo → SMTP & API → API Keys → Generate a new API key ("AIM reminders").
--   2. Supabase → SQL editor, run (with your key in place of the dots):
--        select vault.create_secret('xkeysib-...', 'brevo_api_key');
--   3. Run this file. Until the secret exists the job runs and sends nothing.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function send_streak_reminders() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  key text;
  u record;
  n int := 0;
  nxt text;
  html text;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  if key is null then return 0; end if;

  for u in
    select p.id, p.email, coalesce(p.handle, split_part(p.email, '@', 1)) as who, p.streak
      from profiles p
     where p.approved and p.reminders and p.streak >= 1
       and p.streak_day = current_date - 1
       and p.email like '%@%'
  loop
    -- the next lesson they haven't cleared, in course order
    select l into nxt from (
      select 'Day ' || i as l, 'd' || lpad(i::text, 2, '0') as id, i from generate_series(1, 90) i
    ) days
    where not exists (select 1 from progress g where g.user_id = u.id and g.lesson_id = days.id and g.completed)
    order by i limit 1;

    html := '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0B1220;color:#E6EDF7;border-radius:16px">'
         || '<p style="margin:0 0 6px;font-size:13px;color:#22D3EE;letter-spacing:.08em">AIM · AI &amp; MACHINE LEARNING INSTITUTE</p>'
         || '<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">Your ' || u.streak || '-day streak ends at midnight</h1>'
         || '<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#A9B6CA">Hi ' || replace(replace(u.who, '<', ''), '>', '')
         || ', fifteen minutes keeps it alive. ' || coalesce(nxt, 'Your next lesson') || ' is waiting.</p>'
         || '<a href="https://telugucoders.com/" style="display:inline-block;background:#22D3EE;color:#03141B;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:12px">Keep the streak</a>'
         || '<p style="margin:22px 0 0;font-size:12px;color:#8592A8">You get this because you learned on AIM yesterday. Turn reminders off any time from the menu on telugucoders.com.</p>'
         || '</div>';

    perform net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', key, 'content-type', 'application/json', 'accept', 'application/json'),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'AIM', 'email', 'noreply@telugucoders.com'),
        'to', jsonb_build_array(jsonb_build_object('email', u.email)),
        'subject', 'Your ' || u.streak || '-day streak ends at midnight',
        'htmlContent', html,
        'tags', jsonb_build_array('streak-reminder')));
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function send_streak_reminders() from public, anon, authenticated;

-- (re)schedule: every day at 18:00 UTC
select cron.unschedule(jobid) from cron.job where jobname = 'aim-streak-reminders';
select cron.schedule('aim-streak-reminders', '0 18 * * *', 'select public.send_streak_reminders()');
