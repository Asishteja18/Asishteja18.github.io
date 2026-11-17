/* AIM interactive tools — Biological path (Medical Coding).
   Same contract as the other viz files: (host) => void on AIMViz.W. Mostly DOM (not canvas)
   so screen readers and keyboards work. ICD-10-CM data: content/icd10cm.json (FY2026, public). */
(function () {
  "use strict";
  const V = window.AIMViz;
  const W = V.W;
  const E = V.el;
  const VER = ((document.currentScript && document.currentScript.src) || "").split("v=")[1] || "1";
  const box = (host, cls) => { const b = E("div", "biobox " + (cls || "")); host.append(b); return b; };
  const hint = (host, t) => host.append(E("p", "vizhint", t));
  const chip = (txt, cls) => E("span", "biochip " + (cls || ""), txt);
  const btn = (host, label, on, pressed) => {
    const b = E("button", "btn ghost sm vizbtn" + (pressed ? " on" : ""), label);
    b.type = "button"; b.onclick = on; if (pressed != null) b.setAttribute("aria-pressed", pressed ? "true" : "false");
    host.append(b); return b;
  };

  /* ---------- shared ICD-10-CM data (loaded once, only when a tool needs it) */
  let ICD = null;
  const loadICD = () => ICD || (ICD = fetch("content/icd10cm.json?v=" + VER)
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((d) => {
      d.map = new Map(d.codes);
      d.lower = d.codes.map(([c, t]) => (c + " " + t).toLowerCase());
      return d;
    }));
  const lastInput = { el: null };
  document.addEventListener("focusin", (e) => { if (e.target.classList && e.target.classList.contains("qin")) lastInput.el = e.target; });

  /* ================================================ ICD-10-CM lookup (all lessons 8–14) */
  W.icdlookup = (host) => {
    const ctl = V.controls(host);
    const lab = E("label", "vizsl biosearch");
    lab.append(E("span", "vizsl-l", "Search"));
    const q = E("input", "vizin"); q.type = "search"; q.placeholder = "e.g. 'diabetes kidney' or 'S52.5'";
    q.setAttribute("aria-label", "Search ICD-10-CM codes by word or code");
    lab.append(q); ctl.append(lab);
    const info = E("p", "vizhint", "Loading the FY2026 code set…");
    const list = E("ul", "lkres"); list.setAttribute("aria-live", "polite");
    host.append(info, list);
    let data = null;
    const run = () => {
      if (!data) return;
      const s = q.value.trim().toLowerCase();
      list.innerHTML = "";
      if (s.length < 2) { info.textContent = data.codes.length.toLocaleString() + " billable codes · " + data.version + ". Type 2+ characters."; return; }
      const words = s.split(/\s+/);
      const code = /^[a-z]\d/.test(s) ? s.toUpperCase().replace(/\s/g, "") : null;
      const out = [];
      for (let i = 0; i < data.codes.length && out.length < 40; i++) {
        const [c] = data.codes[i];
        if (code ? c.startsWith(code) || c.replace(".", "").startsWith(code.replace(".", "")) : words.every((w) => data.lower[i].includes(w))) out.push(data.codes[i]);
      }
      info.textContent = out.length ? (out.length === 40 ? "First 40 matches. " : out.length + " match" + (out.length > 1 ? "es. " : ". ")) +
        "Billable codes only: always confirm the notes in your Tabular List." : "No billable code matches. Try the condition's main term.";
      out.forEach(([c, t]) => {
        const li = E("li");
        const b = E("button", "lkcode", c); b.type = "button";
        b.title = "Copy " + c + (lastInput.el ? " into your answer" : "");
        b.onclick = () => {
          if (lastInput.el && document.body.contains(lastInput.el)) {
            const v = lastInput.el.value.trim();
            lastInput.el.value = v ? v.replace(/[,\s]*$/, "") + ", " + c : c;
            lastInput.el.dispatchEvent(new Event("input"));
            b.textContent = "Added ✓"; setTimeout(() => (b.textContent = c), 900);
          } else if (navigator.clipboard) { navigator.clipboard.writeText(c).catch(() => {}); b.textContent = "Copied ✓"; setTimeout(() => (b.textContent = c), 900); }
        };
        li.append(b, E("span", null, t));
        list.append(li);
      });
    };
    let t = null;
    q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 120); });
    loadICD().then((d) => { data = d; run(); }).catch(() => { info.textContent = "The code set didn't load. Check your connection and reload."; });
    hint(host, "Tip: click a code to add it to the last answer box you typed in.");
  };

  /* ================================================ code dissector (lesson 8) */
  const CHAPTERS = [["A", "B", "Infectious and parasitic"], ["C", "C", "Neoplasms"], ["D", "D", "Neoplasms (D00–D49) / blood (D50–D89)"],
    ["E", "E", "Endocrine, nutritional, metabolic"], ["F", "F", "Mental and behavioural"], ["G", "G", "Nervous system"],
    ["H", "H", "Eye (H00–H59) / ear (H60–H95)"], ["I", "I", "Circulatory"], ["J", "J", "Respiratory"], ["K", "K", "Digestive"],
    ["L", "L", "Skin"], ["M", "M", "Musculoskeletal"], ["N", "N", "Genitourinary"], ["O", "O", "Pregnancy and childbirth"],
    ["P", "P", "Perinatal (newborn)"], ["Q", "Q", "Congenital"], ["R", "R", "Symptoms and abnormal findings"],
    ["S", "T", "Injury and poisoning"], ["U", "U", "Special purposes (e.g. COVID-19)"], ["V", "Y", "External causes"], ["Z", "Z", "Factors influencing health status"]];
  const SEVENTH = { A: "initial encounter (active treatment)", B: "initial encounter, open fracture", C: "initial encounter, open fracture (other types)",
    D: "subsequent encounter, routine healing", E: "subsequent, open fracture, routine healing", G: "subsequent, delayed healing",
    K: "subsequent, nonunion", P: "subsequent, malunion", S: "sequela" };
  W.icdparts = (host) => {
    const ctl = V.controls(host);
    const lab = E("label", "vizsl"); lab.append(E("span", "vizsl-l", "Code"));
    const inp = E("input", "vizin"); inp.value = "S52.501A"; inp.maxLength = 8; inp.setAttribute("aria-label", "ICD-10-CM code to explain");
    lab.append(inp); ctl.append(lab);
    ["S52.501A", "E11.22", "T39.1X1A", "W19.XXXA", "I10", "E11.6"].forEach((c) => btn(ctl, c, () => { inp.value = c; draw(); }));
    const strip = E("div", "vizstrip biostrip"); host.append(strip);
    const read = V.readout(host);
    let data = null;
    const draw = () => {
      let c = inp.value.trim().toUpperCase().replace(/\s/g, "");
      if (c.length > 3 && !c.includes(".")) c = c.slice(0, 3) + "." + c.slice(3);
      const chars = c.replace(".", "").split("");
      strip.innerHTML = "";
      const role = (i, ch) => i === 0 ? "chapter letter" : i < 3 ? "category" : ch === "X" ? "placeholder" : i === 6 ? "7th: extension" : i === 3 ? "4th: detail" : i === 4 ? "5th: detail" : "6th: detail / side";
      chars.forEach((ch, i) => {
        const cell = E("div", "vizcell biocell " + (i < 3 ? "cat" : ch === "X" ? "ph" : i === 6 ? "ext" : "det"));
        cell.append(E("b", null, ch), E("small", null, role(i, ch)));
        strip.append(cell);
        if (i === 2 && chars.length > 3) strip.append(E("div", "biodot", "."));
      });
      const ltr = c[0] || "";
      const chap = CHAPTERS.find(([a, b]) => ltr >= a && ltr <= b);
      const rows = [["chapter", chap ? chap[2] : "—"]];
      if (chars.length === 7 && SEVENTH[chars[6]] && /[ST]/.test(ltr)) rows.push(["7th character " + chars[6], SEVENTH[chars[6]]]);
      if (data) {
        const d = data.map.get(c);
        if (d) rows.push(["FY2026", "billable ✓ — " + d, "hi"]);
        else {
          const kids = data.codes.filter(([k]) => k.startsWith(c) && k !== c).length;
          rows.push(["FY2026", kids ? "not billable: a header with " + kids + " codes below it. Keep going to the most specific code." : "not a valid ICD-10-CM FY2026 code", "hi"]);
        }
      } else rows.push(["FY2026", "checking…"]);
      V.say(read, rows);
    };
    inp.addEventListener("input", draw);
    loadICD().then((d) => { data = d; draw(); }).catch(() => {});
    draw();
  };

  /* ================================================ word builder (lesson 2) */
  const PRE = [["", "—"], ["hyper", "above normal"], ["hypo", "below normal"], ["brady", "slow"], ["tachy", "fast"], ["peri", "around"], ["endo", "within"], ["a", "without"], ["dys", "painful / bad"], ["poly", "many"]];
  const ROOT = [["card", "heart"], ["hepat", "liver"], ["nephr", "kidney"], ["gastr", "stomach"], ["arthr", "joint"], ["oste", "bone"], ["neur", "nerve"], ["derm", "skin"], ["hyster", "uterus"], ["col", "colon"], ["glyc", "sugar"], ["append", "appendix"]];
  const SUF = [["itis", "inflammation of"], ["ectomy", "surgical removal of"], ["otomy", "cutting into"], ["ostomy", "making an opening into"], ["scopy", "looking inside with a scope:"], ["algia", "pain in"], ["megaly", "enlargement of"], ["ia", "condition of"], ["emia", "blood condition:"], ["plasty", "surgical repair of"]];
  const REAL = new Set(["carditis", "pericarditis", "endocarditis", "hepatitis", "hepatomegaly", "nephritis", "nephrectomy", "gastritis", "gastrectomy", "gastroscopy",
    "arthritis", "arthroscopy", "arthroplasty", "arthralgia", "osteitis", "neuritis", "neuralgia", "polyneuritis", "dermatitis", "hysterectomy", "colitis", "colectomy",
    "colostomy", "colotomy", "colonoscopy", "hyperglycemia", "hypoglycemia", "bradycardia", "tachycardia", "appendicitis", "appendectomy", "cardiomegaly", "polyarthritis", "endoscopy"]);
  W.terms = (host) => {
    const ctl = V.controls(host);
    let p = 0, r = 0, s = 0;
    const out = box(host, "termout");
    const read = V.readout(host);
    const join = () => {
      const pre = PRE[p][0], root = ROOT[r][0] === "col" && SUF[s][0] === "scopy" ? "colon" : ROOT[r][0], suf = SUF[s][0];
      const cv = /^[aeiou]/.test(suf) ? "" : "o";
      let word = pre + root + cv + suf;
      if (root === "card" && (suf === "ia")) word = pre + "cardia";
      if (root === "glyc" && suf === "emia") word = pre + "glycemia";
      return { word, cv };
    };
    const draw = () => {
      const { word, cv } = join();
      out.innerHTML = "";
      const parts = [[PRE[p][0], "pre"], [ROOT[r][0], "root"], [cv, "cv"], [SUF[s][0], "suf"]].filter(([t]) => t);
      parts.forEach(([t, c]) => out.append(chip(t, c)));
      out.append(E("span", "termeq", "= " + word));
      const meaning = (PRE[p][0] ? PRE[p][1] + " " : "") + SUF[s][1] + " the " + ROOT[r][1];
      V.say(read, [["meaning", meaning], ["in real charts?", REAL.has(word) ? "yes ✓ a real term" : "rare or not used — but you can still read it", REAL.has(word) ? "hi" : ""]]);
    };
    V.select(ctl, "prefix", PRE.map(([a, b], i) => [String(i), a ? a + "- (" + b + ")" : "none"]), "0", (v) => { p = +v; draw(); });
    V.select(ctl, "root", ROOT.map(([a, b], i) => [String(i), a + " (" + b + ")"]), "0", (v) => { r = +v; draw(); });
    V.select(ctl, "suffix", SUF.map(([a, b], i) => [String(i), "-" + a + " (" + b.replace(/ of$|:$/, "") + ")"]), "0", (v) => { s = +v; draw(); });
    draw();
  };

  /* ================================================ directions + laterality (lesson 3) */
  const REGIONS = [
    ["Head", "superior; cranial", "Laceration of scalp: no laterality, but eye and ear codes always need right / left / bilateral."],
    ["Chest", "anterior thorax; the heart is medial and slightly left", "Rib fractures are coded by side: right, left, bilateral."],
    ["Right arm", "lateral; the hand is distal to the elbow", "Fracture of the RIGHT radius = 6th character 1 (S52.501A)."],
    ["Left arm", "lateral; the shoulder is proximal to the elbow", "Fracture of the LEFT radius = 6th character 2 (S52.502A)."],
    ["Abdomen", "four quadrants: RUQ, LUQ, RLQ, LLQ", "RLQ pain = R10.31; the appendix lives here."],
    ["Right leg", "lateral; the knee is proximal to the ankle", "Osteoarthritis of the RIGHT knee = M17.11."],
    ["Left leg", "the ankle is distal to the knee", "Sprain of the LEFT ankle = S93.402A."],
    ["Back", "posterior; dorsal", "Low back pain = M54.50 (no side)."],
  ];
  W.planes = (host) => {
    const ctl = V.controls(host);
    const fig = E("pre", "biofig");
    fig.textContent = "      you are FACING the patient\n\n             ( o )\n      R  ─────┼─────  L      ← patient's RIGHT is on YOUR left\n             /|\\\n            / | \\\n             / \\\n            /   \\\n         R leg  L leg";
    host.append(fig);
    const read = V.readout(host);
    REGIONS.forEach(([name, dir, code], i) => btn(ctl, name, (e) => {
      ctl.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
      e.currentTarget.setAttribute("aria-pressed", "true");
      V.say(read, [["region", name], ["directional words", dir], ["coding example", code, "hi"]]);
    }, i === 0));
    V.say(read, [["region", REGIONS[0][0]], ["directional words", REGIONS[0][1]], ["coding example", REGIONS[0][2], "hi"]]);
  };

  /* ================================================ body systems (lessons 4–5) */
  const SYSTEMS = [
    ["Integumentary", "skin (epidermis, dermis, subcutaneous), hair, nails, breast", "L00–L99", "10030–19499", "cellulitis, dermatitis, burns, lacerations"],
    ["Musculoskeletal", "bones, joints, muscles, tendons, ligaments", "M00–M99", "20100–29999", "osteoarthritis, fractures (S codes), back pain"],
    ["Respiratory", "nose, sinuses, larynx, trachea, bronchi, lungs", "J00–J99", "30000–32999", "asthma, COPD, pneumonia, sinusitis"],
    ["Cardiovascular", "heart, valves, coronary arteries, veins", "I00–I99", "33016–37799", "hypertension, heart failure, MI, atrial fibrillation"],
    ["Hemic + lymphatic", "spleen, lymph nodes, bone marrow, blood cells", "D50–D89", "38100–38999", "anaemia, thrombocytopenia"],
    ["Digestive", "mouth → oesophagus → stomach → intestines; liver, gallbladder, pancreas", "K00–K95", "40490–49999", "GERD, appendicitis, cholecystitis, hernia"],
    ["Urinary", "kidneys, ureters, bladder, urethra", "N00–N39", "50010–53899", "CKD, UTI, kidney stones"],
    ["Male genital", "testes, prostate, penis", "N40–N53", "54000–55899", "benign prostatic hyperplasia"],
    ["Female + maternity", "ovaries, tubes, uterus, cervix; pregnancy", "N70–N98 · O00–O9A", "56405–59899", "endometriosis; pregnancy is chapter O"],
    ["Endocrine", "pituitary, thyroid, adrenals, pancreas islets", "E00–E89", "60000–60699", "diabetes, hypothyroidism"],
    ["Nervous", "brain, spinal cord, nerves", "G00–G99", "61000–64999", "migraine, epilepsy, neuropathy, stroke (I63)"],
    ["Eye", "globe, lens, retina, eyelids", "H00–H59", "65091–68899", "cataract, glaucoma"],
    ["Ear", "outer, middle and inner ear", "H60–H95", "69000–69979", "otitis media, hearing loss"],
  ];
  W.body = (host) => {
    const grid = E("div", "biogrid"); host.append(grid);
    const read = V.readout(host);
    const show = (i) => {
      const [n, st, icd, cpt, cond] = SYSTEMS[i];
      grid.querySelectorAll("button").forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      V.say(read, [["system", n], ["structures", st], ["ICD-10-CM", icd, "hi"], ["CPT surgery range", cpt, "hi"], ["you'll code", cond]]);
    };
    SYSTEMS.forEach(([n], i) => { const b = E("button", "biosys", n); b.type = "button"; b.onclick = () => show(i); grid.append(b); });
    show(3);
    hint(host, "CPT ranges are the subsection ranges to tab in your book; the code descriptions are in the CPT book itself.");
  };

  /* ================================================ HTN / diabetes / CKD helper (lesson 11) */
  W.htnckd = (host) => {
    const ctl = V.controls(host);
    const st = { htn: true, dm: false, hf: "", ckd: "N18.30", dial: false };
    const tog = (k, label) => {
      const l = E("label", "biochk"); const c = E("input"); c.type = "checkbox"; c.checked = !!st[k];
      c.onchange = () => { st[k] = c.checked; draw(); }; l.append(c, E("span", null, label)); ctl.append(l);
    };
    tog("htn", "Hypertension"); tog("dm", "Type 2 diabetes");
    V.select(ctl, "heart failure", [["", "none"], ["I50.9", "unspecified (I50.9)"], ["I50.22", "chronic systolic (I50.22)"], ["I50.32", "chronic diastolic (I50.32)"], ["I50.42", "chronic combined (I50.42)"]], "", (v) => { st.hf = v; draw(); });
    V.select(ctl, "CKD", [["", "none"], ["N18.1", "stage 1"], ["N18.2", "stage 2"], ["N18.30", "stage 3 unspecified"], ["N18.31", "stage 3a"], ["N18.32", "stage 3b"], ["N18.4", "stage 4"], ["N18.5", "stage 5"], ["N18.6", "ESRD"]], st.ckd, (v) => { st.ckd = v; draw(); });
    tog("dial", "On dialysis");
    const out = E("ol", "biocodes"); host.append(out);
    const read = V.readout(host);
    const draw = () => {
      const codes = [];
      const late = st.ckd === "N18.5" || st.ckd === "N18.6";
      if (st.dm) codes.push([st.ckd ? "E11.22" : "E11.9", st.ckd ? "diabetes WITH CKD is presumed linked" : "type 2 diabetes, no complications"]);
      if (st.htn) {
        if (st.hf && st.ckd) codes.push([late ? "I13.2" : "I13.0", "hypertension + heart failure + CKD → I13 (both links presumed)"]);
        else if (st.hf) codes.push(["I11.0", "hypertension + heart failure → I11.0 (link presumed)"]);
        else if (st.ckd) codes.push([late ? "I12.0" : "I12.9", "hypertension + CKD → I12 (link presumed)"]);
        else codes.push(["I10", "hypertension alone"]);
      }
      if (st.hf) codes.push([st.hf, "type of heart failure (use additional code)"]);
      if (st.ckd) codes.push([st.ckd, "CKD stage (use additional code)"]);
      if (st.dial && late) codes.push(["Z99.2", "dependence on dialysis"]);
      out.innerHTML = "";
      codes.forEach(([c, why]) => { const li = E("li"); li.append(E("code", null, c), E("span", null, " " + why)); out.append(li); });
      if (!codes.length) out.append(E("li", null, "Tick at least one condition."));
      V.say(read, [["codes", codes.map((c) => c[0]).join(", ") || "—", "hi"],
        ["sequencing", "first-listed = the condition chiefly responsible for the visit; combination codes always come before their 'use additional code' partners"]]);
      if (st.dial && !late) read.append(E("p", "vizhint", "Dialysis normally means stage 5 / ESRD: check the CKD stage documented."));
    };
    draw();
  };

  /* ================================================ 7th character timeline (lesson 13) */
  W.seventh = (host) => {
    const ctl = V.controls(host);
    const visits = [["ED: fracture set, cast on", "A", "initial encounter: active treatment"], ["Week 4: cast check", "D", "subsequent encounter"], ["1 year later: stiffness", "S", "sequela: code the stiffness first (M25.631), then S52.501S"]];
    const heal = { D: "routine healing", G: "delayed healing", K: "nonunion", P: "malunion" };
    let v = 0, h = "D";
    const line = E("div", "biotl"); host.append(line);
    const read = V.readout(host);
    const draw = () => {
      line.innerHTML = "";
      visits.forEach(([t, ch], i) => {
        const b = E("button", "biovisit" + (i === v ? " on" : ""), t); b.type = "button";
        b.setAttribute("aria-pressed", i === v ? "true" : "false");
        b.onclick = () => { v = i; draw(); }; line.append(b);
      });
      const ch = v === 1 ? h : visits[v][1];
      V.say(read, [["code", "S52.501" + ch, "hi"], ["7th character " + ch, v === 1 ? "subsequent encounter, " + heal[h] : visits[v][2]], ["same fracture", "lower end of the RIGHT radius, closed"]]);
    };
    V.select(ctl, "healing (week 4)", Object.entries(heal).map(([k, t]) => [k, k + ": " + t]), "D", (x) => { h = x; draw(); });
    draw();
  };

  /* ================================================ trimester (lesson 14) */
  W.trimester = (host) => {
    const ctl = V.controls(host);
    const bar = E("div", "biotri"); host.append(bar);
    const read = V.readout(host);
    const draw = (w) => {
      const tri = w < 14 ? 1 : w < 28 ? 2 : 3;
      bar.innerHTML = "";
      [["1st", 0, 14], ["2nd", 14, 28], ["3rd", 28, 43]].forEach(([n, a, b], i) => {
        const seg = E("div", "triseg" + (i + 1 === tri ? " on" : ""), n + " (" + a + "–" + (b === 43 ? "birth" : b) + " wk)");
        seg.style.flex = String(b - a); bar.append(seg);
      });
      const z = w < 8 ? "Z3A.01" : w > 42 ? "Z3A.49" : "Z3A." + String(w).padStart(2, "0");
      V.say(read, [["weeks", String(w)], ["trimester", ["first", "second", "third"][tri - 1], "hi"], ["weeks code", z, "hi"],
        ["example O code", "O10.01" + tri + " pre-existing essential hypertension complicating pregnancy"]]);
    };
    V.slider(ctl, "weeks of gestation", 4, 43, 1, 24, (x) => (x > 42 ? "42+" : String(x)), draw);
    draw(24);
  };

  /* ================================================ CPT map (lesson 15) */
  const CPT = [["E/M", "99202–99499", ""], ["Anesthesia", "00100–01999", ""], ["Surgery", "10004–69990", "surg"], ["Radiology", "70010–79999", ""], ["Path + Lab", "80047–89398", ""], ["Medicine", "90281–99199 · 99500–99607", ""]];
  const SURG = [["General", "10004–10021"], ["Integumentary", "10030–19499"], ["Musculoskeletal", "20100–29999"], ["Respiratory", "30000–32999"],
    ["Cardiovascular", "33016–37799"], ["Hemic/lymphatic", "38100–38999"], ["Mediastinum/diaphragm", "39000–39599"], ["Digestive", "40490–49999"],
    ["Urinary", "50010–53899"], ["Male genital", "54000–55899"], ["Female genital", "56405–58999"], ["Maternity", "59000–59899"],
    ["Endocrine", "60000–60699"], ["Nervous", "61000–64999"], ["Eye", "65091–68899"], ["Auditory", "69000–69979"]];
  W.cptmap = (host) => {
    const g = E("div", "biogrid cpt"); host.append(g);
    const s = E("div", "biogrid surg"); host.append(s);
    const read = V.readout(host);
    const pick = (n, r, b) => { host.querySelectorAll(".biosys").forEach((x) => x.classList.toggle("on", x === b)); V.say(read, [["section", n], ["range", r, "hi"]]); };
    CPT.forEach(([n, r, c]) => { const b = E("button", "biosys " + c, n); b.type = "button"; b.onclick = () => pick(n, r, b); g.append(b); });
    SURG.forEach(([n, r]) => { const b = E("button", "biosys small", n); b.type = "button"; b.onclick = () => pick("Surgery › " + n, r, b); s.append(b); });
    pick("Surgery", "10004–69990", g.children[2]);
    hint(host, "Tab these in your CPT book. Codes are listed in your book with their AMA descriptions.");
  };

  /* ================================================ E/M level helper (lesson 16) */
  W.emlevel = (host) => {
    const ctl = V.controls(host);
    const L = ["straightforward", "low", "moderate", "high"];
    const st = { pt: "est", p: 2, d: 1, r: 2, t: 0 };
    V.select(ctl, "patient", [["new", "new"], ["est", "established"]], "est", (v) => { st.pt = v; draw(); });
    V.select(ctl, "problems", L.map((x, i) => [String(i), x]), "2", (v) => { st.p = +v; draw(); });
    V.select(ctl, "data", L.map((x, i) => [String(i), x]), "1", (v) => { st.d = +v; draw(); });
    V.select(ctl, "risk", L.map((x, i) => [String(i), x]), "2", (v) => { st.r = +v; draw(); });
    V.slider(ctl, "total time (min)", 0, 90, 1, 0, (v) => (v ? v + " min" : "not used"), (v) => { st.t = v; draw(); });
    const read = V.readout(host);
    const draw = () => {
      const mdm = [st.p, st.d, st.r].sort((a, b) => b - a)[1];           // two of three
      const newC = ["99202", "99203", "99204", "99205"], estC = ["99212", "99213", "99214", "99215"];
      const codes = st.pt === "new" ? newC : estC;
      const tm = st.pt === "new" ? [15, 30, 45, 60] : [10, 20, 30, 40];
      let ti = -1; tm.forEach((m, i) => { if (st.t >= m) ti = i; });
      const best = Math.max(mdm, ti);
      V.say(read, [["MDM (2 of 3)", L[mdm] + " → " + codes[mdm]],
        ["by time", ti < 0 ? (st.t ? "below " + tm[0] + " min: use MDM" : "—") : st.t + " min → " + codes[ti]],
        ["report", codes[best], "hi"]]);
    };
    draw();
  };

  /* ================================================ excision + repair (lesson 18) */
  W.repair = (host) => {
    const ctl = V.controls(host);
    let les = 1.2, mar = 0.2;
    const r1 = V.readout(host);
    const d1 = () => V.say(r1, [["excised diameter", les.toFixed(1) + " + 2 × " + mar.toFixed(1) + " = " + (les + 2 * mar).toFixed(1) + " cm", "hi"]]);
    V.slider(ctl, "lesion (cm)", 0.2, 4, 0.1, les, (v) => v.toFixed(1), (v) => { les = v; d1(); });
    V.slider(ctl, "narrowest margin (cm)", 0, 1, 0.1, mar, (v) => v.toFixed(1), (v) => { mar = v; d1(); });
    d1();
    const rows = [[2.5, "simple", "A"], [3.0, "simple", "A"], [2.0, "intermediate", "B"]];
    const tbl = E("div", "biorep"); host.append(tbl);
    const r2 = V.readout(host);
    const draw = () => {
      tbl.innerHTML = "";
      rows.forEach((row, i) => {
        const line = E("div", "reprow");
        const n = E("input", "vizin"); n.type = "number"; n.min = "0.1"; n.step = "0.1"; n.value = row[0]; n.setAttribute("aria-label", "Repair " + (i + 1) + " length in cm");
        n.oninput = () => { row[0] = Math.max(0, +n.value || 0); total(); };
        const t = E("select", "vizsel"); ["simple", "intermediate", "complex"].forEach((x) => t.append(new Option(x, x))); t.value = row[1]; t.setAttribute("aria-label", "Repair " + (i + 1) + " type");
        t.onchange = () => { row[1] = t.value; total(); };
        const g = E("select", "vizsel"); [["A", "group A: scalp, neck, axillae, trunk, limbs"], ["B", "group B: face, ears, eyelids, nose, lips"]].forEach(([v, x]) => g.append(new Option(x, v))); g.value = row[2]; g.setAttribute("aria-label", "Repair " + (i + 1) + " anatomic group");
        g.onchange = () => { row[2] = g.value; total(); };
        const x = E("button", "btn ghost sm", "Remove"); x.type = "button"; x.onclick = () => { rows.splice(i, 1); draw(); };
        line.append(n, E("span", null, "cm"), t, g, x); tbl.append(line);
      });
      const add = E("button", "btn ghost sm", "Add a repair"); add.type = "button"; add.onclick = () => { rows.push([1, "simple", "A"]); draw(); };
      tbl.append(add); total();
    };
    const total = () => {
      const sums = {};
      rows.forEach(([len, t, g]) => { const k = t + " · group " + g; sums[k] = (sums[k] || 0) + len; });
      const order = ["complex", "intermediate", "simple"];
      const ks = Object.keys(sums).sort((a, b) => order.indexOf(a.split(" ")[0]) - order.indexOf(b.split(" ")[0]));
      V.say(r2, ks.map((k, i) => [i === 0 ? "line 1 (most complex)" : "line " + (i + 1), k + ": " + sums[k].toFixed(1) + " cm", i === 0 ? "hi" : ""]));
    };
    draw();
    hint(host, "Groups here are simplified for practice; your CPT book lists the exact body areas in each repair code family.");
  };

  /* ================================================ anaesthesia (lesson 20) */
  W.anes = (host) => {
    const ctl = V.controls(host);
    const st = { base: 5, min: 60, mod: 0, cf: 20.4976 };
    V.slider(ctl, "base units", 3, 20, 1, st.base, null, (v) => { st.base = v; draw(); });
    V.slider(ctl, "anaesthesia time (min)", 15, 300, 1, st.min, (v) => v + " min", (v) => { st.min = v; draw(); });
    V.slider(ctl, "modifying units", 0, 5, 1, 0, null, (v) => { st.mod = v; draw(); });
    V.select(ctl, "CY2026 CF", [["20.4976", "$20.4976 non-APM"], ["20.5998", "$20.5998 qualifying APM"]], "20.4976", (v) => { st.cf = +v; draw(); });
    const read = V.readout(host);
    const draw = () => {
      const tu = Math.round((st.min / 15) * 10) / 10, units = st.base + tu + st.mod;
      V.say(read, [["time units", st.min + " ÷ 15 = " + tu], ["total units", st.base + " + " + tu + " + " + st.mod + " = " + units.toFixed(1)],
        ["payment (before locality)", "$" + (units * st.cf).toFixed(2), "hi"]]);
    };
    draw();
    hint(host, "Medicare reports time in minutes and computes units to one decimal; some payers round to whole 15-minute units.");
  };

  /* ================================================ HCPCS units (lesson 21) */
  W.units = (host) => {
    const ctl = V.controls(host);
    const st = { dose: 25, per: 10, unit: "mg" };
    V.select(ctl, "example", [["0", "a code 'per 10 mg', 25 mg given"], ["1", "J3420 'up to 1000 mcg', 1000 mcg given"], ["2", "A4253 'per 50 strips', 100 strips"]], "0", (v) => {
      [[25, 10, "mg"], [1000, 1000, "mcg"], [100, 50, "strips"]].forEach((x, i) => { if (+v === i) [st.dose, st.per, st.unit] = x; });
      dose.setValue(st.dose); per.setValue(st.per); draw();
    });
    const dose = V.slider(ctl, "amount given", 1, 2000, 1, st.dose, (v) => v + " " + st.unit, (v) => { st.dose = v; draw(); });
    const per = V.slider(ctl, "amount per unit (code)", 1, 1000, 1, st.per, (v) => v + " " + st.unit, (v) => { st.per = v; draw(); });
    const read = V.readout(host);
    const draw = () => V.say(read, [["calculation", st.dose + " ÷ " + st.per + " = " + (st.dose / st.per).toFixed(2)], ["units to bill", String(Math.ceil(st.dose / st.per - 1e-9)), "hi"]]);
    draw();
  };

  /* ================================================ claim pointers (lesson 23) */
  W.claim = (host) => {
    const dx = [["A", "E11.9", "type 2 diabetes"], ["B", "I10", "hypertension"], ["C", "Z23", "encounter for immunization"]];
    const lines = [["Office visit, established (CPT E/M)", ["A", "B"]], ["Blood glucose test (CPT lab)", ["A"]], ["Flu vaccine product + administration (CPT medicine)", ["C"]]];
    const pick = lines.map(() => new Set());
    const d = E("div", "claimdx"); host.append(d);
    d.append(E("b", null, "Item 21 · diagnoses"));
    dx.forEach(([l, c, t]) => d.append(E("span", "biochip", l + ". " + c + " — " + t)));
    const tb = E("div", "claimlines"); host.append(tb);
    lines.forEach(([name], i) => {
      const row = E("div", "claimrow");
      row.append(E("span", "claimsvc", "24 · line " + (i + 1) + ": " + name));
      const ptr = E("span", "claimptr");
      dx.forEach(([l]) => {
        const lab = E("label", "biochk"); const c = E("input"); c.type = "checkbox";
        c.setAttribute("aria-label", "Line " + (i + 1) + " points to diagnosis " + l);
        c.onchange = () => { c.checked ? pick[i].add(l) : pick[i].delete(l); };
        lab.append(c, E("span", null, l)); ptr.append(lab);
      });
      row.append(ptr); tb.append(row);
    });
    const ctl = V.controls(host);
    const read = V.readout(host);
    btn(ctl, "Check my pointers", () => {
      const res = lines.map(([n, want], i) => {
        const got = [...pick[i]];
        const ok = got.length && got.every((x) => want.includes(x)) && got.includes(want[0]);
        return ["line " + (i + 1), ok ? "✓ supports the service" : "✗ point it at " + want.join(" + "), ok ? "hi" : ""];
      });
      V.say(read, res);
    });
    hint(host, "Each line may point to up to four diagnoses. The vaccine is justified by Z23, not by the diabetes.");
  };

  /* ================================================ RVU fee (lesson 24) */
  W.rvu = (host) => {
    const ctl = V.controls(host);
    const st = { w: 1.3, pe: 1.2, mp: 0.1, gw: 1, gpe: 1, gmp: 1, cf: 33.4009 };
    const sl = (k, label, max) => V.slider(ctl, label, 0, max, 0.01, st[k], (v) => v.toFixed(2), (v) => { st[k] = v; draw(); });
    sl("w", "work RVU", 5); sl("pe", "practice expense RVU", 5); sl("mp", "malpractice RVU", 1);
    sl("gw", "work GPCI", 1.5); sl("gpe", "PE GPCI", 1.5); sl("gmp", "MP GPCI", 1.5);
    V.select(ctl, "CY2026 conversion factor", [["33.4009", "$33.4009 (non-APM)"], ["33.5675", "$33.5675 (qualifying APM)"]], "33.4009", (v) => { st.cf = +v; draw(); });
    const read = V.readout(host);
    const draw = () => {
      const r = st.w * st.gw + st.pe * st.gpe + st.mp * st.gmp;
      V.say(read, [["adjusted RVUs", r.toFixed(4)], ["× conversion factor", "$" + st.cf], ["Medicare fee", "$" + (r * st.cf).toFixed(2), "hi"]]);
    };
    draw();
    hint(host, "Real RVUs and GPCIs come from the CMS physician fee schedule files for each code and locality.");
  };
})();
