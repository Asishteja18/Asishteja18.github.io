# AIM — AI & Machine Learning Institute

Telugu coders' home for learning to **build** AI, not just vibe-code it:
basic Python first, then machine learning, then your own models, all in one
path, learned together.


Python and machine learning taught by making you write the code. Lessons run a
real Python runtime in the browser and grade your work against tests.

Live at **https://telugucoders.com** · sign-up link: **https://telugucoders.com/#signup**

People sign up with email + password, verify a 6-digit emailed code, and go
straight into the lessons. One admin (asishtejavinnakota@gmail.com, enforced by
the database) can see every learner's stats and block accounts.

**Doubts** (`#doubts`): a group chat. Learners pick a code name (`AIM-` + their
choice), ask (first line = title, Enter to send), reply, and see who is online.
Unsolved doubts stay pinned on top. The asker marks a reply as the solution and
its author earns +2 points. Every lesson or AI-90 day cleared is +5. Points
(recomputed by the database from progress + solved doubts, so they can't be
farmed) set the level (Bronze 100, Silver 500,
Gold 1,500, Platinum 3,000, Diamond 6,000, Master 10,000, Grandmaster 16,000,
God tier 25,000).

**Your progress** (`#me`): level badge, current/best streak, hours learned
(active time on lesson pages), lessons cleared, and a year calendar of active days. A doubt nobody else
answers within 12 hours is flagged to the admin (badge + "Waiting on you").
Inside a lesson, a failed run offers to ask a doubt with the code and error
already filled in; code examples have "Ask about this".

**AI-90 — 90 days to build your own AI** (`content/ai90.json`): Days 1–30
(Python, automation, real data) sit in Stage 1 after the 10 warm-up lessons,
Days 31–60 (ML from scratch) in Stage 2, Days 61–90 (autograd engine → GPT →
chat, RAG, tools, server) in Stage 3. Each day has the syllabus Visual (ASCII
or Mermaid), the Notes with **runnable examples** (output and matplotlib plots
show inline), and a practice pane that runs the day's real tests (307 in all)
in a Web Worker. Earlier days a test imports are loaded from their reference
solutions, so nobody is blocked. 39 days carry an **interactive illustration**
(`assets/viz-*.js`, real Iris / airline / names / digits data).

**Look:** Midnight Slate & Frosted Neon — aurora mesh background, film grain,
frosted glass with an inner highlight, cursor-tracked spotlight borders on the
bento cards, GSAP staggered entrances (CSS fallback; reduced-motion respected).
"Frosted" light theme on the toggle.

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | The app: styles, code and the 24 warm-up lessons inlined. This is what GitHub Pages serves. |
| `content/ai90.json` | The 90 AI-90 days, **generated** — don't edit by hand. |
| `syllabus/AI90_MASTER.md` | The AI-90 source of truth (notes, visuals, tests, solutions). Edit this. |
| `notes/` | **90 per-day notes** (`dayNN-<topic>.md`) + `README.md` library + `links.json`, **generated** — read on GitHub or download from `telugucoders.com/notes/…`. Each AI-90 day page links to its note. |
| `tools/build_notes.py` | `python3 tools/build_notes.py` → rebuilds `notes/` from the master file. Run it before `build_ai90.py`. |
| `tests/test_notes_links.py` | Browser test of the per-day notes links (desktop + phone, 31 checks). |
| `tools/build_ai90.py` | `python3 tools/build_ai90.py` → rebuilds `content/ai90.json` (needs `pip install markdown`). |
| `assets/viz-*.js` | The interactive illustrations (core + Python, ML, AI) and their data. |
| `tests/ai90_pyodide.mjs` | Runs all 90 days in real Pyodide: `node tests/ai90_pyodide.mjs <pyodide-dist> solutions` (307/307) or `starters` (no crashes). |
| `tests/test_ai90_site.py` | Browser test of AI-90 + the redesign (40 checks: tests in the worker, plots, every illustration, phone layout). |
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

## Change the AI-90 course

Edit `syllabus/AI90_MASTER.md` (keep each day's Visual · Notes · Task · Tests ·
Solution · Done when), then:

```bash
python3 tools/build_ai90.py
node tests/ai90_pyodide.mjs /path/to/pyodide-0.29.5 solutions   # must stay 307/307
```

To attach an illustration to a day, add it to `VIZ` in `tools/build_ai90.py`
and write the widget in `assets/viz-*.js` (`V.W.<id> = (host) => {...}`).

## Add a warm-up lesson

Lessons live in the `const __LESSONS__ = [...]` array near the top of the
`<script>` in `index.html`, one object per lesson. Copy an existing lesson
object, change `id`, `order`, text and tests, then commit.

## Known limits

- Pyodide is a ~10 MB first load (plus NumPy/pandas/scikit-learn on the days that need them). Lesson text is readable while it loads.
- Days that call live websites (Day 19 weather, Day 20 scraping) are graded on offline parsing tests; the live call itself needs a local Python.
- Day 65 trains a tiny network in its test and takes ~1 minute in the browser; the Stop button appears after 4 s.
- The repo is public, so lesson text is readable on GitHub.
- Emails sent from a Gmail address can land in spam. A verified domain in
  Brevo fixes it.
