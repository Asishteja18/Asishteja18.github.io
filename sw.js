/* AIM service worker: makes return visits fast and the app installable.
   - the page itself: network first (so updates land), cached copy offline
   - our assets + course content: served from cache, refreshed in the background
   - Pyodide, GSAP, Mermaid, fonts (versioned CDN files): cache first, kept
   - Supabase, YouTube and everything else: never touched */
const VERSION = "aim-20261117e";
const SHELL = ["./", "index.html", "manifest.webmanifest", "assets/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("aim-") && k !== VERSION && k !== "aim-cdn").map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const CDN = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/(pyodide@|gsap@|mermaid@)|fonts\.gstatic\.com\/|fonts\.googleapis\.com\/)/;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (CDN.test(req.url)) {
    e.respondWith(caches.open("aim-cdn").then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") c.put(req, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put("index.html", copy));
      return res;
    }).catch(() => caches.match("index.html")));
    return;
  }

  if (/\/(assets|content)\//.test(url.pathname) || url.pathname.endsWith(".webmanifest")) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
