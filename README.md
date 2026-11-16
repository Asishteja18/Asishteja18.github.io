# PyML

Python and machine learning taught by making you write the code. Lessons run a
real Python runtime in the browser and grade your work against tests.

Live at **https://asishteja18.github.io** · invite link: **https://asishteja18.github.io/#signup**

Invite only: people request access, confirm their email, and see nothing until
an admin approves them.

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | **The whole site in one file**: styles, app code and all 22 lessons inlined. This is what GitHub Pages serves and what you edit. |
| `supabase-schema.sql` | Database tables, the approval rules and the email triggers. Run once in Supabase. |
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
`demo1234`: `admin@pyml.dev` (admin), `learner@pyml.dev` (approved),
`pending@pyml.dev` (locked out). They're listed on the sign-in screen. Demo
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

## Emails (free, via Brevo, 300/day)

| When | Who gets it |
|---|---|
| Someone requests access | them: "confirm your email" |
| They confirm | every admin: "new access request" + link to approve |
| An admin approves them | them: "you're in" |

## Add a lesson

Lessons live in the `const __LESSONS__ = [...]` array near the top of the
`<script>` in `index.html`, one object per lesson. Copy an existing lesson
object, change `id`, `order`, text and tests, then commit.

## Known limits

- Pyodide is a ~10 MB first load. Lesson text is readable while it loads.
- The repo is public, so lesson text is readable on GitHub. Approval controls
  who gets the app, not who can read the source.
- Emails sent from a Gmail address can land in spam. A verified domain in
  Brevo fixes it.
