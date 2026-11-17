# PyML — project handover

Drop this file into the AIM project's knowledge. It is written so a fresh
session can pick the project up without being told any of it again.

---

## What it is

A Python and machine-learning teaching site. Lessons run a real Python runtime
in the browser and grade the learner's code against tests. Anyone can sign up
(email + password + 6-digit emailed code) and goes straight in; admins can block accounts.

Three stages. Only the first is open.

| Stage | Title | Stops | State |
|---|---|---|---|
| 1 | Introduction to Python | 10 | open |
| 2 | How machine learning actually works | 8 | written, locked — "Coming soon" |
| 3 | Build your own AI | 6 | written, locked — "Coming soon" |

24 lesson files, ~130 graded tests. Exercises are standard-library only on
purpose — learners build a perceptron and backprop by hand, and it avoids a
30 MB numpy download.

## Where it lives now (Nov 2026)

- Repo **Asishteja18/Asishteja18.github.io**, served by GitHub Pages at
  https://asishteja18.github.io. Sign-up link: `/#signup`.
- **`index.html` is the single source of truth**: the standalone bundle with
  CSS, app code and all lessons inlined (`const __LESSONS__ = [...]`). The
  multi-file tree (`app/`, `content/`, `scripts/`, `docs/` tests) is NOT in the
  repo; `pyml-source.md` is an archive of it. Edit `index.html` directly.
- Claude cannot push to this repo yet (GitHub App not installed); changes reach
  it by Asish uploading files through the GitHub web UI.

## Signup + email (added 16 Nov 2026)

- [stated] ONE auth card with Sign in | Sign up tabs, pitch beside it (card goes
  first on phones). [stated] Sign up = email + password only, then a 6-digit
  code emailed to them; the account only works once the code is verified
  (`supabase.auth.verifyOtp({type:'signup'})`). Code input auto-submits at 6
  digits; resend has a 30s cooldown; duplicate emails get "sign in instead".
  Demo mode shows the code on screen and only creates the account on verify.
  `#signup` opens the Sign up tab. Supabase's Confirm-signup template must
  contain `{{ .Token }}` (SETUP-EMAIL.md step 5).
- Live mode: Supabase email confirmation, then a "Check your inbox" screen.
  Name and reason go in user metadata and are copied into `profiles`.
- Admin table shows name, email and reason.
- Lessons are served from the page itself in both modes; Supabase only decides
  who is blocked. `shortcut:` noted in code: move lessons back into the DB with
  RLS if the content ever needs to be private (the repo is public anyway).
- Email is free: **Brevo** (300/day, sends from a verified Gmail, no domain).
  Supabase custom SMTP → Brevo sends the sign-up code. (Approval/notification
  emails existed briefly and were removed with the approval step.)
- Full steps: `SETUP-EMAIL.md`.

## Live backend (16 Nov 2026)

- Supabase project `olwcsvxplvgsavwpajkc` (Asishteja18's Org, free, eu-central-1),
  signed in via GitHub. URL + anon key are in `index.html`, so the site runs LIVE.
- Schema from `supabase-schema.sql` has been run (also saved as a SQL snippet).
- Auth: confirm email ON; custom SMTP = Brevo (`smtp-relay.brevo.com:587`,
  login `c3a954001@smtp-brevo.com`, sender = Asish's verified Gmail, name PyML);
  the SMTP key was pasted by Asish. Confirm-signup template sends `{{ .Token }}`,
  subject "Your PyML code". **Email OTP length was 8 by default; set to 6** to
  match the site's 6-digit input.
- [stated] 16 Nov: admin approval REMOVED. New profiles default `approved = true`;
  `approved = false` now means "blocked" (admin page: Block / Restore,
  blocked users see "Access paused"). The approval-email triggers, `send_email`
  and `esc` were dropped from the DB and schema; no Brevo API key is needed.
- Asish (asishtejavinnakota@gmail.com) is admin on the live project.
- Codes from a Gmail sender get rewritten to `…@…brevosend.com` and tend to land
  in spam; a verified domain in Brevo is the fix.

## v2 (17 Nov 2026): stats in the DB, one admin, code names, doubts

- [stated] Asish asked: store user stats in the database; only
  asishtejavinnakota@gmail.com is admin, everyone else a normal user; a Doubts
  section where users ask and chat; unanswered for 12h goes to the admin; show
  who is online; code names = "AIM" prefix + their own name; test before deploying.
- Before v2 the progress table had 0 rows for 2 users and streak/snake reach were
  browser-only. Now on `profiles`: `streak`, `streak_day`, `reach` (jsonb),
  `last_seen`, `handle`. Written only via RPCs `touch_streak(today)`,
  `set_reach(k,n)`, `set_handle(name)` so users can never touch role/block.
  `setDone` now reports upsert errors. Old browser-saved reach migrates up on read.
- Admin lock: trigger `lock_admin` sets `is_admin` from the auth email on every
  insert/update; the admin is always approved (cannot block themself).
- Code names: `AIM-` + 3–16 of [A-Za-z0-9_], unique case-insensitively.
- Doubts: tables `doubts`, `doubt_replies`; column-level grants (users cannot set
  `created_at`/`user_id`); RLS needs active + code name to post. Read via RPCs
  `doubts_feed()` (adds `needs_admin` = unresolved, >12h, no reply from anyone
  but the author; `admin_replied`) and `doubt_thread(did)`. Author/admin can
  resolve/delete (two-click delete, no confirm dialog).
- Online status + live refresh: one Supabase Realtime channel `pyml-online`
  (presence keyed by user id, plus a "changed" broadcast). Demo mode uses a
  BroadcastChannel heartbeat; demo login is now per tab (sessionStorage).
- Admin page: code name, cleared count, streak, last seen per learner, plus a
  banner and top-bar badge for doubts waiting on the admin. Escalation is
  in-app only (no email; would need a Brevo API key + pg_cron).
- Tests: `tests/test_v2.py` (28 browser checks, 2 users at once) and
  `tests/db_tests.sql` (17 RLS/permission checks run in a rolled-back
  transaction on the live DB) all passed before deploy.

## Ask from a lesson (17 Nov 2026)

- [stated] Doubts inside the code area: after a run errors or tests fail, a
  "Stuck? Ask the others" box appears under the output. "Ask a doubt" opens an
  inline form pre-filled with the lesson title + first error line, the learner's
  code, the error or failing tests, and "What I don't get:" with the cursor
  there; the doubt is tagged with the lesson. First-timers pick a code name inline.
- Every code example in the reading pane has "Ask about this" (pre-fills the
  example). Under the editor: "Ask a doubt about this lesson" and "N doubts on
  this lesson", which opens Doubts filtered to that lesson. On phones, asking
  from the Lesson tab switches to Practice.
- `tests/test_lesson_ask.py`: 15 checks with real Python (Pyodide from
  `npm pack pyodide@0.29.5`, routed locally because the CDN is unreachable from
  the test box).

## v3 (17 Nov 2026): group chat, points, levels, progress page

- [stated] Doubts as a group-chat UI with unsolved doubts pinned on top; whoever
  solves a doubt gets points; points (separate from the streak) set a level with
  badges: Bronze 100, Silver 500, Gold 1500 … up to God tier; show hours spent
  learning and a LeetCode-style calendar streak.
- Chat: `#doubts` is one stream of doubts as bubbles (own on the right), day
  separators, filters All/Unsolved/Solved/Mine(/Waiting on you/lesson), pinned
  bar of every unsolved doubt (admin-waiting first, then oldest), composer at the
  bottom: first line = title, Enter sends, Shift+Enter newline. Thread = chat
  with the question as the first bubble. Sidebar: online, your level, top solvers.
- Points: only via RPC `accept_answer(did, rid)` — asker or admin picks; never
  your own reply (admin included); +20 (now +2, see v4) to the reply's author, moved if the
  solution changes, revoked if the solved doubt or reply is deleted.
  `profiles.points/solved_count/best_streak`, `doubts.solved_reply_id`.
- Tiers: Newbie 0, Bronze 100, Silver 500, Gold 1500, Platinum 3000, Diamond
  6000, Master 10000, Grandmaster 16000, God tier 25000 (crowned). Shield SVG
  badges with the tier name as text/label (not colour alone).
- Time: active time on lesson/track pages only (tab visible, input in the last
  2 min), 15 s ticks, sent each minute via `log_time(today, secs)` (≤120 s per
  call, ≤16 h/day) into `activity(user_id, day, seconds)`; `touch_streak` also
  inserts the day's row so visit-only days show on the calendar.
- `#me` Your progress: level + bar to next tier, current/best streak, total and
  7-day time, lessons cleared, doubts solved, 53-week Sunday-first heatmap
  (visit / <15 min / <45 min / 45+), ladder of all 9 levels.
- Tests: `tests/test_v3.py` 37 checks (2 users; fake clock for the timer),
  `tests/test_lesson_ask.py` 15, `tests/db_tests.sql` 25 (rolled back on live).
  Found and fixed before deploy: the admin could mark their own reply as the
  solution.

## AIM brand and mission (17 Nov 2026)

- [stated] AIM = the AI and Machine Learning Institute. Mission: learn to build
  AI instead of only vibe coding (vibe coding still needs basic coding), all
  brought together in one format, "the mission AIM". Started exclusively to
  encourage the Telugu coders community, to teach and learn in a good, fun way.
- Visible brand is now AIM everywhere (title, logo, sign-in card with
  "AI & Machine Learning Institute", chat copy, loading). Internal keys
  (`pyml.*` storage, demo emails, repo file names) intentionally unchanged.
- Landing: badge "For the Telugu coders community"; hero "Build AI. Don't just
  vibe-code it."; "The mission" (basics before vibe coding, build the AI, all in
  one place, learn together and have fun); closer "Let's learn together".
- [stated] No Telugu script / Telugu font on the site (removed 17 Nov at Asish's
  request); the community is named in English.
- Supabase sign-up email: subject "Your AIM code" + AIM welcome line, English only (done). Sender
  name is still "PyML": the SMTP form loads with an empty password box, so saving
  it needs the Brevo SMTP key re-pasted by Asish (Claude must not paste keys).

## Sign-up email + spam (17 Nov 2026)

- [stated] Codes were landing in spam; Asish wants them to look good and reach the inbox.
- Cause: sender is a Gmail address via Brevo; Brevo rewrites From to
  `…@12822868.brevosend.com`, so DMARC/DKIM don't align for gmail.com and Gmail
  files it as spam. Content changes can't fix that; a domain AIM owns, verified
  in Brevo (SPF/DKIM/DMARC records), is the fix.
- Done: branded table-layout email (`email/confirm-signup.html`, inline styles,
  no images/fonts, hidden preheader with the code, "why you got this" footer),
  subject "Your AIM sign-up code", saved in Supabase. Code screen shows a
  "check Spam / mark Not spam" hint in live mode (shortcut: remove after domain).
- DONE 17 Nov: Asish bought **telugucoders.com** at **Wix** (DNS on Wix,
  ns8/ns9.wixdns.net; domain not attached to any Wix site). Existing Google
  Workspace MX + google-site-verification kept.
- Wix DNS added: TXT @ brevo-code, CNAME brevo1/brevo2._domainkey →
  b1/b2.telugucoders-com.dkim.brevo.com, TXT _dmarc "v=DMARC1; p=none;
  rua=mailto:rua@dmarc.brevo.com", SPF merged to
  "v=spf1 include:_spf.google.com include:spf.brevo.com ~all".
- Brevo: domain authenticated; sender AIM <noreply@telugucoders.com> verified
  (DKIM telugucoders.com, DMARC configured).
- Supabase SMTP sender switched to noreply@telugucoders.com / "AIM". Leaving the
  password box empty keeps the stored SMTP key (the form says so), so no re-paste.
- Site: A @ → 185.199.108-111.153, CNAME www → asishteja18.github.io, repo
  `CNAME` file = telugucoders.com. Live at https://telugucoders.com (old github.io
  URL redirects). Moving origin means users sign in again once.
- Later: tighten DMARC to p=quarantine after a few weeks of clean reports.

## How to run it

```bash
python3 -m http.server 8000      # any static server
```

With no Supabase keys it starts in **demo mode**, seeded with three accounts
(password `demo1234` for all): `admin@pyml.dev` (admin), `learner@pyml.dev`
(approved), `pending@pyml.dev` (locked out). They are listed on the sign-in
screen; clicking one fills the form.

`python3 scripts/build_standalone.py` inlines the whole site into
`pyml-standalone.html`, which opens by double-clicking with no server. Use it
whenever Asish asks to "check the site" — he opens files directly.

## Architecture

Static site, no backend of its own.

- **Auth and data: Supabase.** `app/api.js` is the only file that knows whether
  Supabase or the local demo store is running. Everything else talks to one
  interface.
- **Row-level security is the gate.** Lessons live in a `lessons` table whose
  select policy requires `is_approved()`. Client-side access control is
  theatre; do not add any. `supabase/schema.sql` holds the tables and policies.
- **Python runs in the learner's browser** via Pyodide 0.29.5. No execution
  server, no sandbox to operate.
- **Progress** is a `progress` table in live mode, localStorage in demo mode.
- Hosted from GitHub Pages. Admin is a hash route (`index.html#admin`);
  `admin.html` just redirects to it.

### Blocked on Asish

Supabase + Brevo signup (see `SETUP-EMAIL.md`), then project URL + anon key
into the `SUPABASE_URL` / `SUPABASE_ANON_KEY` constants in `index.html`. Until then
everything runs in demo mode. The anon key is public by design; the **service
key** is secret and only ever lives in a shell for `scripts/sync-content.mjs`.

## File map

```
index.html              sign in / hub / map / lesson / practice
admin.html              redirect to #admin
app/config.js           Supabase keys (blank = demo mode)
app/api.js              auth, lessons, progress — Supabase or demo, one interface
app/app.js              all UI
app/style.css           design tokens + every component
content/<track>/*.json  lesson source of truth
content/index.json      track order and titles
supabase/schema.sql     tables + the policies that do the gating
scripts/build_standalone.py   one-file build
scripts/sync-content.mjs      push lesson JSON into the database
docs/                   schema doc + the five verification suites
```

## The design, as decided

Nothing here is up for re-litigation unless Asish says so.

- **Palette:** premium brown and golden yellow. Warm cream/brown/gold in light,
  black/grey/gold in dark. Both themes are pure CSS tokens — three blocks in
  `style.css` (`:root`, the `prefers-color-scheme` query, `[data-theme="dark"]`).
- **Glassmorphism, generous rounded corners,** glow that intensifies on hover.
- **Entering the Python course auto-switches to dark.** An explicit toggle
  choice always wins and is never overwritten.
- **Hub:** three glowing glass cubes (Python / Machine Learning / Build your own
  AI) joined by an interlocking path. Locked cubes are not clickable.
- **The track map is a python** — a snake. Parabolic serpentine down the page,
  topics on the peaks, scale texture, thin tail at the start growing to a head
  that parks on the stop you have reached. Clicking a topic further down makes
  the serpent crawl to it before the lesson opens. How far it has crawled is
  remembered per user per section in `pyml.reach.v1` and only ever increases.
- **Focus states on the map:** cleared topics fade back and are struck through,
  the current one is lit with a glow, upcoming ones are glossy and quiet. The
  haze on upcoming cards is a sheen layer over the card — never `filter: blur()`
  on text, which makes it unreadable.
- **Map sections collapse.** All ten current stops sit under "Introduction";
  more concept sections get added after it. Adding a section is data, not code:
  put `"section": "<name>"` on a lesson JSON.
- **Left menu:** a hamburger at the left end of the top bar opens a collapsing
  profile panel that slides in from the left. It holds the avatar, name, email,
  Learner/Admin and Live/Demo chips, the streak chip, three counters (cleared /
  to go / minutes logged), one collapsing section per stage listing every topic
  — cleared struck off, current lit, locked greyed — and Admin + Sign out.
  Clicking a topic opens it and closes the panel. Escape or the scrim closes it.
- **Top-right corner:** the name, with the streak under it in gold. On a phone
  the name drops out and the streak stays.
- **Streak:** consecutive days the site was opened, per user, in
  `pyml.streak.v1`. A gap of more than a day restarts it at one. Marked in the
  code as a shortcut — it counts visits, not cleared work, and it belongs in
  Supabase with the progress table.
- **Mobile:** lesson pages use Lesson/Practice tabs so the editor is one tap
  away, the top bar collapses to one row, hub cubes become rows.
- Fonts: Sora (display), Figtree (body), IBM Plex Mono (labels and code).

## Adding content

```bash
# write content/<track>/<id>.json per docs/LESSON_SCHEMA.md
python3 docs/validate_content.py     # not optional
node scripts/sync-content.mjs        # push to the database
```

The validator checks that `id` matches the filename, `track` matches the
folder, there are 3–6 mixed sections and 4–6 tests, exactly one function in the
solution, that the solution passes all its own tests, and that the starter does
**not**. That last pair is the bug learners cannot work around.

## Verification — all five must pass before anything ships

```bash
python3 docs/validate_content.py     # 24 lesson files
python3 docs/audit_contrast.py       # palette maths, both themes, WCAG AA
python3 docs/audit_rendered.py       # 58 real-pixel contrast pairs through the glass
python3 docs/standalone_test.py      # 11 assertions against file://
python3 docs/e2e.py                  # 105 assertions, served over localhost
```

`audit_rendered.py` is the one that matters for anything translucent: it hides
every glyph, screenshots a backdrop plate and samples the real pixel behind each
piece of text. Token maths alone cannot see through glass.

Chromium for all of it lives at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

## Gotchas already paid for

- **`file://` is an opaque origin** — localStorage silently fails there. Never
  seed storage in a `file://` test.
- **Navigating to the same URL with a different hash is a same-document
  navigation** — the module does not re-run, so seeded storage is not picked up.
  Reload first, then set the hash.
- **Class collisions are the recurring bug.** `.t` once styled both test rows
  and lesson titles; `.done` styled both the exercise-cleared banner and the
  panel list items. Grep `style.css` for a class name before reusing it.
- **The sandbox blocks Google Fonts, all CDNs and all hosted TTS.** The webfonts
  cannot load in tests — the suites check that the CSS *asks* for the right
  family. Pyodide is therefore unverified end to end; first run on a real
  machine is the real test.
- `order` restarts at 1 in each track, so sort by track position first or the
  three tracks interleave.

## Working agreements

- **No new Python topics from Claude.** Asish adds them day by day himself.
- He pushes updates daily and wants the modules to keep growing.
- He wants the work split across an engineering team, each task handled
  separately.
- Ponytail mode: smallest complete change, no unasked features, finish every
  caller and test the change breaks, `shortcut:` comments for known limits, and
  every reply ends with what was skipped and the risk.
- Save project context to memory as it is decided rather than asking him to
  repeat it.

## Open items

1. **The syllabus** — Asish flagged this as the next conversation: agree the
   full topic list so every task is covered before more content is written.
2. Supabase + Brevo accounts, then URL + anon key into `index.html`.
   The email triggers are untested until then.
5. Lessons are hand-edited inside `index.html`. If daily additions get
   painful, rebuild the multi-file source from the bundle.
6. Install the Claude GitHub App on the repo so updates can be pushed directly.
3. Pyodide unverified from the sandbox (CDN blocked).
4. Streak counts visits, not cleared work, and lives in one browser only.

---

## 2026-11-17 — AI-90 course + Midnight Slate & Frosted Neon redesign

**AI-90 is on the site.** `syllabus/AI90_MASTER.md` (the learner's 90-day course:
30 Python · 30 ML · 30 AI-from-scratch) → `tools/build_ai90.py` →
`content/ai90.json`, fetched at boot and merged into `LESSONS`.

- Days are lessons with `id: "dNN"`, `day: N`, `track` python/ml/ai, `section`
  e.g. "Days 1–15 · Core Python". The old 24 lessons stay first in each stage
  (ML/AI ones under "Warm-up · the big picture"). ML and AI stages are unlocked.
- Lesson sections now include `visual` (ASCII), `mermaid` (lazy-loaded
  mermaid@11.4.1 ESM), `viz` (interactive widget id) and `code` with `lang`.
  Python examples have a **Run** button; stdout and matplotlib figures render inline.
- Exercises with `kind: "pytest"`: the starter is generated from the reference
  solution (bodies → `raise NotImplementedError`, docstrings/task lines kept);
  the browser writes `dayNN.py` (learner), `test_dayNN.py`, and reference
  solutions for every earlier day imported, then runs `harness` (in the JSON).
  Results: pass / fail / todo ("not started").
- **Python runs in a Web Worker now** (`PY` in index.html): one Pyodide for
  lessons, day tests and examples; `loadPackagesFromImports` pulls NumPy,
  pandas, scikit-learn, matplotlib, bs4; openpyxl via micropip. Stop button
  after 4 s. Learner code is saved per lesson in localStorage `aim.code.<id>`.
- Verified: 307/307 tests pass in real Pyodide 0.29.5 (`tests/ai90_pyodide.mjs`);
  starters never crash on import. Day 65's test takes ~50 s in the browser.
- `window.__aim` exposes `ai90`, `loadMermaid`, `py` for tests/console.

**Illustrations** (`assets/viz-core.js`, `viz-ml.js`, `viz-ai.js`, `viz-data.js`):
36 widgets on 39 days — hms, slicing, Collatz, running mean, hashing, min-max,
vectors, matmul, Iris scatter, derivative, gradient descent, normal sampling,
linear regression (closed form + GD), polynomial/ridge, sigmoid, threshold +
confusion matrix, softmax, kNN, decision tree, k-means (k-means++ init, Iris),
PCA, airline time series, TF-IDF, perceptron, MLP on XOR, backprop graph,
optimiser race, LayerNorm, convolution (sklearn digits), bigram (32k real
names), attention, sampling (temperature/top-k/top-p), BPE (bytes, Telugu,
emoji), RAG. Real data in `viz-data.js`. Mapping lives in `VIZ` in the build script.

**Design: Midnight Slate & Frosted Neon.** Tokens replaced (old names kept:
`--gold*` = cyan neon, `--brown*` = violet, new `--neon-3` = pink). Dark is the
default (`aim.theme` in localStorage; "Frosted" light on the toggle). Fixed
`.aurora` (4 blurred drifting blobs, 15–22%), fixed `svg.grain` noise
(`--grain` .035, pointer-events none), frosted surfaces with `--hi` inner top
highlight, `.spot` cards get a cursor-tracked radial border glow (one pointermove
listener sets `--mx/--my/--spot`). `[data-reveal]` elements get a GSAP 3.12.7
stagger (0.08 s) via a MutationObserver; CSS fallback; reduced-motion skips it.
Hub is now a bento grid (3 stages, Next up, 90-cell journey, level, streak, doubts).

Tests: `tests/test_ai90_site.py` (40 checks) + the old `test_v3.py` and
`test_lesson_ask.py` all pass on a demo copy (blank SUPABASE_URL).

## v4 points (17 Nov 2026)

- [stated] Asish: +5 points for each day of progress, +2 for clearing a doubt, to keep it fair.
- Points = 5 × lessons/days cleared + 2 × doubts solved, recomputed by
  `recalc_points(uid)` (trigger on `progress` insert/update/delete, and from
  `accept_answer` and both revoke triggers). Only real ids count (`d01`–`d90`,
  the 24 warm-ups), so fake progress rows earn nothing. Top solvers now ranks by
  doubts solved. Applied to the live DB as a delta (the full schema file is not
  cleanly re-runnable: `doubts_feed` changed return type in v3); everyone backfilled.
- Tests: `tests/db_tests.sql` now 29 checks (all passed, rolled back), test_v3 and
  test_ai90_site updated and passing. Demo mode mirrors it in `demoPoints()`.

## v5 (17 Nov 2026): "update all in one go"

- [stated] Asish asked to ship every improvement from the list at once.
- Editor: CodeMirror 6 bundle `assets/editor.js` (esbuild IIFE, `window.AIMEditor.create(textarea)`),
  textarea stays the source of truth (synced both ways), plain textarea fallback.
- Hints: `tools/hints.py` builds 3 steps per exercise from the solution (what to
  reach for → skeleton → first line). Days via build_ai90, warm-ups via
  `tools/add_warmup_hints.py`. "Show solution" warns if hints are left.
- Guest mode: `#try-d01|d33|d76` (guest bar, no doubts); a pass is stored in
  `aim.guest.passed` and claimed after sign-in (setDone with the saved code).
- Tour: 5 steps on the hub, first visit only (`aim.toured.v1`), closes on Esc,
  scrim click or navigation.
- DB v5 (applied live, 39 DB checks pass on a fresh full-schema run):
  `progress.code` (≤60k, kept for spot checks/portfolio), `progress.completed_at`
  (server-stamped, can't be backdated), `doubts.solved_at`, `challenge_lesson(date)`
  (week k → day (k·37 mod 90)+1, week of 16 Nov 2026 = d01), recalc_points adds +10
  per challenge cleared in its week, `weekly_board()`, `certificates` +
  `claim_certificate(track, name)` (server checks all 30 days) + public
  `verify_certificate(code)`, `lesson_videos` (admin write, public read),
  `profiles.reminders` + `set_reminders()`. Schema file now re-runnable
  (drops doubts_feed/doubt_thread before redefining).
- Reminders: `supabase-reminders.sql` applied (pg_net + pg_cron, job
  `aim-streak-reminders` 18:00 UTC). Sends 0 until Asish adds the Brevo API
  key to Vault as `brevo_api_key` (README has the 2 steps).
- Certificates `#cert-<code>` (public), LinkedIn add-to-profile link, print CSS.
- Portfolio: zip built in the browser (store-only ZIP writer), README with
  progress bars, `ai-90/dayNN.py` + tests + conftest.
- Admin: drop-off chart (cleared count per lesson, biggest drop flagged) and
  "Re-run their code" spot check per learner.
- PWA: `sw.js` (network-first page, SWR for assets/content, cache-first CDN),
  manifest, icons; registered on https only. OG/Twitter tags + `assets/og.png`.
- a11y: axe (WCAG A/AA) clean on landing, guest lesson, hub, progress, admin,
  doubts. Scrollable boxes get tabindex; stagger capped at 0.9 s total.
- Tests: tests/test_v5.py (44 checks), test_ai90_site, test_v3, test_lesson_ask all pass.

## v6 (17 Nov 2026): Advanced ML stage between ML and AI

- New stage `adv` ("Advanced ML: beyond the basics"), 13 lessons `x01`–`x13` from
  `syllabus/AI90_PLUS.md`: lasso, calibration, SVM, kernels, GMM/EM, DBSCAN +
  agglomerative, t-SNE, anomaly detection, matrix factorisation, bandits + Q-learning,
  NumPy autoencoder, drift (PSI/KS) + run tracking, fairness. 48 tests.
- Timing: Python ~61 h, ML ~64 h, Advanced ~29 h, AI ~69 h → 103 lessons, ~223 h,
  about 15–16 weeks at 2 h a day. `STAGE_HOURS` / `STAGE_SPAN` in index.html.
- Illustrations `assets/viz-adv.js` (+ `viz-adv-data.js`: lasso path, 90 digits, trained AE outputs).
- Notes `notes/advNN-*.md`; `tools/build_notes.py` + `tools/build_ai90.py` read the plus file.
- DB: `supabase-v6.sql` (points regex adds `x01–x13`, certificate track `adv` = all 13). Applied live.
- Tests: Pyodide 355/355 (`node tests/ai90_pyodide.mjs <dist> solutions all`), site + v5 suites green,
  axe clean on Advanced pages, DB 42/42. `tests/test_v2.py` is obsolete (fails on HEAD too).

## v7 (17 Nov 2026): two paths — Digital | Biological (Medical Coding)

- Path switch on landing + hub (`PATHS`, `currentPath()`, `setPath()`; `profiles.path` + `set_path()` RPC; localStorage `aim.path`).
  Hub, menu, journey, certificates follow the current path; Digital stays the default.
- Biological = 28 Medical Coding lessons `mc01`–`mc28` (tracks `mcf`, `mcd`, `mcp`, `mcr`), US outpatient coding for the CPC exam.
  Source `syllabus/MEDCODE_MASTER.md`; build `tools/build_medcode.py` validates every ICD-10-CM code against FY2026
  (`simple_icd_10_cm`), HCPCS against a hand-checked list. CPT descriptors never stored (AMA copyright).
- New exercise kind `check` (`checkQuiz`, `gradeItem` in index.html): MCQ / codes (order optional, dots optional) / text;
  answers saved as JSON in `progress.code`; admin spot-check re-grades them.
- 15 tools in `assets/viz-bio.js`, incl. ICD-10-CM lookup over `content/icd10cm.json` (FY2026, lazy-loaded, ~0.6 MB gzipped).
- DB `supabase-v7.sql` applied live: points regex + `mc01–mc28`, certificate track `medcode`, `profiles.path`. DB tests 46/46.
- Fixed: JS demo points regex was missing Advanced `x01–x13` (DB was right).
- Tests: `tests/test_bio.py` (landing picker, hub, every lesson's answer key, tools, axe, phone) + all earlier suites green.
