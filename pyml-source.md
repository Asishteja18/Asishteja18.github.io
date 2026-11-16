# PyML — full source
Every file of the running site, concatenated. Lesson content beyond the one
sample below lives in `content/<track>/*.json` and all follow the same schema.
Read `PYML-HANDOVER.md` first for what any of it is for.

---

## `index.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PyML — Python and machine learning, by writing it</title>
<meta name="description" content="Learn Python and machine learning by writing code in the browser. Invite only.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Sora:wght@500;600;700;800&display=swap">
<link rel="stylesheet" href="app/style.css">
<script src="https://cdn.jsdelivr.net/npm/pyodide@0.29.5/pyodide.js"></script>
</head>
<body>
<div id="root"></div>
<noscript><div class="centre"><p>PyML runs Python in your browser, so it needs JavaScript enabled.</p></div></noscript>
<script type="module" src="app/app.js"></script>
</body>
</html>
```

---

## `admin.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PyML — Access control</title>
<meta http-equiv="refresh" content="0; url=index.html#admin">
</head>
<body>
<p>Moved to <a href="index.html#admin">index.html#admin</a>.</p>
</body>
</html>
```

---

## `app/config.js`

```js
// Fill these in from Supabase → Project Settings → API.
// Leave blank to run in DEMO mode (local only, no real security).
// The anon key is public by design; row-level security does the enforcing.
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
```

---

## `app/api.js`

```js
// The whole backend behind one interface: Supabase when configured, a local
// demo store when not. Nothing else in the app knows which is running.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const DEMO_KEY = "pyml.demo.v1";
let sb = null;
let me = null; // {id, email, approved, is_admin}

/* ------------------------------------------------------------------ demo */
// shortcut: demo mode stores plaintext passwords in localStorage and enforces
// nothing — it exists so the UI is clickable before Supabase is wired up.
// Delete it once config.js is filled in.
export const DEMO_ACCOUNTS = [
  { email: "admin@pyml.dev", password: "demo1234", approved: true, is_admin: true,
    note: "admin — approves everyone else" },
  { email: "learner@pyml.dev", password: "demo1234", approved: true, is_admin: false,
    note: "approved learner — straight into the lessons" },
  { email: "pending@pyml.dev", password: "demo1234", approved: false, is_admin: false,
    note: "locked out — approve it as admin to let it in" },
];

const demo = {
  read() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch {}
    if (s && s.users) return s;
    const users = {};
    for (const a of DEMO_ACCOUNTS) {
      users[a.email] = { email: a.email, password: a.password, approved: a.approved, is_admin: a.is_admin };
    }
    return { users, current: null };
  },
  write(s) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(s)); } catch {} },
};

/* ------------------------------------------------------------------ init */
export async function init() {
  if (LIVE) {
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/+esm");
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await loadProfile();
  } else {
    const s = demo.read();
    me = s.current ? { id: s.current, ...s.users[s.current] } : null;
  }
  return me;
}

async function loadProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { me = null; return; }
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  me = data
    ? { id: user.id, email: data.email, approved: data.approved, is_admin: data.is_admin }
    // the signup trigger may not have committed yet; treat as unapproved
    : { id: user.id, email: user.email, approved: false, is_admin: false };
}

export function session() { return me; }

/* ------------------------------------------------------------------ auth */
export async function signUp(email, password) {
  if (LIVE) {
    const { error } = await sb.auth.signUp({ email, password });
    if (error) return { ok: false, error: error.message };
    await loadProfile();
    return { ok: true };
  }
  const s = demo.read();
  if (s.users[email]) return { ok: false, error: "That email already has an account." };
  // Seeded accounts already exist, so a new signup is never the first: it lands
  // pending, same as it will in production.
  s.users[email] = { email, password, approved: false, is_admin: false };
  s.current = email;
  demo.write(s);
  me = { id: email, ...s.users[email] };
  return { ok: true };
}

export async function signIn(email, password) {
  if (LIVE) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    await loadProfile();
    return { ok: true };
  }
  const s = demo.read();
  const u = s.users[email];
  if (!u || u.password !== password) return { ok: false, error: "Wrong email or password." };
  s.current = email; demo.write(s);
  me = { id: email, ...u };
  return { ok: true };
}

export async function signOut() {
  if (LIVE) await sb.auth.signOut();
  else { const s = demo.read(); s.current = null; demo.write(s); }
  me = null;
}

/* ----------------------------------------------------------------- admin */
export async function listUsers() {
  if (!me?.is_admin) return [];
  if (LIVE) {
    const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  return Object.values(demo.read().users).map((u) => ({
    id: u.email, email: u.email, approved: u.approved, is_admin: u.is_admin,
  }));
}

export async function setApproved(id, approved) {
  if (!me?.is_admin) return { ok: false, error: "Admins only." };
  if (LIVE) {
    const { error } = await sb.from("profiles").update({ approved }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  const s = demo.read();
  if (s.users[id]) { s.users[id].approved = approved; demo.write(s); }
  return { ok: true };
}

/* --------------------------------------------------------------- lessons */
export async function lessons() {
  if (LIVE) {
    // RLS returns nothing unless this account is approved — that is the gate.
    const { data, error } = await sb.from("lessons").select("*").order("order");
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      id: r.id, track: r.track, order: r.order, title: r.title,
      blurb: r.blurb, minutes: r.minutes, ...r.body,
    }));
  }
  if (!me?.approved) return [];
  const index = await (await fetch("content/index.json")).json();
  return Promise.all(index.map((p) => fetch("content/" + p).then((r) => r.json())))
    .then((ls) => ls.sort((a, b) => a.order - b.order));
}

/* -------------------------------------------------------------- progress */
export async function getProgress() {
  if (!me) return {};
  if (LIVE) {
    const { data } = await sb.from("progress").select("lesson_id,completed").eq("user_id", me.id);
    return Object.fromEntries((data || []).map((r) => [r.lesson_id, r.completed]));
  }
  try { return JSON.parse(localStorage.getItem("pyml.progress." + me.id)) || {}; }
  catch { return {}; }
}

export async function setDone(lessonId, completed) {
  if (!me) return;
  if (LIVE) {
    await sb.from("progress").upsert(
      { user_id: me.id, lesson_id: lessonId, completed, updated_at: new Date() },
      { onConflict: "user_id,lesson_id" });
    return;
  }
  const p = await getProgress();
  p[lessonId] = completed;
  try { localStorage.setItem("pyml.progress." + me.id, JSON.stringify(p)); } catch {}
}
```

---

## `app/app.js`

```js
import * as api from "./api.js";

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const root = $("#root");

function spinner(big) {
  const s = el("span", "spin" + (big ? " lg" : ""));
  s.setAttribute("role", "status");
  s.setAttribute("aria-label", "Loading");
  return s;
}

function busyButton(btn, label) {
  btn.disabled = true;
  btn.textContent = "";
  btn.append(spinner(), document.createTextNode(label));
}

let LESSONS = [], PROGRESS = {}, pyodide = null, pyBoot = null;

const TRACKS = [
  { id: "python", title: "Introduction to Python", short: "Python",
    why: "Every machine-learning idea you will ever read is written in Python. Not because it is the best language. The field simply agreed on it." },
  { id: "ml", title: "How machine learning actually works", short: "Machine Learning", locked: true,
    why: "A model is a function with numbers you can tune. Loss tells it when it is wrong; gradient descent makes it less wrong. You build every piece of it by hand." },
  { id: "ai", title: "Build your own AI", short: "Build your own AI", locked: true,
    why: "A neural network that learns, in under sixty lines, written by you. Then an honest account of what separates those lines from a large language model." },
];

function trackMeta(id) {
  return TRACKS.find((t) => t.id === id) || { id, title: id, why: "" };
}
function orderedTracks() {
  const present = [...new Set(LESSONS.map((l) => l.track))];
  const known = TRACKS.map((t) => t.id).filter((id) => present.includes(id));
  return known.concat(present.filter((id) => !known.includes(id)));
}

/* ==================================================================== auth */
function authShell(body, pitch) {
  root.innerHTML = "";
  const page = el("div", pitch ? "landing" : "centre");
  const card = el("div", "auth");
  const brand = el("div", "brand");
  brand.append(el("span", "dot"), document.createTextNode("PyML"));
  const lede = el("p", "lede",
    "Python and machine learning, built by writing code rather than watching someone else write it.");
  card.append(brand, lede, body);
  if (!api.LIVE) {
    const n = el("p", "note");
    n.style.marginTop = "16px";
    n.textContent = "Demo mode. Accounts live in this browser only and nothing is secured. Add Supabase keys in app/config.js to go live.";
    card.append(n);
  }
  if (pitch) { page.append(pitchColumn(), card); }
  else { page.append(card); }
  root.append(page);
}

function pitchColumn() {
  const col = el("div", "pitch");

  col.append(el("h1", null, "Most people meet AI as a box that answers questions."));
  col.append(el("p", "big",
    "A much smaller number know what is inside the box. The distance between those two groups is not talent. It is about twenty-two lessons of writing code yourself."));

  const why = el("div", "why");
  why.append(el("h2", null, "Why bother learning this"));
  [
    ["You stop guessing.", "When a model gives a bad answer, you either shrug or you know where to look. Knowing where to look is the entire job."],
    ["You can build your own.", "Tools built by other people solve other people's problems. Yours needs you."],
    ["It is smaller than it looks.", "Tune some numbers until the error stops shrinking. Everything else is detail stacked on that one idea."],
  ].forEach(([h, p]) => {
    const r = el("div", "whyrow");
    r.append(el("b", null, h), el("span", null, p));
    why.append(r);
  });
  col.append(why);

  const path = el("div", "path");
  path.append(el("h2", null, "The path"));
  TRACKS.forEach((t, i) => {
    const step = el("div", "step");
    step.append(el("span", "stepn", "Part " + (i + 1)));
    const b = el("div");
    b.append(el("h3", null, t.title), el("p", null, t.why));
    step.append(b);
    path.append(step);
  });
  col.append(path);

  col.append(el("p", "closer",
    "Twenty-two lessons. Every one ends with code you write and tests that either pass or do not."));
  return col;
}

function renderAuth(tab = "in") {
  const panel = el("div", "panel");
  const tabs = el("div", "tabs");
  const bIn = el("button", null, "Sign in"), bUp = el("button", null, "Request access");
  bIn.setAttribute("aria-selected", tab === "in");
  bUp.setAttribute("aria-selected", tab === "up");
  bIn.onclick = () => renderAuth("in");
  bUp.onclick = () => renderAuth("up");
  tabs.append(bIn, bUp);

  const form = el("form");
  form.innerHTML =
    '<div class="field"><label for="em">Email</label><input id="em" type="email" required autocomplete="email"></div>' +
    '<div class="field"><label for="pw">Password</label><input id="pw" type="password" required minlength="8" ' +
    'autocomplete="' + (tab === "up" ? "new-password" : "current-password") + '"></div>';
  const btn = el("button", "btn", tab === "in" ? "Sign in" : "Request access");
  btn.type = "submit";
  const err = el("p", "err");
  form.append(btn, err);
  if (tab === "up") {
    const n = el("p", "note");
    n.style.marginTop = "12px";
    n.textContent = "New accounts need an admin to approve them before lessons unlock.";
    form.append(n);
  }

  if (tab === "in" && !api.LIVE) {
    const box = el("div", "demo-logins");
    box.append(el("p", "note", "Demo accounts. Click one to fill the form. Password is demo1234."));
    api.DEMO_ACCOUNTS.forEach((a) => {
      const row = el("div", "demo-row");
      const b = el("button", "btn ghost sm", a.email);
      b.type = "button";
      b.onclick = () => {
        $("#em").value = a.email;
        $("#pw").value = a.password;
        err.textContent = "";
      };
      row.append(b, el("span", "note", a.note));
      box.append(row);
    });
    form.append(box);
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    err.textContent = "";
    busyButton(btn, tab === "in" ? "Signing in" : "Sending");
    const email = $("#em").value.trim(), pw = $("#pw").value;
    const r = tab === "in" ? await api.signIn(email, pw) : await api.signUp(email, pw);
    if (!r.ok) {
      err.textContent = r.error; btn.disabled = false;
      btn.textContent = tab === "in" ? "Sign in" : "Request access";
      return;
    }
    render();
  };

  panel.append(tabs, form);
  authShell(panel, true);
}

function renderPending() {
  const panel = el("div", "panel pending");
  panel.append(el("div", "ring"));
  panel.append(el("h2", null, "Waiting for approval"));
  panel.append(el("p", null,
    "Your account exists but an admin has not let you in yet. You will not see lessons until they do."));
  const out = el("button", "btn ghost", "Sign out");
  out.onclick = async () => { await api.signOut(); render(); };
  panel.append(out);
  authShell(panel, false);
}

/* ==================================================================== bar */
function topBar() {
  const me = api.session();
  const bar = el("div", "bar");
  bar.append(menuButton());
  const logo = el("div", "logo");
  logo.append(el("span", "dot"), document.createTextNode("PyML"));
  logo.style.cursor = "pointer";
  logo.onclick = () => { location.hash = ""; };
  bar.append(logo);
  bar.append(el("span", api.LIVE ? "tag ok" : "tag demo", api.LIVE ? "Live" : "Demo"));
  const sp = el("span", "sp"); bar.append(sp);
  bar.append(themeButton());
  bar.append(youButton(me));

  // the panel is a sibling of the bar, so every signed-in screen carries it
  const frag = document.createDocumentFragment();
  const scrim = el("div", "scrim" + (PANEL ? " on" : ""));
  scrim.onclick = () => togglePanel(false);
  frag.append(bar, scrim, profilePanel());
  return frag;
}

// Entering the course drops you into dark, which is what a coding surface
// wants. An explicit toggle choice always wins and is never overwritten.
function courseDark() {
  try {
    if (localStorage.getItem("pyml.theme")) return;
    localStorage.setItem("pyml.theme", "dark");
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", "dark");
}

// Both palettes are designed, so give people a way to see the other one.
function themeButton() {
  const b = el("button", "btn ghost sm themebtn");
  const paint = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
       matchMedia("(prefers-color-scheme: dark)").matches);
    b.textContent = dark ? "Light" : "Dark";
    b.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " theme");
  };
  b.onclick = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
       matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("pyml.theme", next); } catch (e) {}
    paint();
  };
  paint();
  return b;
}

try {
  const saved = localStorage.getItem("pyml.theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
} catch (e) {}

/* ================================================================= panel */
// One account menu for every signed-in screen. It is also the only stop list
// outside the map, so it doubles as navigation.
let PANEL = false;

const CARET_SVG = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
  '<path d="M4.5 2.5 8.5 6l-4 3.5" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';

function caretIcon() {
  const c = el("span", "caret");
  c.innerHTML = CARET_SVG;
  return c;
}

function togglePanel(on) {
  PANEL = on;
  const p = $(".mepanel"), sc = $(".scrim"), b = $(".whobtn"), m = $(".menubtn");
  if (p) {
    p.classList.toggle("open", on);
    p.setAttribute("aria-hidden", on ? "false" : "true");
  }
  if (sc) sc.classList.toggle("on", on);
  [b, m].forEach((n) => { if (n) n.setAttribute("aria-expanded", on ? "true" : "false"); });
  if (on && p) { const x = p.querySelector(".mex"); if (x) x.focus(); }
  else if (b) b.focus();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && PANEL) togglePanel(false);
});

function initial(email) { return (email || "?").charAt(0).toUpperCase(); }
function meName(me) { return (me.email || "").split("@")[0]; }

/* ------------------------------------------------------------- streak */
// shortcut: counts days you opened the site, not days you cleared work, and it
// lives in this browser only. Move it to a Supabase column with the progress.
const STREAK_KEY = "pyml.streak.v1";

function dayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}

function streakStore() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || {}; } catch (e) { return {}; }
}

function touchStreak() {
  const me = api.session();
  if (!me) return 0;
  const all = streakStore();
  const r = all[me.id] || { last: null, days: 0 };
  const t = dayKey(new Date());
  if (r.last !== t) {
    // a gap of more than one day starts again from one
    r.days = r.last === dayKey(new Date(Date.now() - 864e5)) ? r.days + 1 : 1;
    r.last = t;
    all[me.id] = r;
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(all)); } catch (e) {}
  }
  return r.days;
}

function streakDays() {
  const me = api.session();
  const r = me && streakStore()[me.id];
  return r ? r.days : 0;
}

function streakLabel() { return streakDays() + " day streak"; }

function menuButton() {
  const b = el("button", "menubtn");
  b.innerHTML = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
    '<path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round"/></svg>';
  b.setAttribute("aria-label", "Menu");
  b.setAttribute("aria-haspopup", "true");
  b.setAttribute("aria-expanded", PANEL ? "true" : "false");
  b.onclick = () => togglePanel(!PANEL);
  return b;
}

function youButton(me) {
  const b = el("button", "whobtn");
  b.append(el("span", "meav", initial(me.email)));
  const t = el("span", "whotext");
  t.append(el("span", "whoname", meName(me)));
  t.append(el("span", "who", streakLabel()));
  b.append(t);
  b.setAttribute("aria-haspopup", "true");
  b.setAttribute("aria-expanded", PANEL ? "true" : "false");
  b.setAttribute("aria-label", "Your profile");
  b.onclick = () => togglePanel(!PANEL);
  return b;
}

function meStat(value, label) {
  const d = el("div", "mestat");
  d.append(el("b", null, String(value)), el("span", null, label));
  return d;
}

function profilePanel() {
  const me = api.session();
  const panel = el("aside", "mepanel" + (PANEL ? " open" : ""));
  panel.setAttribute("aria-label", "Your profile");
  panel.setAttribute("aria-hidden", PANEL ? "false" : "true");

  const head = el("div", "mehead");
  head.append(el("span", "meav", initial(me.email)));
  const who = el("div", "mewho");
  who.append(el("span", "mename", me.email.split("@")[0]));
  who.append(el("span", "memail", me.email));
  head.append(who);
  const x = el("button", "mex");
  x.setAttribute("aria-label", "Close profile");
  x.innerHTML = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round"/></svg>';
  x.onclick = () => togglePanel(false);
  head.append(x);
  panel.append(head);

  const chips = el("div", "mechips");
  chips.append(el("span", me.is_admin ? "tag ok" : "tag", me.is_admin ? "Admin" : "Learner"));
  chips.append(el("span", api.LIVE ? "tag ok" : "tag demo", api.LIVE ? "Live" : "Demo"));
  chips.append(el("span", "tag ok", streakLabel()));
  panel.append(chips);

  const cleared = LESSONS.filter((l) => PROGRESS[l.id]);
  const mins = cleared.reduce((a, l) => a + (l.minutes || 0), 0);
  const stats = el("div", "mestats");
  stats.append(meStat(cleared.length, "cleared"));
  stats.append(meStat(LESSONS.length - cleared.length, "to go"));
  stats.append(meStat(mins >= 60 ? (mins / 60).toFixed(1) + "h" : mins + "m", "logged"));
  panel.append(stats);

  const here = location.hash.slice(1);
  const body = el("div", "mebody");
  orderedTracks().forEach((tid, i) => {
    const meta = trackMeta(tid);
    const ls = LESSONS.filter((l) => l.track === tid);
    if (!ls.length) return;
    const done = ls.filter((l) => PROGRESS[l.id]).length;
    const open = tid === here || ls.some((l) => l.id === here) || (!here && i === 0);

    const sect = el("section", "sect" + (open ? " open" : ""));
    const sh = el("button", "secthead");
    sh.setAttribute("aria-expanded", open ? "true" : "false");
    sh.append(caretIcon(), el("span", "secttitle", meta.short || meta.title));
    sh.append(el("span", "sectcount", meta.locked ? "Locked" : done + "/" + ls.length));
    sh.onclick = () => {
      const now = !sect.classList.contains("open");
      sect.classList.toggle("open", now);
      sh.setAttribute("aria-expanded", now ? "true" : "false");
    };
    sect.append(sh);

    const nextId = (ls.find((l) => !PROGRESS[l.id]) || {}).id;
    const list = el("ul", "melist");
    ls.forEach((l) => {
      const isDone = !!PROGRESS[l.id];
      const b = el("button", "meitem" + (isDone ? " cleared" : "") +
        (meta.locked ? " off" : l.id === nextId ? " now" : ""));
      b.append(el("span", "medot"), el("span", "metitle", l.title));
      if (meta.locked) {
        b.disabled = true;
      } else {
        if (isDone) b.setAttribute("aria-label", l.title + " — cleared");
        b.onclick = () => { togglePanel(false); location.hash = l.id; };
      }
      const li = el("li");
      li.append(b);
      list.append(li);
    });
    sect.append(list);
    body.append(sect);
  });
  panel.append(body);

  const foot = el("div", "mefoot");
  if (me.is_admin) {
    const a = el("button", "btn ghost sm", "Admin");
    a.onclick = () => { togglePanel(false); location.hash = "admin"; };
    foot.append(a);
  }
  const out = el("button", "btn ghost sm", "Sign out");
  out.onclick = async () => { togglePanel(false); await api.signOut(); render(); };
  foot.append(out);
  panel.append(foot);
  return panel;
}

/* =================================================================== hub */
const GLYPH = {
  "python": "<svg viewBox=\"0 0 32 32\" fill=\"none\" aria-hidden=\"true\"><path d=\"M11 8 5 16l6 8M21 8l6 8-6 8M18.5 6l-5 20\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  "ml": "<svg viewBox=\"0 0 32 32\" fill=\"none\" aria-hidden=\"true\"><path d=\"M4 27h24M6 22l6-7 5 4 8-11\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"15\" r=\"2.4\" fill=\"currentColor\"/><circle cx=\"17\" cy=\"19\" r=\"2.4\" fill=\"currentColor\"/><circle cx=\"25\" cy=\"8\" r=\"2.4\" fill=\"currentColor\"/></svg>",
  "ai": "<svg viewBox=\"0 0 32 32\" fill=\"none\" aria-hidden=\"true\"><path d=\"M8 9h7M8 23h7M22 16h-7M15 9v14\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><circle cx=\"6\" cy=\"9\" r=\"3.2\" stroke=\"currentColor\" stroke-width=\"2.2\"/><circle cx=\"6\" cy=\"23\" r=\"3.2\" stroke=\"currentColor\" stroke-width=\"2.2\"/><circle cx=\"25\" cy=\"16\" r=\"3.2\" stroke=\"currentColor\" stroke-width=\"2.2\"/></svg>"
};

function renderHub() {
  root.innerHTML = "";
  root.append(topBar());
  const wrap = el("div", "wrap hubwrap");

  const head = el("div", "head");
  head.append(el("h1", null, "Choose your path"));
  head.append(el("p", null,
    "Three stages, and they lock together in one order. Python first, because the two after it are written in it."));
  wrap.append(head);

  const cubes = el("div", "cubes");
  orderedTracks().forEach((id, i) => {
    const meta = trackMeta(id);
    const ls = LESSONS.filter((l) => l.track === id);
    const done = ls.filter((l) => PROGRESS[l.id]).length;
    const locked = !!meta.locked;

    if (i > 0) {
      const link = el("i", "link" + (locked ? "" : " live"));
      link.setAttribute("aria-hidden", "true");
      cubes.append(link);
    }

    const cube = el(locked ? "div" : "button", "cube " + (locked ? "locked" : "open"));
    const glyph = el("span", "glyph");
    glyph.innerHTML = GLYPH[id] || GLYPH.python;
    cube.append(glyph);
    const body = el("span", "cubebody");
    body.append(el("span", "cubenum", "Stage " + (i + 1)));
    body.append(el("span", "cubetitle", meta.short || meta.title));
    body.append(el("span", "cubemeta", locked
      ? ls.length + " stops · locked"
      : done + " of " + ls.length + " cleared"));
    body.append(el("span", locked ? "cubetag" : "cubetag go",
      locked ? "Coming soon" : (done ? "Continue" : "Start here")));
    cube.append(body);
    if (!locked) {
      cube.onclick = () => { location.hash = id; };
      cube.setAttribute("aria-label", "Open " + meta.title);
    }
    cube.style.animationDelay = i * 90 + "ms";
    cubes.append(cube);
  });
  wrap.append(cubes);

  const note = el("p", "hubnote");
  note.textContent = "Machine learning and the build-your-own-AI stage unlock once the Python path is finished. They are written and waiting, not empty.";
  wrap.append(note);

  root.append(wrap);
}

/* =================================================================== map */
// The track is a python winding down the page. Topics sit on the peaks of a
// parabolic serpentine; the body is a tapered outline built from the centre
// line, grown only as far as the stop you have reached.
const OPEN = new Set();
let OPEN_READY = false;

// How far the python has been pulled along each section. Browser-local polish,
// not authoritative progress: it only ever runs ahead of real completions, and
// never behind them.
const REACH_KEY = "pyml.reach.v1";
function reachAll() {
  try { return JSON.parse(localStorage.getItem(REACH_KEY)) || {}; } catch (e) { return {}; }
}
function reachId(track, section) {
  const me = api.session();
  return (me ? me.id : "?") + "|" + track + "|" + section;
}
function getReach(track, section) { return reachAll()[reachId(track, section)] || 0; }
function setReach(track, section, i) {
  const m = reachAll(), k = reachId(track, section);
  if ((m[k] || 0) >= i) return;
  m[k] = i;
  try { localStorage.setItem(REACH_KEY, JSON.stringify(m)); } catch (e) {}
}
const SVGNS = "http://www.w3.org/2000/svg";

function svg(tag, attrs) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

function sectionsOf(ls) {
  const out = [];
  ls.forEach((l) => {
    const name = l.section || "Introduction";
    let s = out.find((x) => x.name === name);
    if (!s) { s = { name, items: [] }; out.push(s); }
    s.items.push(l);
  });
  return out;
}

/* Peaks alternate side to side; consecutive peaks are joined by a cubic whose
   control points sit on the vertical through each peak, which gives the
   rounded parabolic arc rather than a diagonal. */
function centreLine(peaks) {
  let d = `M ${peaks[0].x} ${peaks[0].y - 46}`;
  d += ` L ${peaks[0].x} ${peaks[0].y}`;
  for (let i = 0; i < peaks.length - 1; i++) {
    const a = peaks[i], b = peaks[i + 1], m = (a.y + b.y) / 2;
    d += ` C ${a.x} ${m}, ${b.x} ${m}, ${b.x} ${b.y}`;
  }
  return d;
}

function taperedBody(pathEl, from, to, wStart, wEnd, samples) {
  const L = pathEl.getTotalLength();
  if (!L) return "";
  const N = samples || 120, a = [], b = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const len = (from + (to - from) * t) * L;
    const p = pathEl.getPointAtLength(len);
    const q = pathEl.getPointAtLength(Math.min(L, len + 1.2));
    const dx = q.x - p.x, dy = q.y - p.y;
    const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m;
    const w = (wStart + (wEnd - wStart) * t) / 2;
    a.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`);
    b.push(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`);
  }
  return "M " + a.join(" L ") + " L " + b.reverse().join(" L ") + " Z";
}

function lengthAtY(pathEl, targetY) {
  const L = pathEl.getTotalLength();
  if (!L) return 0;
  let lo = 0, hi = L;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    pathEl.getPointAtLength(mid).y < targetY ? (lo = mid) : (hi = mid);
  }
  return ((lo + hi) / 2) / L;
}

function buildHead(headW) {
  const r = headW / 2;
  const head = svg("g", { class: "snakehead" });
  head.dataset && (head.dataset.r = String(r));
  head.append(svg("path", {
    d: `M ${-r} 2 Q ${-r} ${-r * 1.5} 0 ${-r * 1.7} Q ${r} ${-r * 1.5} ${r} 2 Q ${r} ${r * 1.1} 0 ${r * 1.2} Q ${-r} ${r * 1.1} ${-r} 2 Z`,
    fill: "url(#scales)", class: "headshape",
  }));
  head.append(svg("circle", { cx: String(-r * 0.42), cy: String(-r * 0.5), r: "2.6", class: "eye" }));
  head.append(svg("circle", { cx: String(r * 0.42), cy: String(-r * 0.5), r: "2.6", class: "eye" }));
  head.append(svg("path", {
    d: `M 0 ${-r * 1.7} l 0 -7 m -3.5 0 l 3.5 4 l 3.5 -4`,
    class: "tongue", fill: "none", "stroke-width": "1.6", "stroke-linecap": "round",
  }));
  return head;
}

function placeHead(head, spine, t) {
  const L = spine.getTotalLength();
  const p = spine.getPointAtLength(L * t);
  const q = spine.getPointAtLength(Math.max(0, L * t - 6));
  const ang = Math.atan2(p.y - q.y, p.x - q.x) * 180 / Math.PI;
  head.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang + 90})`);
}

// Clicking a topic ahead of the head pulls the python forward to it. The body
// is rebuilt per frame at a coarser sample count, then settled at full detail.
function growSnake(road, toIdx, after) {
  const s = road.__snake;
  if (!s || toIdx <= s.reached) return after && after();
  const target = Math.min(1, lengthAtY(s.spine, s.peaks[Math.min(toIdx, s.peaks.length - 1)].y));
  const from = s.grown;
  s.reached = toIdx;
  s.grown = target;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const d = taperedBody(s.spine, 0, target, 3, s.headW);
    s.body.setAttribute("d", d); s.sheen.setAttribute("d", d);
    placeHead(s.head, s.spine, target);
    return after && after();
  }
  const t0 = performance.now(), dur = 700;
  (function frame(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    const t = from + (target - from) * e;
    const d = taperedBody(s.spine, 0, t, 3, s.headW, 70);
    s.body.setAttribute("d", d); s.sheen.setAttribute("d", d);
    placeHead(s.head, s.spine, t);
    if (p < 1) return requestAnimationFrame(frame);
    const fin = taperedBody(s.spine, 0, target, 3, s.headW);
    s.body.setAttribute("d", fin); s.sheen.setAttribute("d", fin);
    road.querySelectorAll(".peakdot").forEach((dot, i) =>
      dot.classList.toggle("on", i <= toIdx));
    after && after();
  })(performance.now());
}

function buildSnake(host, peaks, reachedIdx, width, height) {
  const narrow = width < 760;
  const wrap = svg("svg", {
    class: "snake", width: "100%", height: String(height),
    viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true",
  });

  const defs = svg("defs", {});
  // scales: one tile of overlapping arcs, repeated across the body
  const pat = svg("pattern", {
    id: "scales", width: "18", height: "14", patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(8)",
  });
  pat.append(svg("rect", { width: "18", height: "14", fill: "var(--snake-mid)" }));
  [[0, 0], [9, 7], [18, 0], [0, 14], [18, 14]].forEach(([cx, cy]) => {
    pat.append(svg("path", {
      d: `M ${cx - 9} ${cy + 7} a 9 7 0 0 1 18 0`,
      fill: "none", stroke: "var(--snake-dark)", "stroke-width": "1.4",
    }));
  });
  defs.append(pat);

  const sheen = svg("linearGradient", { id: "sheen", x1: "0", y1: "0", x2: "1", y2: "0" });
  [["0%", "var(--snake-dark)", ".85"], ["34%", "var(--snake-light)", ".55"],
   ["62%", "var(--snake-mid)", "0"], ["100%", "var(--snake-dark)", ".6"]]
    .forEach(([o, c, op]) =>
      sheen.append(svg("stop", { offset: o, "stop-color": c, "stop-opacity": op })));
  defs.append(sheen);
  wrap.append(defs);

  const d = centreLine(peaks);
  const spine = svg("path", { d, fill: "none", stroke: "none" });
  wrap.append(spine);

  // the road still to travel, ghosted
  wrap.append(svg("path", {
    d, class: "ahead", fill: "none", "stroke-width": "3",
    "stroke-dasharray": "2 10", "stroke-linecap": "round",
  }));

  host.append(wrap);          // must be in the document before it can be measured

  // Arc length is not linear in y, so walk the path to find the length at the
  // reached peak. Growing by (i+1)/n overshoots and parks the head mid-curve.
  const grown = Math.min(1, lengthAtY(spine, peaks[Math.min(reachedIdx, peaks.length - 1)].y));
  const headW = narrow ? 24 : 34;
  const body = taperedBody(spine, 0, grown, 3, headW);
  const bodyEl = svg("path", { d: body, class: "snakebody", fill: "url(#scales)" });
  const sheenEl = svg("path", { d: body, class: "snakesheen", fill: "url(#sheen)" });
  wrap.append(bodyEl, sheenEl);

  const head = buildHead(headW);
  placeHead(head, spine, grown);
  wrap.append(head);

  host.__snake = { spine, body: bodyEl, sheen: sheenEl, head, peaks, headW,
                   grown, reached: reachedIdx };

  peaks.forEach((p, i) => {
    const reached = i <= reachedIdx;
    wrap.append(svg("circle", {
      cx: String(p.x), cy: String(p.y), r: reached ? "6" : "4.5",
      class: "peakdot" + (reached ? " on" : ""),
    }));
  });
  return wrap;
}

function renderTracks(trackId) {
  const id = trackId || "python";
  const meta = trackMeta(id);
  const ls = LESSONS.filter((l) => l.track === id);
  const done = ls.filter((l) => PROGRESS[l.id]).length;

  root.innerHTML = "";
  root.append(topBar());
  const wrap = el("div", "wrap");

  const back = el("button", "backlink", "← All stages");
  back.onclick = () => { location.hash = ""; };
  wrap.append(back);

  const head = el("div", "head");
  head.append(el("span", "part", "Stage " + (orderedTracks().indexOf(id) + 1)));
  head.append(el("h1", null, meta.title));
  head.append(el("p", null, meta.why || ""));
  const meter = el("div", "meter");
  const bar = el("div", "track"), fill = el("i");
  fill.style.width = ls.length ? (done / ls.length * 100) + "%" : "0%";
  bar.append(fill);
  meter.append(bar, el("span", "n", done + " of " + ls.length + " challenges cleared"));
  head.append(meter);
  wrap.append(head);

  if (!ls.length) {
    wrap.append(el("p", "empty", "No stops here yet."));
    root.append(wrap);
    return;
  }

  const nextId = (ls.find((l) => !PROGRESS[l.id]) || {}).id;
  const groups = sectionsOf(ls);
  if (!OPEN_READY) {
    const live = groups.find((g) => g.items.some((l) => l.id === nextId)) || groups[0];
    OPEN.add(live.name);
    OPEN_READY = true;
  }

  groups.forEach((g) => {
    const gDone = g.items.filter((l) => PROGRESS[l.id]).length;
    const isOpen = OPEN.has(g.name);
    const sect = el("section", "sect" + (isOpen ? " open" : ""));

    const sh = el("button", "secthead");
    sh.setAttribute("aria-expanded", isOpen ? "true" : "false");
    sh.append(caretIcon(), el("span", "secttitle", g.name));
    sh.append(el("span", "sectcount", gDone + "/" + g.items.length));
    sh.onclick = () => {
      OPEN.has(g.name) ? OPEN.delete(g.name) : OPEN.add(g.name);
      render();
    };
    sect.append(sh);

    const road = el("div", "road");
    sect.append(road);
    wrap.append(sect);

    if (!isOpen) return;

    const cleared = Math.max(0, g.items.findIndex((l) => l.id === nextId));
    const reached = Math.min(g.items.length - 1, Math.max(cleared, getReach(id, g.name)));
    g.items.forEach((l, k) => {
      const isDone = !!PROGRESS[l.id];
      const now = l.id === nextId;
      const state = isDone ? "past" : now ? "live" : "ahead";
      const stop = el("div", "peak " + state + (k % 2 ? " right" : " left"));
      stop.style.setProperty("--row", String(k));
      stop.style.animationDelay = Math.min(k, 8) * 55 + "ms";

      const card = el("button", "peakcard");
      card.title = l.blurb;
      const badge = el("span", "peakno");
      if (isDone) {
        badge.innerHTML = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
          '<path d="M2 6.3 4.7 9 10 3.2" stroke="currentColor" stroke-width="2.4" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        badge.textContent = String(l.order).padStart(2, "0");
      }
      const top = el("span", "peaktop");
      top.append(badge);
      if (now) top.append(el("span", "youhere", "You are here"));
      top.append(el("span", "m", l.minutes + " min"));
      card.append(top);
      card.append(el("span", "rtitle", l.title));
      if (now) card.append(el("span", "b", l.blurb));
      card.onclick = () => {
        const go = () => { location.hash = l.id; };
        const s = road.__snake;
        if (s && k > s.reached) { setReach(id, g.name, k); growSnake(road, k, go); }
        else go();
      };

      stop.append(card);
      road.append(stop);
    });

    // measure after layout so the serpentine lines up with the real cards
    requestAnimationFrame(() => {
      const w = road.clientWidth;
      if (!w) return;
      const narrow = w < 760;
      const rows = g.items.length;
      const band = narrow ? 118 : 184;
      const h = rows * band + 40;
      road.style.height = h + "px";
      const xl = narrow ? 28 : Math.round(w * 0.38);
      const xr = narrow ? 52 : Math.round(w * 0.62);
      const peaks = g.items.map((_, k) => ({
        x: k % 2 ? xr : xl,
        y: Math.round(k * band + band / 2) + 20,
      }));
      road.querySelectorAll(".peak").forEach((p, k) => {
        p.style.top = peaks[k].y + "px";
        if (!narrow) p.style.setProperty("--peakx", peaks[k].x + "px");
      });
      road.querySelectorAll("svg.snake").forEach((s) => s.remove());
      buildSnake(road, peaks, reached, w, h);
    });
  });

  root.append(wrap);
}

/* ================================================================= lesson */
function renderLesson(l) {
  root.innerHTML = "";
  root.append(topBar());
  const grid = el("div", "grid");

  /* ---- left: the teaching ---- */
  const left = el("div", "pane lesson");
  left.append(el("span", "kicker",
    "Lesson " + String(l.order).padStart(2, "0") + " · " + trackMeta(l.track).title));
  left.append(el("h1", null, l.title));
  left.append(el("p", "sub", l.blurb));

  const obj = el("div", "obj");
  obj.append(el("h2", null, "After this you can"));
  const ul = el("ul");
  l.objectives.forEach((o) => ul.append(el("li", null, o)));
  obj.append(ul); left.append(obj);

  l.sections.forEach((s) => {
    if (s.type === "prose") {
      // Trusted: lesson HTML ships in our own repo, not user input.
      const d = el("div"); d.innerHTML = s.html; left.append(d);
    } else if (s.type === "code") {
      if (s.caption) left.append(el("p", "cap", s.caption));
      const pre = el("pre"); pre.textContent = s.code; left.append(pre);
    } else if (s.type === "callout") {
      const c = el("div", "callout " + (s.kind === "tip" ? "tip" : "warn"));
      c.append(el("b", null, s.title));
      c.append(document.createTextNode(s.body));
      left.append(c);
    }
  });

  const nav = el("div");
  nav.style.cssText = "display:flex;gap:9px;margin-top:26px;flex-wrap:wrap";
  const toMap = el("button", "btn ghost sm", "← Map");
  toMap.onclick = () => { location.hash = l.track; };
  nav.append(toMap);
  const i = LESSONS.findIndex((x) => x.id === l.id);
  if (i > 0) {
    const b = el("button", "btn ghost sm", "← " + LESSONS[i - 1].title);
    b.onclick = () => { location.hash = LESSONS[i - 1].id; };
    nav.append(b);
  }
  if (i < LESSONS.length - 1) {
    const b = el("button", "btn ghost sm", LESSONS[i + 1].title + " →");
    b.onclick = () => { location.hash = LESSONS[i + 1].id; };
    nav.append(b);
  }
  left.append(nav);

  /* ---- right: the practice ---- */
  const right = el("div", "pane");
  const ptop = el("div", "ptop");
  ptop.append(el("span", "ptitle", "Practice"));
  const status = el("span", "status");
  const led = spinner(), stxt = el("span", null, "Starting Python");
  status.append(led, stxt); ptop.append(status);
  right.append(ptop);

  right.append(el("div", "brief", l.exercise.brief));

  const ed = el("div", "editor");
  ed.append(el("div", "ehead", "exercise.py"));
  const ta = el("textarea");
  ta.spellcheck = false;
  ta.setAttribute("aria-label", "Python code editor");
  ta.value = l.exercise.starter;
  ed.append(ta);
  const erow = el("div", "erow");
  const run = el("button", "btn"); run.disabled = true;
  run.append(el("span", null, "Run tests"));
  const reset = el("button", "btn ghost sm", "Reset");
  const sol = el("button", "btn ghost sm", "Show solution");
  const hint = el("span"); hint.style.marginLeft = "auto";
  hint.innerHTML = "<kbd>Ctrl</kbd> + <kbd>Enter</kbd>";
  erow.append(run, reset, sol, hint);
  ed.append(erow); right.append(ed);

  const tests = el("div", "tests"); right.append(tests);
  const out = el("div", "out");
  out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite");
  right.append(out);
  const done = el("div", "done"); done.hidden = true;
  done.innerHTML = "<b>All tests passed.</b> ";
  done.append(document.createTextNode("Marked complete."));
  right.append(done);

  function setStatus(t, cls, busy) {
    status.className = "status" + (cls ? " " + cls : "");
    stxt.textContent = t;
    const mark = busy ? spinner() : el("span", "led");
    status.replaceChild(mark, status.firstChild);
  }
  function paint(results) {
    tests.innerHTML = "";
    l.exercise.tests.forEach((t, k) => {
      const r = results && results[k];
      const row = el("div", "t" + (r ? (r.pass ? " pass" : " fail") : ""));
      const ic = el("span", "ic");
      ic.innerHTML = '<svg viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
        '<path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';
      row.append(ic, el("span", "lab", t.label), el("span", "got", r && !r.pass ? r.detail : ""));
      tests.append(row);
    });
  }
  paint(null);

  reset.onclick = () => { ta.value = l.exercise.starter; paint(null); out.textContent = ""; done.hidden = true; };
  sol.onclick = () => {
    if (!confirm("Show the worked solution? Try your own version first. That is where the learning happens.")) return;
    ta.value = l.exercise.solution;
  };

  async function runTests() {
    if (!pyodide) return;
    const runLabel = run.innerHTML;
    busyButton(run, "Running");
    setStatus("Running your code", "", true);
    done.hidden = true; out.textContent = "";
    try {
      pyodide.runPython("import sys, io\n_buf = io.StringIO()\nsys.stdout = _buf\n");
      await pyodide.runPythonAsync(ta.value);
      const printed = pyodide.runPython("sys.stdout = sys.__stdout__\n_buf.getvalue()");
      const results = l.exercise.tests.map((t) => {
        try { return { pass: !!pyodide.runPython("bool(" + t.expr + ")"), detail: "returned false" }; }
        catch (e) { return { pass: false, detail: String(e).split("\n").pop().slice(0, 44) }; }
      });
      paint(results);
      const n = results.filter((r) => r.pass).length;
      out.textContent = printed || "";
      setStatus(n + "/" + results.length + " passing", n === results.length ? "ready" : "fail");
      if (n === results.length) {
        done.hidden = false;
        PROGRESS[l.id] = true;
        await api.setDone(l.id, true);
      }
    } catch (e) {
      try { pyodide.runPython("sys.stdout = sys.__stdout__"); } catch (_) {}
      paint(null); setStatus("Error in your code", "fail");
      const s = el("span", "e", String(e.message || e).split("\n").slice(-6).join("\n"));
      out.textContent = ""; out.append(s);
    }
    run.disabled = false;
    run.innerHTML = runLabel;
  }
  run.onclick = runTests;
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 4;
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runTests(); }
  });

  // On a phone the practice pane sits three screens below the reading pane,
  // so swap them with a tab instead of making people scroll to the editor.
  const tabs = el("div", "ltabs");
  const tRead = el("button", "ltab on", "Lesson");
  const tDo = el("button", "ltab", "Practice");
  tRead.onclick = () => {
    grid.classList.remove("practice");
    tRead.classList.add("on"); tDo.classList.remove("on");
    tRead.setAttribute("aria-selected", "true"); tDo.setAttribute("aria-selected", "false");
    window.scrollTo(0, 0);
  };
  tDo.onclick = () => {
    grid.classList.add("practice");
    tDo.classList.add("on"); tRead.classList.remove("on");
    tDo.setAttribute("aria-selected", "true"); tRead.setAttribute("aria-selected", "false");
    window.scrollTo(0, 0);
  };
  tRead.setAttribute("aria-selected", "true");
  tDo.setAttribute("aria-selected", "false");
  tabs.append(tRead, tDo);

  grid.append(tabs, left, right); root.append(grid);

  bootPython().then(
    () => { setStatus("Python ready", "ready"); run.disabled = false; },
    (e) => {
      setStatus("Python unavailable", "fail");
      const s = el("span", "e", "The Python runtime did not load (" + (e.message || e) +
        "). The lesson still reads fine. Reload to retry.");
      out.append(s);
    });
}

function bootPython() {
  if (pyodide) return Promise.resolve(pyodide);
  if (pyBoot) return pyBoot;
  pyBoot = (async () => {
    if (typeof loadPyodide !== "function") throw new Error("runtime script blocked");
    pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/npm/pyodide@0.29.5/" });
    return pyodide;
  })();
  return pyBoot;
}

/* ================================================================== admin */
async function renderAdmin() {
  const me = api.session();
  root.innerHTML = "";
  root.append(topBar());
  const wrap = el("div", "wrap");

  if (!me.is_admin) {
    wrap.append(el("p", "empty", "This page is for admins only."));
    root.append(wrap);
    return;
  }

  const head = el("div", "head");
  head.append(el("h1", null, "Who gets in"));
  head.append(el("p", null,
    "New accounts arrive unapproved and see nothing. Approve one and the lessons unlock for them immediately."));
  wrap.append(head);

  const users = await api.listUsers();
  const box = el("div", "tblwrap");
  if (!users.length) {
    box.append(el("p", "empty", "No accounts yet."));
  } else {
    const table = el("table");
    table.innerHTML = "<thead><tr><th>Email</th><th>Status</th><th>Role</th><th></th></tr></thead>";
    const tb = el("tbody");
    users.forEach((u) => {
      const tr = el("tr");
      tr.append(el("td", "email", u.email));
      const st = el("td");
      st.append(el("span", u.approved ? "tag ok" : "tag demo", u.approved ? "Approved" : "Pending"));
      tr.append(st, el("td", null, u.is_admin ? "Admin" : "Learner"));
      const act = el("td");
      act.style.textAlign = "right";
      if (u.id !== me.id) {
        const btn = el("button", u.approved ? "btn danger sm" : "btn sm",
          u.approved ? "Revoke" : "Approve");
        btn.onclick = async () => {
          btn.disabled = true;
          const r = await api.setApproved(u.id, !u.approved);
          if (!r.ok) { btn.disabled = false; btn.textContent = r.error; return; }
          renderAdmin();
        };
        act.append(btn);
      } else {
        act.append(el("span", "note", "you"));
      }
      tr.append(act);
      tb.append(tr);
    });
    table.append(tb);
    box.append(table);
  }
  wrap.append(box);

  if (!api.LIVE) {
    const n = el("p", "note");
    n.style.marginTop = "16px";
    n.textContent = "Demo mode. This list lives in your browser only. With Supabase connected, approval is enforced by a database policy, so an unapproved account gets zero lessons back no matter what its browser asks for.";
    wrap.append(n);
  }
  root.append(wrap);
}

/* =================================================================== main */
async function render() {
  const me = api.session();
  if (!me) return renderAuth();
  if (!me.approved) return renderPending();
  touchStreak();

  if (!LESSONS.length) {
    try { LESSONS = await api.lessons(); } catch (e) {
      root.innerHTML = "";
      root.append(topBar());
      const w = el("div", "wrap");
      w.append(el("p", "empty", "Could not load lessons: " + e.message));
      root.append(w);
      return;
    }
    // `order` restarts at 1 in each track, so sort by track position first or
    // the three tracks interleave.
    const pos = orderedTracks();
    LESSONS.sort((a, b) =>
      (pos.indexOf(a.track) - pos.indexOf(b.track)) || (a.order - b.order));
    PROGRESS = await api.getProgress();
  }
  const id = location.hash.slice(1);
  if (id === "admin") return renderAdmin();
  if (TRACKS.some((t) => t.id === id && !t.locked)) { courseDark(); return renderTracks(id); }
  const l = LESSONS.find((x) => x.id === id);
  if (l && trackMeta(l.track).locked) { location.hash = ""; return renderHub(); }
  if (l) { courseDark(); return renderLesson(l); }
  renderHub();
}

window.addEventListener("hashchange", render);
function renderBoot() {
  root.innerHTML = "";
  const b = el("div", "boot");
  b.append(spinner(true), el("span", null, "Loading PyML"));
  root.append(b);
}

renderBoot();
api.init().then(render);
```

---

## `app/style.css`

```css
/* PyML — warm premium palette: brown and gold on paper by day, black, grey
   and gold at night. Components only ever read tokens, never literals, so the
   two themes stay in step. */
:root{
  --bg:#EDE7DA; --muted:#E2D9C6; --line:rgba(62,44,22,.16);
  --fg:#2A1F12; --fg-2:#5C4A33; --fg-3:#6F5D44;
  --gold:#7D560C; --gold-strong:#59400A; --gold-ink:#FFFCF5; --gold-soft:rgba(125,86,12,.11);
  --gold-line:rgba(125,86,12,.34);
  --brown:#7A4A1E; --brown-soft:rgba(122,74,30,.10); --brown-line:rgba(122,74,30,.32);
  --ok:#2F6B40; --on-ok:#FFFFFF; --ok-soft:rgba(47,107,64,.12); --ok-line:rgba(47,107,64,.38);
  --bad:#A33224; --bad-soft:rgba(163,50,36,.10); --bad-line:rgba(163,50,36,.36);
  --code-bg:#2A2218; --code-fg:#EDE3D2; --code-inline:#6B4A10; --prose:#3E3022;
  --snake-dark:#4A330A; --snake-mid:#8A6011; --snake-light:#D8B35C;
  --card:rgba(255,252,245,.78); --glass:saturate(1.3) blur(16px);
  --glow:rgba(125,86,12,.34); --glow-2:rgba(122,74,30,.20);
  --amb-1:rgba(201,150,40,.20); --amb-2:rgba(122,74,30,.14);
  --shadow:0 1px 2px rgba(50,35,15,.07), 0 10px 26px -18px rgba(50,35,15,.4);
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:"Figtree",system-ui,-apple-system,"Segoe UI",sans-serif;
  --display:"Sora","Figtree",system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --bg:#0B0A08; --muted:#201C14; --line:rgba(240,220,170,.12);
    --fg:#F3EEE3; --fg-2:#B5AC98; --fg-3:#9A9180;
    --gold:#E7B64E; --gold-strong:#F0C66A; --gold-ink:#1A1304; --gold-soft:rgba(231,182,78,.12);
    --gold-line:rgba(231,182,78,.36);
    --brown:#C08A4A; --brown-soft:rgba(192,138,74,.11); --brown-line:rgba(192,138,74,.32);
    --ok:#6FBE7E; --on-ok:#0B0A08; --ok-soft:rgba(111,190,126,.11); --ok-line:rgba(111,190,126,.36);
    --bad:#E4756A; --bad-soft:rgba(228,117,106,.10); --bad-line:rgba(228,117,106,.36);
    --code-bg:#050504; --code-fg:#E6DCC8; --code-inline:#F0C977; --prose:#D8D0C0;
    --snake-dark:#6B4A0C; --snake-mid:#B07F22; --snake-light:#F0CE82;
    --card:rgba(32,28,20,.66); --glass:saturate(1.25) blur(18px);
    --glow:rgba(231,182,78,.40); --glow-2:rgba(192,138,74,.26);
    --amb-1:rgba(231,182,78,.13); --amb-2:rgba(192,138,74,.10);
    --shadow:0 1px 2px rgba(0,0,0,.6), 0 12px 32px -20px rgba(0,0,0,.95);
  }
}
:root[data-theme="dark"]{
  --bg:#0B0A08; --muted:#201C14; --line:rgba(240,220,170,.12);
  --fg:#F3EEE3; --fg-2:#B5AC98; --fg-3:#9A9180;
  --gold:#E7B64E; --gold-strong:#F0C66A; --gold-ink:#1A1304; --gold-soft:rgba(231,182,78,.12);
  --gold-line:rgba(231,182,78,.36);
  --brown:#C08A4A; --brown-soft:rgba(192,138,74,.11); --brown-line:rgba(192,138,74,.32);
  --ok:#6FBE7E; --on-ok:#0B0A08; --ok-soft:rgba(111,190,126,.11); --ok-line:rgba(111,190,126,.36);
  --bad:#E4756A; --bad-soft:rgba(228,117,106,.10); --bad-line:rgba(228,117,106,.36);
  --code-bg:#050504; --code-fg:#E6DCC8; --code-inline:#F0C977; --prose:#D8D0C0;
  --snake-dark:#6B4A0C; --snake-mid:#B07F22; --snake-light:#F0CE82;
    --card:rgba(32,28,20,.66); --glass:saturate(1.25) blur(18px);
    --glow:rgba(231,182,78,.40); --glow-2:rgba(192,138,74,.26);
    --amb-1:rgba(231,182,78,.13); --amb-2:rgba(192,138,74,.10);
  --shadow:0 1px 2px rgba(0,0,0,.6), 0 12px 32px -20px rgba(0,0,0,.95);
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--fg);font-family:var(--sans);
  font-size:15px;line-height:1.62;-webkit-font-smoothing:antialiased}
h1,h2,h3{margin:0;font-family:var(--display);line-height:1.22;
  text-wrap:balance;font-weight:650;letter-spacing:-.018em}
p{margin:0}
code,pre,.mono{font-family:var(--mono);font-variant-ligatures:none}
button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}
a{color:var(--gold)}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:5px}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{transition-duration:.01ms!important;animation-duration:.01ms!important}}

/* ------------------------------------------------------------- controls */
.btn{background:var(--gold);color:var(--gold-ink);font-weight:650;font-size:14px;
  padding:9px 20px;border-radius:12px;transition:filter .18s,transform .15s;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px}
.btn:hover:not(:disabled){filter:brightness(1.1)}
.btn:active:not(:disabled){transform:translateY(1px)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.ghost{background:transparent;color:var(--fg-2);border:1px solid var(--line);font-weight:500}
.btn.ghost:hover{border-color:var(--gold);color:var(--gold)}
.btn.sm{padding:6px 13px;font-size:12.5px;min-height:32px}
.btn.danger{background:transparent;border:1px solid var(--bad-line);color:var(--bad)}
label{display:block;font-size:12.5px;color:var(--fg-2);margin-bottom:6px;font-weight:500}
input[type=email],input[type=password],input[type=text]{width:100%;background:var(--muted);
  border:1px solid var(--line);color:var(--fg);border-radius:12px;padding:11px 13px;
  font:inherit;font-size:14.5px;min-height:44px}
input:focus{outline:0;border-color:var(--gold)}
.err{color:var(--bad);font-size:13.5px;margin-top:10px;min-height:19px}
.note{color:var(--fg-3);font-size:13px}

/* ------------------------------------------------------------- top bar */
.bar{display:flex;align-items:center;gap:14px;padding:12px 20px;flex-wrap:wrap;
  border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:5}
.logo{display:flex;align-items:center;gap:9px;font-family:var(--display);
  font-weight:700;letter-spacing:-.02em}
.logo .dot{width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 11px var(--gold)}
.bar .sp{margin-left:auto}
.who{font-family:var(--mono);font-size:11.5px;color:var(--fg-3)}
.tag{font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;
  padding:3px 9px;border-radius:999px;border:1px solid var(--line);color:var(--fg-2)}
.tag.demo{color:var(--brown);border-color:var(--brown-line);background:var(--brown-soft)}
.tag.ok{color:var(--gold);border-color:var(--ok-line);background:var(--gold-soft)}

/* ------------------------------------------------------------- auth card */
.centre{display:grid;place-items:center;min-height:100vh;padding:28px 18px}
.auth{width:100%;max-width:400px}
.auth .brand{display:flex;align-items:center;gap:10px;font-family:var(--display);
  font-size:20px;font-weight:700;
  letter-spacing:-.02em;margin-bottom:6px}
.auth .brand .dot{width:10px;height:10px;border-radius:50%;background:var(--gold);
  box-shadow:0 0 12px var(--gold)}
.auth .lede{color:var(--fg-2);font-size:14.5px;margin-bottom:24px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px}
.tabs{display:flex;gap:4px;background:var(--muted);border:1px solid var(--line);
  border-radius:13px;padding:4px;margin-bottom:20px}
.tabs button{flex:1;padding:8px;border-radius:6px;font-size:13.5px;color:var(--fg-2);
  transition:background .18s,color .18s}
.tabs button[aria-selected=true]{background:var(--card);color:var(--fg);font-weight:600}
.field{margin-bottom:14px}
.auth .btn{width:100%;margin-top:4px}
.pending{text-align:center}
.pending .ring{width:52px;height:52px;border-radius:50%;margin:0 auto 16px;
  border:2px solid var(--brown-line);border-top-color:var(--brown);
  animation:spin 1.6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pending h2{font-size:19px;margin-bottom:8px}
.pending p{color:var(--fg-2);font-size:14.5px;max-width:34ch;margin:0 auto 18px}

/* ------------------------------------------------------------- tracks */
.wrap{max-width:1180px;margin:0 auto;padding:26px 20px 70px}
.head{margin-bottom:24px}
.head h1{font-size:27px;letter-spacing:-.02em;margin-bottom:6px}
.head p{color:var(--fg-2);max-width:60ch}
.meter{display:flex;align-items:center;gap:12px;margin-top:14px}
.meter .track{flex:1;height:7px;background:var(--muted);border-radius:4px;overflow:hidden;max-width:300px}
.meter .track i{display:block;height:100%;background:var(--gold);border-radius:4px;transition:width .5s}
.meter .n{font-family:var(--mono);font-size:12px;color:var(--fg-2)}
.list{display:grid;gap:10px}
.row{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;
  background:var(--card);border:1px solid var(--line);border-radius:16px;
  padding:14px 16px;width:100%;text-align:left;transition:border-color .18s}
.row:hover{border-color:var(--gold-line)}
.row .num{font-family:var(--mono);font-size:11.5px;color:var(--fg-3);
  background:var(--muted);border:1px solid var(--line);border-radius:11px;padding:5px 9px}
.row.done .num{background:var(--gold-soft);color:var(--gold);border-color:transparent}
.row .rtitle{font-weight:600;font-size:16px}
.row .b{color:var(--fg-2);font-size:13.5px;margin-top:2px}
.row .m{font-family:var(--mono);font-size:11.5px;color:var(--fg-3);white-space:nowrap}

/* ------------------------------------------------------------- lesson */
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:calc(100vh - 53px)}
.pane{padding:26px 24px 56px;min-width:0}
.pane.lesson{border-right:1px solid var(--line)}
.kicker{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px;
  letter-spacing:.11em;text-transform:uppercase;color:var(--gold-strong);background:var(--gold-soft);
  border:1px solid var(--gold-line);padding:5px 11px;border-radius:999px;margin-bottom:13px}
.lesson h1{font-size:28px;letter-spacing:-.022em;margin-bottom:8px}
.lesson .sub{color:var(--fg-2);font-size:15.5px;max-width:58ch;margin-bottom:22px}
.obj{background:var(--muted);border:1px solid var(--line);border-radius:14px;padding:13px 16px;margin-bottom:22px}
.obj h2{font-family:var(--mono);font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--fg-3);font-weight:600;margin-bottom:8px;border:0;padding:0}
.obj ul{margin:0;padding-left:17px;color:var(--prose);font-size:14px}
.lesson p{margin:0 0 13px;max-width:62ch;color:var(--prose)}
.lesson ul,.lesson ol{max-width:62ch;color:var(--prose);padding-left:20px}
.lesson code:not(pre code){background:var(--muted);border:1px solid var(--line);
  padding:1.5px 6px;border-radius:5px;font-size:13px;color:var(--code-inline)}
pre{background:var(--code-bg);border:1px solid var(--line);border-radius:14px;padding:15px 17px;
  overflow-x:auto;font-size:13.2px;line-height:1.72;margin:0 0 15px;color:var(--code-fg)}
.cap{font-family:var(--mono);font-size:11px;color:var(--fg-3);margin:0 0 6px}
.callout{border-radius:14px;padding:13px 16px;margin:4px 0 15px;font-size:14.2px}
.callout b{display:block;margin-bottom:3px;font-family:var(--mono);font-size:10.5px;
  letter-spacing:.1em;text-transform:uppercase}
.callout.warn{background:var(--brown-soft);border:1px solid var(--brown-line);color:var(--fg)}
.callout.warn b{color:var(--brown)}
.callout.tip{background:var(--ok-soft);border:1px solid var(--ok-line);color:var(--fg)}
.callout.tip b{color:var(--gold)}

/* ------------------------------------------------------------- practice */
.ptop{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
.ptitle{font-family:var(--mono);font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:var(--fg-3)}
.status{font-family:var(--mono);font-size:11.5px;color:var(--fg-3);display:flex;align-items:center;gap:7px}
.status .led{width:7px;height:7px;border-radius:50%;background:var(--fg-3);flex:none}
.status.ready .led{background:var(--gold);box-shadow:0 0 8px var(--gold)}
.status.fail .led{background:var(--bad)}
.brief{background:var(--card);border:1px solid var(--line);border-left:2px solid var(--gold);
  border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:14px;font-size:14.3px;color:var(--fg-2)}
.editor{background:var(--code-bg);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.ehead{display:flex;align-items:center;padding:8px 13px;border-bottom:1px solid var(--line);
  background:var(--muted);font-family:var(--mono);font-size:11.5px;color:var(--fg-2)}
textarea{width:100%;min-height:230px;background:transparent;color:var(--code-fg);border:0;padding:14px 16px;
  font-family:var(--mono);font-size:13.2px;line-height:1.72;resize:vertical;display:block;tab-size:4}
textarea:focus{outline:0}
.erow{display:flex;gap:9px;padding:11px 13px;border-top:1px solid var(--line);
  background:var(--muted);align-items:center;flex-wrap:wrap}
kbd{font-family:var(--mono);font-size:10.5px;color:var(--fg-3);border:1px solid var(--line);
  border-bottom-width:2px;border-radius:4px;padding:1px 5px}
.tests{margin-top:15px;display:grid;gap:7px}
.t{display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center;
  background:var(--card);border:1px solid var(--line);border-radius:13px;padding:10px 13px}
.t .ic{width:17px;height:17px;border-radius:50%;border:1.5px solid var(--fg-3);
  display:grid;place-items:center;flex:none}
.t .ic svg{width:9px;height:9px;opacity:0}
.t.pass{border-color:var(--ok-line);background:var(--ok-soft)}
.t.pass .ic{background:var(--gold);border-color:var(--gold)}
.t.pass .ic svg{opacity:1}
.t.fail{border-color:var(--bad-line);background:var(--bad-soft)}
.t.fail .ic{border-color:var(--bad)}
.t .lab{font-family:var(--mono);font-size:12.6px;color:var(--fg-2);overflow-wrap:anywhere}
.t.pass .lab,.t.fail .lab{color:var(--fg)}
.t .got{font-family:var(--mono);font-size:11.5px;color:var(--bad);text-align:right}
.out{margin-top:13px;background:var(--code-bg);border:1px solid var(--line);border-radius:14px;
  padding:13px 15px;font-family:var(--mono);font-size:12.6px;color:var(--fg-2);
  white-space:pre-wrap;overflow-x:auto;min-height:46px;overflow-wrap:anywhere}
.out:empty::before{content:"Run your code to see output here.";color:var(--fg-3)}
.out .e{color:var(--bad)}
.done{margin-top:14px;background:var(--gold-soft);border:1px solid var(--ok-line);
  border-radius:14px;padding:14px 16px;font-size:14.3px}
.done b{color:var(--gold)}

/* ------------------------------------------------------------- admin */
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--fg-3);font-weight:600;padding:0 12px 10px}
td{padding:12px;border-top:1px solid var(--line)}
td.email{font-family:var(--mono);font-size:13px;overflow-wrap:anywhere}
.tblwrap{background:var(--card);border:1px solid var(--line);border-radius:18px;
  padding:16px;overflow-x:auto}
.empty{color:var(--fg-3);text-align:center;padding:30px 0;font-size:14px}

@media (max-width:900px){
  .grid{grid-template-columns:1fr}
  .pane.lesson{border-right:0;border-bottom:1px solid var(--line)}
  .pane{padding:22px 17px 40px}
  .row{grid-template-columns:auto 1fr}
  .row .m{grid-column:2;margin-top:2px}
}

/* ------------------------------------------------------- demo logins */
.demo-logins{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);display:grid;gap:9px}
.demo-logins>.note{margin-bottom:2px}
.demo-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.demo-row .btn{font-family:var(--mono);font-size:11.5px}
.demo-row .note{font-size:12px}

/* ------------------------------------------------------------- landing */
.landing{max-width:1120px;margin:0 auto;padding:48px 20px 72px;
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);gap:56px;align-items:start}
.pitch h1{font-size:clamp(28px,3.6vw,40px);letter-spacing:-.025em;margin-bottom:14px;max-width:18ch}
.pitch .big{color:var(--fg-2);font-size:17px;max-width:48ch;margin-bottom:34px}
.pitch h2{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--fg-3);font-weight:600;margin-bottom:14px}
.why{margin-bottom:34px;display:grid;gap:14px}
.whyrow{display:grid;gap:3px}
.whyrow b{font-size:15px;font-weight:650}
.whyrow span{color:var(--fg-2);font-size:14.5px;max-width:52ch}
.path{display:grid;gap:2px;margin-bottom:26px}
.step{display:grid;grid-template-columns:auto 1fr;gap:16px;padding:16px 0;
  border-top:1px solid var(--line)}
.step:last-child{border-bottom:1px solid var(--line)}
.stepn{font-family:var(--mono);font-size:11px;color:var(--gold);letter-spacing:.07em;
  padding-top:3px;white-space:nowrap}
.step h3{font-size:16.5px;margin-bottom:4px}
.step p{color:var(--fg-2);font-size:14.5px;max-width:50ch}
.closer{font-family:var(--mono);font-size:13px;color:var(--fg-3);max-width:48ch}
.landing .auth{position:sticky;top:28px;max-width:420px;justify-self:end;width:100%}

/* ------------------------------------------------------------- groups */
.group{margin-bottom:38px}
.ghead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;
  margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.part{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--gold);display:block;margin-bottom:5px}
.ghead h2{font-size:20px;letter-spacing:-.015em}
.gwhy{color:var(--fg-2);font-size:14px;margin-top:5px;max-width:62ch}
.gcount{font-family:var(--mono);font-size:13px;color:var(--fg-3);
  font-variant-numeric:tabular-nums;white-space:nowrap;padding-top:14px}

@media (max-width:980px){
  .landing{grid-template-columns:1fr;gap:38px;padding:30px 18px 56px}
  .landing .auth{position:static;justify-self:stretch;max-width:none}
}

/* ------------------------------------------------- collapsing sections */
.sect{border:1px solid var(--line);border-radius:22px;background:var(--card);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  margin-bottom:14px;overflow:hidden;box-shadow:var(--shadow)}
.secthead{display:flex;align-items:center;gap:13px;width:100%;padding:17px 20px;
  text-align:left;min-height:58px;transition:background .2s;position:relative}
.secthead::after{content:"";position:absolute;left:20px;right:20px;bottom:0;height:1px;
  background:var(--line);opacity:0;transition:opacity .2s}
.sect.open .secthead::after{opacity:1}
.secthead:hover{background:var(--gold-soft)}
.caret{width:13px;height:13px;color:var(--fg-3);flex:none;display:grid;place-items:center;
  transition:transform .3s cubic-bezier(.22,1,.36,1),color .2s}
.caret svg{width:13px;height:13px}
.sect.open .caret{transform:rotate(90deg);color:var(--gold)}
.secttitle{font-family:var(--display);font-weight:700;font-size:17.5px;
  letter-spacing:-.015em;flex:1;min-width:0}
.sectcount{font-family:var(--mono);font-size:12px;color:var(--fg-3);
  font-variant-numeric:tabular-nums}

/* --------------------------------------------------------- the python */
.road{position:relative;display:none;width:100%}
.sect.open .road{display:block}
svg.snake{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:visible}
.snake .ahead{stroke:var(--line)}
.peakdot{fill:var(--bg);stroke:var(--line);stroke-width:2}
.peakdot.on{fill:var(--gold);stroke:var(--gold)}
.snakebody{filter:drop-shadow(0 3px 10px rgba(0,0,0,.28))}
.snakesheen{mix-blend-mode:screen;opacity:.5}
.headshape{filter:drop-shadow(0 0 16px var(--glow))}
.snakehead .eye{fill:#0B0A08}
.snakehead .tongue{stroke:#C4443A}

/* ------------------------------------------------------- topics on peaks */
.peak{position:absolute;transform:translateY(-50%);z-index:1;width:min(320px,34%)}
.peak.left{right:calc(100% - var(--peakx) + 34px)}
.peak.right{left:calc(var(--peakx) + 34px)}
.peakcard{width:100%;text-align:left;display:grid;gap:5px;padding:14px 16px;
  border-radius:16px;border:1px solid var(--line);background:var(--card);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  transition:transform .24s cubic-bezier(.22,1,.36,1),box-shadow .24s,
             border-color .24s,opacity .24s}
.peaktop{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.peakno{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex:none;
  border:1.5px solid var(--line);font-family:var(--mono);font-size:11px;font-weight:600;
  color:var(--fg-3);background:var(--muted)}
.peakno svg{width:13px;height:13px}
.peaktop .m{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--fg-3)}
.peakcard .rtitle{font-family:var(--display);font-weight:650;font-size:15.5px;
  letter-spacing:-.012em;line-height:1.25}
.peakcard .b{color:var(--fg-2);font-size:12.8px;line-height:1.45}

/* cleared: receded, still legible */
.peak.past .peakcard{opacity:.52}
.peak.past .peakno{background:var(--gold);border-color:var(--gold);color:var(--gold-ink)}
.peak.past:hover .peakcard{opacity:1}

/* where you are: lit */
.peak.live{width:min(348px,37%)}
.peak.live .peakcard{border-color:var(--gold);background:var(--gold-soft);
  box-shadow:0 0 44px -12px var(--glow),0 0 0 1px var(--gold-line)}
.peak.live .peakno{border-color:var(--gold);color:var(--gold);
  box-shadow:0 0 0 4px var(--gold-soft)}

/* not yet: glossy, hazy, deliberately quieter. The haze is a sheen layer over
   the card, never a blur on the text, which would make it unreadable. */
.peak.ahead .peakcard{opacity:.72;position:relative;overflow:hidden}
.peak.ahead .peakcard::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(118deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.03) 38%,
             transparent 60%),var(--gold-soft);
  backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px)}
.peak.ahead:hover .peakcard{opacity:1}
.peak.ahead:hover .peakcard::after{opacity:.35}

.peakcard:hover{transform:translateY(-3px);border-color:var(--gold-line);
  box-shadow:0 0 40px -14px var(--glow)}

@media (max-width:760px){
  /* one column: the serpentine tightens into the left gutter */
  .peak,.peak.live{width:calc(100% - 86px);left:78px;right:auto}
  .peak.right{left:78px;right:auto}
  .peakcard{padding:12px 14px}
  .peakcard .rtitle{font-size:14.5px}
  .secthead{padding:15px 16px}
}

/* ------------------------------------------------------- coming soon */
.soon{background:var(--card);border:1px dashed var(--line);border-radius:18px;
  padding:18px 20px;margin-bottom:14px}
.soontop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
  margin-bottom:8px}
.soon h2{font-size:18px;color:var(--fg-2)}
.soon .gwhy{margin-bottom:8px}
.soon .tag{white-space:nowrap;color:var(--brown);border-color:var(--brown-line);
  background:var(--brown-soft)}

@media (max-width:560px){
  .stop{grid-template-columns:30px 1fr;gap:10px}
  .stop::before{left:7px}
  .sect .map{padding:2px 12px 14px}
  .secthead{padding:14px}
}


/* ------------------------------------------------- glass, glow, ambience */
body{position:relative}
/* something for the glass to actually blur */
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(52rem 38rem at 12% -6%, var(--amb-1), transparent 62%),
    radial-gradient(44rem 34rem at 92% 22%, var(--amb-2), transparent 60%),
    radial-gradient(38rem 30rem at 48% 108%, var(--amb-1), transparent 58%)}

.card,.stopcard,.panel,.soon,.tblwrap,.editor,.brief,.obj,.out{
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass)}
.bar{background:var(--card);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass)}

/* ------------------------------------------------------------- the hub */
.hubwrap{padding-top:34px}
.cubes{display:flex;align-items:stretch;justify-content:center;gap:0;flex-wrap:nowrap;
  margin:30px 0 26px}
.cube{flex:1 1 0;min-width:0;max-width:260px;aspect-ratio:1/1;
  background:var(--card);border:1px solid var(--line);border-radius:26px;
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;
  gap:4px;padding:22px;text-align:left;position:relative;overflow:hidden;
  transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s,border-color .28s}
.cube .glyph{position:absolute;top:20px;left:20px;width:36px;height:36px;color:var(--fg-3);
  transition:color .28s,transform .28s}
.cube .glyph svg{width:100%;height:100%}
.cubebody{display:contents}
.cubenum{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--fg-3)}
.cubetitle{font-family:var(--display);font-size:19px;font-weight:650;
  line-height:1.2;letter-spacing:-.02em}
.cubemeta{font-family:var(--mono);font-size:11px;color:var(--fg-3);margin-bottom:8px}
.cubetag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  border:1px solid var(--line);border-radius:999px;padding:4px 11px;color:var(--fg-3)}

.cube.open{cursor:pointer;border-color:var(--gold-line);
  box-shadow:0 0 34px -14px var(--glow), inset 0 1px 0 var(--gold-soft)}
.cube.open .glyph{color:var(--gold)}
.cube.open .cubetag.go{color:var(--gold-ink);background:var(--gold);border-color:var(--gold)}
.cube.open:hover,.cube.open:focus-visible{transform:translateY(-6px);
  border-color:var(--gold);
  box-shadow:0 0 62px -8px var(--glow), 0 0 0 1px var(--gold-line),
             inset 0 1px 0 var(--gold-soft)}
.cube.open:hover .glyph{transform:scale(1.08)}
.cube.open:active{transform:translateY(-2px)}

.cube.locked{opacity:.66;border-style:dashed}
.cube.locked:hover{opacity:.9;box-shadow:0 0 36px -16px var(--glow-2)}
.cube.locked .cubetag{color:var(--brown);border-color:var(--brown-line);
  background:var(--brown-soft)}

/* the interlocking path between stages */
.link{flex:0 0 46px;align-self:center;height:2px;background:var(--line);position:relative}
.link::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:11px;
  transform:translate(-50%,-50%) rotate(45deg);
  background:var(--bg);border:2px solid var(--line);border-radius:3px}
.link.live{background:var(--gold-line)}
.link.live::after{border-color:var(--gold);box-shadow:0 0 14px -2px var(--glow)}

.hubnote{color:var(--fg-3);font-size:13.5px;max-width:62ch;margin:0 auto;text-align:center}

.backlink{font-family:var(--mono);font-size:12px;color:var(--fg-3);padding:6px 0;
  margin-bottom:10px;transition:color .18s}
.backlink:hover{color:var(--gold)}

@media (max-width:760px){
  .cubes{flex-direction:column;align-items:stretch;gap:0}
  .cube{max-width:none;aspect-ratio:auto;min-height:150px}
  .link{flex:0 0 34px;width:2px;height:34px;align-self:center}
}

/* ------------------------------------------------- motion and loading */
@keyframes viewIn{from{opacity:0;translate:0 10px}to{opacity:1;translate:0 0}}
@keyframes riseIn{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.45}50%{opacity:.9}}

/* every view fades up as it mounts; `translate` is used instead of `transform`
   so hover lifts on cubes and cards still work afterwards */
.wrap,.grid,.centre,.landing{animation:viewIn .34s cubic-bezier(.22,1,.36,1) both}
.peak,.cube{animation:riseIn .44s cubic-bezier(.22,1,.36,1) both}

.spin{width:14px;height:14px;border-radius:50%;flex:none;box-sizing:border-box;
  border:2px solid currentColor;border-top-color:transparent;
  animation:spin .72s linear infinite;display:inline-block}
.spin.lg{width:34px;height:34px;border-width:3px}
.status .spin{width:11px;height:11px;border-width:2px;color:var(--gold)}
.btn .spin{color:currentColor}

.boot{min-height:70vh;display:grid;place-items:center;gap:16px;
  grid-auto-flow:row;justify-items:center;color:var(--fg-3)}
.boot .spin{color:var(--gold)}
.boot span{font-family:var(--mono);font-size:12px;letter-spacing:.08em;
  animation:pulse 1.8s ease-in-out infinite}

.skel{background:var(--card);border:1px solid var(--line);border-radius:16px;
  height:74px;animation:pulse 1.5s ease-in-out infinite}
.skelwrap{display:grid;gap:10px;margin-top:18px}

/* ------------------------------------------------------------- mobile */
.ltabs{display:none}

@media (max-width:900px){
  /* the bar costs 108px pinned on a phone and buries headings underneath it;
     the tab switch is the control that actually needs to stay reachable */
  .bar{position:static}
  .grid{grid-template-rows:auto 1fr}
  .ltabs{display:flex;gap:5px;position:sticky;top:0;z-index:6;
    padding:9px 16px;background:var(--bg);border-bottom:1px solid var(--line);
    backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass)}
  .ltab{flex:1;padding:10px;border-radius:12px;font-size:13.5px;font-weight:600;
    color:var(--fg-3);border:1px solid transparent;min-height:42px;
    transition:background .18s,color .18s,border-color .18s}
  .ltab.on{background:var(--card);color:var(--fg);border-color:var(--gold-line)}
  .grid:not(.practice) .pane:last-child{display:none}
  .grid.practice .pane.lesson{display:none}
  .pane{padding-top:18px}
  textarea{min-height:300px}
}

@media (max-width:620px){
  /* one row, not two: the signed-in address and mode chip are not worth 54px */
  .bar .whoname,.bar .tag{display:none}
  .bar{padding:10px 14px;gap:9px}
}

@media (max-width:760px){
  /* the glyph is absolute on desktop and collides with the stage label once
     the cube collapses to a short row */
  .cube{flex-direction:row;align-items:center;justify-content:flex-start;
    gap:16px;padding:18px 20px;min-height:96px;aspect-ratio:auto;overflow:visible}
  .cube .glyph{position:static;width:30px;height:30px;flex:none}
  .cube .cubebody{display:flex;flex-direction:column;align-items:flex-start;
    gap:2px;min-width:0;flex:1}
  .cubemeta{margin-bottom:0}
  .cubetag{margin-top:7px}
}

/* ------------------------------------------------------- profile panel */
.menubtn{width:36px;height:36px;border-radius:12px;flex:none;display:grid;place-items:center;
  color:var(--fg-2);border:1px solid var(--line);transition:color .2s,border-color .2s,background .2s}
.menubtn:hover{color:var(--gold);border-color:var(--gold);background:var(--gold-soft)}
.menubtn svg{width:17px;height:17px}

.whobtn{display:flex;align-items:center;gap:10px;padding:4px 11px 4px 4px;
  border-radius:999px;border:1px solid transparent;
  transition:border-color .2s,background .2s}
.whotext{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2}
.whoname{font-family:var(--display);font-weight:650;font-size:13.5px;
  letter-spacing:-.01em;text-transform:capitalize;color:var(--fg)}
.whobtn .who{color:var(--gold-strong);font-size:10.5px;letter-spacing:.04em}
.whobtn:hover{border-color:var(--gold-line);background:var(--gold-soft)}
.meav{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;
  background:var(--gold);color:var(--gold-ink);font-family:var(--display);
  font-weight:700;font-size:12.5px;box-shadow:0 0 14px -4px var(--glow)}

.scrim{position:fixed;inset:0;background:rgba(16,11,3,.46);opacity:0;pointer-events:none;
  transition:opacity .28s;z-index:19}
.scrim.on{opacity:1;pointer-events:auto}

.mepanel{position:fixed;top:0;left:0;bottom:0;z-index:20;width:min(364px,89vw);
  display:flex;flex-direction:column;gap:14px;padding:20px 18px 22px;overflow-y:auto;
  background:var(--card);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  border-right:1px solid var(--gold-line);box-shadow:26px 0 64px -30px rgba(28,18,4,.62);
  transform:translateX(-102%);visibility:hidden;
  transition:transform .34s cubic-bezier(.22,1,.36,1),visibility .34s}
.mepanel.open{transform:none;visibility:visible}

.mehead{display:flex;align-items:center;gap:12px}
.mehead .meav{width:44px;height:44px;font-size:18.5px}
.mewho{display:flex;flex-direction:column;min-width:0;flex:1}
.mename{font-family:var(--display);font-weight:700;font-size:16.5px;
  letter-spacing:-.015em;text-transform:capitalize}
.memail{font-family:var(--mono);font-size:11px;color:var(--fg-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mex{width:32px;height:32px;border-radius:10px;flex:none;display:grid;place-items:center;
  color:var(--fg-3);border:1px solid var(--line);transition:color .2s,border-color .2s}
.mex:hover{color:var(--gold);border-color:var(--gold)}
.mex svg{width:14px;height:14px}

.mechips{display:flex;gap:7px;flex-wrap:wrap}

.mestats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mestat{border:1px solid var(--gold-line);border-radius:14px;padding:11px 8px;
  text-align:center;background:var(--gold-soft)}
.mestat b{display:block;font-family:var(--display);font-weight:700;font-size:19px;
  color:var(--gold-strong);font-variant-numeric:tabular-nums;line-height:1.2}
.mestat span{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--fg-2)}

.mebody{flex:1}
.mepanel .sect{border-radius:16px;margin-bottom:9px;box-shadow:none}
.mepanel .secthead{padding:13px 15px;min-height:46px;gap:11px}
.mepanel .secttitle{font-size:14.5px}
.melist{display:none;padding:4px 9px 11px;list-style:none}
.mepanel .sect.open .melist{display:block}
.meitem{display:flex;align-items:center;gap:11px;width:100%;text-align:left;
  padding:8px 10px;border-radius:11px;min-height:38px;transition:background .18s}
.meitem:hover:not(:disabled){background:var(--gold-soft)}
.medot{width:7px;height:7px;border-radius:50%;flex:none;border:1.5px solid var(--line)}
.metitle{font-size:13.2px;color:var(--fg-2);line-height:1.3}
.meitem.cleared .medot{background:var(--gold);border-color:var(--gold)}
.meitem.cleared .metitle{text-decoration:line-through;text-decoration-thickness:1.5px;
  text-decoration-color:var(--gold)}
.meitem.now .medot{background:var(--gold);border-color:var(--gold);
  box-shadow:0 0 0 4px var(--gold-soft)}
.meitem.now .metitle{color:var(--fg);font-weight:650}
.meitem.off{opacity:.52;cursor:not-allowed}

.mefoot{display:flex;gap:8px;padding-top:4px}
.mefoot .btn{flex:1;text-align:center;justify-content:center}

/* a cleared stop reads as struck off the list, on the map too. The card sits
   at .52 opacity, so the rule needs solid gold to survive it. */
.peak.past .rtitle{text-decoration:line-through;text-decoration-thickness:2px;
  text-decoration-color:var(--gold)}

@media (max-width:620px){
  /* the name goes, the streak stays — it is the thing worth a daily glance */
  .whobtn{padding:3px 9px 3px 3px;gap:7px}
  .mepanel{padding:16px 14px 18px}
}
```

---

## `supabase/schema.sql`

```sql
-- PyML access control + content. Run once in the Supabase SQL editor.
-- The gate is enforced HERE, not in the browser: an unapproved account's
-- select on lessons returns zero rows no matter what the client asks for.

create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  approved    boolean not null default false,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists lessons (
  id         text primary key,
  track      text not null,
  "order"    int  not null,
  title      text not null,
  blurb      text not null,
  minutes    int  not null,
  body       jsonb not null,          -- objectives, sections, exercise
  updated_at timestamptz not null default now()
);

create table if not exists progress (
  user_id    uuid not null references auth.users on delete cascade,
  lesson_id  text not null references lessons on delete cascade,
  completed  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table profiles enable row level security;
alter table lessons  enable row level security;
alter table progress enable row level security;

-- a row in profiles appears for every new signup, unapproved
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create or replace function is_approved() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select approved from profiles where id = auth.uid()), false)
$$;

-- profiles: you see yourself; admins see and edit everyone
drop policy if exists p_self   on profiles;
drop policy if exists p_admin  on profiles;
drop policy if exists p_update on profiles;
create policy p_self   on profiles for select using (id = auth.uid() or is_admin());
create policy p_update on profiles for update using (is_admin()) with check (is_admin());

-- lessons: readable only by approved accounts. This is the access gate.
drop policy if exists l_read  on lessons;
drop policy if exists l_write on lessons;
create policy l_read  on lessons for select using (is_approved() or is_admin());
create policy l_write on lessons for all    using (is_admin()) with check (is_admin());

-- progress: your own rows only
drop policy if exists g_own on progress;
create policy g_own on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Make yourself admin after signing up (replace the address):
--   update profiles set approved = true, is_admin = true where email = 'you@example.com';
```

---

## `scripts/sync-content.mjs`

```js
// Push content/**/*.json into the Supabase `lessons` table.
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-content.mjs
// Service key, not the anon key: only an admin may write lessons.
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY"); process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const rows = [];
for (const track of await readdir(root)) {
  let files;
  try { files = await readdir(join(root, track)); } catch { continue; }
  for (const f of files.filter((f) => f.endsWith(".json"))) {
    const l = JSON.parse(await readFile(join(root, track, f), "utf8"));
    const { id, track: t, order, title, blurb, minutes, ...body } = l;
    rows.push({ id, track: t, order, title, blurb, minutes, body, updated_at: new Date() });
  }
}
if (!rows.length) { console.error("no lessons found"); process.exit(1); }

const { error } = await db.from("lessons").upsert(rows, { onConflict: "id" });
if (error) { console.error(error.message); process.exit(1); }
console.log(`synced ${rows.length} lessons`);
```

---

## `scripts/build_standalone.py`

```python
#!/usr/bin/env python3
"""Build a single self-contained HTML file you can open by double-clicking.

The real site loads ES modules and fetches lesson JSON, both of which browsers
block on file:// — so this inlines everything into one page. Pyodide is the one
thing that still needs the network; it is 10MB and cannot be inlined.

    python3 scripts/build_standalone.py        -> pyml-standalone.html
"""
import json, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()


def must_replace(text, old, new, what):
    """Replace exactly once, or fail loudly — a silent miss ships a broken page."""
    n = text.count(old)
    if n != 1:
        sys.exit(f"build: expected 1 occurrence of {what}, found {n}")
    return text.replace(old, new)


# ---- lessons, in the order the app wants them -----------------------------
TRACK_ORDER = {"python": 0, "ml": 1, "ai": 2}
paths = sorted(glob.glob(os.path.join(ROOT, "content", "*", "*.json")),
               key=lambda f: (TRACK_ORDER.get(os.path.basename(os.path.dirname(f)), 99), f))
lessons = [json.load(open(p, encoding="utf-8")) for p in paths]
if not lessons:
    sys.exit("build: no lessons found")

# ---- javascript -----------------------------------------------------------
config = read("app", "config.js").replace("export const", "const")

api = read("app", "api.js")
api = must_replace(
    api,
    'import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";',
    config.strip(),
    "the api.js config import")
api = must_replace(
    api,
    '  const index = await (await fetch("content/index.json")).json();\n'
    '  return Promise.all(index.map((p) => fetch("content/" + p).then((r) => r.json())))\n'
    '    .then((ls) => ls.sort((a, b) => a.order - b.order));',
    "  return __LESSONS__.slice();",
    "the api.js demo fetch path")
api = api.replace("export const ", "const ").replace("export function ", "function ") \
         .replace("export async function ", "async function ")
if "export " in api:
    sys.exit("build: an export survived in api.js — the standalone bundle would break")

app = read("app", "app.js")
app = must_replace(app, 'import * as api from "./api.js";', "", "the app.js api import")

NAMESPACE = """
const api = { LIVE, DEMO_ACCOUNTS, init, session, signUp, signIn, signOut,
              listUsers, setApproved, lessons, getProgress, setDone };
"""

# </script> anywhere in lesson text would close the tag early
data = json.dumps(lessons, ensure_ascii=False).replace("</", "<\\/")

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PyML — standalone</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Sora:wght@500;600;700;800&display=swap">
<style>
{read("app", "style.css")}
</style>
<script src="https://cdn.jsdelivr.net/npm/pyodide@0.29.5/pyodide.js"></script>
</head>
<body>
<div id="root"></div>
<noscript><div class="centre"><p>PyML runs Python in your browser, so it needs JavaScript enabled.</p></div></noscript>
<script type="module">
const __LESSONS__ = {data};
{api}
{NAMESPACE}
{app}
</script>
</body>
</html>
"""

out = os.path.join(ROOT, "pyml-standalone.html")
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {out}  ({len(html)/1024:.0f} KB, {len(lessons)} lessons)")
```

---

## `docs/LESSON_SCHEMA.md`

```markdown
# Lesson file contract

One JSON file per lesson: `content/<track>/<id>.json`. Adding a lesson = add a
file + push. Nothing else to touch.

```jsonc
{
  "id": "py-01",                  // unique, matches filename
  "track": "python",              // "python" | "ml"
  "order": 1,                     // position within the track
  "title": "Variables and types",
  "blurb": "One sentence, shown on the track list. Concrete, not a promise.",
  "minutes": 12,                  // honest estimate of reading + exercise
  "section": "Introduction",      // optional: groups stops into a collapsing
                                  // block on the map. Omit and the stop lands
                                  // in "Introduction". Add a new name to start
                                  // a new block; order within the track decides
                                  // the order of the blocks.
  "objectives": [                 // 2-4, each a thing they can DO afterwards
    "Assign and reassign variables"
  ],
  "sections": [
    { "type": "prose",   "html": "<p>Paragraphs. Inline <code>x</code> allowed.</p>" },
    { "type": "code",    "caption": "optional", "code": "x = 1\nprint(x)" },
    { "type": "callout", "kind": "warn",   "title": "Watch out", "body": "Plain text." },
    { "type": "callout", "kind": "tip",    "title": "Shortcut",  "body": "Plain text." }
  ],
  "exercise": {
    "brief":   "What to write. One or two sentences. State edge cases explicitly.",
    "starter": "def solve(xs):\n    # your code here\n    return xs\n",
    "solution":"def solve(xs):\n    return sorted(xs)\n",
    "tests": [
      { "label": "sorts ascending", "expr": "solve([3,1,2]) == [1,2,3]" },
      { "label": "handles empty",   "expr": "solve([]) == []" }
    ]
  }
}
```

## Rules the runner depends on

- `tests[].expr` is a **Python expression returning a boolean**, evaluated after
  the learner's code runs. It must reference only the function the brief names.
- Every exercise needs **4-6 tests**, and at least one must cover an edge case
  (empty input, duplicates, single element, division by zero).
- `solution` must pass every one of its own tests. This is checked in CI.
- `html` in prose: only `<p> <code> <strong> <em> <ul> <ol> <li> <a>`. No scripts,
  no style attributes, no headings (the shell supplies those).
- `code` is plain text, not HTML. The shell highlights it.

## Writing standard

- Teach the *why* before the *how*. A lesson that only shows syntax is a failure.
- Every Python lesson earns its place by connecting to data work later on.
- No filler, no "in this lesson we will learn". Open on the actual problem.
- Prose aimed at someone who has never programmed, without talking down.
```

---

## `content/index.json`

```json
[
  "python/py-intro.json",
  "python/py-what.json",
  "python/py-01.json",
  "python/py-02.json",
  "python/py-03.json",
  "python/py-04.json",
  "python/py-05.json",
  "python/py-06.json",
  "python/py-07.json",
  "python/py-08.json",
  "ml/ml-01.json",
  "ml/ml-02.json",
  "ml/ml-03.json",
  "ml/ml-04.json",
  "ml/ml-05.json",
  "ml/ml-06.json",
  "ml/ml-07.json",
  "ml/ml-08.json",
  "ai/ai-01.json",
  "ai/ai-02.json",
  "ai/ai-03.json",
  "ai/ai-04.json",
  "ai/ai-05.json",
  "ai/ai-06.json"
]
```

---

## `content/python/py-intro.json`

```json
{
  "id": "py-intro",
  "track": "python",
  "order": 1,
  "title": "Start here",
  "blurb": "The whole road ahead, and how each stop works, before you write a line.",
  "minutes": 8,
  "section": "Introduction",
  "objectives": [
    "Know every stop on the map and why it is in that order",
    "Know what a challenge asks of you and how it is marked",
    "Run Python in your browser and pass your first test"
  ],
  "sections": [
    {
      "type": "prose",
      "html": "<p>There is nothing to install and nothing to watch. Every stop on this map is a short read followed by one challenge, and the challenge is the point. You write a function, you press <strong>Run tests</strong>, and a list of checks either goes green or stays grey.</p><p>That is deliberate. You are never left wondering whether you understood something. The tests either pass or they do not, and the failing one names the case you missed.</p>"
    },
    {
      "type": "callout",
      "kind": "tip",
      "title": "Nothing to install",
      "body": "A full Python interpreter loads inside this page the first time you open a challenge. It takes a few seconds on first visit, then runs entirely on your own machine. Nothing you type is sent anywhere."
    },
    {
      "type": "prose",
      "html": "<p><strong>The road ahead.</strong> Ten stops, roughly two hours of reading plus however long the challenges take you. They are grouped, and the grouping is the reason for the order.</p><ul><li><strong>Stops 1-2, orientation.</strong> This page, then what Python actually is and why machine learning ended up using it.</li><li><strong>Stops 3-5, the shapes data arrives in.</strong> Values and types, then strings, then lists. Most real data is messy text pretending to be numbers, and this is where you learn to tell the difference.</li><li><strong>Stops 6-7, doing something to all of it.</strong> Loops and comprehensions, then conditionals and the quiet trap where a sensor reading of zero gets treated as missing.</li><li><strong>Stops 8-10, structure and the real world.</strong> Functions, dictionaries and sets, then files and the errors they throw at row nine thousand.</li></ul><p>Nothing here is filler. Every stop exists because skipping it causes a specific, predictable problem later.</p>"
    },
    {
      "type": "prose",
      "html": "<p><strong>After Python.</strong> Two more parts are written and waiting, locked until this map is done.</p><ul><li><strong>How machine learning actually works</strong>, eight stops. A model is a function with numbers you can tune; loss tells it when it is wrong; gradient descent makes it less wrong. You build each piece by hand.</li><li><strong>Build your own AI</strong>, six stops. A neural network that learns, in under sixty lines, written by you, then an honest account of what separates those lines from a large language model.</li></ul><p>They are locked because they do not work without the Python. Not as a gimmick: the exercises assume you can already write a loop without thinking about it.</p>"
    },
    {
      "type": "callout",
      "kind": "warn",
      "title": "Three things that decide whether this works",
      "body": "Getting stuck is the work, not a sign you are failing; ten minutes with a failing test teaches more than reading a correct answer. Show solution is there and it costs you something, because you cannot un-see an answer. And the order matters, because each stop assumes the ones before it."
    },
    {
      "type": "code",
      "caption": "Every challenge has this shape: a function to finish, and tests that check it.",
      "code": "def first_run(name):\n    # your code here\n    return \"\"\n\n# the tests then check things like:\n#   first_run(\"Asish\") == \"Hello, Asish. You are running Python.\"\n#   first_run(\"\") still returns a string instead of crashing"
    }
  ],
  "exercise": {
    "brief": "Write a function named first_run that takes a name and returns the string \"Hello, NAME. You are running Python.\" with NAME replaced by whatever was passed in. An empty name should still produce a string, not an error.",
    "starter": "def first_run(name):\n    # your code here\n    return \"\"\n",
    "solution": "def first_run(name):\n    return \"Hello, \" + name + \". You are running Python.\"\n",
    "tests": [
      {
        "label": "exact wording",
        "expr": "first_run(\"Asish\") == \"Hello, Asish. You are running Python.\""
      },
      {
        "label": "works for a different name",
        "expr": "first_run(\"Priya\") == \"Hello, Priya. You are running Python.\""
      },
      {
        "label": "the name actually appears",
        "expr": "\"Priya\" in first_run(\"Priya\")"
      },
      {
        "label": "empty name does not crash",
        "expr": "first_run(\"\") == \"Hello, . You are running Python.\""
      }
    ]
  }
}
```
