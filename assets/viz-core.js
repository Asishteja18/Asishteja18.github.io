/* AIM interactive illustrations — core helpers + Python-block widgets.
   Every widget is `(host) => void`, draws with the page's theme tokens, and
   explains itself through a live readout. Registered on window.AIMViz.W. */
(function () {
  "use strict";
  const V = (window.AIMViz = window.AIMViz || { W: {} });

  /* ---------------------------------------------------------- utilities */
  const css = (v, fb) => (getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb);
  V.pal = () => ({
    fg: css("--fg", "#e6edf7"), fg2: css("--fg-2", "#9fb0c8"), fg3: css("--fg-3", "#7d8ca3"),
    line: css("--line", "rgba(148,163,184,.18)"), a: css("--gold", "#22d3ee"), b: css("--brown", "#a78bfa"),
    c: css("--neon-3", "#f472b6"), ok: css("--ok", "#34d399"), bad: css("--bad", "#fb7185"),
    card: css("--muted", "#1b2333"), mono: css("--mono", "monospace"),
  });
  V.series = (p) => [p.a, p.b, p.c, p.ok, "#fbbf24"];

  V.el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // seeded RNG so every learner sees the same "random" data
  V.rng = (seed = 7) => {
    let s = seed >>> 0;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    r.normal = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  };

  // A responsive, HiDPI canvas. draw(ctx, W, H) is called on resize too.
  V.canvas = (host, aspect = 0.56, draw, minH = 200) => {
    const cv = V.el("canvas", "vizcv");
    host.append(cv);
    const ctx = cv.getContext("2d");
    const st = { W: 0, H: 0, draw };
    const size = () => {
      const w = Math.max(240, cv.parentElement ? cv.parentElement.clientWidth : 480);
      const h = Math.max(minH, Math.round(w * aspect));
      const d = window.devicePixelRatio || 1;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      cv.style.height = h + "px";
      ctx.setTransform(d, 0, 0, d, 0, 0);
      st.W = w; st.H = h;
      st.draw && st.draw(ctx, w, h);
    };
    st.redraw = () => { ctx.clearRect(0, 0, st.W, st.H); st.draw && st.draw(ctx, st.W, st.H); };
    st.cv = cv; st.ctx = ctx; st.size = size;
    cv.addEventListener("aim-theme", () => st.redraw());
    if ("ResizeObserver" in window) new ResizeObserver(() => size()).observe(host);
    requestAnimationFrame(size);
    // pointer in canvas coordinates
    st.pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    return st;
  };

  V.controls = (host) => { const c = V.el("div", "vizctl"); host.append(c); return c; };

  V.slider = (host, label, min, max, step, value, fmt, on) => {
    const w = V.el("label", "vizsl");
    const t = V.el("span", "vizsl-l", label);
    const r = V.el("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = value;
    const o = V.el("output", "vizsl-v");
    const show = () => { o.textContent = fmt ? fmt(+r.value) : r.value; };
    r.addEventListener("input", () => { show(); on(+r.value); });
    show();
    w.append(t, r, o);
    host.append(w);
    r.setValue = (v) => { r.value = v; show(); };
    return r;
  };

  V.button = (host, label, on, cls = "") => {
    const b = V.el("button", "btn ghost sm vizbtn " + cls, label);
    b.type = "button"; b.onclick = on; host.append(b); return b;
  };

  V.select = (host, label, options, value, on) => {
    const w = V.el("label", "vizsl");
    w.append(V.el("span", "vizsl-l", label));
    const s = V.el("select", "vizsel");
    options.forEach(([v, t]) => s.append(new Option(t, v)));
    s.value = value;
    s.onchange = () => on(s.value);
    w.append(s); host.append(w);
    return s;
  };

  V.readout = (host) => { const r = V.el("div", "vizread"); r.setAttribute("aria-live", "polite"); host.append(r); return r; };
  // readout lines: [label, value, accent?]
  V.say = (r, rows) => {
    r.innerHTML = "";
    rows.forEach(([k, v, cls]) => {
      const d = V.el("span", "vizkv" + (cls ? " " + cls : ""));
      d.append(V.el("b", null, k), V.el("code", null, v));
      r.append(d);
    });
  };

  // axes helper: maps data box to canvas box with padding
  V.frame = (W, H, x0, x1, y0, y1, pad = [28, 14, 14, 30]) => {
    const [pl, pt, pr, pb] = [pad[0], pad[1], pad[2], pad[3]];
    const sx = (x) => pl + ((x - x0) / (x1 - x0)) * (W - pl - pr);
    const sy = (y) => H - pb - ((y - y0) / (y1 - y0)) * (H - pt - pb);
    const ix = (px) => x0 + ((px - pl) / (W - pl - pr)) * (x1 - x0);
    const iy = (py) => y0 + ((H - pb - py) / (H - pt - pb)) * (y1 - y0);
    return { sx, sy, ix, iy, pl, pt, pr, pb };
  };
  V.grid = (ctx, f, W, H, xt = [], yt = [], p = V.pal()) => {
    ctx.save();
    ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono;
    xt.forEach((x) => { const X = f.sx(x); ctx.beginPath(); ctx.moveTo(X, f.pt); ctx.lineTo(X, H - f.pb); ctx.stroke(); ctx.textAlign = "center"; ctx.fillText(+x.toFixed(3), X, H - f.pb + 15); });
    yt.forEach((y) => { const Y = f.sy(y); ctx.beginPath(); ctx.moveTo(f.pl, Y); ctx.lineTo(W - f.pr, Y); ctx.stroke(); ctx.textAlign = "right"; ctx.fillText(+y.toFixed(3), f.pl - 5, Y + 4); });
    ctx.restore();
  };
  V.ticks = (a, b, n = 5) => {
    const step = Math.pow(10, Math.floor(Math.log10((b - a) / n)));
    const m = [1, 2, 5, 10].find((k) => (b - a) / (k * step) <= n) * step;
    const out = []; for (let v = Math.ceil(a / m) * m; v <= b + 1e-9; v += m) out.push(+v.toFixed(10));
    return out;
  };
  V.dot = (ctx, x, y, r, fill, stroke) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  };
  V.glow = (ctx, color, blur = 12) => { ctx.shadowColor = color; ctx.shadowBlur = blur; };
  V.alpha = (c, a) => {
    if (c.startsWith("#")) {
      const n = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1, 7);
      return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
    }
    return c.replace(/rgba?\(([^)]+)\)/, (_, v) => `rgba(${v.split(",").slice(0, 3).join(",")},${a})`);
  };
  V.heat = (t, p = V.pal()) => V.alpha(p.a, 0.06 + 0.94 * Math.max(0, Math.min(1, t)));
  V.animate = (step, ms = 30) => {
    let id = null;
    const stop = () => { if (id) clearInterval(id); id = null; };
    const start = () => { stop(); id = setInterval(() => { if (step() === false) stop(); }, ms); };
    return { start, stop, get on() { return !!id; } };
  };
  V.reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // python's slice semantics, so the slicer shows exactly what Python returns
  V.pySlice = (n, start, stop, step) => {
    const out = [];
    if (step > 0) {
      let a = start == null ? 0 : start < 0 ? Math.max(0, n + start) : Math.min(start, n);
      const b = stop == null ? n : stop < 0 ? Math.max(0, n + stop) : Math.min(stop, n);
      for (let i = a; i < b; i += step) out.push(i);
    } else {
      let a = start == null ? n - 1 : start < 0 ? n + start : Math.min(start, n - 1);
      const b = stop == null ? -1 : stop < 0 ? Math.max(-1, n + stop) : stop;
      for (let i = a; i > b; i += step) if (i >= 0) out.push(i);
    }
    return out;
  };

  /* --------------------------------------------- Day 1: // and % (hms) */
  V.W.hms = (host) => {
    const ctl = V.controls(host);
    const boxes = V.el("div", "vizrow3"); host.append(boxes);
    const read = V.readout(host);
    const mk = (name, max) => {
      const b = V.el("div", "vizbox");
      const n = V.el("span", "vizbig"), l = V.el("span", "vizlab", name), bar = V.el("i", "vizbar"), fill = V.el("b");
      bar.append(fill); b.append(n, l, bar); boxes.append(b);
      return (v) => { n.textContent = String(v).padStart(2, "0"); fill.style.width = (v / max) * 100 + "%"; };
    };
    const H = mk("hours", 24), M = mk("minutes", 60), S = mk("seconds", 60);
    const set = (s) => {
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
      H(h); M(m); S(x);
      V.say(read, [["total_seconds", String(s)], ["// 3600", String(h)], ["% 3600 // 60", String(m)], ["% 60", String(x)],
        ["f\"{h:02}:{m:02}:{s:02}\"", `"${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}"`, "hi"]]);
    };
    V.slider(ctl, "seconds", 0, 86399, 1, 3723, null, set);
    set(3723);
  };

  /* --------------------------------------------- Day 2: slicing */
  V.W.slice = (host) => {
    const ctl = V.controls(host);
    const word = V.el("input", "vizin"); word.value = "python"; word.maxLength = 16; word.setAttribute("aria-label", "string to slice");
    const wl = V.el("label", "vizsl"); wl.append(V.el("span", "vizsl-l", "s ="), word); ctl.append(wl);
    const st = { a: 0, b: 3, c: 1, useA: true, useB: true };
    const strip = V.el("div", "vizstrip"); host.append(strip);
    const read = V.readout(host);
    const ctl2 = V.controls(host);
    let sa, sb;
    const draw = () => {
      const s = Array.from(word.value || " ");
      const n = s.length;
      sa.min = sb.min = -n; sa.max = sb.max = n;
      const idx = V.pySlice(n, st.useA ? st.a : null, st.useB ? st.b : null, st.c);
      strip.innerHTML = "";
      s.forEach((ch, i) => {
        const c = V.el("div", "vizcell" + (idx.includes(i) ? " on" : ""));
        c.append(V.el("small", null, String(i)), V.el("span", null, ch === " " ? "␣" : ch), V.el("small", null, String(i - n)));
        const k = idx.indexOf(i);
        if (k >= 0) c.append(V.el("em", null, String(k + 1)));
        strip.append(c);
      });
      const expr = `s[${st.useA ? st.a : ""}:${st.useB ? st.b : ""}${st.c !== 1 ? ":" + st.c : ""}]`;
      V.say(read, [[expr, JSON.stringify(idx.map((i) => s[i]).join("")), "hi"], ["len(s)", String(n)],
        ["rule", st.c > 0 ? "start included, stop excluded" : "negative step walks backwards"]]);
    };
    sa = V.slider(ctl2, "start", -6, 6, 1, 0, null, (v) => { st.a = v; draw(); });
    sb = V.slider(ctl2, "stop", -6, 6, 1, 3, null, (v) => { st.b = v; draw(); });
    V.slider(ctl2, "step", -3, 3, 1, 1, (v) => (v === 0 ? "1" : String(v)), (v) => { st.c = v || 1; draw(); });
    const omit = (lab, key) => {
      const l = V.el("label", "vizchk"); const c = V.el("input"); c.type = "checkbox";
      c.onchange = () => { st[key] = !c.checked; draw(); };
      l.append(c, document.createTextNode(lab)); ctl2.append(l);
    };
    omit("omit start", "useA"); omit("omit stop", "useB");
    word.oninput = draw;
    draw();
  };

  /* --------------------------------------------- Day 4: Collatz loop */
  V.W.collatz = (host) => {
    const ctl = V.controls(host);
    let n = 27;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.42, (ctx, W, H) => {
      const p = V.pal();
      const seq = [n]; while (seq[seq.length - 1] !== 1 && seq.length < 400) { const x = seq[seq.length - 1]; seq.push(x % 2 ? 3 * x + 1 : x / 2); }
      const mx = Math.max(...seq);
      const bw = (W - 20) / seq.length;
      seq.forEach((v, i) => {
        const h = (v / mx) * (H - 30);
        ctx.fillStyle = v % 2 ? p.b : p.a;
        ctx.fillRect(10 + i * bw, H - 10 - h, Math.max(1, bw - 1), h);
      });
      V.say(read, [["start", String(n)], ["steps until 1", String(seq.length - 1), "hi"], ["peak", String(mx)],
        ["loop", "while n != 1: n = n//2 if even else 3*n+1"]]);
    });
    V.slider(ctl, "start number", 1, 120, 1, n, null, (v) => { n = v; cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `<i style="background:var(--gold)"></i> even → halve <i style="background:var(--brown)"></i> odd → 3n+1`;
    host.append(k);
  };

  /* --------------------------------------------- Day 5: running mean */
  V.W.running = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(11);
    const xs = Array.from({ length: 80 }, (_, i) => 2 + Math.sin(i / 9) * 1.2 + r.normal() * 0.55);
    let k = 5;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.45, (ctx, W, H) => {
      const p = V.pal(), f = V.frame(W, H, 0, 79, -0.5, 4.5);
      V.grid(ctx, f, W, H, [0, 20, 40, 60, 79], [0, 2, 4], p);
      xs.forEach((v, i) => V.dot(ctx, f.sx(i), f.sy(v), 2.6, V.alpha(p.fg2, 0.55)));
      ctx.beginPath(); ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10);
      xs.forEach((_, i) => {
        const w = xs.slice(Math.max(0, i - k + 1), i + 1);
        const m = w.reduce((a, b) => a + b, 0) / w.length;
        i ? ctx.lineTo(f.sx(i), f.sy(m)) : ctx.moveTo(f.sx(i), f.sy(m));
      });
      ctx.stroke(); ctx.shadowBlur = 0;
      V.say(read, [["window", String(k)], ["running_mean[i]", "mean(xs[i-window+1 : i+1])", "hi"], ["trade-off", k > 10 ? "smooth but late" : k < 3 ? "fast but noisy" : "balanced"]]);
    });
    V.slider(ctl, "window", 1, 25, 1, k, null, (v) => { k = v; cv.redraw(); });
  };

  /* --------------------------------------------- Day 6: hashing into buckets */
  V.W.hash = (host) => {
    const ctl = V.controls(host);
    const inp = V.el("input", "vizin wide"); inp.value = "apple banana cherry mango kiwi grape lime pear plum fig";
    inp.setAttribute("aria-label", "words to put in the dict");
    const l = V.el("label", "vizsl grow"); l.append(V.el("span", "vizsl-l", "keys"), inp); ctl.append(l);
    const q = V.el("input", "vizin"); q.value = "mango"; q.setAttribute("aria-label", "key to look up");
    const l2 = V.el("label", "vizsl"); l2.append(V.el("span", "vizsl-l", "look up"), q); ctl.append(l2);
    const wrap = V.el("div", "vizbuckets"); host.append(wrap);
    const read = V.readout(host);
    const N = 8;
    const h = (s) => { let x = 5381; for (const ch of s) x = ((x * 33) ^ ch.codePointAt(0)) >>> 0; return x; };
    const draw = () => {
      const words = [...new Set(inp.value.toLowerCase().split(/\s+/).filter(Boolean))];
      const B = Array.from({ length: N }, () => []);
      words.forEach((w) => B[h(w) % N].push(w));
      const qb = h(q.value.toLowerCase()) % N;
      wrap.innerHTML = "";
      B.forEach((b, i) => {
        const c = V.el("div", "vizbucket" + (i === qb ? " on" : ""));
        c.append(V.el("small", null, "bucket " + i));
        b.forEach((w) => c.append(V.el("span", w === q.value.toLowerCase() ? "hit" : "", w)));
        wrap.append(c);
      });
      const found = B[qb].includes(q.value.toLowerCase());
      V.say(read, [["hash(key) % 8", String(qb)], ["checked", B[qb].length + " key(s), not " + words.length], [`"${q.value}" in d`, String(found ? "True" : "False"), "hi"]]);
    };
    inp.oninput = q.oninput = draw; draw();
  };

  /* --------------------------------------------- Day 12: min-max scaling */
  V.W.minmax = (host) => {
    const ctl = V.controls(host);
    const base = [12, 18, 23, 27, 31, 38, 44, 52];
    let out = 60;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.38, (ctx, W, H) => {
      const p = V.pal(), xs = base.concat([out]);
      const lo = Math.min(...xs), hi = Math.max(...xs);
      const top = 40, bot = H - 40, L = 40, R = W - 30;
      const sx = (v) => L + ((v - 0) / 200) * (R - L), sx2 = (t) => L + t * (R - L);
      ctx.strokeStyle = p.line; ctx.lineWidth = 2;
      [[top, "raw value"], [bot, "scaled 0…1"]].forEach(([y, t]) => { ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.fillText(t, L, y - 10); });
      xs.forEach((v, i) => {
        const t = (v - lo) / (hi - lo || 1);
        ctx.strokeStyle = V.alpha(i === xs.length - 1 ? p.c : p.a, 0.35); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx(v), top); ctx.lineTo(sx2(t), bot); ctx.stroke();
        V.dot(ctx, sx(v), top, 5, i === xs.length - 1 ? p.c : p.a);
        V.dot(ctx, sx2(t), bot, 5, i === xs.length - 1 ? p.c : p.a);
      });
      ctx.fillStyle = p.fg3; ctx.fillText("0", sx2(0) - 3, bot + 18); ctx.fillText("1", sx2(1) - 3, bot + 18);
      V.say(read, [["formula", "(x - min) / (max - min)", "hi"], ["min, max", lo + ", " + hi], ["38 →", ((38 - lo) / (hi - lo)).toFixed(3)],
        ["note", out > 120 ? "one outlier squashes everyone else" : "order and gaps are kept"]]);
    });
    V.slider(ctl, "largest value (pink)", 55, 200, 1, out, null, (v) => { out = v; cv.redraw(); });
  };

  /* --------------------------------------------- Days 13 + 31: vectors */
  V.W.vector = (host) => {
    const st = { a: [3, 1], b: [1, 2.5] };
    let drag = null;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.62, (ctx, W, H) => {
      const p = V.pal();
      const R = 4.5 * Math.max(1, W / H) ;
      const f = V.frame(W, H, -R, R, -4.5, 4.5, [10, 10, 10, 10]);
      ctx.strokeStyle = p.line; ctx.lineWidth = 1;
      for (let x = Math.ceil(-R); x <= R; x++) { ctx.beginPath(); ctx.moveTo(f.sx(x), 10); ctx.lineTo(f.sx(x), H - 10); ctx.stroke(); }
      for (let y = -4; y <= 4; y++) { ctx.beginPath(); ctx.moveTo(10, f.sy(y)); ctx.lineTo(W - 10, f.sy(y)); ctx.stroke(); }
      const arrow = (v, col, dash, from = [0, 0]) => {
        const x0 = f.sx(from[0]), y0 = f.sy(from[1]), x1 = f.sx(from[0] + v[0]), y1 = f.sy(from[1] + v[1]);
        ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; if (dash) ctx.setLineDash([6, 5]);
        V.glow(ctx, col, dash ? 0 : 10);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
        const an = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 11 * Math.cos(an - 0.4), y1 - 11 * Math.sin(an - 0.4)); ctx.lineTo(x1 - 11 * Math.cos(an + 0.4), y1 - 11 * Math.sin(an + 0.4)); ctx.fill();
        ctx.restore();
      };
      const { a, b } = st, s = [a[0] + b[0], a[1] + b[1]];
      arrow(b, V.alpha(p.b, 0.35), true, a);
      arrow(s, p.fg3, true);
      arrow(a, p.a); arrow(b, p.b);
      V.dot(ctx, f.sx(a[0]), f.sy(a[1]), 8, null, p.a); V.dot(ctx, f.sx(b[0]), f.sy(b[1]), 8, null, p.b);
      ctx.fillStyle = p.fg2; ctx.font = "12px " + p.mono; ctx.fillText("a", f.sx(a[0]) + 10, f.sy(a[1]) - 8); ctx.fillText("b", f.sx(b[0]) + 10, f.sy(b[1]) - 8); ctx.fillText("a+b", f.sx(s[0]) + 8, f.sy(s[1]) - 8);
      const dot = a[0] * b[0] + a[1] * b[1], na = Math.hypot(...a), nb = Math.hypot(...b), cos = dot / (na * nb || 1);
      V.say(read, [["a", `(${a.map((x) => x.toFixed(1))})`], ["b", `(${b.map((x) => x.toFixed(1))})`], ["a + b", `(${s.map((x) => x.toFixed(1))})`],
        ["a · b", dot.toFixed(2)], ["|a|, |b|", na.toFixed(2) + ", " + nb.toFixed(2)], ["cos θ", cos.toFixed(3), "hi"], ["θ", (Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI).toFixed(1) + "°"]]);
      cv.f = f;
    });
    cv.cv.style.touchAction = "none";
    cv.cv.addEventListener("pointerdown", (e) => {
      const [x, y] = cv.pos(e), f = cv.f;
      const d = (v) => Math.hypot(f.sx(v[0]) - x, f.sy(v[1]) - y);
      drag = d(st.a) < d(st.b) ? "a" : "b";
      cv.cv.setPointerCapture(e.pointerId);
    });
    cv.cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const [x, y] = cv.pos(e), f = cv.f;
      st[drag] = [Math.round(f.ix(x) * 2) / 2, Math.round(f.iy(y) * 2) / 2];
      if (!st[drag][0] && !st[drag][1]) st[drag] = [0.5, 0];
      cv.redraw();
    });
    cv.cv.addEventListener("pointerup", () => { drag = null; });
    host.append(V.el("p", "vizhint", "Drag either arrow tip. Snaps to half units."));
  };

  /* --------------------------------------------- Day 15: matmul */
  V.W.matmul = (host) => {
    const r = V.rng(3);
    let A = [[1, 2, 0], [3, -1, 2]], B = [[2, 1], [0, 1], [4, -2]];
    const grid = V.el("div", "vizmm"); host.append(grid);
    const read = V.readout(host);
    const ctl = V.controls(host);
    let hi = [0, 0];
    const C = () => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
    const draw = () => {
      grid.innerHTML = "";
      const mat = (M, name, on) => {
        const m = V.el("div", "vizmat"); m.style.gridTemplateColumns = `repeat(${M[0].length}, 2.6em)`;
        M.forEach((row, i) => row.forEach((v, j) => { const c = V.el("span", on(i, j) ? "on" : "", String(v)); m.append(c); if (name === "C") { c.tabIndex = 0; c.onmouseenter = c.onfocus = () => { hi = [i, j]; draw(); }; } }));
        const w = V.el("div", "vizmatw"); w.append(V.el("small", null, name + " " + M.length + "×" + M[0].length), m); return w;
      };
      const c = C();
      grid.append(mat(A, "A", (i) => i === hi[0]), V.el("b", "vizop", "@"), mat(B, "B", (_, j) => j === hi[1]), V.el("b", "vizop", "="), mat(c, "C", (i, j) => i === hi[0] && j === hi[1]));
      const [i, j] = hi;
      V.say(read, [[`C[${i}][${j}]`, A[i].map((v, k) => `${v}×${B[k][j]}`).join(" + ") + " = " + c[i][j], "hi"], ["shapes", "(2×3) @ (3×2) → (2×2): inner sizes must match"]]);
    };
    V.button(ctl, "New numbers", () => { A = A.map((r0) => r0.map(() => Math.floor(r() * 7) - 3)); B = B.map((r0) => r0.map(() => Math.floor(r() * 7) - 3)); draw(); });
    host.append(V.el("p", "vizhint", "Hover or tab through the cells of C."));
    draw();
  };

  /* --------------------------------------------- Day 23: Iris scatter */
  V.W.scatter = (host) => {
    const D = window.AIM_VIZDATA.iris;
    let fx = 2, fy = 3;
    const ctl = V.controls(host);
    const opts = D.features.map((f, i) => [String(i), f + " (cm)"]);
    const read = V.readout(host);
    const cv = V.canvas(host, 0.6, (ctx, W, H) => {
      const p = V.pal(), cols = V.series(p);
      const xs = D.X.map((r) => r[fx]), ys = D.X.map((r) => r[fy]);
      const x0 = Math.min(...xs) - 0.3, x1 = Math.max(...xs) + 0.3, y0 = Math.min(...ys) - 0.3, y1 = Math.max(...ys) + 0.3;
      const f = V.frame(W, H, x0, x1, y0, y1, [36, 12, 12, 30]);
      V.grid(ctx, f, W, H, V.ticks(x0, x1), V.ticks(y0, y1), p);
      D.X.forEach((r, i) => V.dot(ctx, f.sx(r[fx]), f.sy(r[fy]), 4.2, V.alpha(cols[D.y[i]], 0.8), cols[D.y[i]]));
      const means = [0, 1, 2].map((s) => { const rows = D.X.filter((_, i) => D.y[i] === s); return [rows.reduce((a, r) => a + r[fx], 0) / rows.length, rows.reduce((a, r) => a + r[fy], 0) / rows.length]; });
      V.say(read, means.map((m, s) => [D.species[s], `mean (${m[0].toFixed(2)}, ${m[1].toFixed(2)})`]).concat([["rows", "150 flowers · 50 per species"]]));
    });
    V.select(ctl, "x", opts, String(fx), (v) => { fx = +v; cv.redraw(); });
    V.select(ctl, "y", opts, String(fy), (v) => { fy = +v; cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = D.species.map((s, i) => `<i style="background:${["var(--gold)", "var(--brown)", "var(--neon-3)"][i]}"></i>${s}`).join(" ");
    host.append(k);
  };

  /* ---------------------------------------------------------- mounting */
  V.mount = (id, host) => {
    const w = V.W[id];
    if (!w) return false;
    host.classList.add("viz-" + id);
    try { w(host); } catch (e) { host.append(V.el("p", "vizhint", "This illustration could not start: " + e.message)); }
    // repaint canvases when the theme flips
    new MutationObserver(() => host.querySelectorAll("canvas").forEach((c) => c.dispatchEvent(new Event("aim-theme"))))
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return true;
  };
})();
