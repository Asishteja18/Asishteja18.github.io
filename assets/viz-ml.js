/* AIM interactive illustrations — machine-learning block (Days 31–60). */
(function () {
  "use strict";
  const V = window.AIMViz;
  const W = V.W;

  /* small linear-algebra helpers */
  const solve = (A, b) => { // Gaussian elimination with partial pivoting
    const n = A.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      if (Math.abs(M[c][c]) < 1e-12) continue;
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => (Math.abs(r[i]) < 1e-12 ? 0 : r[n] / r[i]));
  };
  const blobs = (seed, centres, n, sd) => {
    const r = V.rng(seed), pts = [];
    centres.forEach(([cx, cy], k) => { for (let i = 0; i < n; i++) pts.push({ x: cx + r.normal() * sd, y: cy + r.normal() * sd, k }); });
    return pts;
  };

  /* ---------------------------------------------- Day 32: derivative */
  W.derivative = (host) => {
    const ctl = V.controls(host);
    const fn = (x) => x * x * x - 3 * x, dfn = (x) => 3 * x * x - 3;
    let x0 = 1.6, h = 1;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.55, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -2.6, 2.6, -4.5, 4.5);
      V.grid(ctx, f, Wd, H, [-2, -1, 0, 1, 2], [-4, -2, 0, 2, 4], p);
      ctx.beginPath(); ctx.strokeStyle = p.fg2; ctx.lineWidth = 2;
      for (let i = 0; i <= 200; i++) { const x = -2.6 + (5.2 * i) / 200; i ? ctx.lineTo(f.sx(x), f.sy(fn(x))) : ctx.moveTo(f.sx(x), f.sy(fn(x))); }
      ctx.stroke();
      const line = (m, col, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; if (dash) ctx.setLineDash([6, 5]); V.glow(ctx, col, dash ? 0 : 8); ctx.beginPath(); ctx.moveTo(f.sx(-2.6), f.sy(fn(x0) + m * (-2.6 - x0))); ctx.lineTo(f.sx(2.6), f.sy(fn(x0) + m * (2.6 - x0))); ctx.stroke(); ctx.restore(); };
      const sec = (fn(x0 + h) - fn(x0)) / h;
      line(dfn(x0), p.a, false); line(sec, p.b, true);
      V.dot(ctx, f.sx(x0), f.sy(fn(x0)), 5, p.a); V.dot(ctx, f.sx(x0 + h), f.sy(fn(x0 + h)), 5, p.b);
      V.say(read, [["f(x)", "x³ − 3x"], ["(f(x+h) − f(x)) / h", sec.toFixed(5)], ["exact f′(x) = 3x² − 3", dfn(x0).toFixed(5), "hi"], ["error", Math.abs(sec - dfn(x0)).toExponential(2)]]);
    });
    V.slider(ctl, "x", -2.2, 2.2, 0.05, x0, (v) => v.toFixed(2), (v) => { x0 = v; cv.redraw(); });
    V.slider(ctl, "h (log)", -4, 0, 0.05, 0, (v) => Math.pow(10, v).toPrecision(2), (v) => { h = Math.pow(10, v); cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `<i style="background:var(--gold)"></i> tangent (true slope) <i style="background:var(--brown)"></i> secant through x and x+h`; host.append(k);
  };

  /* ---------------------------------------------- Day 33: gradient descent */
  W.gd = (host) => {
    const ctl = V.controls(host);
    const fx = (x, y) => x * x + 4 * y * y, gx = (x, y) => [2 * x, 8 * y];
    let lr = 0.1, start = [-2.6, 1.6], path = [start];
    const read = V.readout(host);
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), R = 3 * Math.max(1, Wd / H / 1.1), f = V.frame(Wd, H, -R, R, -2, 2, [8, 8, 8, 8]);
      [0.25, 1, 2.5, 5, 9, 14].forEach((c, i) => { // contours: ellipses x²+4y²=c
        ctx.beginPath(); ctx.strokeStyle = V.alpha(p.b, 0.18 + i * 0.04); ctx.lineWidth = 1.2;
        ctx.ellipse(f.sx(0), f.sy(0), (f.sx(Math.sqrt(c)) - f.sx(0)), (f.sy(0) - f.sy(Math.sqrt(c) / 2)), 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.beginPath(); ctx.strokeStyle = p.a; ctx.lineWidth = 2; V.glow(ctx, p.a, 10);
      path.forEach(([x, y], i) => (i ? ctx.lineTo(f.sx(x), f.sy(y)) : ctx.moveTo(f.sx(x), f.sy(y)))); ctx.stroke(); ctx.shadowBlur = 0;
      path.forEach(([x, y], i) => V.dot(ctx, f.sx(x), f.sy(y), i === path.length - 1 ? 5 : 2.5, p.a));
      V.dot(ctx, f.sx(0), f.sy(0), 4, p.ok);
      const [x, y] = path[path.length - 1];
      const L = fx(x, y);
      V.say(read, [["step", String(path.length - 1)], ["loss x² + 4y²", isFinite(L) ? L.toFixed(4) : "∞", "hi"], ["update", "p ← p − lr · ∇f(p)"],
        ["verdict", L > 1e3 ? "diverged: lr too big" : lr > 0.24 ? "bouncing across the valley" : lr < 0.03 ? "crawling" : "converging"]]);
      cv.f = f;
    });
    const anim = V.animate(() => {
      const [x, y] = path[path.length - 1], [a, b] = gx(x, y);
      const nx = [x - lr * a, y - lr * b];
      if (path.length > 80 || !isFinite(nx[0]) || Math.abs(nx[0]) > 1e4 || Math.hypot(...nx) < 1e-4) return false;
      path.push(nx); cv.redraw();
    }, 90);
    V.slider(ctl, "learning rate", 0.01, 0.3, 0.005, lr, (v) => v.toFixed(3), (v) => { lr = v; path = [start]; cv.redraw(); });
    V.button(ctl, "Run", () => { path = [start]; V.reduced() ? (() => { while (anim && path.length < 80) { const [x, y] = path[path.length - 1], [a, b] = gx(x, y); path.push([x - lr * a, y - lr * b]); } cv.redraw(); })() : anim.start(); });
    V.button(ctl, "Step", () => { anim.stop(); const [x, y] = path[path.length - 1], [a, b] = gx(x, y); path.push([x - lr * a, y - lr * b]); cv.redraw(); });
    cv.cv.addEventListener("click", (e) => { const [x, y] = cv.pos(e); start = [cv.f.ix(x), cv.f.iy(y)]; path = [start]; anim.stop(); cv.redraw(); });
    host.append(V.el("p", "vizhint", "Click the bowl to choose a new start point. Try lr 0.25 and above."));
  };

  /* ---------------------------------------------- Day 34: normal sampling */
  W.normal = (host) => {
    const ctl = V.controls(host);
    let mu = 0, sd = 1, n = 200, seed = 1;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.5, (ctx, Wd, H) => {
      const p = V.pal(), r = V.rng(seed), xs = Array.from({ length: n }, () => mu + sd * r.normal());
      const f = V.frame(Wd, H, -6, 6, 0, 0.85);
      V.grid(ctx, f, Wd, H, [-6, -4, -2, 0, 2, 4, 6], [0, 0.4, 0.8], p);
      const bins = 48, bw = 12 / bins, cnt = new Array(bins).fill(0);
      xs.forEach((x) => { const b = Math.floor((x + 6) / bw); if (b >= 0 && b < bins) cnt[b]++; });
      cnt.forEach((c, i) => { const d = c / (n * bw); ctx.fillStyle = V.alpha(p.b, 0.55); ctx.fillRect(f.sx(-6 + i * bw) + 1, f.sy(d), f.sx(bw) - f.sx(0) - 2, f.sy(0) - f.sy(d)); });
      ctx.beginPath(); ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10);
      for (let i = 0; i <= 240; i++) { const x = -6 + (12 * i) / 240, y = Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)); i ? ctx.lineTo(f.sx(x), f.sy(Math.min(y, 0.85))) : ctx.moveTo(f.sx(x), f.sy(y)); }
      ctx.stroke(); ctx.shadowBlur = 0;
      const m = xs.reduce((a, b) => a + b, 0) / n, s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
      const within = xs.filter((x) => Math.abs(x - mu) <= sd).length / n;
      V.say(read, [["sample mean", m.toFixed(3)], ["sample std", s.toFixed(3)], ["within 1σ", (within * 100).toFixed(1) + "% (theory 68.3%)", "hi"]]);
    });
    V.slider(ctl, "μ", -3, 3, 0.1, mu, (v) => v.toFixed(1), (v) => { mu = v; cv.redraw(); });
    V.slider(ctl, "σ", 0.4, 2.5, 0.1, sd, (v) => v.toFixed(1), (v) => { sd = v; cv.redraw(); });
    V.slider(ctl, "n samples", 10, 5000, 10, n, null, (v) => { n = v; cv.redraw(); });
    V.button(ctl, "Resample", () => { seed++; cv.redraw(); });
  };

  /* ---------------------------------------------- Days 36–37: linear regression */
  W.linreg = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(5);
    let pts = Array.from({ length: 14 }, (_, i) => { const x = 0.5 + i * 0.65; return [x, 1 + 0.8 * x + r.normal() * 0.9]; });
    let gd = null, it = 0;
    const read = V.readout(host);
    const fit = () => {
      const n = pts.length; if (n < 2) return [0, 0];
      const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
      const sxy = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
      const w = sxx ? sxy / sxx : 0; return [w, my - w * mx];
    };
    const mse = ([w, b]) => pts.reduce((a, p) => a + (w * p[0] + b - p[1]) ** 2, 0) / Math.max(1, pts.length);
    const cv = V.canvas(host, 0.58, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, 0, 10, 0, 10);
      V.grid(ctx, f, Wd, H, [0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8, 10], p);
      const best = fit(), cur = gd || best;
      pts.forEach(([x, y]) => { ctx.strokeStyle = V.alpha(p.c, 0.45); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(f.sx(x), f.sy(y)); ctx.lineTo(f.sx(x), f.sy(cur[0] * x + cur[1])); ctx.stroke(); ctx.setLineDash([]); });
      if (gd) { ctx.strokeStyle = V.alpha(p.fg3, 0.6); ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(f.sx(0), f.sy(best[1])); ctx.lineTo(f.sx(10), f.sy(best[0] * 10 + best[1])); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10);
      ctx.beginPath(); ctx.moveTo(f.sx(0), f.sy(cur[1])); ctx.lineTo(f.sx(10), f.sy(cur[0] * 10 + cur[1])); ctx.stroke(); ctx.shadowBlur = 0;
      pts.forEach(([x, y]) => V.dot(ctx, f.sx(x), f.sy(y), 5, p.b));
      V.say(read, [["w (slope)", cur[0].toFixed(3)], ["b (intercept)", cur[1].toFixed(3)], ["MSE", mse(cur).toFixed(4), "hi"],
        gd ? ["gradient descent", "epoch " + it + (Math.abs(mse(cur) - mse(best)) < 1e-3 ? " · matches closed form" : "")] : ["closed form", "w = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²"]]);
      cv.f = f;
    });
    cv.cv.addEventListener("click", (e) => { const [x, y] = cv.pos(e); pts.push([cv.f.ix(x), cv.f.iy(y)]); gd = null; cv.redraw(); });
    const anim = V.animate(() => {
      const n = pts.length; let [w, b] = gd; let dw = 0, db = 0;
      pts.forEach(([x, y]) => { const e = w * x + b - y; dw += (2 / n) * e * x; db += (2 / n) * e; });
      gd = [w - 0.012 * dw, b - 0.012 * db]; it++;
      cv.redraw(); if (it > 600) return false;
    }, 16);
    V.button(ctl, "Train with gradient descent", () => { gd = [0, 0]; it = 0; anim.start(); });
    V.button(ctl, "Closed form", () => { anim.stop(); gd = null; cv.redraw(); });
    V.button(ctl, "Clear points", () => { anim.stop(); pts = []; gd = null; cv.redraw(); });
    host.append(V.el("p", "vizhint", "Click to add points. Pink dashes are the residuals the line is minimising."));
  };

  /* ---------------------------------------------- Day 38: polynomial + ridge */
  W.poly = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(9);
    const pts = Array.from({ length: 14 }, (_, i) => { const x = -1 + (2 * i) / 13 + r.normal() * 0.02; return [x, Math.sin(Math.PI * x) + r.normal() * 0.25]; });
    const test = Array.from({ length: 40 }, (_, i) => { const x = -1 + (2 * i) / 39; return [x, Math.sin(Math.PI * x)]; });
    let deg = 3, lam = 0;
    const read = V.readout(host);
    const feats = (x) => Array.from({ length: deg + 1 }, (_, k) => x ** k);
    const fitW = () => {
      const D = deg + 1, A = Array.from({ length: D }, () => new Array(D).fill(0)), b = new Array(D).fill(0);
      pts.forEach(([x, y]) => { const f = feats(x); for (let i = 0; i < D; i++) { b[i] += f[i] * y; for (let j = 0; j < D; j++) A[i][j] += f[i] * f[j]; } });
      for (let i = 1; i < D; i++) A[i][i] += lam;
      return solve(A, b);
    };
    const cv = V.canvas(host, 0.55, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -1.05, 1.05, -2, 2);
      V.grid(ctx, f, Wd, H, [-1, -0.5, 0, 0.5, 1], [-2, -1, 0, 1, 2], p);
      const w = fitW(), pred = (x) => feats(x).reduce((s, v, k) => s + v * w[k], 0);
      ctx.strokeStyle = V.alpha(p.fg3, 0.7); ctx.setLineDash([5, 5]); ctx.beginPath();
      test.forEach(([x, y], i) => (i ? ctx.lineTo(f.sx(x), f.sy(y)) : ctx.moveTo(f.sx(x), f.sy(y)))); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.beginPath(); ctx.rect(f.pl, f.pt, Wd - f.pl - f.pr, H - f.pt - f.pb); ctx.clip();
      ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10); ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = -1.05 + (2.1 * i) / 300; i ? ctx.lineTo(f.sx(x), f.sy(pred(x))) : ctx.moveTo(f.sx(x), f.sy(pred(x))); }
      ctx.stroke(); ctx.restore();
      pts.forEach(([x, y]) => V.dot(ctx, f.sx(x), f.sy(y), 5, p.b));
      const tr = pts.reduce((a, [x, y]) => a + (pred(x) - y) ** 2, 0) / pts.length, te = test.reduce((a, [x, y]) => a + (pred(x) - y) ** 2, 0) / test.length;
      V.say(read, [["train MSE", tr.toFixed(4)], ["test MSE (true curve)", te.toFixed(4), "hi"], ["|w|", Math.hypot(...w).toFixed(1)],
        ["diagnosis", te > 3 * tr + 0.05 && deg > 5 ? "overfitting" : deg < 2 ? "underfitting" : "reasonable"]]);
    });
    V.slider(ctl, "degree", 1, 13, 1, deg, null, (v) => { deg = v; cv.redraw(); });
    V.slider(ctl, "ridge λ (log)", -6, 1, 0.1, -6, (v) => (v <= -6 ? "0" : Math.pow(10, v).toPrecision(2)), (v) => { lam = v <= -6 ? 0 : Math.pow(10, v); cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `<i style="background:var(--gold)"></i> your polynomial <i style="background:var(--fg-3)"></i> true sin(πx)`; host.append(k);
  };

  /* ---------------------------------------------- Day 39: sigmoid */
  W.sigmoid = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(4);
    const data = Array.from({ length: 24 }, (_, i) => { const y = i < 12 ? 0 : 1; return [(y ? 1.2 : -1.2) + r.normal() * 1.3, y]; });
    let w = 1.5, b = 0;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.5, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -6, 6, -0.1, 1.1);
      V.grid(ctx, f, Wd, H, [-6, -4, -2, 0, 2, 4, 6], [0, 0.5, 1], p);
      const s = (x) => 1 / (1 + Math.exp(-(w * x + b)));
      ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10); ctx.beginPath();
      for (let i = 0; i <= 240; i++) { const x = -6 + (12 * i) / 240; i ? ctx.lineTo(f.sx(x), f.sy(s(x))) : ctx.moveTo(f.sx(x), f.sy(s(x))); } ctx.stroke(); ctx.shadowBlur = 0;
      if (w) { const xb = -b / w; ctx.strokeStyle = V.alpha(p.c, 0.8); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(f.sx(xb), f.pt); ctx.lineTo(f.sx(xb), H - f.pb); ctx.stroke(); ctx.setLineDash([]); }
      let ll = 0, acc = 0;
      data.forEach(([x, y]) => { const q = Math.min(1 - 1e-9, Math.max(1e-9, s(x))); ll += -(y * Math.log(q) + (1 - y) * Math.log(1 - q)); acc += (q > 0.5) === !!y; V.dot(ctx, f.sx(x), f.sy(y), 5, y ? p.b : p.ok); });
      V.say(read, [["p = σ(wx + b)", "1 / (1 + e^-(wx+b))"], ["boundary x", w ? (-b / w).toFixed(2) : "—"], ["log loss", (ll / data.length).toFixed(4), "hi"], ["accuracy", (acc / data.length * 100).toFixed(0) + "%"]]);
    });
    V.slider(ctl, "w", -4, 4, 0.05, w, (v) => v.toFixed(2), (v) => { w = v; cv.redraw(); });
    V.slider(ctl, "b", -5, 5, 0.05, b, (v) => v.toFixed(2), (v) => { b = v; cv.redraw(); });
  };

  /* ---------------------------------------------- Days 40 + 53: threshold */
  W.threshold = (host) => {
    const ctl = V.controls(host);
    let t = 0.5, prev = 0.3;
    const r = V.rng(21);
    const base = Array.from({ length: 2000 }, () => ({ pos: r(), s: r.normal() }));
    const read = V.readout(host);
    const cm = V.el("div", "vizcm"); host.append(cm);
    const cv = V.canvas(host, 0.38, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, 0, 1, 0, 1, [12, 10, 12, 24]);
      const pts = base.map((d) => { const y = d.pos < prev ? 1 : 0; const z = (y ? 1 : -1) * 1.1 + d.s * 1; return { y, q: 1 / (1 + Math.exp(-z)) }; });
      const bins = 40, hp = new Array(bins).fill(0), hn = new Array(bins).fill(0);
      pts.forEach(({ y, q }) => (y ? hp : hn)[Math.min(bins - 1, Math.floor(q * bins))]++);
      const mx = Math.max(...hp, ...hn);
      for (let i = 0; i < bins; i++) {
        const x = f.sx(i / bins), w = f.sx(1 / bins) - f.sx(0) - 1;
        ctx.fillStyle = V.alpha(p.ok, 0.45); ctx.fillRect(x, f.sy(hn[i] / mx), w, f.sy(0) - f.sy(hn[i] / mx));
        ctx.fillStyle = V.alpha(p.b, 0.7); ctx.fillRect(x, f.sy(hp[i] / mx), w, f.sy(0) - f.sy(hp[i] / mx));
      }
      ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10); ctx.beginPath(); ctx.moveTo(f.sx(t), f.pt); ctx.lineTo(f.sx(t), H - f.pb); ctx.stroke(); ctx.shadowBlur = 0;
      let TP = 0, FP = 0, FN = 0, TN = 0;
      pts.forEach(({ y, q }) => { const h = q >= t; if (h && y) TP++; else if (h) FP++; else if (y) FN++; else TN++; });
      const P = TP / (TP + FP || 1), R = TP / (TP + FN || 1), A = (TP + TN) / pts.length, F1 = (2 * P * R) / (P + R || 1);
      cm.innerHTML = `<span></span><b>pred +</b><b>pred −</b><b>actual +</b><span class="tp">TP ${TP}</span><span class="fn">FN ${FN}</span><b>actual −</b><span class="fp">FP ${FP}</span><span class="tn">TN ${TN}</span>`;
      V.say(read, [["precision", P.toFixed(3)], ["recall", R.toFixed(3), "hi"], ["F1", F1.toFixed(3)], ["accuracy", A.toFixed(3)],
        ["always say −", ((FP + TN) / pts.length * 100).toFixed(1) + "% accurate, 0 recall"]]);
    });
    V.slider(ctl, "threshold", 0.02, 0.98, 0.01, t, (v) => v.toFixed(2), (v) => { t = v; cv.redraw(); });
    V.slider(ctl, "positives in data", 0.02, 0.5, 0.01, prev, (v) => Math.round(v * 100) + "%", (v) => { prev = v; cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `predicted probability → <i style="background:var(--brown)"></i> actual positives <i style="background:var(--ok)"></i> actual negatives`; host.append(k);
  };

  /* ---------------------------------------------- Day 41: softmax */
  W.softmax = (host) => {
    const ctl = V.controls(host);
    const names = ["setosa", "versicolor", "virginica", "other"];
    const z = [2.0, 1.0, 0.2, -1.0]; let T = 1;
    const bars = V.el("div", "vizbars"); host.append(bars);
    const read = V.readout(host);
    const draw = () => {
      const m = Math.max(...z.map((v) => v / T)), e = z.map((v) => Math.exp(v / T - m)), s = e.reduce((a, b) => a + b, 0), p = e.map((v) => v / s);
      bars.innerHTML = "";
      p.forEach((q, i) => { const r0 = V.el("div", "vizbarrow"); const bar = V.el("i"); const fill = V.el("b"); fill.style.width = q * 100 + "%"; bar.append(fill); r0.append(V.el("span", null, names[i]), bar, V.el("code", null, q.toFixed(3))); bars.append(r0); });
      V.say(read, [["softmax(z)ᵢ", "exp(zᵢ/T) / Σ exp(zⱼ/T)"], ["sum", p.reduce((a, b) => a + b, 0).toFixed(3), "hi"], ["T", T < 0.6 ? "low: confident, peaky" : T > 2 ? "high: flat, unsure" : "1 = plain softmax"]]);
    };
    z.forEach((v, i) => V.slider(ctl, "z " + names[i], -4, 4, 0.1, v, (x) => x.toFixed(1), (x) => { z[i] = x; draw(); }));
    V.slider(ctl, "temperature T", 0.1, 5, 0.05, T, (x) => x.toFixed(2), (x) => { T = x; draw(); });
    draw();
  };

  /* ---------------------------------------------- Day 43: kNN */
  W.knn = (host) => {
    const ctl = V.controls(host);
    const pts = blobs(8, [[-1.4, -0.6], [1.3, -0.9], [0.1, 1.4]], 18, 0.75);
    let k = 5, q = [0.2, 0.0];
    const read = V.readout(host);
    const vote = (x, y) => { const d = pts.map((p) => [Math.hypot(p.x - x, p.y - y), p.k]).sort((a, b) => a[0] - b[0]).slice(0, k); const c = [0, 0, 0]; d.forEach(([, c0]) => c[c0]++); return [c.indexOf(Math.max(...c)), c, d]; };
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), cols = V.series(p), R = 3.2 * Math.max(1, Wd / H / 1.2), f = V.frame(Wd, H, -R, R, -3, 3, [8, 8, 8, 8]);
      const step = 12;
      for (let px = 8; px < Wd - 8; px += step) for (let py = 8; py < H - 8; py += step) { const [c] = vote(f.ix(px + step / 2), f.iy(py + step / 2)); ctx.fillStyle = V.alpha(cols[c], 0.1); ctx.fillRect(px, py, step, step); }
      const [c, counts] = vote(q[0], q[1]);
      pts.map((pt) => [Math.hypot(pt.x - q[0], pt.y - q[1]), pt]).sort((a, b) => a[0] - b[0]).slice(0, k).forEach(([, pt]) => { ctx.strokeStyle = V.alpha(cols[pt.k], 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(f.sx(q[0]), f.sy(q[1])); ctx.lineTo(f.sx(pt.x), f.sy(pt.y)); ctx.stroke(); });
      pts.forEach((pt) => V.dot(ctx, f.sx(pt.x), f.sy(pt.y), 4.5, V.alpha(cols[pt.k], 0.85)));
      V.glow(ctx, cols[c], 14); V.dot(ctx, f.sx(q[0]), f.sy(q[1]), 8, cols[c], p.fg); ctx.shadowBlur = 0;
      V.say(read, [["k", String(k)], ["votes", counts.join(" / ")], ["prediction", ["class A", "class B", "class C"][c], "hi"], ["shading", "what the vote would be at every spot"]]);
      cv.f = f;
    });
    const move = (e) => { const [x, y] = cv.pos(e); q = [cv.f.ix(x), cv.f.iy(y)]; cv.redraw(); };
    cv.cv.addEventListener("click", move);
    cv.cv.addEventListener("pointermove", (e) => { if (e.buttons) move(e); });
    V.slider(ctl, "k", 1, 25, 1, k, null, (v) => { k = v; cv.redraw(); });
    host.append(V.el("p", "vizhint", "Click or drag to move the query point. k = 1 is jagged; big k is smooth."));
  };

  /* ---------------------------------------------- Day 45: decision tree */
  W.tree = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(14);
    const pts = Array.from({ length: 120 }, () => { const x = r() * 2 - 1, y = r() * 2 - 1; const k = (x * x + y * y < 0.45) !== (r() < 0.06) ? 1 : 0; return { x, y, k }; });
    let depth = 3;
    const read = V.readout(host);
    const gini = (s) => { if (!s.length) return 0; const p1 = s.filter((p) => p.k).length / s.length; return 1 - p1 * p1 - (1 - p1) ** 2; };
    const build = (s, d) => {
      const p1 = s.filter((p) => p.k).length / (s.length || 1);
      const leaf = { leaf: true, k: p1 >= 0.5 ? 1 : 0, n: s.length, p1 };
      if (d === 0 || s.length < 4 || p1 === 0 || p1 === 1) return leaf;
      let best = null;
      ["x", "y"].forEach((ax) => {
        const vals = [...new Set(s.map((p) => p[ax]))].sort((a, b) => a - b);
        for (let i = 1; i < vals.length; i++) {
          const th = (vals[i - 1] + vals[i]) / 2, L = s.filter((p) => p[ax] <= th), R = s.filter((p) => p[ax] > th);
          const g = (L.length * gini(L) + R.length * gini(R)) / s.length;
          if (!best || g < best.g) best = { g, ax, th, L, R };
        }
      });
      if (!best || best.g >= gini(s)) return leaf;
      return { ax: best.ax, th: best.th, l: build(best.L, d - 1), r: build(best.R, d - 1) };
    };
    const cv = V.canvas(host, 0.62, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -1, 1, -1, 1, [8, 8, 8, 8]);
      const tree = build(pts, depth);
      let leaves = 0;
      const paint = (n, box) => {
        if (n.leaf) { leaves++; ctx.fillStyle = V.alpha(n.k ? p.b : p.ok, 0.16); ctx.fillRect(f.sx(box[0]), f.sy(box[3]), f.sx(box[1]) - f.sx(box[0]), f.sy(box[2]) - f.sy(box[3])); return; }
        const [a, b, c, d] = box;
        if (n.ax === "x") { paint(n.l, [a, n.th, c, d]); paint(n.r, [n.th, b, c, d]); ctx.strokeStyle = p.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.sx(n.th), f.sy(c)); ctx.lineTo(f.sx(n.th), f.sy(d)); ctx.stroke(); }
        else { paint(n.l, [a, b, c, n.th]); paint(n.r, [a, b, n.th, d]); ctx.strokeStyle = p.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.sx(a), f.sy(n.th)); ctx.lineTo(f.sx(b), f.sy(n.th)); ctx.stroke(); }
      };
      paint(tree, [-1, 1, -1, 1]);
      const pred = (n, pt) => (n.leaf ? n.k : pred(pt[n.ax] <= n.th ? n.l : n.r, pt));
      let acc = 0; pts.forEach((pt) => { acc += pred(tree, pt) === pt.k; V.dot(ctx, f.sx(pt.x), f.sy(pt.y), 4, pt.k ? p.b : p.ok); });
      V.say(read, [["max depth", String(depth)], ["leaves", String(leaves)], ["train accuracy", (acc / pts.length * 100).toFixed(1) + "%", "hi"], ["split rule", "pick the cut that lowers Gini impurity most"]]);
    });
    V.slider(ctl, "max depth", 1, 8, 1, depth, null, (v) => { depth = v; cv.redraw(); });
    host.append(V.el("p", "vizhint", "The true shape is a circle. Watch the boxes approximate it — then memorise the noise."));
  };

  /* ---------------------------------------------- Day 47: k-means on Iris petals */
  W.kmeans = (host) => {
    const ctl = V.controls(host);
    const D = window.AIM_VIZDATA.iris;
    const pts = D.X.map((r, i) => ({ x: r[2], y: r[3], s: D.y[i] }));
    let k = 3, C = [], lab = [], it = 0, seed = 2;
    const read = V.readout(host);
    // k-means++ style start: a random first centre, then each next centre is
    // picked with probability proportional to its squared distance
    const init = () => {
      const r = V.rng(seed), p0 = pts[Math.floor(r() * pts.length)];
      C = [[p0.x, p0.y]];
      while (C.length < k) {
        const d = pts.map((p) => Math.min(...C.map((c) => (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2)));
        let u = r() * d.reduce((a, b) => a + b, 0), i = 0;
        while ((u -= d[i]) > 0 && i < d.length - 1) i++;
        C.push([pts[i].x, pts[i].y]);
      }
      lab = pts.map(() => -1); it = 0;
    };
    const step = () => {
      lab = pts.map((p) => { let b = 0, bd = 1e9; C.forEach((c, j) => { const d = (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2; if (d < bd) { bd = d; b = j; } }); return b; });
      const moved = C.map((c, j) => { const m = pts.filter((_, i) => lab[i] === j); return m.length ? [m.reduce((a, p) => a + p.x, 0) / m.length, m.reduce((a, p) => a + p.y, 0) / m.length] : c; });
      const shift = moved.reduce((a, c, j) => a + Math.hypot(c[0] - C[j][0], c[1] - C[j][1]), 0);
      C = moved; it++; return shift;
    };
    const cv = V.canvas(host, 0.58, (ctx, Wd, H) => {
      const p = V.pal(), cols = V.series(p), f = V.frame(Wd, H, 0.5, 7.3, -0.1, 2.8, [36, 10, 12, 30]);
      V.grid(ctx, f, Wd, H, [1, 2, 3, 4, 5, 6, 7], [0, 1, 2], p);
      pts.forEach((pt, i) => V.dot(ctx, f.sx(pt.x), f.sy(pt.y), 4.2, lab[i] < 0 ? V.alpha(p.fg3, 0.6) : V.alpha(cols[lab[i]], 0.8)));
      C.forEach((c, j) => { ctx.save(); ctx.strokeStyle = cols[j]; ctx.lineWidth = 3.2; V.glow(ctx, cols[j], 14); const x = f.sx(c[0]), y = f.sy(c[1]); ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke(); ctx.restore(); });
      const inertia = lab[0] < 0 ? 0 : pts.reduce((a, pt, i) => a + (pt.x - C[lab[i]][0]) ** 2 + (pt.y - C[lab[i]][1]) ** 2, 0);
      let agree = "";
      if (k === 3 && lab[0] >= 0) { // best match of clusters to real species
        const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        const best = Math.max(...perms.map((pm) => pts.filter((pt, i) => pm[lab[i]] === pt.s).length));
        agree = (best / pts.length * 100).toFixed(1) + "% match the real species";
      }
      V.say(read, [["iteration", String(it)], ["inertia", inertia ? inertia.toFixed(2) : "—", "hi"], ["axes", "petal length × petal width (cm)"]].concat(agree ? [["labels hidden", agree]] : []));
    });
    const anim = V.animate(() => { const s = step(); cv.redraw(); if (s < 1e-4 || it > 30) return false; }, 450);
    V.slider(ctl, "k", 2, 5, 1, k, null, (v) => { k = v; init(); anim.stop(); cv.redraw(); });
    V.button(ctl, "Step", () => { anim.stop(); step(); cv.redraw(); });
    V.button(ctl, "Run", () => anim.start());
    V.button(ctl, "New random start", () => { seed++; init(); anim.stop(); cv.redraw(); });
    init();
  };

  /* ---------------------------------------------- Day 48: PCA */
  W.pca = (host) => {
    const ctl = V.controls(host);
    let rho = 0.85, proj = 0, seed = 3;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), r = V.rng(seed);
      const pts = Array.from({ length: 90 }, () => { const a = r.normal(), b = r.normal(); return [a * 1.6, (rho * a + Math.sqrt(1 - rho * rho) * b) * 1.6 * 0.8]; });
      const mx = pts.reduce((s, q) => s + q[0], 0) / pts.length, my = pts.reduce((s, q) => s + q[1], 0) / pts.length;
      let sxx = 0, syy = 0, sxy = 0; pts.forEach(([x, y]) => { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); });
      sxx /= pts.length; syy /= pts.length; sxy /= pts.length;
      const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr - l1;
      let v = [l1 - syy, sxy]; if (Math.abs(sxy) < 1e-9) v = sxx >= syy ? [1, 0] : [0, 1]; const n = Math.hypot(...v); v = [v[0] / n, v[1] / n];
      const R = 4.5 * Math.max(1, Wd / H / 1.1), f = V.frame(Wd, H, -R, R, -4, 4, [8, 8, 8, 8]);
      ctx.strokeStyle = p.line; ctx.beginPath(); ctx.moveTo(f.sx(-R), f.sy(0)); ctx.lineTo(f.sx(R), f.sy(0)); ctx.moveTo(f.sx(0), f.sy(-4)); ctx.lineTo(f.sx(0), f.sy(4)); ctx.stroke();
      ctx.strokeStyle = V.alpha(p.a, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.sx(mx - v[0] * 9), f.sy(my - v[1] * 9)); ctx.lineTo(f.sx(mx + v[0] * 9), f.sy(my + v[1] * 9)); ctx.stroke();
      pts.forEach(([x, y]) => {
        const t = (x - mx) * v[0] + (y - my) * v[1], px = mx + t * v[0], py = my + t * v[1];
        const X = x + (px - x) * proj, Y = y + (py - y) * proj;
        if (proj > 0 && proj < 1) { ctx.strokeStyle = V.alpha(p.c, 0.3); ctx.beginPath(); ctx.moveTo(f.sx(x), f.sy(y)); ctx.lineTo(f.sx(X), f.sy(Y)); ctx.stroke(); }
        V.dot(ctx, f.sx(X), f.sy(Y), 4, V.alpha(p.b, 0.85));
      });
      const arr = (vec, len, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; V.glow(ctx, col, 12); ctx.beginPath(); ctx.moveTo(f.sx(mx), f.sy(my)); ctx.lineTo(f.sx(mx + vec[0] * len), f.sy(my + vec[1] * len)); ctx.stroke(); ctx.restore(); };
      arr(v, 2 * Math.sqrt(l1), p.a); arr([-v[1], v[0]], 2 * Math.sqrt(Math.max(l2, 0)), p.c);
      V.say(read, [["PC1 direction", `(${v[0].toFixed(2)}, ${v[1].toFixed(2)})`], ["variance kept by PC1", (l1 / tr * 100).toFixed(1) + "%", "hi"], ["PC2 (pink)", (l2 / tr * 100).toFixed(1) + "% — dropped"]]);
    });
    V.slider(ctl, "correlation", 0, 0.99, 0.01, rho, (v) => v.toFixed(2), (v) => { rho = v; cv.redraw(); });
    V.slider(ctl, "project onto PC1", 0, 1, 0.01, 0, (v) => Math.round(v * 100) + "%", (v) => { proj = v; cv.redraw(); });
    V.button(ctl, "New cloud", () => { seed++; cv.redraw(); });
  };

  /* ---------------------------------------------- Day 54: time series */
  W.timeseries = (host) => {
    const ctl = V.controls(host);
    const y = window.AIM_VIZDATA.flights;
    let hold = 12;
    const read = V.readout(host);
    const cv = V.canvas(host, 0.5, (ctx, Wd, H) => {
      const p = V.pal(), n = y.length, cut = n - hold;
      const f = V.frame(Wd, H, 0, n - 1, 80, 660, [40, 10, 12, 26]);
      V.grid(ctx, f, Wd, H, [0, 24, 48, 72, 96, 120, 143].slice(0, 7), [100, 300, 500], p);
      ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono;
      // baseline: repeat last seen value. seasonal: same month last year × yearly growth
      // average yearly growth over every full year seen so far (one weak year shouldn't set it)
      const yrs = Math.floor(cut / 12), sum = (a, b) => y.slice(a, b).reduce((s, v) => s + v, 0);
      const g = Math.pow(sum(cut - 12, cut) / sum(cut - 12 * yrs, cut - 12 * yrs + 12), 1 / (yrs - 1));
      const naive = [], seas = [];
      for (let i = cut; i < n; i++) { naive.push(y[cut - 1]); const back = i - 12 * Math.ceil((i - cut + 1) / 12); seas.push(y[back] * Math.pow(g, Math.ceil((i - cut + 1) / 12))); }
      const mape = (pr) => pr.reduce((a, v, j) => a + Math.abs(v - y[cut + j]) / y[cut + j], 0) / pr.length * 100;
      ctx.fillStyle = V.alpha(p.a, 0.06); ctx.fillRect(f.sx(cut), f.pt, f.sx(n - 1) - f.sx(cut), H - f.pt - f.pb);
      const line = (arr, off, col, w, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); arr.forEach((v, i) => (i ? ctx.lineTo(f.sx(i + off), f.sy(v)) : ctx.moveTo(f.sx(i + off), f.sy(v)))); ctx.stroke(); ctx.restore(); };
      line(y, 0, p.fg2, 1.8);
      line(naive, cut, p.c, 2, [5, 4]);
      ctx.save(); V.glow(ctx, p.a, 10); line(seas, cut, p.a, 2.5); ctx.restore();
      ctx.fillStyle = p.fg3; [1949, 1952, 1955, 1958].forEach((yr) => ctx.fillText(String(yr), f.sx((yr - 1949) * 12), f.pt + 12));
      V.say(read, [["held out", hold + " months"], ["baseline MAPE (repeat last)", mape(naive).toFixed(1) + "%"], ["seasonal × growth MAPE", mape(seas).toFixed(1) + "%", "hi"], ["avg growth per year", ((g - 1) * 100).toFixed(1) + "%"]]);
    });
    V.slider(ctl, "forecast horizon", 6, 36, 6, hold, (v) => v + " mo", (v) => { hold = v; cv.redraw(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `<i style="background:var(--fg-2)"></i> real passengers (thousands) <i style="background:var(--gold)"></i> seasonal forecast <i style="background:var(--neon-3)"></i> naive baseline`; host.append(k);
  };

  /* ---------------------------------------------- Day 55: TF-IDF */
  W.tfidf = (host) => {
    const ta = V.el("textarea", "vizta"); ta.rows = 4; ta.setAttribute("aria-label", "one document per line");
    ta.value = "win a free prize now\ncall me when you are free\nfree entry win cash prize\nare you coming to the class";
    host.append(ta);
    const tbl = V.el("div", "viztbl"); host.append(tbl);
    const read = V.readout(host);
    const draw = () => {
      const docs = ta.value.split("\n").map((s) => s.toLowerCase().match(/[a-z0-9']+/g) || []).filter((d) => d.length).slice(0, 6);
      const vocab = [...new Set(docs.flat())].sort();
      const df = Object.fromEntries(vocab.map((w) => [w, docs.filter((d) => d.includes(w)).length]));
      const idf = (w) => Math.log((1 + docs.length) / (1 + df[w])) + 1; // scikit-learn's smooth idf
      const M = docs.map((d) => { const v = vocab.map((w) => (d.filter((x) => x === w).length / d.length) * idf(w)); const n = Math.hypot(...v) || 1; return v.map((x) => x / n); });
      const mx = Math.max(...M.flat(), 1e-9);
      tbl.innerHTML = "";
      const t = V.el("table");
      const hr = V.el("tr"); hr.append(V.el("th", null, "")); vocab.forEach((w) => hr.append(V.el("th", null, w))); t.append(hr);
      M.forEach((row, i) => { const tr = V.el("tr"); tr.append(V.el("th", null, "doc " + (i + 1))); row.forEach((v) => { const td = V.el("td", null, v ? v.toFixed(2) : ""); td.style.background = v ? V.heat(v / mx) : ""; tr.append(td); }); t.append(tr); });
      const ir = V.el("tr"); ir.append(V.el("th", null, "idf")); vocab.forEach((w) => ir.append(V.el("td", "idf", idf(w).toFixed(2)))); t.append(ir);
      tbl.append(t);
      const top = M.map((row, i) => vocab[row.indexOf(Math.max(...row))]);
      V.say(read, [["tf-idf", "tf(word, doc) × idf(word)"], ["idf", "log((1+N)/(1+df)) + 1"], ["most distinctive per doc", top.join(", "), "hi"]]);
    };
    ta.oninput = draw; draw();
  };
})();
