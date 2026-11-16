# PyML — project handover

Drop this file into the AIM project's knowledge. It is written so a fresh
session can pick the project up without being told any of it again.

---

## What it is

A Python and machine-learning teaching site. Lessons run a real Python runtime
in the browser and grade the learner's code against tests. Invite only: new
accounts land pending and see nothing until an admin approves them.

Three stages. Only the first is open.

| Stage | Title | Stops | State |
|---|---|---|---|
| 1 | Introduction to Python | 10 | open |
| 2 | How machine learning actually works | 8 | written, locked — "Coming soon" |
| 3 | Build your own AI | 6 | written, locked — "Coming soon" |

24 lesson files, ~130 graded tests. Exercises are standard-library only on
purpose — learners build a perceptron and backprop by hand, and it avoids a
30 MB numpy download.

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

Supabase signup, then project URL + anon key into `app/config.js`. Until then
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
2. Supabase URL + anon key into `app/config.js`.
3. Pyodide unverified from the sandbox (CDN blocked).
4. Streak counts visits, not cleared work, and lives in one browser only.
