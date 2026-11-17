# PyML

Python and machine learning taught by making you write the code. Lessons run a
real Python runtime in the browser and grade your work against tests.

Live at **https://asishteja18.github.io** · sign-up link: **https://asishteja18.github.io/#signup**

People sign up with email + password, verify a 6-digit emailed code, and go
straight into the lessons. One admin (asishtejavinnakota@gmail.com, enforced by
the database) can see every learner's stats and block accounts.

**Doubts** (`#doubts`): learners pick a code name (`AIM-` + their choice), ask
questions, reply to each other, and see who is online. A doubt nobody else
answers within 12 hours is flagged to the admin (badge + "Waiting on you").

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | **The whole site in one file**: styles, app code and all 22 lessons inlined. This is what GitHub Pages serves and what you edit. |
| `supabase-schema.sql` | Database tables and access rules. Safe to re-run in Supabase. |
| `tests/test_v2.py` | Two-user browser test of doubts, presence, code names, roles (demo mode). |
| `tests/db_tests.sql` | 17 permission checks; run inside `begin; … ` and abort, see the file. |
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
