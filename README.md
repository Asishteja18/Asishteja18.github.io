# AIM — AI & Machine Learning Institute

Telugu coders' home for learning to **build** AI, not just vibe-code it:
basic Python first, then machine learning, then your own models, all in one
path, learned together.


Python and machine learning taught by making you write the code. Lessons run a
real Python runtime in the browser and grade your work against tests.

Live at **https://asishteja18.github.io** · sign-up link: **https://asishteja18.github.io/#signup**

People sign up with email + password, verify a 6-digit emailed code, and go
straight into the lessons. One admin (asishtejavinnakota@gmail.com, enforced by
the database) can see every learner's stats and block accounts.

**Doubts** (`#doubts`): a group chat. Learners pick a code name (`AIM-` + their
choice), ask (first line = title, Enter to send), reply, and see who is online.
Unsolved doubts stay pinned on top. The asker marks a reply as the solution and
its author earns +20 points; points set the level (Bronze 100, Silver 500,
Gold 1,500, Platinum 3,000, Diamond 6,000, Master 10,000, Grandmaster 16,000,
God tier 25,000).

**Your progress** (`#me`): level badge, current/best streak, hours learned
(active time on lesson pages), lessons cleared, and a year calendar of active days. A doubt nobody else
answers within 12 hours is flagged to the admin (badge + "Waiting on you").
Inside a lesson, a failed run offers to ask a doubt with the code and error
already filled in; code examples have "Ask about this".

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | **The whole site in one file**: styles, app code and all 22 lessons inlined. This is what GitHub Pages serves and what you edit. |
| `supabase-schema.sql` | Database tables and access rules. Safe to re-run in Supabase. |
| `tests/test_v3.py` | Two-user browser test: chat, pins, solutions, points, levels, timer, calendar, roles. |
| `tests/test_lesson_ask.py` | Asking a doubt from a failed run / code example, with real Python. |
| `tests/db_tests.sql` | 25 permission checks; run inside `begin; … ` and abort, see the file. |
| `SETUP-EMAIL.md` | Step-by-step for going live with real accounts and free email (Supabase + Brevo). |
| `admin.html` | Redirects to `index.html#admin`. |
| `glimpse-lesson.html` | Standalone preview of one lesson. |
| `PYML-HANDOVER.md` | Full project context for picking the work up later. |
| `pyml-source.md` | Archive of the original multi-file source (`app/`, `content/`, `scripts/`). Those folders are not in this repo. |

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

With no Supabase keys it runs in **demo mode**. Three seeded accounts, password
`demo1234`: `admin@pyml.dev` (admin), `learner@pyml.dev` (learner),
`pending@pyml.dev` (blocked). They're listed on the sign-in screen. Demo
accounts live in your browser only and nothing is secured.

## Go live

Follow `SETUP-EMAIL.md`. In short: create free Supabase + Brevo accounts, run
`supabase-schema.sql`, point Supabase's SMTP at Brevo, then put the project URL
and anon key into `index.html`:

```js
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```

The anon key is public by design. The service_role key never goes in this repo.

## Email (free, via Brevo, 300/day)

The only email is the 6-digit sign-up code, sent by Supabase through Brevo SMTP.

## Add a lesson

Lessons live in the `const __LESSONS__ = [...]` array near the top of the
`<script>` in `index.html`, one object per lesson. Copy an existing lesson
object, change `id`, `order`, text and tests, then commit.

## Known limits

- Pyodide is a ~10 MB first load. Lesson text is readable while it loads.
- The repo is public, so lesson text is readable on GitHub.
- Emails sent from a Gmail address can land in spam. A verified domain in
  Brevo fixes it.
