/* AIM interactive illustrations — Advanced ML stage (Advanced 1–13).
   Same contract as viz-ml.js: each widget is (host) => void, registered on AIMViz.W. */
(function () {
  "use strict";
  const V = window.AIMViz;
  const W = V.W;
  const DA = () => (window.AIM_VIZDATA || {}).adv || {};
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const key = (host, items) => {
    const k = V.el("p", "vizkey");
    k.innerHTML = items.map(([c, t]) => `<i style="background:${c}"></i>${t}`).join(" ");
    host.append(k);
  };
  const hint = (host, t) => host.append(V.el("p", "vizhint", t));
  const solve = (A, b) => {
    const n = A.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c]; if (Math.abs(d) < 1e-12) continue;
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / d; if (k) for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => (Math.abs(r[i]) < 1e-12 ? 0 : r[n] / r[i]));
  };
  const blobs = (seed, centres, n, sd) => {
    const r = V.rng(seed), pts = [];
    centres.forEach(([cx, cy], k) => { for (let i = 0; i < n; i++) pts.push({ x: cx + r.normal() * sd, y: cy + r.normal() * sd, k }); });
    return pts;
  };
  const moons = (seed, n, noise) => {
    const r = V.rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const t = Math.PI * r(), k = i % 2;
      const x = k ? 1 - Math.cos(t) : Math.cos(t), y = k ? 0.5 - Math.sin(t) : Math.sin(t);
      pts.push({ x: x + r.normal() * noise, y: y + r.normal() * noise, k });
    }
    return pts;
  };

  /* ------------------------------------------- Advanced 1: lasso path */
  W.lasso = (host) => {
    const D = DA().lasso; if (!D) throw new Error("data missing");
    const ctl = V.controls(host), read = V.readout(host);
    const la = D.alphas.map(Math.log10), lo = la[0], hi = la[la.length - 1];
    let ai = 18;
    const ymax = Math.max(...D.W.flat().map(Math.abs)) * 1.05;
    const cv = V.canvas(host, 0.55, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, lo, hi, -ymax, ymax, [34, 12, 12, 30]), S = V.series(p);
      V.grid(ctx, f, Wd, H, [-1, 0, 1], V.ticks(-ymax, ymax, 4), p);
      D.names.forEach((nm, j) => {
        const on = Math.abs(D.W[ai][j]) > 1e-8;
        ctx.save(); ctx.strokeStyle = on ? S[j % 5] : V.alpha(p.fg3, 0.45); ctx.lineWidth = on ? 2.2 : 1.2;
        if (on) V.glow(ctx, S[j % 5], 6);
        ctx.beginPath(); la.forEach((x, i) => (i ? ctx.lineTo(f.sx(x), f.sy(D.W[i][j])) : ctx.moveTo(f.sx(x), f.sy(D.W[i][j])))); ctx.stroke(); ctx.restore();
        if (on) { ctx.fillStyle = S[j % 5]; ctx.font = "11px " + p.mono; ctx.fillText(nm, f.sx(la[0]) + 4, f.sy(D.W[0][j]) - 3); }
      });
      ctx.save(); ctx.strokeStyle = p.fg; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(f.sx(la[ai]), f.pt); ctx.lineTo(f.sx(la[ai]), H - f.pb); ctx.stroke(); ctx.restore();
      const live = D.names.filter((_, j) => Math.abs(D.W[ai][j]) > 1e-8);
      V.say(read, [["α", D.alphas[ai].toFixed(2)], ["weights still non-zero", `${live.length} of ${D.names.length}`, "hi"], ["selected", live.join(", ") || "none"]]);
    });
    V.slider(ctl, "log₁₀ α", 0, D.alphas.length - 1, 1, ai, (v) => D.alphas[v].toFixed(2), (v) => { ai = v; cv.redraw(); });
    hint(host, "x axis: α on a log scale. Each line is one feature's weight. Grey = switched off (exactly 0).");
  };

  /* ------------------------------------------- Advanced 2: calibration */
  W.calib = (host) => {
    const r = V.rng(11), N = 3000, s = [], y = [];
    for (let i = 0; i < N; i++) { const z = r.normal() * 2.2; s.push(z); y.push(r() < sig(z) ? 1 : 0); }
    let T = 2.5, platt = false;
    const ctl = V.controls(host), read = V.readout(host);
    const fitPlatt = (sc) => { let a = 1, b = 0; for (let it = 0; it < 400; it++) { let ga = 0, gb = 0; for (let i = 0; i < N; i++) { const g = sig(a * sc[i] + b) - y[i]; ga += g * sc[i]; gb += g; } a -= 0.5 * ga / N; b -= 0.5 * gb / N; } return [a, b]; };
    const curve = (pr) => { const B = Array.from({ length: 10 }, () => [0, 0, 0]); pr.forEach((q, i) => { const b = Math.min(9, Math.floor(q * 10)); B[b][0] += q; B[b][1] += y[i]; B[b][2]++; }); return B.filter((b) => b[2]).map(([a, c, n]) => [a / n, c / n, n]); };
    const ece = (C) => C.reduce((t, [m, f, n]) => t + n * Math.abs(m - f), 0) / N;
    const brier = (pr) => pr.reduce((t, q, i) => t + (q - y[i]) ** 2, 0) / N;
    const cv = V.canvas(host, 0.62, (ctx, Wd, H) => {
      const p = V.pal(), side = Math.min(Wd - 40, H - 40), f = V.frame(side + 40, side + 40, 0, 1, 0, 1, [34, 10, 10, 30]);
      V.grid(ctx, f, side + 40, side + 40, [0, 0.5, 1], [0, 0.5, 1], p);
      ctx.save(); ctx.strokeStyle = p.fg3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(f.sx(0), f.sy(0)); ctx.lineTo(f.sx(1), f.sy(1)); ctx.stroke(); ctx.restore();
      const sc = s.map((z) => z * T), raw = sc.map(sig), Craw = curve(raw);
      const draw = (C, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; V.glow(ctx, col, 8); ctx.beginPath(); C.forEach(([m, fr], i) => (i ? ctx.lineTo(f.sx(m), f.sy(fr)) : ctx.moveTo(f.sx(m), f.sy(fr)))); ctx.stroke(); ctx.restore(); C.forEach(([m, fr, n]) => V.dot(ctx, f.sx(m), f.sy(fr), 2 + Math.sqrt(n) / 6, col)); };
      draw(Craw, p.b);
      const rows = [["model scores × T", T.toFixed(2)], ["ECE raw", ece(Craw).toFixed(3)], ["Brier raw", brier(raw).toFixed(4)]];
      if (platt) { const [a, b] = fitPlatt(sc), cal = sc.map((z) => sig(a * z + b)), Cc = curve(cal); draw(Cc, p.a); rows.push(["Platt a, b", `${a.toFixed(2)}, ${b.toFixed(2)}`], ["ECE calibrated", ece(Cc).toFixed(3), "hi"], ["Brier calibrated", brier(cal).toFixed(4)]); }
      ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.fillText("predicted →", f.sx(0.7), f.sy(0) - 6); ctx.fillText("actual ↑", f.sx(0) + 4, f.sy(1) + 12);
      V.say(read, rows);
    }, 260);
    V.slider(ctl, "T (1 = honest)", 0.3, 4, 0.05, T, (v) => v.toFixed(2), (v) => { T = v; cv.redraw(); });
    const b = V.button(ctl, "Apply Platt scaling", () => { platt = !platt; b.textContent = platt ? "Hide Platt" : "Apply Platt scaling"; cv.redraw(); });
    key(host, [["var(--brown)", "raw model"], ["var(--gold)", "after Platt"]]);
    hint(host, "T > 1 makes the model over-confident (S-curve flattens below the diagonal); T < 1 under-confident.");
  };

  /* ------------------------------------------- Advanced 3: linear SVM */
  W.svm = (host) => {
    let pts = blobs(5, [[-1.2, -0.8], [1.2, 0.9]], 18, 0.65), C = 1, cls = 1, model = null;
    const ctl = V.controls(host), read = V.readout(host);
    const train = () => {
      const n = pts.length, lam = 1 / (C * n); let w = [0, 0], b = 0;
      for (let t = 1; t <= 400; t++) {
        const eta = 1 / (lam * t); let gx = 0, gy = 0, gb = 0;
        pts.forEach((q) => { const tt = q.k ? 1 : -1; if (tt * (w[0] * q.x + w[1] * q.y + b) < 1) { gx += tt * q.x; gy += tt * q.y; gb += tt; } });
        w = [(1 - eta * lam) * w[0] + eta * gx / n, (1 - eta * lam) * w[1] + eta * gy / n]; b += 0.1 * eta * gb / n;
        const nr = Math.hypot(...w), cap = 1 / Math.sqrt(lam); if (nr > cap) w = w.map((v) => v * cap / nr);
      }
      model = { w, b };
    };
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), R = 3 * Math.max(1, Wd / H / 1.15), f = V.frame(Wd, H, -R, R, -3, 3, [8, 8, 8, 8]); cv.f = f;
      if (!model) train();
      const { w, b } = model, line = (off, col, dash, lw) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash([6, 5]); ctx.beginPath();
        if (Math.abs(w[1]) > 1e-9) { const yy = (x) => (off - b - w[0] * x) / w[1]; ctx.moveTo(f.sx(-R), f.sy(yy(-R))); ctx.lineTo(f.sx(R), f.sy(yy(R))); }
        else { const xx = (off - b) / w[0]; ctx.moveTo(f.sx(xx), f.sy(-3)); ctx.lineTo(f.sx(xx), f.sy(3)); }
        ctx.stroke(); ctx.restore();
      };
      line(1, p.fg3, true, 1.3); line(-1, p.fg3, true, 1.3); line(0, p.a, false, 2.5);
      let sv = 0, ok = 0;
      pts.forEach((q) => {
        const t = q.k ? 1 : -1, m = t * (w[0] * q.x + w[1] * q.y + b);
        V.dot(ctx, f.sx(q.x), f.sy(q.y), 4.5, q.k ? p.b : p.c);
        if (m <= 1.001) { sv++; ctx.beginPath(); ctx.arc(f.sx(q.x), f.sy(q.y), 8, 0, 7); ctx.strokeStyle = p.fg; ctx.lineWidth = 1.2; ctx.stroke(); }
        if (m > 0) ok++;
      });
      V.say(read, [["C", C.toFixed(2)], ["margin 2/‖w‖", (2 / Math.hypot(...w)).toFixed(2), "hi"], ["support vectors", String(sv)], ["training accuracy", (ok / pts.length * 100).toFixed(0) + "%"]]);
    });
    V.slider(ctl, "C (log)", -2, 2, 0.1, 0, (v) => Math.pow(10, v).toPrecision(2), (v) => { C = Math.pow(10, v); model = null; cv.redraw(); });
    V.select(ctl, "click adds", [["1", "violet class"], ["0", "pink class"]], "1", (v) => { cls = +v; });
    V.button(ctl, "Reset", () => { pts = blobs(5, [[-1.2, -0.8], [1.2, 0.9]], 18, 0.65); model = null; cv.redraw(); });
    cv.cv.addEventListener("click", (e) => { const [x, y] = cv.pos(e); pts.push({ x: cv.f.ix(x), y: cv.f.iy(y), k: cls }); model = null; cv.redraw(); });
    hint(host, "Ringed points are on or inside the street: only they decide the line. Drop a point inside the street and watch it move.");
  };

  /* ------------------------------------------- Advanced 4: kernels */
  W.kernel = (host) => {
    const pts = moons(4, 110, 0.15);
    let kind = "rbf", gamma = 2, model = null;
    const ctl = V.controls(host), read = V.readout(host);
    const k = (a, b) => kind === "rbf" ? Math.exp(-gamma * ((a.x - b.x) ** 2 + (a.y - b.y) ** 2))
      : kind === "poly" ? (a.x * b.x + a.y * b.y + 1) ** 3 : a.x * b.x + a.y * b.y + 1;
    const fit = () => { const K = pts.map((a) => pts.map((b) => k(a, b))); K.forEach((r, i) => (r[i] += 0.01)); model = solve(K, pts.map((q) => (q.k ? 1 : -1))); };
    const dec = (q) => pts.reduce((s, b, i) => s + model[i] * k(q, b), 0);
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -1.6, 2.6, -1.2, 1.7, [6, 6, 6, 6]);
      if (!model) fit();
      const cs = 9;
      for (let X = 0; X < Wd; X += cs) for (let Y = 0; Y < H; Y += cs) {
        const v = dec({ x: f.ix(X + cs / 2), y: f.iy(Y + cs / 2) });
        ctx.fillStyle = V.alpha(v >= 0 ? p.b : p.c, Math.min(0.28, 0.06 + Math.abs(v) * 0.12)); ctx.fillRect(X, Y, cs, cs);
      }
      let ok = 0;
      pts.forEach((q) => { V.dot(ctx, f.sx(q.x), f.sy(q.y), 3.8, q.k ? p.b : p.c, p.fg); if ((dec(q) >= 0) === !!q.k) ok++; });
      V.say(read, [["kernel", kind === "rbf" ? "exp(−γ‖x − z‖²)" : kind === "poly" ? "(x·z + 1)³" : "x·z + 1 (linear)"], ["training accuracy", (ok / pts.length * 100).toFixed(0) + "%", "hi"], ["solve", "α = (K + λI)⁻¹ t"]]);
    });
    V.select(ctl, "kernel", [["rbf", "RBF"], ["poly", "polynomial (3)"], ["linear", "linear"]], kind, (v) => { kind = v; model = null; cv.redraw(); });
    V.slider(ctl, "γ (RBF)", -1, 2, 0.1, Math.log10(gamma), (v) => Math.pow(10, v).toPrecision(2), (v) => { gamma = Math.pow(10, v); model = null; if (kind === "rbf") cv.redraw(); });
    hint(host, "Very large γ memorises every point (islands); very small γ is almost linear.");
  };

  /* ------------------------------------------- Advanced 5: GMM + EM */
  W.gmm = (host) => {
    const r = V.rng(8), pts = [];
    const gen = (n, m, a, b, c) => { for (let i = 0; i < n; i++) { const u = r.normal(), v = r.normal(); pts.push([m[0] + a * u, m[1] + b * u + c * v]); } };
    gen(70, [-1.6, 0.4], 0.9, 0.6, 0.3); gen(60, [1.5, 1.2], 0.35, -0.1, 0.55); gen(50, [0.6, -1.4], 0.7, 0.1, 0.25);
    const K = 3; let st, it;
    const reset = () => { const rr = V.rng(it === undefined ? 3 : Math.floor(Math.random() * 1e6)); st = { pi: [1 / 3, 1 / 3, 1 / 3], mu: [0, 1, 2].map(() => pts[Math.floor(rr() * pts.length)].slice()), S: [0, 1, 2].map(() => [[1, 0], [0, 1]]), R: null, ll: [] }; it = 0; estep(); };
    const pdf = (x, m, S) => { const det = S[0][0] * S[1][1] - S[0][1] * S[1][0], dx = x[0] - m[0], dy = x[1] - m[1]; const q = (S[1][1] * dx * dx - 2 * S[0][1] * dx * dy + S[0][0] * dy * dy) / det; return Math.exp(-q / 2) / (2 * Math.PI * Math.sqrt(det)); };
    const estep = () => { let ll = 0; st.R = pts.map((x) => { const d = [0, 1, 2].map((j) => st.pi[j] * pdf(x, st.mu[j], st.S[j])); const s = d.reduce((a, b) => a + b, 0) || 1e-300; ll += Math.log(s); return d.map((v) => v / s); }); st.ll.push(ll); };
    const mstep = () => {
      for (let j = 0; j < K; j++) {
        const Nk = st.R.reduce((s, r) => s + r[j], 0) + 1e-9; st.pi[j] = Nk / pts.length;
        const m = [0, 0]; pts.forEach((x, i) => { m[0] += st.R[i][j] * x[0]; m[1] += st.R[i][j] * x[1]; }); m[0] /= Nk; m[1] /= Nk; st.mu[j] = m;
        const S = [[1e-6, 0], [0, 1e-6]]; pts.forEach((x, i) => { const dx = x[0] - m[0], dy = x[1] - m[1], w = st.R[i][j] / Nk; S[0][0] += w * dx * dx; S[0][1] += w * dx * dy; S[1][1] += w * dy * dy; }); S[1][0] = S[0][1]; st.S[j] = S;
      }
      it++; estep();
    };
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), C = [p.a, p.b, p.c], f = V.frame(Wd, H, -3.8, 3.4, -3, 3, [6, 6, 6, 6]);
      pts.forEach((x, i) => { const R = st.R[i], j = R.indexOf(Math.max(...R)); V.dot(ctx, f.sx(x[0]), f.sy(x[1]), 3.5, V.alpha(C[j], 0.25 + 0.75 * R[j])); });
      st.mu.forEach((m, j) => {
        const S = st.S[j], tr = S[0][0] + S[1][1], dt = S[0][0] * S[1][1] - S[0][1] ** 2, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - dt)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - dt));
        const ang = Math.atan2(l1 - S[0][0], S[0][1] || 1e-9), sxs = (f.sx(1) - f.sx(0)), sys = (f.sy(0) - f.sy(1));
        [1, 2].forEach((k) => { ctx.save(); ctx.translate(f.sx(m[0]), f.sy(m[1])); ctx.scale(sxs, -sys); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0, 0, k * Math.sqrt(Math.max(l1, 1e-6)), k * Math.sqrt(Math.max(l2, 1e-6)), 0, 0, 7); ctx.restore(); ctx.strokeStyle = V.alpha(C[j], k === 1 ? 0.9 : 0.45); ctx.lineWidth = 1.8; ctx.stroke(); });
        V.dot(ctx, f.sx(m[0]), f.sy(m[1]), 5, C[j], p.fg);
      });
      const ll = st.ll[st.ll.length - 1];
      V.say(read, [["EM iteration", String(it)], ["log-likelihood", ll.toFixed(2), "hi"], ["weights π", st.pi.map((v) => v.toFixed(2)).join(" · ")], ["never goes down?", st.ll.every((v, i) => !i || v >= st.ll[i - 1] - 1e-4) ? "yes ✓" : "no ✗"]]);
    });
    const anim = V.animate(() => { if (it > 60) return false; mstep(); cv.redraw(); }, 160);
    V.button(ctl, "Step (E + M)", () => { anim.stop(); mstep(); cv.redraw(); });
    V.button(ctl, "Run", () => (V.reduced() ? (() => { for (let i = 0; i < 40; i++) mstep(); cv.redraw(); })() : anim.start()));
    V.button(ctl, "New start", () => { anim.stop(); reset(); cv.redraw(); });
    reset();
    hint(host, "Faded points are shared between bells. Ellipses show 1σ and 2σ of each component.");
  };

  /* ------------------------------------------- Advanced 6: DBSCAN */
  W.dbscan = (host) => {
    const r = V.rng(21), pts = moons(6, 160, 0.07).map((q) => [q.x, q.y]);
    for (let i = 0; i < 14; i++) pts.push([-1.4 + 3.8 * r(), -1 + 2.5 * r()]);
    let eps = 0.25, minp = 5;
    const ctl = V.controls(host), read = V.readout(host);
    const run = () => {
      const n = pts.length, nb = pts.map((a) => pts.map((b, j) => ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 <= eps * eps ? j : -1)).filter((j) => j >= 0));
      const core = nb.map((l) => l.length >= minp), lab = new Array(n).fill(-1); let c = 0;
      for (let i = 0; i < n; i++) { if (lab[i] !== -1 || !core[i]) continue; lab[i] = c; const st = [i]; while (st.length) { const q = st.pop(); if (!core[q]) continue; nb[q].forEach((j) => { if (lab[j] === -1) { lab[j] = c; st.push(j); } }); } c++; }
      return { lab, core, c };
    };
    const cv = V.canvas(host, 0.55, (ctx, Wd, H) => {
      const p = V.pal(), S = V.series(p), f = V.frame(Wd, H, -1.6, 2.6, -1.1, 1.6, [6, 6, 6, 6]), { lab, core, c } = run();
      pts.forEach(([x, y], i) => {
        if (lab[i] === -1) { ctx.strokeStyle = p.fg3; ctx.lineWidth = 1.4; const X = f.sx(x), Y = f.sy(y); ctx.beginPath(); ctx.moveTo(X - 4, Y - 4); ctx.lineTo(X + 4, Y + 4); ctx.moveTo(X + 4, Y - 4); ctx.lineTo(X - 4, Y + 4); ctx.stroke(); return; }
        V.dot(ctx, f.sx(x), f.sy(y), core[i] ? 4.5 : 3, core[i] ? S[lab[i] % 5] : V.alpha(S[lab[i] % 5], 0.5));
      });
      const R = f.sx(eps) - f.sx(0); ctx.save(); ctx.strokeStyle = p.fg3; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(Wd - R - 12, R + 12, R, 0, 7); ctx.stroke(); ctx.restore();
      ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.textAlign = "right"; ctx.fillText("eps", Wd - 2 * R - 16, R + 16); ctx.textAlign = "left";
      V.say(read, [["clusters", String(c), "hi"], ["noise points", String(lab.filter((v) => v === -1).length)], ["core points", String(core.filter(Boolean).length)]]);
    });
    V.slider(ctl, "eps", 0.05, 0.6, 0.01, eps, (v) => v.toFixed(2), (v) => { eps = v; cv.redraw(); });
    V.slider(ctl, "min_pts", 2, 15, 1, minp, null, (v) => { minp = v; cv.redraw(); });
    hint(host, "Big dots are core points; small dots are border points; crosses are noise. Too big an eps merges the moons.");
  };

  /* ------------------------------------------- Advanced 7: t-SNE */
  W.tsne = (host) => {
    const D = DA().tsne; if (!D) throw new Error("data missing");
    const X = D.X.map((r) => r.map((v) => v / 16)), lab = D.y, n = X.length;
    const d2 = X.map((a) => X.map((b) => a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0)));
    const P = Array.from({ length: n }, () => new Array(n).fill(0)), target = Math.log2(15);
    for (let i = 0; i < n; i++) {
      let lo = 0, hi = Infinity, beta = 1;
      for (let t = 0; t < 60; t++) {
        const row = d2[i].map((d, j) => (j === i ? 0 : Math.exp(-d * beta))), s = row.reduce((a, b) => a + b, 0) || 1e-300;
        let Hh = 0; row.forEach((v, j) => { if (j !== i) { const q = v / s; if (q > 1e-12) Hh -= q * Math.log2(q); } P[i][j] = v / s; });
        if (Math.abs(Hh - target) < 1e-4) break;
        if (Hh > target) { lo = beta; beta = hi === Infinity ? beta * 2 : (beta + hi) / 2; } else { hi = beta; beta = (beta + lo) / 2; }
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const v = Math.max((P[i][j] + P[j][i]) / (2 * n), 1e-12); P[i][j] = P[j][i] = v; }
    let Y, vel, it, kl = 0;
    const reset = () => { const r = V.rng(5); Y = X.map(() => [r.normal() * 1e-2, r.normal() * 1e-2]); vel = Y.map(() => [0, 0]); it = 0; };
    const step = () => {
      const ex = it < 60 ? 4 : 1, num = Y.map((a) => Y.map((b) => 1 / (1 + (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)));
      let Z = 0; num.forEach((r, i) => r.forEach((v, j) => { if (i !== j) Z += v; }));
      kl = 0;
      for (let i = 0; i < n; i++) {
        let gx = 0, gy = 0;
        for (let j = 0; j < n; j++) { if (i === j) continue; const q = Math.max(num[i][j] / Z, 1e-12), m = (ex * P[i][j] - q) * num[i][j]; gx += 4 * m * (Y[i][0] - Y[j][0]); gy += 4 * m * (Y[i][1] - Y[j][1]); kl += P[i][j] * Math.log(P[i][j] / q); }
        const mom = it < 60 ? 0.5 : 0.8; vel[i][0] = mom * vel[i][0] - 60 * gx; vel[i][1] = mom * vel[i][1] - 60 * gy;
      }
      Y.forEach((y, i) => { y[0] += vel[i][0]; y[1] += vel[i][1]; });
      it++;
    };
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), C = { 0: p.a, 1: p.b, 6: p.c };
      const xs = Y.map((y) => y[0]), ys = Y.map((y) => y[1]), m = Math.max(1e-3, ...xs.map(Math.abs), ...ys.map(Math.abs)) * 1.1;
      const f = V.frame(Wd, H, -m * Wd / H, m * Wd / H, -m, m, [6, 6, 6, 6]);
      Y.forEach((y, i) => { ctx.fillStyle = C[lab[i]]; ctx.font = "bold 12px " + p.mono; ctx.textAlign = "center"; ctx.fillText(String(lab[i]), f.sx(y[0]), f.sy(y[1]) + 4); });
      V.say(read, [["iteration", String(it)], ["phase", it < 60 ? "early exaggeration (P × 4)" : "fine-tuning"], ["KL(P‖Q)", it ? kl.toFixed(3) : "—", "hi"]]);
    });
    const anim = V.animate(() => { if (it >= 300) return false; for (let k = 0; k < 3; k++) step(); cv.redraw(); }, 40);
    V.button(ctl, "Run", () => { if (V.reduced()) { while (it < 300) step(); cv.redraw(); } else anim.start(); });
    V.button(ctl, "Pause", () => anim.stop());
    V.button(ctl, "Restart", () => { anim.stop(); reset(); cv.redraw(); });
    reset();
    hint(host, "90 real handwritten digits (0, 1, 6), 64 pixels each. Each number is drawn where t-SNE puts it.");
  };

  /* ------------------------------------------- Advanced 8: isolation forest */
  W.iforest = (host) => {
    const r0 = V.rng(9), pts = []; for (let i = 0; i < 120; i++) pts.push([r0.normal() * 0.8, r0.normal() * 0.6]);
    let odd = [2.6, 1.9], cuts = [], rr = V.rng(2);
    const ctl = V.controls(host), read = V.readout(host);
    const box0 = [-4, 4, -3, 3];
    const isolate = (target, rnd, rec) => { // returns number of cuts to isolate `target`
      let P = pts.concat([odd]), box = box0.slice(), d = 0;
      while (P.length > 1 && d < 40) {
        const ax = rnd() < 0.5 ? 0 : 1, lo = Math.min(...P.map((q) => q[ax])), hi = Math.max(...P.map((q) => q[ax]));
        if (lo === hi) break;
        const c = lo + rnd() * (hi - lo);
        if (rec) rec.push({ ax, c, box: box.slice() });
        const left = target[ax] < c;
        P = P.filter((q) => (q[ax] < c) === left);
        if (ax === 0) { if (left) box[1] = c; else box[0] = c; } else { if (left) box[3] = c; else box[2] = c; }
        d++;
      }
      return d;
    };
    const avg = (t) => { const rnd = V.rng(77); let s = 0; for (let k = 0; k < 60; k++) s += isolate(t, rnd); return s / 60; };
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -4, 4, -3, 3, [6, 6, 6, 6]); cv.f = f;
      cuts.forEach(({ ax, c, box }, i) => { ctx.strokeStyle = V.alpha(p.a, 0.35 + 0.5 * (i + 1) / cuts.length); ctx.lineWidth = 1.3; ctx.beginPath(); if (ax === 0) { ctx.moveTo(f.sx(c), f.sy(box[2])); ctx.lineTo(f.sx(c), f.sy(box[3])); } else { ctx.moveTo(f.sx(box[0]), f.sy(c)); ctx.lineTo(f.sx(box[1]), f.sy(c)); } ctx.stroke(); });
      pts.forEach(([x, y]) => V.dot(ctx, f.sx(x), f.sy(y), 3, V.alpha(p.b, 0.8)));
      V.dot(ctx, f.sx(odd[0]), f.sy(odd[1]), 6, p.c, p.fg);
      const ho = avg(odd), hn = avg(pts[0]), cn = 2 * (Math.log(120) + 0.5772) - 2 * 120 / 121;
      V.say(read, [["cuts this tree", String(cuts.length)], ["avg cuts: pink point", ho.toFixed(1), "hi"], ["avg cuts: a normal point", hn.toFixed(1)], ["score 2^(−h/c)", `${Math.pow(2, -ho / cn).toFixed(2)} vs ${Math.pow(2, -hn / cn).toFixed(2)}`]]);
    });
    const grow = () => { cuts = []; isolate(odd, rr, cuts); cv.redraw(); };
    V.button(ctl, "New random tree", grow);
    cv.cv.addEventListener("click", (e) => { const [x, y] = cv.pos(e); odd = [cv.f.ix(x), cv.f.iy(y)]; grow(); });
    grow();
    hint(host, "Click anywhere to move the pink point. Drop it in the middle of the crowd and it takes many more cuts to isolate.");
  };

  /* ------------------------------------------- Advanced 9: matrix factorisation */
  W.mf = (host) => {
    const r = V.rng(5), U = 12, I = 12, k = 2;
    const tu = Array.from({ length: U }, () => [r.normal(), r.normal()]), ti = Array.from({ length: I }, () => [r.normal(), r.normal()]);
    const truth = tu.map((a) => ti.map((b) => Math.max(1, Math.min(5, 3 + 0.9 * (a[0] * b[0] + a[1] * b[1])))));
    const seen = truth.map(() => truth[0].map(() => r() < 0.6));
    let P, Q, bu, bi, mu, ep;
    const reset = () => { const q = V.rng(3); P = tu.map(() => [q.normal() * 0.1, q.normal() * 0.1]); Q = ti.map(() => [q.normal() * 0.1, q.normal() * 0.1]); bu = new Array(U).fill(0); bi = new Array(I).fill(0); let s = 0, c = 0; seen.forEach((row, u) => row.forEach((v, i) => { if (v) { s += truth[u][i]; c++; } })); mu = s / c; ep = 0; };
    const pred = (u, i) => mu + bu[u] + bi[i] + P[u][0] * Q[i][0] + P[u][1] * Q[i][1];
    const epoch = () => { for (let u = 0; u < U; u++) for (let i = 0; i < I; i++) if (seen[u][i]) { const e = truth[u][i] - pred(u, i), lr = 0.05, rg = 0.05; bu[u] += lr * (e - rg * bu[u]); bi[i] += lr * (e - rg * bi[i]); for (let f = 0; f < k; f++) { const pu = P[u][f]; P[u][f] += lr * (e * Q[i][f] - rg * pu); Q[i][f] += lr * (e * pu - rg * Q[i][f]); } } ep++; };
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.55, (ctx, Wd, H) => {
      const p = V.pal(), cs = Math.min((Wd - 60) / I, (H - 30) / U), x0 = 46, y0 = 22;
      ctx.font = (cs < 34 ? "10px " : "11px ") + p.mono; ctx.fillStyle = p.fg3; ctx.textAlign = "center";
      for (let i = 0; i < I; i++) ctx.fillText("i" + (i + 1), x0 + i * cs + cs / 2, y0 - 6);
      ctx.textAlign = "right"; for (let u = 0; u < U; u++) ctx.fillText("u" + (u + 1), x0 - 6, y0 + u * cs + cs / 2 + 4);
      let so = 0, co = 0, sh = 0, ch = 0, sm = 0;
      for (let u = 0; u < U; u++) for (let i = 0; i < I; i++) {
        const v = seen[u][i] ? truth[u][i] : ep ? Math.max(1, Math.min(5, pred(u, i))) : null, X = x0 + i * cs, Y = y0 + u * cs;
        ctx.fillStyle = v == null ? V.alpha(p.fg3, 0.08) : V.alpha(seen[u][i] ? p.a : p.b, 0.12 + 0.75 * (v - 1) / 4); ctx.fillRect(X + 1, Y + 1, cs - 2, cs - 2);
        if (seen[u][i]) { ctx.strokeStyle = p.fg2; ctx.lineWidth = 1; ctx.strokeRect(X + 1.5, Y + 1.5, cs - 3, cs - 3); }
        ctx.fillStyle = p.fg; ctx.textAlign = "center"; ctx.fillText(v == null ? "?" : v.toFixed(1), X + cs / 2, Y + cs / 2 + 4);
        const e = (Math.max(1, Math.min(5, pred(u, i))) - truth[u][i]) ** 2; if (seen[u][i]) { so += e; co++; } else { sh += e; ch++; sm += (mu - truth[u][i]) ** 2; }
      }
      V.say(read, [["epochs", String(ep)], ["RMSE seen cells", Math.sqrt(so / co).toFixed(3)], ["RMSE hidden cells", Math.sqrt(sh / ch).toFixed(3), "hi"], ["just guessing the mean", Math.sqrt(sm / ch).toFixed(3)], ["model", "r̂ = μ + b_u + b_i + p_u · q_i  (k = 2)"]]);
    }, 300);
    V.button(ctl, "Train 10 epochs", () => { for (let t = 0; t < 10; t++) epoch(); cv.redraw(); });
    V.button(ctl, "Train 200", () => { for (let t = 0; t < 200; t++) epoch(); cv.redraw(); });
    V.button(ctl, "Reset", () => { reset(); cv.redraw(); });
    reset();
    key(host, [["var(--gold)", "rating we saw (outlined)"], ["var(--brown)", "rating the model fills in"]]);
  };

  /* ------------------------------------------- Advanced 10: Q-learning */
  W.qlearn = (host) => {
    const holes = new Set(["1,1", "2,3", "3,0"]), M = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let Q, eps = 0.2, episodes, rnd, lastPath = [];
    const reset = () => { Q = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => [0, 0, 0, 0])); episodes = 0; rnd = V.rng(4); lastPath = []; };
    const stepEnv = (s, a) => { const n = [Math.min(3, Math.max(0, s[0] + M[a][0])), Math.min(3, Math.max(0, s[1] + M[a][1]))]; if (n[0] === 3 && n[1] === 3) return [n, 1, true]; if (holes.has(n.join())) return [n, -1, true]; return [n, -0.01, false]; };
    const argmax = (q) => q.indexOf(Math.max(...q));
    const episode = () => { let s = [0, 0], done = false, k = 0; while (!done && k++ < 100) { const a = rnd() < eps ? Math.floor(rnd() * 4) : argmax(Q[s[0]][s[1]]); const [n, rw, d] = stepEnv(s, a); const tgt = d ? rw : rw + 0.95 * Math.max(...Q[n[0]][n[1]]); Q[s[0]][s[1]][a] += 0.5 * (tgt - Q[s[0]][s[1]][a]); s = n; done = d; } episodes++; };
    const greedy = () => { let s = [0, 0]; const path = [s]; for (let k = 0; k < 20; k++) { const [n, , d] = stepEnv(s, argmax(Q[s[0]][s[1]])); path.push(n); s = n; if (d) break; } return path; };
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.62, (ctx, Wd, H) => {
      const p = V.pal(), cs = Math.min(Wd - 20, H - 20) / 4, x0 = (Wd - 4 * cs) / 2, y0 = (H - 4 * cs) / 2, arr = ["↑", "↓", "←", "→"];
      for (let rI = 0; rI < 4; rI++) for (let c = 0; c < 4; c++) {
        const X = x0 + c * cs, Y = y0 + rI * cs, id = rI + "," + c, q = Q[rI][c], v = Math.max(...q);
        ctx.fillStyle = holes.has(id) ? V.alpha(p.bad, 0.35) : rI === 3 && c === 3 ? V.alpha(p.ok, 0.4) : V.alpha(v >= 0 ? p.a : p.c, Math.min(0.5, 0.05 + Math.abs(v) * 0.5));
        ctx.fillRect(X + 2, Y + 2, cs - 4, cs - 4);
        ctx.fillStyle = p.fg; ctx.textAlign = "center"; ctx.font = `bold ${Math.round(cs / 3)}px ${p.mono}`;
        const lbl = holes.has(id) ? "H" : rI === 3 && c === 3 ? "G" : episodes && q.some((x) => x) ? arr[argmax(q)] : "·";
        ctx.fillText(lbl, X + cs / 2, Y + cs / 2 + cs / 9);
        if (!holes.has(id) && !(rI === 3 && c === 3)) { ctx.font = "10px " + p.mono; ctx.fillStyle = p.fg3; ctx.fillText(v.toFixed(2), X + cs / 2, Y + cs - 6); }
      }
      if (lastPath.length > 1) { ctx.save(); ctx.strokeStyle = p.b; ctx.lineWidth = 3; V.glow(ctx, p.b, 10); ctx.beginPath(); lastPath.forEach(([rI, c], i) => { const X = x0 + c * cs + cs / 2, Y = y0 + rI * cs + cs / 2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore(); }
      const end = lastPath[lastPath.length - 1];
      const ok = end && end[0] === 3 && end[1] === 3;
      V.say(read, [["episodes", String(episodes)], ["ε (explore)", eps.toFixed(2)],
        ["greedy path", !lastPath.length ? "—" : ok ? `reaches G in ${lastPath.length - 1} moves` : "not there yet", ok ? "hi" : ""]]);
    });
    const train = (n) => { for (let i = 0; i < n; i++) episode(); lastPath = greedy(); cv.redraw(); };
    V.button(ctl, "Train 10 episodes", () => train(10));
    V.button(ctl, "Train 200", () => train(200));
    V.slider(ctl, "ε", 0, 1, 0.05, eps, (v) => v.toFixed(2), (v) => { eps = v; });
    V.button(ctl, "Reset", () => { reset(); cv.redraw(); });
    reset();
    hint(host, "Start top-left, goal G (+1), holes H (−1), each move −0.01. Numbers are max Q: the value of standing there.");
  };

  /* ------------------------------------------- Advanced 11: autoencoder */
  W.autoenc = (host) => {
    const D = DA().ae; if (!D) throw new Error("data missing");
    let ci = 2;
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.24, (ctx, Wd, H) => {
      const p = V.pal(), code = D.codes[ci], rec = D.rec[code], gap = 18, cs = Math.min((Wd - gap * 6) / 48, (H - 30) / 8);
      const x0 = (Wd - (48 * cs + 5 * gap)) / 2;
      const draw = (img, X, Y, title) => { for (let k = 0; k < 64; k++) { const v = Math.max(0, Math.min(16, img[k])) / 16; ctx.fillStyle = V.alpha(p.a, 0.05 + 0.95 * v); ctx.fillRect(X + (k % 8) * cs, Y + Math.floor(k / 8) * cs, cs - 0.5, cs - 0.5); } ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.textAlign = "center"; ctx.fillText(title, X + 4 * cs, Y + 8 * cs + 14); };
      D.orig.forEach((img, j) => { const X = x0 + j * (16 * cs + 2 * gap); draw(img, X, 6, "original"); draw(rec[j], X + 8 * cs + gap, 6, `rebuilt from ${code}`); });
      V.say(read, [["code size", `${code} numbers`], ["compression", `64 → ${code} (${(64 / code).toFixed(0)}×)`], ["training MSE (pixels 0–1)", String(D.mse[code]), "hi"]]);
    }, 150);
    V.slider(ctl, "bottleneck", 0, D.codes.length - 1, 1, ci, (v) => String(D.codes[v]), (v) => { ci = v; cv.redraw(); });
    hint(host, "Each autoencoder was trained with this lesson's reference solution (150 epochs, Adam). Smaller codes keep the shape, lose detail.");
  };

  /* ------------------------------------------- Advanced 12: drift (PSI) */
  W.drift = (host) => {
    const r = V.rng(31), N = 4000, base = [], z = [];
    for (let i = 0; i < N; i++) { base.push(r.normal()); z.push(r.normal()); }
    let shift = 0, scale = 1;
    const sorted = base.slice().sort((a, b) => a - b), edges = [-Infinity]; for (let k = 1; k < 10; k++) edges.push(sorted[Math.floor(k * N / 10)]); edges.push(Infinity);
    const hist = (xs) => { const h = new Array(10).fill(0); xs.forEach((x) => { let b = 0; while (x >= edges[b + 1]) b++; h[b]++; }); return h.map((v) => Math.max(v / xs.length, 1e-6)); };
    const ctl = V.controls(host), read = V.readout(host);
    const cv = V.canvas(host, 0.5, (ctx, Wd, H) => {
      const p = V.pal(), live = z.map((v) => v * scale + shift), e = hist(base), a = hist(live);
      const psi = e.reduce((s, ev, i) => s + (a[i] - ev) * Math.log(a[i] / ev), 0);
      const ls = live.slice().sort((x, y) => x - y); let ks = 0, j = 0;
      sorted.forEach((x, i) => { while (j < N && ls[j] <= x) j++; ks = Math.max(ks, Math.abs((i + 1) / N - j / N)); });
      const top = Math.max(...e, ...a) * 1.15, bw = (Wd - 50) / 10, f = V.frame(Wd, H, 0, 10, 0, top, [36, 10, 10, 26]);
      V.grid(ctx, f, Wd, H, [], V.ticks(0, top, 3), p);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = V.alpha(p.fg3, 0.45); ctx.fillRect(f.sx(i) + 3, f.sy(e[i]), bw / 2 - 4, f.sy(0) - f.sy(e[i]));
        ctx.fillStyle = V.alpha(psi > 0.25 ? p.bad : psi > 0.1 ? "#fbbf24" : p.a, 0.85); ctx.fillRect(f.sx(i) + bw / 2, f.sy(a[i]), bw / 2 - 4, f.sy(0) - f.sy(a[i]));
      }
      ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.textAlign = "center"; ctx.fillText("10 bins = training deciles (each holds 10% of training data)", Wd / 2, H - 8);
      V.say(read, [["PSI", psi.toFixed(3), "hi"], ["status", psi > 0.25 ? "drifted ✗ act" : psi > 0.1 ? "watch" : "stable ✓"], ["KS", ks.toFixed(3)]]);
    }, 200);
    V.slider(ctl, "live mean shift", -1.5, 1.5, 0.05, shift, (v) => v.toFixed(2), (v) => { shift = v; cv.redraw(); });
    V.slider(ctl, "live spread ×", 0.4, 2.5, 0.05, scale, (v) => v.toFixed(2), (v) => { scale = v; cv.redraw(); });
    key(host, [["rgba(125,140,163,.6)", "training"], ["var(--gold)", "live"]]);
  };

  /* ------------------------------------------- Advanced 13: fairness */
  W.fairness = (host) => {
    const r = V.rng(12), rows = [];
    for (let i = 0; i < 3000; i++) { const g = r() < 0.5 ? 0 : 1, y = r() < 0.4 ? 1 : 0, raw = y * 1.5 + r.normal(); rows.push({ g, y, s: g ? raw * 0.6 - 0.4 : raw }); }
    const th = [0.5, 0.5];
    const ctl = V.controls(host), read = V.readout(host);
    const rates = (g) => { const R = rows.filter((q) => q.g === g), pos = R.filter((q) => q.y), neg = R.filter((q) => !q.y), sel = (q) => q.s >= th[g]; return { tpr: pos.filter(sel).length / pos.length, fpr: neg.filter(sel).length / neg.length, sel: R.filter(sel).length / R.length }; };
    const cv = V.canvas(host, 0.48, (ctx, Wd, H) => {
      const p = V.pal(), A = rates(0), B = rates(1), names = ["TPR", "FPR", "approved"], keys = ["tpr", "fpr", "sel"], bw = (Wd - 80) / 3;
      ctx.font = "12px " + p.mono;
      keys.forEach((k, i) => {
        const X = 50 + i * bw, base = H - 26, hgt = H - 56;
        [[A, p.a, "A"], [B, p.b, "B"]].forEach(([R, col, nm], j) => { const h = R[k] * hgt; ctx.fillStyle = V.alpha(col, 0.85); ctx.fillRect(X + j * (bw / 2 - 6), base - h, bw / 2 - 14, h); ctx.fillStyle = p.fg; ctx.textAlign = "center"; ctx.fillText(R[k].toFixed(2), X + j * (bw / 2 - 6) + (bw / 2 - 14) / 2, base - h - 5); });
        ctx.fillStyle = p.fg3; ctx.textAlign = "center"; ctx.fillText(names[i], X + bw / 2 - 10, H - 8);
      });
      const gap = Math.abs(A.tpr - B.tpr);
      V.say(read, [["TPR gap (equal opportunity)", gap.toFixed(3), gap < 0.02 ? "hi" : ""], ["approval gap (demographic parity)", Math.abs(A.sel - B.sel).toFixed(3)], ["verdict", gap < 0.02 ? "qualified people treated alike ✓" : "group B's qualified applicants are missed more"]]);
    }, 190);
    const sa = V.slider(ctl, "threshold A", -1.5, 2.5, 0.01, th[0], (v) => v.toFixed(2), (v) => { th[0] = v; cv.redraw(); });
    const sb = V.slider(ctl, "threshold B", -1.5, 2.5, 0.01, th[1], (v) => v.toFixed(2), (v) => { th[1] = v; cv.redraw(); });
    V.button(ctl, "Match TPR at 0.80", () => {
      [0, 1].forEach((g) => { const pos = rows.filter((q) => q.g === g && q.y).map((q) => q.s).sort((a, b) => b - a); th[g] = pos[Math.ceil(0.8 * pos.length) - 1]; });
      sa.setValue(th[0]); sb.setValue(th[1]); cv.redraw();
    });
    key(host, [["var(--gold)", "group A"], ["var(--brown)", "group B (biased score)"]]);
  };
})();
