/* AIM interactive illustrations — build-your-own-AI block (Days 61–90). */
(function () {
  "use strict";
  const V = window.AIMViz;
  const W = V.W;

  /* ---------------------------------------------- Day 61: perceptron */
  W.perceptron = (host) => {
    const ctl = V.controls(host);
    const G = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], NAND: [1, 1, 1, 0], XOR: [0, 1, 1, 0] };
    const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
    let gate = "AND", w = [0, 0], b = 0, errs = [], epoch = 0;
    const lr = 0.1;
    const read = V.readout(host);
    const reset = () => { w = [0.2, -0.3]; b = 0; errs = []; epoch = 0; };
    const one = () => {
      let e = 0;
      X.forEach((x, i) => { const yh = w[0] * x[0] + w[1] * x[1] + b > 0 ? 1 : 0, d = G[gate][i] - yh; if (d) { e++; w = [w[0] + lr * d * x[0], w[1] + lr * d * x[1]]; b += lr * d; } });
      errs.push(e); epoch++; return e;
    };
    const cv = V.canvas(host, 0.6, (ctx, Wd, H) => {
      const p = V.pal(), side = Math.min(Wd * 0.58, H), f = V.frame(side, H, -0.4, 1.4, -0.4, 1.4, [16, 10, 10, 16]);
      for (let px = f.pl; px < side - f.pr; px += 8) for (let py = f.pt; py < H - f.pb; py += 8) { const on = w[0] * f.ix(px + 4) + w[1] * f.iy(py + 4) + b > 0; ctx.fillStyle = V.alpha(on ? p.a : p.b, 0.1); ctx.fillRect(px, py, 8, 8); }
      if (Math.abs(w[1]) > 1e-6 || Math.abs(w[0]) > 1e-6) {
        ctx.save(); ctx.strokeStyle = p.a; ctx.lineWidth = 2.5; V.glow(ctx, p.a, 10); ctx.beginPath();
        if (Math.abs(w[1]) > 1e-6) { ctx.moveTo(f.sx(-0.4), f.sy(-(w[0] * -0.4 + b) / w[1])); ctx.lineTo(f.sx(1.4), f.sy(-(w[0] * 1.4 + b) / w[1])); }
        else { ctx.moveTo(f.sx(-b / w[0]), f.sy(-0.4)); ctx.lineTo(f.sx(-b / w[0]), f.sy(1.4)); }
        ctx.stroke(); ctx.restore();
      }
      X.forEach((x, i) => { V.dot(ctx, f.sx(x[0]), f.sy(x[1]), 10, G[gate][i] ? p.a : "transparent", G[gate][i] ? p.fg : p.b); ctx.fillStyle = p.fg2; ctx.font = "11px " + p.mono; ctx.fillText(`(${x})→${G[gate][i]}`, f.sx(x[0]) + 13, f.sy(x[1]) - 10); });
      // errors per epoch sparkline
      const x0 = side + 24, w0 = Wd - x0 - 10, top = 30, h0 = H - 70;
      ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.fillText("mistakes per epoch", x0, 18);
      ctx.strokeStyle = p.line; ctx.strokeRect(x0, top, w0, h0);
      const n = Math.max(errs.length, 10);
      errs.forEach((e, i) => { ctx.fillStyle = e ? p.c : p.ok; const bh = (e / 4) * h0; ctx.fillRect(x0 + (i / n) * w0 + 1, top + h0 - Math.max(2, bh), Math.max(2, w0 / n - 2), Math.max(2, bh)); });
      const done = errs.length && errs[errs.length - 1] === 0;
      V.say(read, [["w", `(${w.map((v) => v.toFixed(2))})`], ["b", b.toFixed(2)], ["epoch", String(epoch)],
        ["status", done ? "converged: one line separates the classes" : gate === "XOR" && epoch > 15 ? "never converges: XOR is not linearly separable" : "learning from mistakes", "hi"]]);
    });
    const anim = V.animate(() => { const e = one(); cv.redraw(); if (!e || epoch > 40) return false; }, 260);
    V.select(ctl, "gate", Object.keys(G).map((g) => [g, g]), gate, (g) => { gate = g; reset(); anim.stop(); cv.redraw(); });
    V.button(ctl, "Train one epoch", () => { anim.stop(); one(); cv.redraw(); });
    V.button(ctl, "Train", () => anim.start());
    V.button(ctl, "Reset", () => { anim.stop(); reset(); cv.redraw(); });
    reset();
  };

  /* ---------------------------------------------- Day 62: MLP solves XOR */
  W.mlp = (host) => {
    const ctl = V.controls(host);
    const X = [[0, 0], [0, 1], [1, 0], [1, 1]], Y = [0, 1, 1, 0];
    let H1 = 3, seed = 4, net, ep = 0, loss = 0;
    const read = V.readout(host);
    const init = () => { const r = V.rng(seed); net = { W1: Array.from({ length: H1 }, () => [r.normal(), r.normal()]), b1: new Array(H1).fill(0).map(() => r.normal() * 0.1), W2: Array.from({ length: H1 }, () => r.normal()), b2: 0 }; ep = 0; };
    const fwd = (x) => { const h = net.W1.map((w, j) => Math.tanh(w[0] * x[0] + w[1] * x[1] + net.b1[j])); const z = h.reduce((s, v, j) => s + v * net.W2[j], net.b2); return [h, 1 / (1 + Math.exp(-z))]; };
    const train = (n) => {
      for (let k = 0; k < n; k++) {
        const g = { W1: net.W1.map(() => [0, 0]), b1: new Array(H1).fill(0), W2: new Array(H1).fill(0), b2: 0 }; loss = 0;
        X.forEach((x, i) => {
          const [h, o] = fwd(x); loss += -(Y[i] * Math.log(o + 1e-9) + (1 - Y[i]) * Math.log(1 - o + 1e-9)) / 4;
          const dz = (o - Y[i]) / 4; g.b2 += dz;
          h.forEach((hv, j) => { g.W2[j] += dz * hv; const dh = dz * net.W2[j] * (1 - hv * hv); g.W1[j][0] += dh * x[0]; g.W1[j][1] += dh * x[1]; g.b1[j] += dh; });
        });
        const lr = 1.2; net.b2 -= lr * g.b2;
        for (let j = 0; j < H1; j++) { net.W2[j] -= lr * g.W2[j]; net.W1[j][0] -= lr * g.W1[j][0]; net.W1[j][1] -= lr * g.W1[j][1]; net.b1[j] -= lr * g.b1[j]; }
        ep++;
      }
    };
    const cv = V.canvas(host, 0.58, (ctx, Wd, H) => {
      const p = V.pal(), side = Math.min(Wd, H * 1.15), f = V.frame(side, H, -0.3, 1.3, -0.3, 1.3, [10, 10, 10, 10]);
      for (let px = f.pl; px < side - f.pr; px += 6) for (let py = f.pt; py < H - f.pb; py += 6) { const [, o] = fwd([f.ix(px + 3), f.iy(py + 3)]); ctx.fillStyle = V.alpha(o > 0.5 ? p.a : p.b, 0.08 + Math.abs(o - 0.5) * 0.45); ctx.fillRect(px, py, 6, 6); }
      X.forEach((x, i) => V.dot(ctx, f.sx(x[0]), f.sy(x[1]), 10, Y[i] ? p.a : p.b, p.fg));
      // the network diagram
      const gx = side + 30, gw = Wd - gx - 10;
      if (gw > 120) {
        const col = (k, n) => Array.from({ length: n }, (_, i) => [gx + k * gw / 2, 40 + (i + 0.5) * (H - 80) / n]);
        const L0 = col(0, 2), L1 = col(1, H1), L2 = col(2, 1);
        const edge = (a, b, w) => { ctx.strokeStyle = V.alpha(w > 0 ? p.a : p.c, Math.min(0.9, 0.15 + Math.abs(w) / 4)); ctx.lineWidth = 1 + Math.min(4, Math.abs(w)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
        L1.forEach((b, j) => { L0.forEach((a, i) => edge(a, b, net.W1[j][i])); edge(b, L2[0], net.W2[j]); });
        [...L0, ...L1, ...L2].forEach((q) => V.dot(ctx, q[0], q[1], 9, p.card, p.fg2));
        ctx.fillStyle = p.fg3; ctx.font = "11px " + p.mono; ctx.fillText("x₁ x₂", L0[0][0] - 14, 24); ctx.fillText("hidden (tanh)", L1[0][0] - 36, 24); ctx.fillText("ŷ", L2[0][0] - 3, 24);
      }
      V.say(read, [["epoch", String(ep)], ["loss", loss ? loss.toFixed(4) : "—", "hi"], ["outputs for 00,01,10,11", X.map((x) => fwd(x)[1].toFixed(2)).join("  ")], ["hidden neurons", String(H1)]]);
    });
    const anim = V.animate(() => { train(25); cv.redraw(); if (ep >= 3000) return false; }, 40);
    V.button(ctl, "Train", () => anim.start());
    V.button(ctl, "New random weights", () => { anim.stop(); seed++; init(); loss = 0; cv.redraw(); });
    V.slider(ctl, "hidden neurons", 1, 6, 1, H1, null, (v) => { H1 = v; anim.stop(); init(); loss = 0; cv.redraw(); });
    init();
    host.append(V.el("p", "vizhint", "With 1 hidden neuron it can't solve XOR. Two or more bend the boundary around the corners."));
  };

  /* ---------------------------------------------- Days 63–64: backprop graph */
  W.backprop = (host) => {
    const ctl = V.controls(host);
    const v = { a: 2, b: -3, c: 10, f: -2 };
    let phase = 2; // 0 inputs only, 1 forward done, 2 backward done
    const read = V.readout(host);
    const cv = V.canvas(host, 0.46, (ctx, Wd, H) => {
      const p = V.pal();
      const e = v.a * v.b, d = e + v.c, L = d * v.f;
      const g = { L: 1, d: v.f, f: d, e: v.f, c: v.f, a: v.f * v.b, b: v.f * v.a };
      const xs = [0.1, 0.35, 0.6, 0.86].map((t) => t * Wd), ys = [0.2, 0.45, 0.72, 0.9].map((t) => t * H);
      const N = { a: [xs[0], ys[0]], b: [xs[0], ys[1]], c: [xs[1], ys[2]], e: [xs[1], ys[0] + 20], d: [xs[2], ys[1]], f: [xs[2], ys[3] - 6], L: [xs[3], ys[1] + 18] };
      const ops = { e: "×", d: "+", L: "×" };
      const edges = [["a", "e"], ["b", "e"], ["e", "d"], ["c", "d"], ["d", "L"], ["f", "L"]];
      edges.forEach(([s, t]) => { ctx.strokeStyle = phase === 2 ? V.alpha(p.c, 0.6) : V.alpha(p.a, phase ? 0.6 : 0.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...N[s]); ctx.lineTo(...N[t]); ctx.stroke(); });
      const val = { a: v.a, b: v.b, c: v.c, f: v.f, e, d, L };
      Object.entries(N).forEach(([k, [x, y]]) => {
        const bw = 92, bh = 46, inner = ["e", "d", "L"].includes(k);
        ctx.fillStyle = p.card; ctx.strokeStyle = inner ? p.a : p.b; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 10) : ctx.rect(x - bw / 2, y - bh / 2, bw, bh); ctx.fill(); ctx.stroke();
        ctx.font = "12px " + p.mono; ctx.textAlign = "center";
        ctx.fillStyle = p.fg; ctx.fillText(`${k}${ops[k] ? " (" + ops[k] + ")" : ""} = ${inner && !phase ? "?" : val[k]}`, x, y - 4);
        ctx.fillStyle = p.c; ctx.fillText(phase === 2 ? `grad ${g[k]}` : "grad ?", x, y + 14);
        ctx.textAlign = "left";
      });
      V.say(read, [["forward", "e = a·b,  d = e + c,  L = d·f"], ["L", phase ? String(L) : "?", "hi"],
        ["backward (chain rule)", phase === 2 ? `dL/da = dL/dd · dd/de · de/da = ${v.f} · 1 · ${v.b} = ${g.a}` : "press Backward"]]);
    }, 230);
    ["a", "b", "c", "f"].forEach((k) => V.slider(ctl, k, -5, 10, 1, v[k], null, (x) => { v[k] = x; phase = 0; cv.redraw(); }));
    V.button(ctl, "Forward", () => { phase = 1; cv.redraw(); });
    V.button(ctl, "Backward", () => { phase = 2; cv.redraw(); });
  };

  /* ---------------------------------------------- Day 69: optimisers race */
  W.optim = (host) => {
    const ctl = V.controls(host);
    const grad = (x, y) => [0.2 * x, 4 * y]; // f = 0.1x² + 2y²: a long, narrow ravine
    let lr = 0.05, paths;
    const read = V.readout(host);
    const start = [-9, 2.2];
    const reset = () => { paths = { SGD: { p: [start], s: {} }, Momentum: { p: [start], s: { v: [0, 0] } }, Adam: { p: [start], s: { m: [0, 0], v: [0, 0], t: 0 } } }; };
    const stepAll = () => {
      Object.entries(paths).forEach(([k, o]) => {
        const [x, y] = o.p[o.p.length - 1], g = grad(x, y);
        let n;
        if (k === "SGD") n = [x - lr * g[0], y - lr * g[1]];
        if (k === "Momentum") { o.s.v = [0.9 * o.s.v[0] + g[0], 0.9 * o.s.v[1] + g[1]]; n = [x - lr * o.s.v[0], y - lr * o.s.v[1]]; }
        if (k === "Adam") { const s = o.s; s.t++; s.m = s.m.map((m, i) => 0.9 * m + 0.1 * g[i]); s.v = s.v.map((v, i) => 0.999 * v + 0.001 * g[i] * g[i]); n = [x, y].map((q, i) => q - lr * 6 * (s.m[i] / (1 - 0.9 ** s.t)) / (Math.sqrt(s.v[i] / (1 - 0.999 ** s.t)) + 1e-8)); }
        if (n.every(isFinite) && Math.abs(n[1]) < 1e3) o.p.push(n);
      });
    };
    const cv = V.canvas(host, 0.5, (ctx, Wd, H) => {
      const p = V.pal(), f = V.frame(Wd, H, -10, 2, -3, 3, [8, 8, 8, 8]);
      [0.5, 2, 5, 10, 18].forEach((c, i) => { ctx.strokeStyle = V.alpha(p.fg3, 0.18 + i * 0.03); ctx.beginPath(); ctx.ellipse(f.sx(0), f.sy(0), f.sx(Math.sqrt(c / 0.1)) - f.sx(0), f.sy(0) - f.sy(Math.sqrt(c / 2)), 0, 0, Math.PI * 2); ctx.stroke(); });
      const cols = { SGD: p.c, Momentum: p.b, Adam: p.a };
      const rows = [];
      Object.entries(paths).forEach(([k, o]) => {
        ctx.save(); ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.2; V.glow(ctx, cols[k], 8); ctx.beginPath();
        o.p.forEach(([x, y], i) => (i ? ctx.lineTo(f.sx(x), f.sy(y)) : ctx.moveTo(f.sx(x), f.sy(y)))); ctx.stroke(); ctx.restore();
        const [x, y] = o.p[o.p.length - 1]; V.dot(ctx, f.sx(x), f.sy(y), 5, cols[k]);
        rows.push([k, "loss " + (0.1 * x * x + 2 * y * y).toFixed(4)]);
      });
      V.dot(ctx, f.sx(0), f.sy(0), 4, p.ok);
      V.say(read, rows.concat([["step", String(paths.SGD.p.length - 1), "hi"]]));
    });
    const anim = V.animate(() => { stepAll(); cv.redraw(); if (paths.SGD.p.length > 150) return false; }, 50);
    V.slider(ctl, "learning rate", 0.01, 0.45, 0.01, lr, (v) => v.toFixed(2), (v) => { lr = v; reset(); anim.stop(); cv.redraw(); });
    V.button(ctl, "Race", () => { reset(); anim.start(); });
    const k = V.el("p", "vizkey"); k.innerHTML = `<i style="background:var(--neon-3)"></i> SGD <i style="background:var(--brown)"></i> Momentum <i style="background:var(--gold)"></i> Adam`; host.append(k);
    reset();
  };

  /* ---------------------------------------------- Day 70: LayerNorm */
  W.layernorm = (host) => {
    const ctl = V.controls(host);
    const r = V.rng(6);
    const X = [0.3, 3, 0.05, 8].map((sc, i) => Array.from({ length: 10 }, () => (i - 1.5) * 2 + r.normal() * sc));
    let gamma = 1, beta = 0;
    const wrap = V.el("div", "vizln"); host.append(wrap);
    const read = V.readout(host);
    const draw = () => {
      const p = V.pal();
      const Y = X.map((row) => { const m = row.reduce((a, b) => a + b, 0) / row.length, v = row.reduce((a, b) => a + (b - m) ** 2, 0) / row.length; return row.map((x) => gamma * (x - m) / Math.sqrt(v + 1e-5) + beta); });
      const mx = Math.max(...X.flat().map(Math.abs), ...Y.flat().map(Math.abs));
      const grid = (M, title) => {
        const g = V.el("div", "vizlng"); g.append(V.el("small", null, title));
        M.forEach((row) => { const rr = V.el("div", "vizlnr"); row.forEach((x) => { const c = V.el("i"); const t = x / mx; c.style.background = V.alpha(t >= 0 ? p.a : p.c, Math.min(1, 0.08 + Math.abs(t) * 0.92)); c.title = x.toFixed(2); rr.append(c); });
          const m = row.reduce((a, b) => a + b, 0) / row.length, s = Math.sqrt(row.reduce((a, b) => a + (b - m) ** 2, 0) / row.length);
          rr.append(V.el("code", null, `μ ${m.toFixed(2)}  σ ${s.toFixed(2)}`)); g.append(rr); });
        return g;
      };
      wrap.innerHTML = ""; wrap.append(grid(X, "before: each row has its own scale"), grid(Y, "after LayerNorm"));
      V.say(read, [["per row", "y = γ · (x − μ) / √(σ² + ε) + β", "hi"], ["γ, β", gamma.toFixed(2) + ", " + beta.toFixed(2) + " (learned)"]]);
    };
    V.slider(ctl, "γ (scale)", 0.2, 2, 0.05, gamma, (v) => v.toFixed(2), (v) => { gamma = v; draw(); });
    V.slider(ctl, "β (shift)", -1.5, 1.5, 0.05, beta, (v) => v.toFixed(2), (v) => { beta = v; draw(); });
    draw();
  };

  /* ---------------------------------------------- Day 72: convolution */
  W.conv = (host) => {
    const ctl = V.controls(host);
    const D = window.AIM_VIZDATA.digits;
    const K = { "vertical edges": [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], "horizontal edges": [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)), sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] };
    let dg = "3", kn = "vertical edges", pos = [2, 2];
    const wrap = V.el("div", "vizconv"); host.append(wrap);
    const read = V.readout(host);
    const draw = () => {
      const p = V.pal(), img = D[dg], k = K[kn];
      const out = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += img[i + a][j + b] * k[a][b]; return s; }));
      const omx = Math.max(...out.flat().map(Math.abs), 1e-9);
      const grid = (M, n, cell, hl, title) => {
        const g = V.el("div", "vizcg"); g.append(V.el("small", null, title));
        const t = V.el("div", "vizcgt"); t.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        M.forEach((row, i) => row.forEach((v, j) => { const c = V.el("span", hl(i, j) ? "on" : "", ""); c.style.background = cell(v); if (n === 6) { c.tabIndex = 0; c.onmouseenter = c.onfocus = () => { pos = [i, j]; draw(); }; } t.append(c); }));
        g.append(t); return g;
      };
      const [pi, pj] = pos;
      wrap.innerHTML = "";
      wrap.append(
        grid(img, 8, (v) => V.alpha(p.fg, v / 16), (i, j) => i >= pi && i < pi + 3 && j >= pj && j < pj + 3, "input digit 8×8"),
        grid(k, 3, (v) => V.alpha(v >= 0 ? p.a : p.c, Math.min(1, Math.abs(v) / 2 + 0.1)), () => false, "kernel 3×3"),
        grid(out, 6, (v) => V.alpha(v >= 0 ? p.a : p.c, Math.abs(v) / omx), (i, j) => i === pi && j === pj, "output 6×6"));
      const terms = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (k[a][b]) terms.push(`${img[pi + a][pj + b]}·${+k[a][b].toFixed(2)}`);
      V.say(read, [[`out[${pi}][${pj}]`, terms.slice(0, 6).join(" + ") + (terms.length > 6 ? " + …" : "") + " = " + out[pi][pj].toFixed(1), "hi"], ["size", "8 − 3 + 1 = 6 (no padding)"]]);
    };
    V.select(ctl, "digit", Object.keys(D).map((d) => [d, d]), dg, (v) => { dg = v; draw(); });
    V.select(ctl, "kernel", Object.keys(K).map((d) => [d, d]), kn, (v) => { kn = v; draw(); });
    host.append(V.el("p", "vizhint", "Hover the output cells: the highlighted 3×3 patch is what the kernel is looking at."));
    draw();
  };

  /* ---------------------------------------------- Day 73: bigram language model */
  W.bigram = (host) => {
    const ctl = V.controls(host);
    const N = window.AIM_VIZDATA.bigram, ch = ".abcdefghijklmnopqrstuvwxyz";
    const out = V.el("div", "vizchips"); let seed = 1;
    const read = V.readout(host);
    let hover = [1, 14];
    const cv = V.canvas(host, 0.72, (ctx, Wd, H) => {
      const p = V.pal(), s = Math.min(Wd, H) - 24, c = s / 27, ox = Math.max(22, (Wd - s) / 2), oy = 18;
      const mx = Math.log(1 + Math.max(...N.flat()));
      ctx.font = Math.max(8, c * 0.55) + "px " + p.mono; ctx.fillStyle = p.fg3; ctx.textAlign = "center";
      for (let i = 0; i < 27; i++) { ctx.fillText(ch[i], ox + i * c + c / 2, oy - 4); ctx.fillText(ch[i], ox - 10, oy + i * c + c * 0.7); }
      for (let i = 0; i < 27; i++) for (let j = 0; j < 27; j++) { ctx.fillStyle = V.alpha(p.a, Math.pow(Math.log(1 + N[i][j]) / mx, 2.2)); ctx.fillRect(ox + j * c, oy + i * c, c - 1, c - 1); }
      ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.strokeRect(ox + hover[1] * c, oy + hover[0] * c, c - 1, c - 1);
      ctx.textAlign = "left";
      const row = N[hover[0]].reduce((a, b) => a + b, 0);
      V.say(read, [[`"${ch[hover[0]]}" → "${ch[hover[1]]}"`, N[hover[0]][hover[1]] + " times"], ["P(next | prev)", (N[hover[0]][hover[1]] / row).toFixed(4), "hi"], ["data", window.AIM_VIZDATA.nnames.toLocaleString() + " real names · '.' = start/end"]]);
      cv.geo = { c, ox, oy };
    });
    cv.cv.addEventListener("pointermove", (e) => { const [x, y] = cv.pos(e), g = cv.geo; const j = Math.floor((x - g.ox) / g.c), i = Math.floor((y - g.oy) / g.c); if (i >= 0 && i < 27 && j >= 0 && j < 27) { hover = [i, j]; cv.redraw(); } });
    V.button(ctl, "Sample 8 names from the model", () => {
      const r = V.rng(seed++), names = [];
      for (let n = 0; n < 8; n++) { let i = 0, s = ""; do { const row = N[i], tot = row.reduce((a, b) => a + b, 0); let u = r() * tot; i = row.findIndex((v) => (u -= v) < 0); if (i > 0) s += ch[i]; } while (i > 0 && s.length < 14); names.push(s || "(empty)"); }
      out.innerHTML = ""; names.forEach((n) => out.append(V.el("span", null, n)));
    });
    host.append(out);
    host.append(V.el("p", "vizhint", "Rows = current letter, columns = next letter. Hover any cell."));
  };

  /* ---------------------------------------------- Days 76–77: attention */
  W.attention = (host) => {
    const ctl = V.controls(host);
    const tok = ["the", "cat", "sat", "on", "the", "mat"];
    const r = V.rng(5);
    let S = tok.map(() => tok.map(() => r.normal() * 1.5)), causal = true, d = 4;
    const wrap = V.el("div", "vizatt"); host.append(wrap);
    const read = V.readout(host);
    const draw = () => {
      const p = V.pal(), T = tok.length;
      const sc = S.map((row) => row.map((v) => v / Math.sqrt(d)));
      const Wt = sc.map((row, i) => { const m = row.map((v, j) => (causal && j > i ? -Infinity : v)), mx = Math.max(...m), e = m.map((v) => (v === -Infinity ? 0 : Math.exp(v - mx))), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); });
      const table = (M, title, fmt, color) => {
        const t = V.el("table"); const cap = V.el("caption", null, title); t.append(cap);
        const hr = V.el("tr"); hr.append(V.el("th", null, "")); tok.forEach((x) => hr.append(V.el("th", null, x))); t.append(hr);
        M.forEach((row, i) => { const tr = V.el("tr"); tr.append(V.el("th", null, tok[i])); row.forEach((v, j) => { const masked = causal && j > i; const td = V.el("td", masked ? "mask" : "", masked ? "−∞" : fmt(v)); if (!masked) td.style.background = color(v); tr.append(td); }); t.append(tr); });
        return t;
      };
      wrap.innerHTML = "";
      wrap.append(table(sc, "scores  q·kᵀ / √d", (v) => v.toFixed(1), (v) => V.alpha(v >= 0 ? p.b : p.c, Math.min(0.85, Math.abs(v) / 3))),
        table(Wt, "weights  softmax(row)", (v) => v.toFixed(2), (v) => V.heat(v, p)));
      const last = Wt[T - 1], top = last.indexOf(Math.max(...last));
      V.say(read, [["each row sums to", "1.00"], [`"${tok[T - 1]}" (last) attends most to`, `"${tok[top]}" (${last[top].toFixed(2)})`, "hi"], ["mask", causal ? "on: no peeking at future tokens" : "off: bidirectional (like BERT)"]]);
    };
    V.button(ctl, "New q·k scores", () => { S = tok.map(() => tok.map(() => r.normal() * 1.5)); draw(); });
    const l = V.el("label", "vizchk"); const c = V.el("input"); c.type = "checkbox"; c.checked = true; c.onchange = () => { causal = c.checked; draw(); }; l.append(c, document.createTextNode("causal mask")); ctl.append(l);
    V.slider(ctl, "head size d", 1, 64, 1, d, null, (v) => { d = v; draw(); });
    draw();
  };

  /* ---------------------------------------------- Day 81: sampling */
  W.sampling = (host) => {
    const ctl = V.controls(host);
    const words = ["the", "a", "my", "thy", "his", "our", "sweet", "cold", "fair", "dead"];
    const z = [3.1, 2.6, 2.0, 1.8, 1.4, 1.1, 0.6, 0.2, -0.3, -1.2];
    let T = 1, K = 10, P = 1, seed = 1;
    const bars = V.el("div", "vizbars"); host.append(bars);
    const chips = V.el("div", "vizchips");
    const read = V.readout(host);
    const dist = () => {
      const e = z.map((v) => Math.exp(v / T)), s = e.reduce((a, b) => a + b, 0), p0 = e.map((v) => v / s);
      const order = p0.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      const keep = new Set(); let cum = 0;
      order.forEach(([v, i], r0) => { if (r0 < K && (cum < P || !keep.size)) { keep.add(i); cum += v; } });
      const ks = p0.reduce((a, v, i) => a + (keep.has(i) ? v : 0), 0);
      return { p0, p: p0.map((v, i) => (keep.has(i) ? v / ks : 0)), keep };
    };
    const draw = () => {
      const { p0, p, keep } = dist();
      bars.innerHTML = "";
      words.forEach((w, i) => { const r0 = V.el("div", "vizbarrow" + (keep.has(i) ? "" : " off")); const bar = V.el("i"); const ghost = V.el("u"); ghost.style.width = p0[i] * 100 + "%"; const fill = V.el("b"); fill.style.width = p[i] * 100 + "%"; bar.append(ghost, fill); r0.append(V.el("span", null, w), bar, V.el("code", null, p[i].toFixed(3))); bars.append(r0); });
      V.say(read, [["candidates kept", keep.size + " of " + words.length], ["entropy", (-p.reduce((a, v) => a + (v ? v * Math.log2(v) : 0), 0)).toFixed(2) + " bits", "hi"], ["order", "logits / T → softmax → top-k → top-p → renormalise → sample"]]);
    };
    V.slider(ctl, "temperature", 0.1, 3, 0.05, T, (v) => v.toFixed(2), (v) => { T = v; draw(); });
    V.slider(ctl, "top-k", 1, 10, 1, K, null, (v) => { K = v; draw(); });
    V.slider(ctl, "top-p", 0.05, 1, 0.01, P, (v) => v.toFixed(2), (v) => { P = v; draw(); });
    V.button(ctl, "Sample 20 next words", () => { const r = V.rng(seed++), { p } = dist(); chips.innerHTML = ""; for (let n = 0; n < 20; n++) { let u = r(), i = 0; while (i < p.length - 1 && (u -= p[i]) > 0) i++; chips.append(V.el("span", null, words[i])); } });
    host.append(chips);
    host.append(V.el("p", "vizhint", "Faint bars: plain softmax. Bright bars: after temperature, top-k and top-p."));
    draw();
  };

  /* ---------------------------------------------- Day 82: BPE */
  W.bpe = (host) => {
    const ctl = V.controls(host);
    const inp = V.el("input", "vizin wide"); inp.value = "low lower lowest newer newest wider నమస్తే నమస్తే 🙂🙂";
    inp.setAttribute("aria-label", "training text");
    const l = V.el("label", "vizsl grow"); l.append(V.el("span", "vizsl-l", "text"), inp); ctl.append(l);
    const toks = V.el("div", "vizchips tok"); host.append(toks);
    const merges = V.el("ol", "vizmerges"); host.append(merges);
    const read = V.readout(host);
    let seq, ms;
    const reset = () => { seq = Array.from(new TextEncoder().encode(inp.value)).map((b) => [b]); ms = []; draw(); };
    const label = (bytes) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)).replace(/ /g, "␣"); } catch (e) { return bytes.map((b) => b.toString(16).padStart(2, "0")).join(" "); } };
    const step = () => {
      const c = new Map();
      for (let i = 0; i < seq.length - 1; i++) { const k = seq[i].join(",") + "|" + seq[i + 1].join(","); c.set(k, (c.get(k) || 0) + 1); }
      let best = null; c.forEach((n, k) => { if (n > 1 && (!best || n > best[1])) best = [k, n]; });
      if (!best) return false;
      const [l0, r0] = best[0].split("|"), out = [];
      for (let i = 0; i < seq.length; i++) { if (i < seq.length - 1 && seq[i].join(",") === l0 && seq[i + 1].join(",") === r0) { out.push(seq[i].concat(seq[i + 1])); i++; } else out.push(seq[i]); }
      ms.push([label(seq.find((s) => s.join(",") === l0)), label(seq.find((s) => s.join(",") === r0)), best[1]]);
      seq = out; draw(); return true;
    };
    const draw = () => {
      toks.innerHTML = ""; seq.forEach((t) => toks.append(V.el("span", t.length > 1 ? "m" : "", label(t))));
      merges.innerHTML = ""; ms.forEach(([a, b, n], i) => merges.append(V.el("li", null, `merge ${i + 1}: "${a}" + "${b}" (${n}×) → id ${256 + i}`)));
      V.say(read, [["bytes", String(new TextEncoder().encode(inp.value).length)], ["tokens now", String(seq.length), "hi"], ["vocab size", String(256 + ms.length)], ["why bytes", "any language or emoji works: Telugu letters are 3 bytes each"]]);
    };
    V.button(ctl, "Merge most frequent pair", () => { if (!step()) V.say(read, [["done", "no pair appears twice"]]); });
    V.button(ctl, "Merge 10", () => { for (let i = 0; i < 10 && step(); i++); });
    V.button(ctl, "Reset", reset);
    inp.onchange = reset;
    reset();
  };

  /* ---------------------------------------------- Day 86: RAG */
  W.rag = (host) => {
    const chunks = [
      "Day 33: gradient descent moves the weights against the gradient, scaled by the learning rate.",
      "Day 44: Naive Bayes counts words per class and multiplies probabilities to flag SMS spam.",
      "Day 66: the Tensor class stores data and grad, and backward() applies the chain rule in reverse.",
      "Day 76: self-attention scores each query against every key, masks the future and applies softmax.",
      "Day 80: train the GPT on Tiny Shakespeare; validation loss reaches about 1.99 on a CPU.",
      "Day 22: download() caches the Titanic CSV in a data folder so it is fetched only once.",
    ];
    const q = V.el("input", "vizin wide"); q.value = "how does attention use softmax?"; q.setAttribute("aria-label", "your question");
    const ctl = V.controls(host); const l = V.el("label", "vizsl grow"); l.append(V.el("span", "vizsl-l", "question"), q); ctl.append(l);
    const bars = V.el("div", "vizbars rag"); host.append(bars);
    const prompt = V.el("pre", "vizprompt"); host.append(prompt);
    const stop = new Set("the a an of to and is in on it how does do what with by for as be are".split(" "));
    const vec = (s) => { const m = new Map(); (s.toLowerCase().match(/[a-z]+/g) || []).filter((w) => !stop.has(w)).forEach((w) => { w = w.replace(/(ing|es|s)$/, ""); m.set(w, (m.get(w) || 0) + 1); }); return m; };
    const cos = (a, b) => { let d = 0; a.forEach((v, k) => { d += v * (b.get(k) || 0); }); const n = (m) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0)); return d / ((n(a) * n(b)) || 1); };
    const draw = () => {
      const qv = vec(q.value), sc = chunks.map((c, i) => [cos(qv, vec(c)), i]).sort((a, b) => b[0] - a[0]);
      bars.innerHTML = "";
      sc.forEach(([s, i], r0) => { const row = V.el("div", "vizbarrow" + (r0 < 2 ? "" : " off")); const bar = V.el("i"); const fill = V.el("b"); fill.style.width = Math.max(1, s * 100) + "%"; bar.append(fill); row.append(V.el("span", null, "chunk " + (i + 1)), bar, V.el("code", null, s.toFixed(2))); row.title = chunks[i]; bars.append(row); });
      prompt.textContent = "Answer using only this context:\n" + sc.slice(0, 2).map(([, i]) => "- " + chunks[i]).join("\n") + "\n\nQuestion: " + q.value + "\nAnswer:";
    };
    q.oninput = draw; draw();
    host.append(V.el("p", "vizhint", "Bag-of-words cosine here; your Day 86 code does the same with TF-IDF vectors. The top 2 chunks go into the prompt."));
  };
})();
