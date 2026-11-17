/* AIM 3D illustrations — one interactive scene per Medical Coding lesson.
   Three.js loads from the CDN only when a scene scrolls into view. Drag sideways to turn a
   scene (vertical swipes still scroll the page), tap the step buttons to walk through it.
   Labels are real HTML over the canvas, so they stay sharp and readable by screen readers. */
(function () {
  "use strict";
  const V = window.AIMViz;
  const W = V.W;
  const E = V.el;
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";
  let THREE_P = null;
  const loadThree = () => THREE_P || (THREE_P = import(THREE_URL));
  const C = { cyan: 0x22d3ee, violet: 0xa78bfa, pink: 0xf472b6, amber: 0xfbbf24, green: 0x34d399, red: 0xfb7185,
    slate: 0x64748b, ink: 0x1e293b, white: 0xe2e8f0, skin: 0xf5c6a5, bone: 0xf1e9d2, blood: 0xe11d48, tissue: 0xf9a8b4 };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ kit */
  function stage3d(host, S) {
    const wrap = E("div", "s3d");
    const box = E("div", "s3dbox");
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", S.alt);
    const note = E("p", "s3dload", "Loading 3D…");
    box.append(note);
    wrap.append(box);
    host.append(wrap);
    const ctl = V.controls(host);
    ctl.classList.add("s3dctl");
    ctl.setAttribute("role", "group");
    ctl.setAttribute("aria-label", "Steps");
    const read = V.readout(host);
    host.append(E("p", "vizhint", "Drag sideways to turn the model. Tap a step to walk through it."));
    let api = null, cur = 0;
    const btns = S.steps.map(([lab], i) => {
      const b = E("button", "btn ghost sm vizbtn s3dstep" + (i === 0 ? " on" : ""), (i + 1) + ". " + lab);
      b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.onclick = () => go(i);
      ctl.append(b);
      return b;
    });
    const go = (i) => {
      cur = i;
      btns.forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      V.say(read, [[S.steps[i][0], S.steps[i][1], "hi"]]);
      if (api && api.onStep) api.onStep(i);
    };
    V.say(read, [[S.steps[0][0], S.steps[0][1], "hi"]]);
    const start = () => loadThree().then((T) => {
      try { api = init(T, box, S); note.remove(); go(cur); }
      catch (e) { note.textContent = "3D isn't available on this device. The steps below still explain it."; }
    }).catch(() => { note.textContent = "The 3D library didn't load. Check your connection; the steps below still explain it."; });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: "200px" });
      io.observe(box);
    } else start();
  }

  function init(T, box, S) {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.className = "s3dcv";
    box.append(canvas);
    const layer = E("div", "s3dlabels");
    box.append(layer);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(38, 1, 0.1, 100);
    const [cx, cy, cz] = S.cam || [0, 2.2, 8];
    cam.position.set(cx, cy, cz);
    const look = new T.Vector3(...(S.look || [0, 0.6, 0]));
    cam.lookAt(look);
    scene.add(new T.HemisphereLight(0xffffff, 0x334155, 1.25));
    const sun = new T.DirectionalLight(0xffffff, 1.7); sun.position.set(4, 7, 6); scene.add(sun);
    const rim = new T.DirectionalLight(0x67e8f9, 0.6); rim.position.set(-6, 3, -4); scene.add(rim);
    const root = new T.Group(); scene.add(root);
    const ticks = [], labels = [];
    const mat = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0.08,
      emissive: o.glow ? color : 0x000000, emissiveIntensity: o.glow || 0, transparent: o.opacity != null, opacity: o.opacity ?? 1,
      side: o.double ? T.DoubleSide : T.FrontSide, depthWrite: o.opacity == null || o.opacity > 0.6 });
    const mesh = (geo, color, o, parent = root) => { const m = new T.Mesh(geo, color && color.isMaterial ? color : mat(color, o)); parent.add(m); return m; };
    const k = {
      T, scene, root, cam, mat, mesh,
      group: (parent = root) => { const g = new T.Group(); parent.add(g); return g; },
      box: (w, h, d, color, o, parent) => mesh(new T.BoxGeometry(w, h, d, 1, 1, 1), color, o, parent),
      rbox: (w, h, d, color, o, parent) => mesh(roundBox(T, w, h, d, Math.min(w, h, d) * 0.18), color, o, parent),
      sph: (r, color, o, parent) => mesh(new T.SphereGeometry(r, 32, 20), color, o, parent),
      cyl: (rt, rb, h, color, o, parent) => mesh(new T.CylinderGeometry(rt, rb, h, 32), color, o, parent),
      cap: (r, len, color, o, parent) => mesh(new T.CapsuleGeometry(r, len, 8, 16), color, o, parent),
      torus: (r, t, color, o, parent, arc) => mesh(new T.TorusGeometry(r, t, 16, 64, arc || Math.PI * 2), color, o, parent),
      tube: (pts, r, color, o, parent) => {
        const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)));
        const m = mesh(new T.TubeGeometry(curve, 64, r, 12, false), color, o, parent); m.curve = curve; return m;
      },
      ring: (r, color, o, parent) => mesh(new T.RingGeometry(r * 0.92, r, 48), color, Object.assign({ double: true }, o), parent),
      plane: (w, h, color, o, parent) => mesh(new T.PlaneGeometry(w, h), color, Object.assign({ double: true }, o), parent),
      label(text, at, cls) {
        const el = E("span", "s3dlab " + (cls || ""), text);
        layer.append(el);
        const L = { el, at, show: true, set: (t) => { el.textContent = t; }, vis: (v) => { L.show = v; } };
        labels.push(L);
        return L;
      },
      tick: (fn) => ticks.push(fn),
      ease: (a, b, f) => a + (b - a) * f,
    };
    const v3 = new T.Vector3();
    const place = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      labels.forEach((L) => {
        if (L.at.isObject3D) L.at.getWorldPosition(v3); else v3.set(L.at[0], L.at[1], L.at[2]).applyMatrix4(root.matrixWorld);
        v3.project(cam);
        const on = L.show && v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15;
        L.el.style.opacity = on ? "1" : "0";
        L.el.style.transform = `translate(-50%,-50%) translate(${((v3.x + 1) / 2) * w}px,${((1 - v3.y) / 2) * h}px)`;
      });
    };
    const size = () => {
      const w = box.clientWidth || 320;
      const h = Math.round(Math.max(240, Math.min(420, w * (w < 560 ? 0.82 : S.aspect || 0.62))));
      renderer.setSize(w, h, false);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      box.style.height = h + "px";
      cam.aspect = w / h;
      // keep the same horizontal view as a 1.6-wide desktop frame, so the model fills a tall phone frame
      const r = Math.PI / 180, hf = 2 * Math.atan(Math.tan(19 * r) * 1.6);
      cam.fov = Math.max(38, 2 * Math.atan(Math.tan(hf / 2) / cam.aspect) / r);
      cam.updateProjectionMatrix();
    };
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(box);

    // drag to turn: horizontal drags rotate, vertical swipes keep scrolling the page (touch-action: pan-y)
    let drag = null, lastTouch = 0;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, ry: root.rotation.y, rx: root.rotation.x }; lastTouch = performance.now(); });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      root.rotation.y = drag.ry + (e.clientX - drag.x) * 0.012;
      if (e.pointerType === "mouse") root.rotation.x = Math.max(-0.5, Math.min(0.5, drag.rx + (e.clientY - drag.y) * 0.006));
      lastTouch = performance.now();
    });
    addEventListener("pointerup", () => { drag = null; });
    addEventListener("pointercancel", () => { drag = null; });
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "3D model. Left and right arrow keys turn it.");
    canvas.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { root.rotation.y -= 0.2; lastTouch = performance.now(); e.preventDefault(); }
      if (e.key === "ArrowRight") { root.rotation.y += 0.2; lastTouch = performance.now(); e.preventDefault(); }
    });

    let visible = true, t0 = performance.now(), raf = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(box);
    const onNav = () => setTimeout(() => { if (!document.body.contains(canvas)) { removeEventListener("hashchange", onNav); loop(); } }, 60);
    addEventListener("hashchange", onNav);
    const api = S.build(k) || {};
    const sway = S.sway ?? 0.35;
    const loop = () => {
      cancelAnimationFrame(raf);
      if (!document.body.contains(canvas)) {          // left the lesson: free the GPU context
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        renderer.dispose(); renderer.forceContextLoss();
        return;
      }
      if (!visible) return;
      const now = performance.now(), t = (now - t0) / 1000;
      if (!reduced() && !drag && now - lastTouch > 2500 && sway) root.rotation.y += (Math.sin(t * 0.35) * sway - root.rotation.y) * 0.01;
      ticks.forEach((f) => f(reduced() ? 0 : t));
      renderer.render(scene, cam);
      place();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return api;
  }

  function roundBox(T, w, h, d, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }
  const pulse = (m, t, on, base = 0, amp = 0.6) => { m.material.emissiveIntensity = on ? base + amp * (0.5 + 0.5 * Math.sin(t * 4)) : base; };
  const hl = (m, on, color) => { m.material.emissive.setHex(on ? (color || m.material.color.getHex()) : 0x000000); m.material.emissiveIntensity = on ? 0.55 : 0; };
  const fade = (m, o) => { m.traverse((x) => { if (x.material) { x.material.transparent = true; x.material.opacity = o; } }); };

  // a simple person made of capsules, used by several scenes
  function person(k, color, o, parent) {
    const g = k.group(parent);
    k.sph(0.32, C.skin, o, g).position.set(0, 2.55, 0);
    const torso = k.cap(0.42, 0.9, color, o, g); torso.position.set(0, 1.65, 0);
    const parts = { torso };
    [[-0.62, "R"], [0.62, "L"]].forEach(([x, s]) => {
      const arm = k.cap(0.13, 0.95, color, o, g); arm.position.set(x, 1.65, 0); arm.rotation.z = x < 0 ? -0.18 : 0.18; parts["arm" + s] = arm;
      const leg = k.cap(0.17, 1.05, color, o, g); leg.position.set(x * 0.38, 0.55, 0); parts["leg" + s] = leg;
    });
    g.parts = parts;
    return g;
  }

  // a stylised four-chamber heart
  function heart(k, parent, scale = 1) {
    const g = k.group(parent); g.scale.setScalar(scale);
    const ra = k.sph(0.55, 0x60a5fa, {}, g); ra.position.set(-0.5, 0.65, 0); ra.scale.set(1, 0.85, 0.9);
    const la = k.sph(0.55, 0xf87171, {}, g); la.position.set(0.55, 0.7, -0.1); la.scale.set(1, 0.85, 0.9);
    const rv = k.sph(0.8, 0x3b82f6, {}, g); rv.position.set(-0.4, -0.3, 0.15); rv.scale.set(0.95, 1.1, 0.9);
    const lv = k.sph(0.85, C.blood, {}, g); lv.position.set(0.45, -0.4, 0); lv.scale.set(0.95, 1.2, 0.95);
    const ao = k.tube([[0.35, 0.8, 0], [0.35, 1.6, 0], [-0.1, 2.0, 0], [-0.6, 1.6, 0], [-0.75, 1.0, 0]], 0.2, 0xdc2626, {}, g);
    return { g, ra, la, rv, lv, ao };
  }

  /* --------------------------------------------------------------- scenes */
  const S = {};

  S.cycle = { alt: "A ring of six stations of the US revenue cycle with a glowing claim travelling around it, and a red loop back for denials.",
    cam: [0, 4.6, 7.6], look: [0, 0, 0], sway: 0.25,
    steps: [["Visit", "The patient books, is registered and their insurance is checked."], ["Document", "The doctor examines and writes the note: the only source a coder may use."],
      ["Code", "The coder reads the note and assigns ICD-10-CM, CPT and HCPCS codes."], ["Claim", "Codes go on a claim to the payer (insurer)."],
      ["Paid", "A clean claim is paid and posted."], ["Denied", "A wrong or unsupported code is denied: fix it and send it again."]],
    build(k) {
      const names = ["Visit", "Document", "Code", "Claim", "Payer", "Paid"], cols = [C.slate, C.violet, C.cyan, C.amber, C.pink, C.green];
      const st = names.map((n, i) => {
        const a = (i / names.length) * Math.PI * 2;
        const m = k.cyl(0.55, 0.65, 0.35 + (i === 2 ? 0.25 : 0), cols[i], {}); m.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
        k.label(n, [Math.cos(a) * 2.6, 0.75, Math.sin(a) * 2.6]); return m;
      });
      k.torus(2.6, 0.05, C.white, { opacity: 0.35 }).rotation.x = Math.PI / 2;
      const deny = k.tube([[Math.cos(4 * Math.PI / 3) * 2.6, 0.2, Math.sin(4 * Math.PI / 3) * 2.6], [0.8, 1.3, -1.2], [Math.cos(Math.PI) * 2.6, 0.2, Math.sin(Math.PI) * 2.6]], 0.05, C.red, { glow: 0.4 });
      deny.visible = false;
      const token = k.rbox(0.45, 0.3, 0.06, C.white, { glow: 0.6 });
      let step = 0;
      k.tick((t) => {
        const target = [0, 1, 2, 3, 5, 4][step];
        const a = ((step === 5 ? 3 + ((t * 0.6) % 1) : target) / names.length) * Math.PI * 2 + (step === 5 ? 0 : Math.sin(t * 2) * 0.05);
        token.position.set(Math.cos(a) * 2.6, 0.75 + Math.sin(t * 3) * 0.08, Math.sin(a) * 2.6);
        token.rotation.y = -a;
        st.forEach((m, i) => pulse(m, t, i === target, 0, 0.5));
      });
      return { onStep(i) { step = i; deny.visible = i === 5; } };
    } };

  S.words = { alt: "Three 3D blocks, prefix, root and suffix, that slide together to build a medical word.", cam: [0, 1.6, 7.2], look: [0, 0.4, 0],
    steps: [["peri + card + itis", "pericarditis: inflammation of the sac around the heart"], ["hepat + itis", "hepatitis: inflammation of the liver"],
      ["brady + card + ia", "bradycardia: slow heart rate"], ["hyster + ectomy", "hysterectomy: surgical removal of the uterus"],
      ["col + o + scopy", "colonoscopy: looking inside the colon with a scope"]],
    build(k) {
      const sets = [["peri", "card", "itis"], ["", "hepat", "itis"], ["brady", "card", "ia"], ["", "hyster", "ectomy"], ["", "colon", "o·scopy"]];
      const cols = [C.cyan, C.violet, C.pink];
      const blocks = cols.map((c, i) => { const b = k.rbox(1.4, 0.8, 0.6, c, { glow: 0.08 }); b.lab = k.label("", b, "big"); return b; });
      const roles = ["prefix", "root", "suffix"].map((r, i) => k.label(r, [0, -0.9, 0], "dim"));
      let target = sets[0], prog = 0;
      k.tick((t) => {
        prog = Math.min(1, prog + 0.03);
        const shown = target.map((x) => !!x);
        const n = shown.filter(Boolean).length;
        let idx = 0;
        blocks.forEach((b, i) => {
          b.visible = shown[i];
          if (!shown[i]) { roles[i].vis(false); b.lab.vis(false); return; }
          const x = (idx - (n - 1) / 2) * 1.5; idx++;
          const spread = (1 - prog) * (i - 1) * 1.6;
          b.position.set(x + spread, 0.4 + Math.sin(t * 2 + i) * 0.04, (1 - prog) * 1.2);
          b.lab.vis(true); roles[i].vis(true); roles[i].at = [b.position.x, -0.35, b.position.z];
        });
      });
      return { onStep(i) { target = sets[i]; prog = 0; blocks.forEach((b, j) => b.lab.set(target[j])); } };
    } };

  S.planes = { alt: "A 3D human figure with the sagittal, coronal and transverse planes, and the patient's right and left marked.", cam: [2.4, 2.2, 7.4], look: [0, 1.4, 0], sway: 0.6,
    steps: [["Patient's right", "Directions are always the PATIENT's. Facing them, their right is on your left."],
      ["Sagittal", "Splits left from right: laterality (right / left / bilateral) is in many ICD-10-CM codes."],
      ["Coronal", "Splits front (anterior) from back (posterior)."], ["Transverse", "Splits top (superior) from bottom (inferior)."],
      ["Proximal / distal", "The wrist is distal to the elbow: closer to the trunk = proximal."]],
    build(k) {
      const p = person(k, C.violet, {});
      const R = k.label("patient's RIGHT", [-1.1, 2.0, 0.4], "warn"), L = k.label("LEFT", [1.1, 2.0, 0.4]);
      const sag = k.plane(2.4, 3.4, C.cyan, { opacity: 0.25 }); sag.position.set(0, 1.5, 0); sag.rotation.y = Math.PI / 2;
      const cor = k.plane(2.4, 3.4, C.pink, { opacity: 0.25 }); cor.position.set(0, 1.5, 0);
      const tra = k.plane(2.4, 2.4, C.amber, { opacity: 0.25 }); tra.rotation.x = Math.PI / 2; tra.position.set(0, 1.55, 0);
      const prox = k.label("proximal", [-0.72, 2.0, 0.3], "dim"), dist = k.label("distal", [-0.78, 1.1, 0.3], "dim");
      return { onStep(i) {
        R.vis(i === 0 || i === 1); L.vis(i === 0 || i === 1);
        sag.visible = i === 1; cor.visible = i === 2; tra.visible = i === 3; prox.vis(i === 4); dist.vis(i === 4);
        hl(p.parts.armR, i === 0 || i === 4, C.amber);
      } };
    } };

  S.heart = { alt: "A four-chamber heart in 3D with blood flowing from the right side to the lungs and from the left ventricle out to the body.", cam: [0, 1.2, 6.5], look: [0, 0.3, 0], sway: 0.7,
    steps: [["Right side", "Right atrium and ventricle send used (blue) blood to the lungs."], ["Left ventricle", "The left ventricle pumps oxygen-rich blood into the aorta: I50 heart failure is about this pump."],
      ["Coronary arteries", "Arteries on the heart's surface feed the muscle: a blockage causes an MI (I21)."], ["Hypertension", "High pressure strains the heart: hypertension with heart failure is I11.0 (link presumed)."]],
    build(k) {
      const h = heart(k, k.root, 1.1);
      const cor = k.tube([[0.1, 0.35, 0.9], [0.5, -0.1, 0.95], [0.75, -0.7, 0.85], [0.6, -1.3, 0.6]], 0.06, 0xb91c1c, { glow: 0.2 }, h.g);
      const drops = Array.from({ length: 10 }, (_, i) => { const d = k.sph(0.08, C.blood, { glow: 0.5 }, h.g); d.u = i / 10; return d; });
      const labs = [k.label("right atrium", h.ra), k.label("left atrium", h.la), k.label("right ventricle", h.rv), k.label("left ventricle", h.lv)];
      let s = 0;
      k.tick((t) => {
        const beat = 1 + Math.max(0, Math.sin(t * 6)) * 0.04;
        h.g.scale.setScalar(1.1 * beat);
        drops.forEach((d) => { const u = (d.u + t * 0.25) % 1; d.position.copy(h.ao.curve.getPointAt(u)); d.visible = s === 1 || s === 3; });
        pulse(cor, t, s === 2, 0.1, 0.8);
        pulse(h.lv, t, s === 1 || s === 3, 0, 0.35);
        pulse(h.rv, t, s === 0, 0, 0.35); pulse(h.ra, t, s === 0, 0, 0.35);
      });
      return { onStep(i) { s = i; labs.forEach((l, j) => l.vis(i === 3 ? j === 3 : true)); } };
    } };

  S.kidney = { alt: "Two 3D kidneys connected by ureters to the bladder; the kidneys dim as chronic kidney disease stage rises.", cam: [0, 1.4, 7], look: [0, 0.2, 0],
    steps: [["Healthy", "Kidneys filter blood; urine runs down the ureters to the bladder."], ["CKD stage 3", "Filtration falls: N18.30 (stage 3 unspecified), N18.31 3a, N18.32 3b."],
      ["Stage 5 / ESRD", "Kidneys failing: N18.6 ESRD, plus Z99.2 if on dialysis."], ["With hypertension", "HTN + CKD is presumed linked: I12.- comes first, then the N18 stage."]],
    build(k) {
      const ks = [-1.2, 1.2].map((x) => { const m = k.sph(0.75, 0xb45309, {}); m.scale.set(0.62, 1, 0.45); m.position.set(x, 1, 0); m.rotation.z = x < 0 ? -0.25 : 0.25; return m; });
      [-1, 1].forEach((s) => k.tube([[1.1 * s, 0.4, 0], [0.8 * s, -0.4, 0.1], [0.35 * s, -1.2, 0.2]], 0.06, C.amber, { opacity: 0.85 }));
      const bl = k.sph(0.55, C.amber, { opacity: 0.85 }); bl.position.set(0, -1.45, 0.2); bl.scale.set(1, 0.8, 0.8);
      const lab = k.label("eGFR normal", [0, 2.2, 0], "big");
      const vessel = k.tube([[-2.2, 1.6, -0.5], [0, 1.3, -0.6], [2.2, 1.6, -0.5]], 0.09, C.blood, { glow: 0.2 });
      vessel.visible = false;
      let s = 0;
      k.tick((t) => { ks.forEach((m) => { m.material.color.setHex([0xb45309, 0x92400e, 0x57534e, 0x92400e][s]); pulse(m, t, s === 2, 0, 0.25); }); pulse(vessel, t, s === 3, 0.1, 0.6); });
      return { onStep(i) { s = i; vessel.visible = i === 3; lab.set(["eGFR normal", "N18.30 · stage 3", "N18.6 + Z99.2", "I12.9 + N18.30"][i]); } };
    } };

  S.tumour = { alt: "A smooth contained benign tumour next to a spiky malignant one that sends cells through a vessel to the bone.", cam: [0, 1.6, 7.5], look: [0, 0.4, 0],
    steps: [["Benign", "Stays in place, doesn't invade: D codes in the Neoplasm Table's benign column."], ["Malignant primary", "Invades nearby tissue: the site where it started is the primary (C codes)."],
      ["Metastasis", "Cells travel to another site: that site is SECONDARY (e.g. C79.51 bone)."], ["History", "Removed, no treatment, no disease: Z85 personal history instead."]],
    build(k) {
      const ben = k.sph(0.7, C.green, { rough: 0.3 }); ben.position.set(-2, 0.6, 0);
      const malG = new k.T.IcosahedronGeometry(0.75, 2);
      const pos = malG.attributes.position; for (let i = 0; i < pos.count; i++) { const f = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.28; pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f); }
      malG.computeVertexNormals();
      const mal = k.mesh(malG, C.red); mal.position.set(0.2, 0.6, 0);
      const bone = k.cap(0.25, 2.2, C.bone, {}); bone.position.set(2.4, 0.3, -0.2); bone.rotation.z = 0.3;
      const path = k.tube([[0.8, 0.8, 0], [1.5, 1.6, 0.2], [2.3, 0.6, 0]], 0.04, C.blood, { opacity: 0.6 });
      const cells = Array.from({ length: 6 }, (_, i) => { const c = k.sph(0.09, C.red, { glow: 0.6 }); c.u = i / 6; return c; });
      const sec = k.sph(0.25, C.red, {}); sec.position.set(2.35, 0.55, 0.15);
      const lb = k.label("benign", [-2, 1.6, 0]), lm = k.label("primary", [0.2, 1.7, 0]), ls = k.label("secondary", [2.4, 1.3, 0]);
      let s = 0;
      k.tick((t) => {
        mal.rotation.y = t * 0.3;
        cells.forEach((c) => { c.visible = s === 2; c.position.copy(path.curve.getPointAt((c.u + t * 0.3) % 1)); });
        pulse(ben, t, s === 0, 0, 0.4); pulse(mal, t, s === 1, 0, 0.4);
      });
      return { onStep(i) { s = i; mal.visible = i !== 3; sec.visible = i === 2; path.visible = i === 2; ls.vis(i === 2); lm.set(i === 3 ? "" : "primary"); fade(ben, i === 3 ? 0.3 : 1); } };
    } };

  S.soap = { alt: "Four stacked note cards, Subjective, Objective, Assessment and Plan; codes lift out of the Assessment card.", cam: [0, 2.6, 7.4], look: [0, 0.6, 0],
    steps: [["S", "Subjective: what the patient says, e.g. cough for 5 days."], ["O", "Objective: what the provider measures: temperature, crackles."],
      ["A", "Assessment: the provider's diagnoses. Diagnosis codes come from here."], ["P", "Plan: tests, drugs and follow-up: the services billed."]],
    build(k) {
      const names = ["S", "O", "A", "P"], cols = [C.slate, C.slate, C.cyan, C.violet];
      const cards = names.map((n, i) => { const c = k.rbox(3.2, 0.12, 2, cols[i], { opacity: 0.92 }); c.position.set(0, i * 0.45, 0); k.label(n, [-1.4, i * 0.45 + 0.1, 0.9], "big"); return c; });
      const chips = ["J18.9", "I10"].map((c, i) => { const m = k.rbox(0.9, 0.35, 0.12, C.cyan, { glow: 0.4 }); m.lab = k.label(c, m); m.i = i; return m; });
      let s = 0;
      k.tick((t) => {
        cards.forEach((c, i) => { c.position.x = k.ease(c.position.x, i === s ? 0.5 : 0, 0.1); pulse(c, t, i === s, 0, 0.3); });
        chips.forEach((m) => { const up = s === 2; m.visible = up; m.lab.vis(up); m.position.set(0.3 + m.i * 1.1, 2.15 + Math.sin(t * 2 + m.i) * 0.1, 0.4); });
      });
      return { onStep(i) { s = i; } };
    } };

  S.codeparts = { alt: "The code S52.501A as eight 3D tiles that separate into category, detail, side and the 7th character.", cam: [0, 1.4, 8], look: [0, 0.3, 0], sway: 0.25,
    steps: [["Whole code", "S52.501A: one billable ICD-10-CM code."], ["Category", "S52 = fracture of the forearm (3 characters, then the dot)."],
      ["Detail", "5, 0: lower end of the radius, unspecified fracture."], ["Laterality", "6th character 1 = right (2 = left)."], ["7th character", "A = initial encounter, active treatment."]],
    build(k) {
      const chars = "S52.501A".split(""), groups = [1, 1, 1, 0, 2, 2, 3, 4], cols = [C.cyan, C.violet, C.amber, C.pink];
      const tiles = chars.map((ch, i) => {
        const dot = ch === ".";
        const m = dot ? k.sph(0.09, C.white) : k.rbox(0.7, 0.85, 0.3, groups[i] === 1 ? cols[0] : groups[i] === 2 ? cols[1] : groups[i] === 3 ? cols[2] : cols[3], { glow: 0.05 });
        m.home = (i - 3.5) * 0.82; m.g = groups[i];
        if (!dot) m.lab = k.label(ch, m, "big");
        return m;
      });
      let s = 0;
      k.tick((t) => tiles.forEach((m) => {
        const lift = s > 0 && m.g === s ? 0.55 : 0, spread = s > 0 ? (m.g - 2.2) * 0.25 : 0;
        m.position.x = k.ease(m.position.x, m.home + spread, 0.1);
        m.position.y = k.ease(m.position.y, 0.4 + lift, 0.12);
        if (m.lab) pulse(m, t, s > 0 && m.g === s, 0.05, 0.5);
      }));
      return { onStep(i) { s = i; } };
    } };

  S.books = { alt: "Two open books, the Alphabetic Index and the Tabular List, joined by a beam; a red barrier shows an Excludes1 note.", cam: [0, 3, 7.8], look: [0, 0.4, 0],
    steps: [["Index", "Look up the CONDITION (Pharyngitis), then the subterm (streptococcal)."], ["Tabular", "Always confirm in the Tabular List: J02.0, and read every note."],
      ["Excludes1", "Never code together with the excluded condition (chronic pharyngitis J31.2)."], ["Use additional", "Some codes ask for a second code (e.g. organism B96.20 with N39.0)."]],
    build(k) {
      const book = (x, col, name) => { const g = k.group(); g.position.x = x;
        [-0.75, 0.75].forEach((dx, i) => { const p = k.box(1.4, 0.08, 1.9, C.white, {}, g); p.position.set(dx, 0, 0); p.rotation.z = i ? -0.12 : 0.12; });
        k.box(0.12, 0.14, 1.9, col, {}, g).position.y = -0.02; k.label(name, [x, -0.6, 0.9], "dim"); return g; };
      book(-2, C.cyan, "Alphabetic Index"); book(2, C.violet, "Tabular List");
      const entry = k.rbox(0.9, 0.08, 0.3, C.cyan, { glow: 0.6 }); entry.position.set(-2.4, 0.15, -0.2); const le = k.label("Pharyngitis › strep", [-2.4, 0.5, -0.2]);
      const code = k.rbox(0.9, 0.08, 0.3, C.violet, { glow: 0.6 }); code.position.set(1.6, 0.15, 0); const lc = k.label("J02.0", [1.6, 0.5, 0], "big");
      const beam = k.tube([[-2.4, 0.2, -0.2], [0, 1.6, 0], [1.6, 0.2, 0]], 0.04, C.amber, { glow: 0.8 });
      const wall = k.box(0.08, 0.9, 1.6, C.red, { opacity: 0.55, glow: 0.4 }); wall.position.set(2.6, 0.5, 0); const lw = k.label("Excludes1 ✕ J31.2", [2.9, 1.2, 0], "warn");
      const add = k.rbox(0.9, 0.08, 0.3, C.green, { glow: 0.5 }); add.position.set(2.5, 0.15, 0.6); const la = k.label("+ B96.20", [2.5, 0.5, 0.6]);
      return { onStep(i) { beam.visible = i >= 1; code.visible = i >= 1; lc.vis(i >= 1); wall.visible = i === 2; lw.vis(i === 2); add.visible = i === 3; la.vis(i === 3); le.vis(true); } };
    } };

  S.funnel = { alt: "Notes from a chart fall into a funnel; confirmed diagnoses and symptoms are coded, 'rule out' and 'suspected' bounce off.", cam: [0, 2.2, 8], look: [0, 0.6, 0],
    steps: [["Confirmed", "A definitive diagnosis is coded: 'COPD with exacerbation' → J44.1."], ["Rule out", "'Rule out MI' is NOT coded in the office: code the symptom, chest pain R07.9."],
      ["Integral symptom", "RLQ pain with appendicitis is part of the disease: only K35.80."], ["Acute + chronic", "Both documented and indexed: code both, acute first."]],
    build(k) {
      const f = k.cyl(1.6, 0.35, 1.6, C.violet, { opacity: 0.45, double: true }); f.position.y = 0.8;
      const bin = k.cyl(0.5, 0.5, 0.5, C.green, { opacity: 0.8 }); bin.position.y = -0.55; k.label("coded", [0, -1.1, 0]);
      const reject = k.cyl(0.45, 0.45, 0.4, C.red, { opacity: 0.6 }); reject.position.set(2.6, -0.5, 0); k.label("not coded", [2.6, -1.0, 0], "warn");
      const chips = [["J44.1", 1], ["r/o MI", 0], ["R07.9", 1], ["RLQ pain", 0], ["K35.80", 1], ["acute", 1], ["chronic", 1]].map(([n, ok], i) => {
        const m = k.rbox(0.95, 0.32, 0.12, ok ? C.cyan : C.red, { glow: 0.3 }); m.lab = k.label(n, m); m.ok = ok; m.i = i; return m; });
      const show = [[0], [1, 2], [3, 4], [5, 6]];
      let s = 0;
      k.tick((t) => chips.forEach((m) => {
        const on = show[s].includes(m.i); m.visible = on; m.lab.vis(on);
        if (!on) return;
        const u = ((t * 0.35) + m.i * 0.37) % 1;
        if (m.ok) m.position.set(Math.sin(m.i) * (1 - u) * 1.1, 2.6 - u * 3, 0);
        else m.position.set(u < 0.5 ? Math.sin(m.i) * 0.6 : 0.6 + (u - 0.5) * 4, u < 0.5 ? 2.6 - u * 2.4 : 1.4 - (u - 0.5) * 3.6, 0);
        m.rotation.z = Math.sin(t + m.i) * 0.3;
      }));
      return { onStep(i) { s = i; } };
    } };

  S.htn = { alt: "A 3D heart and two kidneys joined by glowing links that show how hypertension combines with heart failure and kidney disease into I11, I12 or I13.", cam: [0, 1.6, 8.2], look: [0, 0.4, 0],
    steps: [["Hypertension only", "No heart or kidney involvement: I10."], ["+ heart failure", "Presumed link: I11.0 + the I50.- type of heart failure."],
      ["+ CKD", "Presumed link: I12.9 (stages 1–4) or I12.0 (5/ESRD) + N18.- stage."], ["+ both", "I13.- + I50.- + N18.-."], ["+ diabetes", "Diabetes with CKD is also linked: E11.22 + the stage."]],
    build(k) {
      const h = heart(k, k.root, 0.7); h.g.position.set(-1.9, 0.8, 0);
      const ks = [1.5, 2.6].map((x) => { const m = k.sph(0.55, 0xb45309, {}); m.scale.set(0.6, 1, 0.45); m.position.set(x, 0.8, 0); return m; });
      const pump = k.cyl(0.5, 0.5, 0.25, C.amber, {}); pump.position.set(0, -0.8, 0); const lp = k.label("BP ↑", [0, -0.3, 0]);
      const linkH = k.tube([[0, -0.6, 0], [-1, 0, 0.3], [-1.8, 0.2, 0]], 0.06, C.amber, { glow: 0.7 });
      const linkK = k.tube([[0, -0.6, 0], [1, 0, 0.3], [1.9, 0.3, 0]], 0.06, C.amber, { glow: 0.7 });
      const dm = k.sph(0.35, C.pink, {}); dm.position.set(2, -0.8, 0.4); const ld = k.label("diabetes", [2, -0.3, 0.4]);
      const linkD = k.tube([[2, -0.6, 0.4], [2.1, 0.2, 0.2]], 0.05, C.pink, { glow: 0.7 });
      const code = k.label("I10", [0, 2.3, 0], "big");
      return { onStep(i) {
        linkH.visible = i === 1 || i === 3; linkK.visible = i === 2 || i === 3 || i === 4; dm.visible = linkD.visible = i === 4; ld.vis(i === 4);
        code.set(["I10", "I11.0 + I50.-", "I12.9 + N18.-", "I13.0 + I50.- + N18.-", "E11.22 + I12.9 + N18.-"][i]);
      } };
    } };

  S.neotable = { alt: "A 3D version of the Table of Neoplasms with six columns; the breast row lights up and an arc jumps to the bone row for a metastasis.", cam: [0, 4.6, 5.4], look: [0, -0.2, 0], sway: 0.15,
    steps: [["Histology first", "Look up the word in the Index ('carcinoma') to learn which column to use."], ["Primary", "Breast, female, left: C50.912 (malignant primary column)."],
      ["Secondary", "Spread to bone: the bone row, secondary column → C79.51."], ["Benign", "A benign breast tumour sits in another column: D24.-."]],
    build(k) {
      const cols = ["Prim.", "Sec.", "In situ", "Benign", "Uncert.", "Unspec."], rows = ["breast", "lung", "bone"];
      const cells = [];
      rows.forEach((r, ri) => cols.forEach((c, ci) => {
        const m = k.rbox(0.85, 0.12, 0.6, ri % 2 ? C.slate : C.ink, { opacity: 0.9 }); m.position.set((ci - 2.5) * 0.92, 0, (ri - 1) * 0.7); cells.push({ m, ri, ci });
      }));
      cols.forEach((c, ci) => k.label(c, [(ci - 2.5) * 0.92, 0.2, -1.25 - (ci % 2) * 0.35], "dim"));
      rows.forEach((r, ri) => k.label(r, [-3.3, 0.1, (ri - 1) * 0.7], "dim"));
      const arc = k.tube([[-2.3, 0.2, -0.7], [-1.8, 1.4, 0], [-1.38, 0.2, 0.7]], 0.05, C.red, { glow: 0.8 });
      const lab = k.label("", [0, 1.6, 0], "big");
      return { onStep(i) {
        cells.forEach(({ m, ri, ci }) => hl(m, (i === 1 && ri === 0 && ci === 0) || (i === 2 && ri === 2 && ci === 1) || (i === 3 && ri === 0 && ci === 3) || (i === 0 && ri === 0), i === 3 ? C.green : C.red));
        arc.visible = i === 2; lab.set(["see Neoplasm, malignant", "C50.912", "C50.912 + C79.51", "D24.2"][i]);
      } };
    } };

  S.fracture = { alt: "A 3D forearm with a broken radius; a cast appears at the first visit, healing at the follow-up, and a stiff wrist a year later.", cam: [0, 1.4, 5.4], look: [0, 0.4, 0], sway: 0.6,
    steps: [["ED visit", "Closed fracture, lower end of RIGHT radius, set and cast: S52.501A."], ["Week 4", "Cast check, healing as expected: S52.501D."],
      ["1 year later", "Stiff wrist caused by the old fracture: M25.631 first, then S52.501S."], ["Poisoning vs adverse effect", "Different 7th-character logic applies to T codes: T39.1X1A poisoning vs T38.0X5A adverse effect."]],
    build(k) {
      const g = k.group(); g.rotation.z = -0.15;
      const ulna = k.cap(0.13, 3, C.bone, {}, g); ulna.rotation.z = Math.PI / 2; ulna.position.set(0, 0.25, -0.15);
      const r1 = k.cap(0.15, 1.6, C.bone, {}, g); r1.rotation.z = Math.PI / 2; r1.position.set(-0.85, 0.05, 0.15);
      const r2 = k.cap(0.15, 1.1, C.bone, {}, g); r2.rotation.z = Math.PI / 2; r2.position.set(1.15, 0.05, 0.15);
      const hand = k.sph(0.45, C.skin, {}, g); hand.position.set(2.2, 0.15, 0); hand.scale.set(0.7, 0.4, 1);
      const cast = k.cyl(0.55, 0.5, 2, C.white, { opacity: 0.55 }, g); cast.rotation.z = Math.PI / 2; cast.position.set(0.9, 0.15, 0);
      const crack = k.label("fracture", [0.3, 0.7, 0.2], "warn");
      const code = k.label("S52.501A", [0, 1.6, 0], "big");
      let s = 0;
      k.tick((t) => { r2.position.y = k.ease(r2.position.y, s === 0 ? 0.15 : 0.05, 0.08); pulse(r2, t, s === 0, 0, 0.4); hand.rotation.z = s === 2 ? Math.sin(t * 2) * 0.05 : 0; });
      return { onStep(i) { s = i; cast.visible = i <= 1; crack.vis(i === 0); code.set(["S52.501A", "S52.501D", "M25.631 + S52.501S", "T39.1X1A · T38.0X5A"][i]); } };
    } };

  S.pregnancy = { alt: "A 3D ring of 40 weeks of pregnancy split into three coloured trimesters, with a marker for the current week.", cam: [0, 4.2, 6.6], look: [0, 0, 0], sway: 0.15,
    steps: [["1st trimester", "Less than 14 weeks: O codes end in 1 (e.g. O10.011)."], ["2nd trimester", "14 weeks 0 days to less than 28: ends in 2. Add Z3A.24 at 24 weeks."],
      ["3rd trimester", "28 weeks until delivery: ends in 3. Gestational diabetes O24.410 has no trimester digit."], ["Delivery", "Normal delivery O80 + outcome Z37.0 on mother; Z38.00 on the baby."]],
    build(k) {
      const segs = [[0, 14, C.cyan], [14, 28, C.violet], [28, 40, C.pink]].map(([a, b, c]) => {
        const m = k.torus(2, 0.18, c, { glow: 0.05 }, k.root, ((b - a) / 40) * Math.PI * 2 - 0.04); m.rotation.x = Math.PI / 2; m.rotation.z = (a / 40) * Math.PI * 2; return m;
      });
      const mark = k.sph(0.22, C.white, { glow: 0.8 });
      const baby = k.sph(0.3, C.skin, {}); baby.position.y = 0.3;
      const wk = k.label("", [0, 1.4, 0], "big");
      [0, 14, 28].forEach((w) => k.label(w + " wk", [Math.cos((w / 40) * Math.PI * 2) * 2.6, 0, Math.sin((w / 40) * Math.PI * 2) * 2.6], "dim"));
      let target = 10, cur = 10;
      k.tick(() => {
        cur = k.ease(cur, target, 0.06);
        const a = (cur / 40) * Math.PI * 2; mark.position.set(Math.cos(a) * 2, 0.25, Math.sin(a) * 2);
        baby.scale.setScalar(0.4 + cur / 40);
        segs.forEach((m, i) => { m.material.emissiveIntensity = (cur < 14 ? 0 : cur < 28 ? 1 : 2) === i ? 0.5 : 0.05; });
      });
      return { onStep(i) { target = [10, 24, 32, 39.5][i]; wk.set(["10 weeks · Z3A.10", "24 weeks · Z3A.24", "32 weeks · Z3A.32", "Delivery · O80 + Z37.0"][i]); } };
    } };

  S.cptbook = { alt: "A 3D CPT book with six coloured section tabs; the Surgery tab fans out into its body-system subsections.", cam: [0, 2.6, 7.4], look: [0, 0.6, 0],
    steps: [["Six sections", "E/M, Anesthesia, Surgery, Radiology, Path + Lab, Medicine: tab each one."], ["Surgery", "10004–69990, split by body system: the biggest part of the CPC exam."],
      ["Category II / III", "4 digits + F (quality) or + T (new technology: use before an unlisted code)."], ["Add-on +", "Never alone: always with its primary procedure."]],
    build(k) {
      const cover = k.rbox(2.6, 3.2, 0.5, C.ink, {}); cover.position.set(0, 0.8, 0);
      const secs = [["E/M", C.cyan], ["Anesthesia", C.slate], ["Surgery", C.amber], ["Radiology", C.violet], ["Path + Lab", C.green], ["Medicine", C.pink]];
      const tabs = secs.map(([n, c], i) => { const t = k.rbox(0.55, 0.42, 0.42, c, { glow: 0.1 }); t.position.set(1.45, 2.1 - i * 0.5, 0); t.lab = k.label(n, [2.35, 2.1 - i * 0.5, 0], "dim"); return t; });
      const fan = ["Integumentary", "Musculoskeletal", "Respiratory", "Cardiovascular", "Digestive", "Urinary", "Nervous", "Eye"].map((n, i) => {
        const p = k.box(1.6, 0.04, 0.9, C.amber, { opacity: 0.85 }); p.rotation.y = 0; p.lab = k.label(n, p, "dim"); p.i = i; return p; });
      const tagF = k.rbox(1, 0.4, 0.15, C.green, { glow: 0.3 }); tagF.position.set(-2.4, 1.6, 0); const lf = k.label("0001F", tagF);
      const tagT = k.rbox(1, 0.4, 0.15, C.violet, { glow: 0.3 }); tagT.position.set(-2.4, 0.9, 0); const lt = k.label("0xxxT", tagT);
      const plus = k.label("+ add-on", [-2.2, 0.1, 0], "big");
      let s = 0;
      k.tick((t) => fan.forEach((p) => { const on = s === 1; p.visible = on; p.lab.vis(on); const a = (p.i - 3.5) * 0.16; p.position.set(-0.4 + Math.cos(a) * 0.2, 0.9 + Math.sin(a) * 2.2, 0.6 + p.i * 0.02); p.rotation.z = a; }));
      return { onStep(i) { s = i; tabs.forEach((tb, j) => hl(tb, (i === 0) || (i === 1 && j === 2), tb.material.color.getHex())); tagF.visible = tagT.visible = i === 2; lf.vis(i === 2); lt.vis(i === 2); plus.vis(i === 3); } };
    } };

  S.mdm = { alt: "Three 3D bars for problems, data and risk; a plane at the two-of-three level shows which E/M level the visit supports.", cam: [0, 2.4, 7.4], look: [0, 0.9, 0],
    steps: [["Score each element", "Problems, data and risk each get a level: straightforward, low, moderate, high."], ["Two of three", "Sort them: the middle bar is the MDM level. moderate / low / moderate → moderate."],
      ["The code", "Established patient, moderate MDM → 99214. New patient → 99204."], ["Or time", "Established 30 min meets 99214's 30 minutes: use whichever supports more."]],
    build(k) {
      const names = ["problems", "data", "risk"], lv = [3, 2, 3], cols = [C.cyan, C.violet, C.pink];
      const bars = names.map((n, i) => { const b = k.box(0.9, 1, 0.9, cols[i], { glow: 0.05 }); b.position.x = (i - 1) * 1.4; k.label(n, [(i - 1) * 1.4, -0.35, 0.5], "dim"); b.v = lv[i]; return b; });
      ["SF", "low", "mod", "high"].forEach((n, i) => k.label(n, [-2.6, (i + 1) * 0.55, 0], "dim"));
      const lvl = k.plane(4.6, 1.6, C.amber, { opacity: 0.22 }); lvl.rotation.x = -Math.PI / 2;
      const code = k.label("", [0, 2.9, 0], "big");
      const clock = k.torus(0.45, 0.07, C.green, { glow: 0.4 }); clock.position.set(2.6, 1.6, 0);
      let s = 0;
      k.tick((t) => { bars.forEach((b) => { const h = b.v * 0.55; b.scale.y = k.ease(b.scale.y, h, 0.08); b.position.y = b.scale.y / 2; }); lvl.position.y = k.ease(lvl.position.y, s >= 1 ? 3 * 0.55 : -5, 0.08); clock.rotation.z = -t; });
      return { onStep(i) { s = i; clock.visible = i === 3; code.set(["", "MDM: moderate", "99214 (new: 99204)", "30 min → 99214"][i]); } };
    } };

  S.settings = { alt: "A small 3D hospital campus: an office, an emergency department and a hospital ward, each labelled with its E/M code range.", cam: [0, 4.6, 9.4], look: [0, 1.1, 0], sway: 0.3,
    steps: [["Office", "99202–99215: new vs established, MDM or time."], ["Emergency department", "99281–99285: no new/established split, MDM only."],
      ["Hospital", "Inpatient and observation share 99221–99239 (initial, subsequent, discharge)."], ["Same-day extra", "A separate problem on the same day as another service needs modifier 25."]],
    build(k) {
      const b = [[-2.4, 1.2, C.cyan, "Office 99202–99215"], [0, 1.8, C.red, "ED 99281–99285"], [2.4, 2.6, C.violet, "Hospital 99221–99239"]].map(([x, h, c, n]) => {
        const m = k.rbox(1.6, h, 1.4, c, { opacity: 0.9 }); m.position.set(x, h / 2, 0); m.lab = k.label(n, [x, h + 0.35, 0]); return m; });
      k.box(7.6, 0.08, 3, C.slate, { opacity: 0.6 }).position.y = -0.04;
      const pin = k.cap(0.12, 0.3, C.white, { glow: 0.8 });
      const tag = k.label("+25", [-2.4, 2, 0.8], "big");
      let s = 0;
      k.tick((t) => { const x = [-2.4, 0, 2.4, -2.4][s]; pin.position.set(k.ease(pin.position.x, x, 0.1), [1.2, 1.8, 2.6, 1.2][s] + 0.9 + Math.sin(t * 3) * 0.1, 0.8); b.forEach((m, i) => pulse(m, t, i === [0, 1, 2, 0][s], 0, 0.35)); });
      return { onStep(i) { s = i; tag.vis(i === 3); } };
    } };

  S.skin = { alt: "A 3D block of skin layers with a lesion and its margins; an excision outline and stitches at two depths show simple and intermediate repairs.", cam: [0, 3.2, 6.6], look: [0, 0, 0], sway: 0.4,
    steps: [["Layers", "Epidermis, dermis, subcutaneous fat: depth decides the repair type."], ["Excised diameter", "Lesion 1.2 cm + 0.2 cm margin on each side = 1.6 cm."],
      ["Simple repair", "One layer, superficial: included in the excision code."], ["Intermediate", "Layered closure of deeper tissue: reported separately."]],
    build(k) {
      const L = [[0.25, C.tissue, "epidermis"], [0.6, 0xfda4af, "dermis"], [0.9, 0xfde68a, "subcutaneous"]];
      let y = 0;
      L.forEach(([h, c, n]) => { const m = k.box(4.2, h, 2.4, c, { opacity: 0.95 }); y -= h / 2; m.position.y = y; k.label(n, [-2.6, y, 1.2], "dim"); y -= h / 2; });
      const lesion = k.cyl(0.6, 0.6, 0.08, 0x7c2d12, {}); lesion.position.y = 0.03;
      const margin = k.ring(0.8, C.cyan, { glow: 0.6 }); margin.rotation.x = -Math.PI / 2; margin.position.y = 0.05;
      const ml = k.label("1.2 + 0.2 + 0.2 = 1.6 cm", [0, 0.8, 0], "big");
      const stitch = (yy, col) => Array.from({ length: 6 }, (_, i) => { const m = k.torus(0.12, 0.025, col, { glow: 0.5 }); m.position.set(-0.75 + i * 0.3, yy, 0); return m; });
      const s1 = stitch(0.02, C.cyan), s2 = stitch(-0.55, C.violet);
      return { onStep(i) { lesion.visible = i <= 1; margin.visible = i === 1; ml.vis(i === 1); s1.forEach((m) => (m.visible = i >= 2)); s2.forEach((m) => (m.visible = i === 3)); } };
    } };

  S.colon = { alt: "A 3D large intestine with an endoscope travelling from the rectum to the cecum and a polyp being removed.", cam: [0, 1.2, 7.6], look: [0, 0.3, 0], sway: 0.5,
    steps: [["Scope in", "Colonoscopy codes depend on how far the scope reaches: all the way to the cecum."], ["Polyp", "A biopsy or polyp removal is a surgical endoscopy..."],
      ["Included", "...and it INCLUDES the diagnostic look: report only the surgical code."], ["Fracture care", "Same idea in bones: closed vs open TREATMENT describes what the surgeon did, and the first cast is included."]],
    build(k) {
      const pts = [[-0.3, -1.6, 0], [-0.4, -0.8, 0], [-1.6, -0.6, 0], [-2, 0.6, 0], [-1.3, 1.6, 0], [0.4, 1.7, 0], [1.8, 1.4, 0], [2, 0.2, 0], [1.6, -0.9, 0]];
      const colon = k.tube(pts, 0.32, 0xf9a8d4, { opacity: 0.45 });
      const cecum = k.label("cecum", [1.7, -1.2, 0]); k.label("rectum", [-0.3, -2, 0], "dim");
      const tip = k.sph(0.16, C.cyan, { glow: 0.9 });
      const polyp = k.sph(0.13, C.red, {}); polyp.position.copy(colon.curve.getPointAt(0.62)).add(new k.T.Vector3(0, 0.2, 0.2));
      const ok = k.label("diagnostic ✓ included", [0, 0.3, 0], "big");
      let s = 0, u = 0;
      k.tick((t) => { u = Math.min(s === 0 ? 1 : 0.62, u + 0.004); if (s === 0 && u >= 1) u = 0; tip.position.copy(colon.curve.getPointAt(Math.min(u, 1))); polyp.visible = s === 1; pulse(tip, t, true, 0.5, 0.5); });
      return { onStep(i) { s = i; u = i === 0 ? 0 : u; ok.vis(i === 2); cecum.vis(i !== 3); } };
    } };

  S.units = { alt: "Stacks of 3D unit blocks for anaesthesia (base, time and modifying units) and an X-ray split into professional and technical components.", cam: [0, 2.8, 8.6], look: [0, 1.5, 0],
    steps: [["Base units", "Each anaesthesia code has base units (e.g. 5)."], ["Time units", "60 minutes ÷ 15 = 4 units on top."], ["× conversion factor", "9 units × $20.4976 (CY2026) ≈ $184.48."],
      ["26 + TC", "Radiology: the reading (26) + the machine and staff (TC) = global."]],
    build(k) {
      const blocks = [];
      for (let i = 0; i < 9; i++) { const b = k.rbox(0.8, 0.32, 0.8, i < 5 ? C.cyan : C.violet, { glow: 0.05 }); b.position.set(-1.5, 0.16 + i * 0.36, 0); b.i = i; blocks.push(b); }
      const coin = k.cyl(0.5, 0.5, 0.12, C.amber, { metal: 0.6, rough: 0.3 }); coin.position.set(0.2, 1.2, 0); coin.rotation.x = Math.PI / 2; const lc = k.label("$184.48", [0.2, 2, 0], "big");
      const film = k.box(1.6, 1.9, 0.06, 0x0f172a, {}); film.position.set(2.2, 1.2, 0);
      const ribs = Array.from({ length: 5 }, (_, i) => { const r = k.torus(0.45 - Math.abs(i - 2) * 0.05, 0.03, C.white, { glow: 0.3 }); r.scale.y = 0.4; r.position.set(2.2, 1.7 - i * 0.25, 0.05); return r; });
      const l26 = k.label("26 · reading", [1.8, 2.45, 0]), ltc = k.label("TC · machine", [2.7, 0, 0]);
      let s = 0;
      k.tick((t) => { blocks.forEach((b) => { b.visible = (s === 0 && b.i < 5) || (s >= 1 && s <= 2); }); coin.visible = s === 2; coin.rotation.z = t * 2; });
      return { onStep(i) { s = i; lc.vis(i === 2); [film, ...ribs].forEach((m) => (m.visible = i === 3)); l26.vis(i === 3); ltc.vis(i === 3); } };
    } };

  S.mods = { alt: "Two 3D knees tagged RT and LT for a bilateral procedure, and vials stacking up as HCPCS drug units.", cam: [0, 2, 7.4], look: [0, 0.8, 0],
    steps: [["RT / LT", "Side modifiers tell the payer which side."], ["50 bilateral", "Same procedure both sides, same session: modifier 50 (or RT + LT by payer)."],
      ["Drug units", "J3420 'up to 1000 mcg': 1000 mcg given = 1 unit."], ["Per 10 mg", "25 mg of a 'per 10 mg' drug = 3 units (round up)."]],
    build(k) {
      const knees = [-1.4, -0.3].map((x, i) => { const g = k.group(); g.position.x = x;
        const th = k.cap(0.22, 1, C.skin, {}, g); th.position.y = 1.5; const sh = k.cap(0.19, 1, C.skin, {}, g); sh.position.y = 0.4;
        const kn = k.sph(0.27, C.bone, {}, g); kn.position.y = 0.95; g.kn = kn; g.lab = k.label(i ? "LT" : "RT", [x, 1.05, 0.4], "big"); return g; });
      const fifty = k.label("modifier 50", [-0.85, 2.4, 0], "big");
      const vials = Array.from({ length: 3 }, (_, i) => { const v = k.cyl(0.22, 0.22, 0.6, C.cyan, { opacity: 0.85 }); v.position.set(1.4 + i * 0.55, 0.3, 0); v.i = i; return v; });
      const ul = k.label("", [2, 1.1, 0], "big");
      let s = 0;
      k.tick((t) => { knees.forEach((g) => pulse(g.kn, t, s <= 1, 0, 0.5)); vials.forEach((v) => { v.visible = (s === 2 && v.i === 0) || s === 3; v.position.y = k.ease(v.position.y, 0.3 + (s >= 2 ? Math.sin(t * 2 + v.i) * 0.05 : 0), 0.2); }); });
      return { onStep(i) { s = i; fifty.vis(i === 1); knees.forEach((g) => g.lab.vis(i === 0)); ul.set(i === 2 ? "J3420 × 1" : i === 3 ? "25 ÷ 10 → 3 units" : ""); } };
    } };

  S.ncci = { alt: "Two 3D code blocks, column 1 and column 2, held apart by a padlock when an edit forbids them together, or a key when a modifier is allowed.", cam: [0, 2, 7.4], look: [0, 0.6, 0],
    steps: [["Column 1 + 2", "An NCCI edit pairs a comprehensive code with a component code."], ["Indicator 0", "Locked: no modifier can ever unbundle them."],
      ["Indicator 1", "A modifier (59, XS…) can unlock it IF the note proves a separate service."], ["ABN", "Medicare may not cover it? The patient signs an ABN first → modifier GA."]],
    build(k) {
      const c1 = k.rbox(1.6, 1, 0.6, C.cyan, {}); c1.position.set(-1.2, 0.7, 0); k.label("column 1", [-1.2, 1.5, 0]);
      const c2 = k.rbox(1.6, 1, 0.6, C.violet, {}); c2.position.set(1.2, 0.7, 0); k.label("column 2", [1.2, 1.5, 0]);
      const lockG = k.group(); lockG.position.set(0, 0.6, 0.2);
      k.rbox(0.6, 0.5, 0.25, C.red, { glow: 0.3 }, lockG); const sh = k.torus(0.2, 0.05, C.red, {}, lockG, Math.PI); sh.position.y = 0.25;
      const keyG = k.group(); keyG.position.set(0, 0.6, 0.3);
      k.torus(0.16, 0.05, C.amber, { metal: 0.5 }, keyG).position.x = -0.35; k.box(0.55, 0.07, 0.07, C.amber, { metal: 0.5 }, keyG).position.x = 0.02;
      const doc = k.rbox(1.1, 1.4, 0.06, C.white, {}); doc.position.set(2.8, 0.8, 0); const ld = k.label("ABN signed → GA", [2.8, 1.8, 0], "big");
      const lab = k.label("", [0, 2.2, 0], "big");
      let s = 0;
      k.tick((t) => { keyG.rotation.z = Math.sin(t * 2) * 0.3; c2.position.x = k.ease(c2.position.x, s === 2 ? 0.9 : 1.2, 0.1); });
      return { onStep(i) { s = i; lockG.visible = i === 1; keyG.visible = i === 2; doc.visible = i === 3; ld.vis(i === 3); lab.set(["", "indicator 0: locked", "indicator 1: modifier allowed", ""][i]); } };
    } };

  S.claim = { alt: "A 3D CMS-1500 claim form with diagnosis tiles A to C above three service lines, joined by glowing pointer beams.", cam: [0, 4.4, 6.2], look: [0, 0, 0.3], sway: 0.15,
    steps: [["Item 21", "Up to 12 diagnoses, lettered A–L."], ["Line 1", "Office visit points to A (E11.9) and B (I10)."], ["Line 2", "Glucose test points to A: diabetes justifies it."],
      ["Line 3", "Flu vaccine points to C (Z23), not to the diabetes."]],
    build(k) {
      const form = k.box(5.4, 0.08, 4, C.white, { opacity: 0.9 }); form.position.set(0, -0.04, 0.3);
      const dx = ["A E11.9", "B I10", "C Z23"].map((n, i) => { const m = k.rbox(1.3, 0.12, 0.45, C.cyan, { glow: 0.1 }); m.position.set((i - 1) * 1.5, 0.1, -1.1); k.label(n, [(i - 1) * 1.5, 0.45, -1.1]); return m; });
      const lines = ["visit", "glucose test", "flu vaccine"].map((n, i) => { const m = k.box(3.2, 0.1, 0.42, C.violet, { opacity: 0.85 }); m.position.set(0.7, 0.05, 0.3 + i * 0.75); k.label(n, [-1.7, 0.15, 0.3 + i * 0.75], "dim"); return m; });
      const ptr = [[0, 1], [0], [2]];
      const beams = [];
      ptr.forEach((ds, li) => ds.forEach((d) => { const b = k.tube([[(d - 1) * 1.5, 0.15, -0.9], [((d - 1) * 1.5 + 0.7) / 2, 0.9, -0.3 + li * 0.35], [0.7, 0.12, 0.3 + li * 0.75]], 0.035, C.amber, { glow: 0.8 }); b.li = li; beams.push(b); }));
      return { onStep(i) { beams.forEach((b) => (b.visible = i > 0 && b.li === i - 1)); dx.forEach((m, j) => hl(m, i === 0 || (i > 0 && ptr[i - 1].includes(j)), C.cyan)); lines.forEach((m, j) => hl(m, i === j + 1, C.violet)); } };
    } };

  S.rvu = { alt: "Three 3D cylinders for work, practice expense and malpractice RVUs that merge and turn into a stack of coins: the Medicare fee.", cam: [0, 2.4, 7.4], look: [0, 0.8, 0],
    steps: [["RVUs", "Work 1.30, practice expense 1.20, malpractice 0.10."], ["× GPCI", "Each is adjusted for the location (here all 1.0)."], ["× CF", "2.60 × $33.4009 (CY2026 non-APM) = $86.84."],
      ["Who pays", "Medicare Part B pays doctors; the patient owes coinsurance (usually 20%) after the deductible."]],
    build(k) {
      const v = [[1.3, C.cyan, "work"], [1.2, C.violet, "PE"], [0.1, C.pink, "MP"]];
      const cy = v.map(([h, c, n], i) => { const m = k.cyl(0.4, 0.4, 1, c, {}); m.h = h; m.x0 = (i - 1) * 1.1; m.lab = k.label(n + " " + h.toFixed(2), [m.x0, -0.3, 0.5], "dim"); return m; });
      const coins = Array.from({ length: 8 }, (_, i) => { const c = k.cyl(0.45, 0.45, 0.1, C.amber, { metal: 0.6, rough: 0.3 }); c.position.set(2.6, 0.06 + i * 0.12, 0); c.i = i; return c; });
      const fee = k.label("$86.84", [2.6, 1.4, 0], "big");
      const split = k.label("80% Medicare · 20% patient", [2.6, 1.9, 0]);
      let s = 0;
      k.tick((t) => {
        let stack = 0;
        cy.forEach((m) => { const merged = s >= 2; m.scale.y = k.ease(m.scale.y, m.h * 1.2, 0.1); m.position.x = k.ease(m.position.x, merged ? 0 : m.x0, 0.08);
          m.position.y = k.ease(m.position.y, merged ? stack + m.h * 0.6 : m.h * 0.6, 0.08); stack += m.h * 1.2; pulse(m, t, s === 1, 0, 0.4); m.lab.vis(!merged); });
        coins.forEach((c) => (c.visible = s >= 2));
      });
      return { onStep(i) { s = i; fee.vis(i >= 2); split.vis(i === 3); } };
    } };

  S.denial = { alt: "A 3D claim cube travels toward the payer and splits into paid, denied or rejected paths, with a five-step staircase for Medicare appeals.", cam: [0, 3, 8], look: [0, 0.6, 0],
    steps: [["Rejected", "Never entered the payer's system (format error): fix and resend."], ["Denied CO-97", "Processed but bundled into another service."], ["Denied CO-50", "Diagnosis doesn't support medical necessity."],
      ["Appeal", "Medicare's 5 levels: redetermination (120 days) → reconsideration → ALJ → Council → federal court."]],
    build(k) {
      const cube = k.rbox(0.5, 0.5, 0.5, C.white, { glow: 0.3 });
      const payer = k.rbox(1.2, 1.2, 1.2, C.pink, {}); payer.position.set(0.6, 0.6, 0); k.label("payer", [0.6, 1.5, 0]);
      const wall = k.box(0.1, 1.2, 1.4, C.red, { opacity: 0.5 }); wall.position.set(-1.2, 0.6, 0);
      const stairs = Array.from({ length: 5 }, (_, i) => { const st = k.box(0.7, 0.3 + i * 0.3, 0.9, C.violet, { opacity: 0.85 }); st.position.set(1.7 + i * 0.72, (0.3 + i * 0.3) / 2, 0); st.i = i; return st; });
      const lab = k.label("", [0, 2.4, 0], "big");
      let s = 0;
      k.tick((t) => {
        const u = (t * 0.3) % 1;
        if (s === 0) cube.position.set(-3 + Math.min(u, 0.55) * 3.3, 0.35, 0);
        else if (s === 3) { const st = Math.floor(u * 5); cube.position.set(1.7 + st * 0.72, 0.6 + st * 0.3, 0); }
        else cube.position.set(-3 + u * 3.6, 0.35, 0);
        cube.material.color.setHex(s === 0 ? C.red : s === 3 ? C.green : C.amber);
      });
      return { onStep(i) { s = i; wall.visible = i === 0; stairs.forEach((st) => (st.visible = i === 3)); lab.set(["rejected", "CO-97 bundled", "CO-50 medical necessity", "appeal: 5 levels"][i]); } };
    } };

  S.pcs = { alt: "Seven 3D slots of an ICD-10-PCS code, 0DTJ4ZZ, each lighting up with its meaning: section, body system, root operation, body part, approach, device, qualifier.", cam: [0, 1.6, 8], look: [0, 0.3, 0], sway: 0.25,
    steps: [["Section 0", "Medical and Surgical."], ["D · T", "Gastrointestinal system · root operation Resection (remove ALL)."], ["J · 4", "Body part appendix · approach percutaneous endoscopic (laparoscopic)."],
      ["Z · Z", "No device, no qualifier: 0DTJ4ZZ = laparoscopic appendectomy."]],
    build(k) {
      const chars = "0DTJ4ZZ".split(""), names = ["section", "system", "operation", "body part", "approach", "device", "qualifier"], grp = [0, 1, 1, 2, 2, 3, 3];
      const slots = chars.map((ch, i) => { const m = k.rbox(0.8, 1, 0.4, [C.slate, C.cyan, C.violet, C.amber][grp[i]], { glow: 0.05 }); m.position.set((i - 3) * 0.95, 0.4, 0); m.g = grp[i]; k.label(ch, m, "big"); m.n = k.label(names[i], [(i - 3) * 0.95, -0.45, 0.2], "dim"); return m; });
      let s = 0;
      k.tick((t) => slots.forEach((m) => { m.position.y = k.ease(m.position.y, m.g === s ? 0.75 : 0.4, 0.1); pulse(m, t, m.g === s, 0.05, 0.5); m.n.vis(m.g === s); }));
      return { onStep(i) { s = i; } };
    } };

  S.ai = { alt: "A 3D note page feeds a glowing AI core that suggests code tiles; a human reviewer's shield turns wrong tiles red and keeps the correct ones.", cam: [0, 2.2, 7.8], look: [0, 0.6, 0],
    steps: [["AI suggests", "Software reads the note and proposes E11.9, N18.30, I10."], ["Coder reviews", "The 'with' links are missed: diabetes + CKD and hypertension + CKD are presumed linked."],
      ["Corrected", "E11.22, I12.9, N18.30: the coder is responsible for every code."], ["Privacy", "Never paste PHI into a public chatbot: approved tools only."]],
    build(k) {
      const note = k.rbox(1.2, 1.6, 0.06, C.white, {}); note.position.set(-2.6, 0.9, 0);
      const core = new k.T.Mesh(new k.T.IcosahedronGeometry(0.55, 1), k.mat(C.cyan, { glow: 0.7, rough: 0.2 })); core.position.set(-0.7, 0.9, 0); k.root.add(core);
      const sets = [["E11.9", "N18.30", "I10"], ["E11.9", "N18.30", "I10"], ["E11.22", "I12.9", "N18.30"]];
      const ok = [[1, 1, 1], [0, 1, 0], [1, 1, 1]];
      const tiles = [0, 1, 2].map((i) => { const m = k.rbox(1, 0.42, 0.14, C.violet, { glow: 0.2 }); m.position.set(1.4, 1.5 - i * 0.6, 0); m.lab = k.label("", m); return m; });
      const shield = k.cyl(0.6, 0.6, 0.08, C.green, { opacity: 0.5 }); shield.rotation.x = Math.PI / 2; shield.position.set(2.8, 0.9, 0); const ls = k.label("coder", [2.8, 1.7, 0]);
      const lock = k.label("PHI 🔒 approved tools only", [-2.6, 2.0, 0], "warn");
      let s = 0;
      k.tick((t) => { core.rotation.y = t; core.rotation.x = t * 0.6; tiles.forEach((m, i) => { m.lab.set(sets[Math.min(s, 2)][i]); m.material.color.setHex(s === 1 && !ok[1][i] ? C.red : s === 2 ? C.green : C.violet); m.position.x = 1.4 + Math.sin(t * 2 + i) * 0.05; }); });
      return { onStep(i) { s = i; shield.visible = i === 1 || i === 2; ls.vis(i === 1 || i === 2); lock.vis(i === 3); tiles.forEach((m) => (m.visible = i < 3)); } };
    } };

  S.exam = { alt: "A 3D clock beside a grid of 100 question tiles; 70 turn green to show the CPC pass mark.", cam: [0, 3.4, 7.6], look: [0, 0.4, 0], sway: 0.2,
    steps: [["100 questions", "The real CPC: 100 multiple-choice questions, open code book."], ["4 hours", "About 2.4 minutes a question: mark slow ones, come back later."],
      ["70% to pass", "70 correct. This mock: 18 of 25."], ["After the mock", "Every wrong answer points to a lesson: redo its practice, then retake."]],
    build(k) {
      const tiles = [];
      for (let i = 0; i < 100; i++) { const m = k.box(0.22, 0.08, 0.22, C.slate, {}); m.position.set(-1.2 + (i % 10) * 0.27, 0, -1.2 + Math.floor(i / 10) * 0.27); m.i = i; tiles.push(m); }
      const face = k.cyl(0.8, 0.8, 0.12, C.white, {}); face.rotation.x = Math.PI / 2; face.position.set(2.4, 1.2, 0);
      const hand = k.box(0.05, 0.6, 0.05, C.ink, {}); hand.position.set(2.4, 1.2, 0.08); hand.geometry.translate(0, 0.3, 0);
      const lab = k.label("", [0.1, 1.1, 0], "big");
      let s = 0, filled = 0;
      k.tick((t) => { hand.rotation.z = -t * (s === 1 ? 1.5 : 0.3); filled = k.ease(filled, s >= 2 ? 70 : s === 0 ? 100 : 0, 0.04);
        tiles.forEach((m) => { m.material.color.setHex(s === 0 ? C.cyan : m.i < filled ? C.green : C.slate); m.position.y = s >= 2 && m.i < filled ? 0.06 : 0; }); });
      return { onStep(i) { s = i; lab.set(["100 questions", "4 hours", "70 / 100", "review → retake"][i]); } };
    } };

  // one scene per lesson (mc01 … mc28)
  const LESSON = ["cycle", "words", "planes", "heart", "kidney", "tumour", "soap", "codeparts", "books", "funnel", "htn", "neotable", "fracture", "pregnancy",
    "cptbook", "mdm", "settings", "skin", "colon", "units", "mods", "ncci", "claim", "rvu", "denial", "pcs", "ai", "exam"];
  Object.entries(S).forEach(([name, scene]) => { W["s3d-" + name] = (host) => stage3d(host, scene); });
  V.S3D_LESSON = LESSON;
})();
