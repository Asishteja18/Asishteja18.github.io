# PyML

Python and machine learning taught by making you write the code. Lessons run a
real Python runtime in the browser and grade your work against tests.

Invite only: new accounts land in a pending state and see nothing until an
admin approves them.

## Run it locally

```bash
python3 -m http.server 8000     # any static server will do
open http://localhost:8000
```

With no Supabase keys it starts in **demo mode**, pre-seeded with three
accounts (password `demo1234` for all of them):

| Account | State |
|---|---|
| `admin@pyml.dev` | admin — approves everyone else |
| `learner@pyml.dev` | approved — straight into the lessons |
| `pending@pyml.dev` | locked out — approve it as admin to watch it unlock |

They are listed on the sign-in screen; click one to fill the form. Everything
is stored in your browser and nothing is secured — fine for clicking through,
useless as a gate. Accounts you create yourself land pending, same as they will
in production.

## Go live (one-time)

1. Create a project at supabase.com (free tier).
2. SQL editor → paste `supabase/schema.sql` → run.
3. Copy the project URL and anon key into `app/config.js`.
4. Sign up on the site, then in the SQL editor:
   `update profiles set approved = true, is_admin = true where email = 'you@example.com';`
5. Push lessons into the database:
   ```bash
   npm i @supabase/supabase-js
   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-content.mjs
   ```

The anon key belongs in the client — it is public by design. Row-level
security is what enforces access, not the key. The **service key** is secret:
it goes in your shell for step 5 and nowhere near the repo.

## Add a lesson

Write `content/<track>/<id>.json` following `docs/LESSON_SCHEMA.md`, then:

```bash
python3 docs/validate_content.py          # schema + every solution must pass its own tests
node scripts/sync-content.mjs             # push to the database
git add . && git commit -m "lesson" && git push
```

The validator is not optional — it catches exercises whose solution does not
actually pass, which is the one bug learners cannot work around.

## Layout

```
index.html              sign in / lessons / practice
admin.html              approve or revoke accounts
app/config.js           your Supabase keys (blank = demo mode)
app/api.js              auth, lessons, progress — Supabase or demo behind one interface
app/app.js              UI
app/style.css
content/<track>/*.json  lesson source of truth
supabase/schema.sql     tables + the row-level policies that do the gating
scripts/sync-content.mjs
docs/
```

## Known limits

- Pyodide is a ~10 MB first load. The lesson text is readable while it loads;
  the exercise is not runnable until it finishes.
- If this repo is public, the lesson JSON is readable on GitHub regardless of
  who can log in. Keep the repo private if the content is the product.
