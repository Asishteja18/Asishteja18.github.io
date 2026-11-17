"""Build the Biological path (Medical Coding) for the site from MEDCODE_MASTER.md.

    pip install simple_icd_10_cm markdown
    python3 tools/build_medcode.py

Writes:
  content/medcode.json   28 lessons in the site's lesson format, exercise kind "check"
  content/icd10cm.json   every billable ICD-10-CM code (FY2026) + chapter list, for the lookup tool

Every ICD-10-CM code in an answer, and every dotted ICD-10-CM code anywhere in the
syllabus, is checked against the official FY2026 code set. HCPCS Level II answers
must be in HCPCS_OK (verified by hand against CMS descriptions). CPT descriptors
are AMA copyright and are never stored here.
"""
import json
import re
import sys
from pathlib import Path

import simple_icd_10_cm as cm

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ai90 import md, to_sections, minutes_of  # noqa: E402
from build_notes import GH_VIEW, slug  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "syllabus" / "MEDCODE_MASTER.md"

STAGES = [  # (first, last, track, section heading)
    (1, 7, "mcf", "Lessons 1–7 · Healthcare foundations"),
    (8, 14, "mcd", "Lessons 8–14 · Diagnosis coding: ICD-10-CM"),
    (15, 21, "mcp", "Lessons 15–21 · Procedure coding: CPT + HCPCS"),
    (22, 28, "mcr", "Lessons 22–28 · Claims, compliance + career"),
]
STAGE_HDR = {"mcf": "STAGE 1", "mcd": "STAGE 2", "mcp": "STAGE 3", "mcr": "STAGE 4"}

# lesson -> [(widget id, caption)]; widgets live in assets/viz-bio.js
LOOKUP = ("icdlookup", "Search every billable ICD-10-CM FY2026 code by word or code. Use it for the practice below.")
VIZ = {
    2: [("terms", "Pick a prefix, a root and a suffix. The word and its meaning build themselves.")],
    3: [("planes", "Click a body region: its directional words and the laterality it needs in a code.")],
    4: [("body", "Click a body system to see its key structures, ICD-10-CM chapter and CPT surgery range.")],
    5: [("body", "The same map, second half of the systems. Click to explore.")],
    8: [("icdparts", "Type any ICD-10-CM code. Each character is explained and the code is checked against FY2026."), LOOKUP],
    9: [LOOKUP],
    10: [LOOKUP],
    11: [("htnckd", "Tick what the provider documented. The right hypertension / diabetes / CKD codes and their order appear."), LOOKUP],
    12: [LOOKUP],
    13: [("seventh", "Follow one fracture through three visits and watch the 7th character change."), LOOKUP],
    14: [("trimester", "Drag the weeks of gestation: trimester, Z3A code and the O-code ending update."), LOOKUP],
    15: [("cptmap", "The six CPT sections and the surgery subsections as one map. Hover for the code range.")],
    16: [("emlevel", "Score problems, data and risk, or enter the time. The E/M level follows the two-of-three rule.")],
    18: [("repair", "Measure an excision and add up repairs the way the CPT rules say.")],
    20: [("anes", "Anaesthesia units and payment: base + time + modifying units × the CY2026 conversion factor.")],
    21: [("units", "HCPCS drug units: dose given ÷ the amount in the code's description.")],
    23: [("claim", "Point each service line at the diagnoses that justify it, like item 24E on a CMS-1500.")],
    24: [("rvu", "Medicare physician fee: RVUs × GPCIs × the CY2026 conversion factor.")],
}

HCPCS_OK = {"J3420", "A4253", "G0121", "G0105"}
ICD_RE = re.compile(r"^[A-TV-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$|^U07\.1$")


def norm(code):
    c = code.strip().upper().replace(" ", "")
    if c in HCPCS_OK:
        return c
    if "." not in c and len(c) > 3 and re.match(r"^[A-Z][0-9][0-9A-Z]", c):
        c = c[:3] + "." + c[3:]
    return c


def check_code(c, where):
    if c in HCPCS_OK:
        return
    if not ICD_RE.match(c):
        raise SystemExit(f"{where}: '{c}' is not an ICD-10-CM or approved HCPCS code")
    if not (cm.is_valid_item(c) and cm.is_leaf(c)):
        raise SystemExit(f"{where}: '{c}' is not a billable FY2026 ICD-10-CM code")


def scan_text_codes(text, where):
    """Every dotted ICD-10-CM code mentioned in prose/visuals must exist (a trailing - means 'more characters')."""
    for m in re.finditer(r"\b([A-TV-Z][0-9][0-9A-Z]\.[0-9A-Z]{1,4})(-?)", text):
        code, open_end = m.group(1), m.group(2)
        if not cm.is_valid_item(code):
            raise SystemExit(f"{where}: '{code}' mentioned in the text does not exist in ICD-10-CM FY2026")
        if not open_end and not cm.is_leaf(code) and not re.search(r"[A-Z]\d\d\.\d$", code):
            # a header code written without '-' is only allowed for 4-char subcategories used as headings
            raise SystemExit(f"{where}: '{code}' is a header code; write it as '{code}-'")


def parse(text):
    heads = list(re.finditer(r"^### Lesson (\d+) — (.+)$", text, re.M))
    out = {}
    for k, h in enumerate(heads):
        stop = heads[k + 1].start() if k + 1 < len(heads) else len(text)
        stop2 = text.find("\n## ", h.end())
        if 0 < stop2 < stop:
            stop = stop2
        out[int(h.group(1))] = (h.group(2).strip(), text[h.end():stop])
    return out


def build_lesson(n, title, body):
    where = f"Lesson {n}"
    stage = next(s for s in STAGES if s[0] <= n <= s[1])
    meta = {}
    m = re.search(r"\*\*Dataset:\*\*\s*(.+?)\s*·\s*\*\*Time:\*\*\s*([^\n]+)", body)
    if m:
        meta["dataset"], meta["time"] = m.group(1).strip(), m.group(2).strip()
    goal = re.search(r"^\*\*Goal:\*\*\s*(.+)$", body, re.M)
    vis = re.search(r"#### Visual\n(.*?)(?=^#### )", body, re.S | re.M)
    notes = re.search(r"#### Notes\n(.*?)(?=^#### Practice)", body, re.S | re.M)
    prac = re.search(r"#### Practice\n+```json\n(.*?)```", body, re.S)
    done = re.search(r"^\*\*Done when:\*\*\s*(.+)$", body, re.M)
    if not (goal and vis and notes and prac):
        raise SystemExit(f"{where}: missing Goal / Visual / Notes / Practice")
    scan_text_codes(vis.group(1) + notes.group(1), where)

    sections = [dict(s, role="visual") for s in to_sections(vis.group(1))]
    for vid, cap in VIZ.get(n, []):
        sections.append({"type": "viz", "viz": vid, "caption": cap})
    sections += to_sections(notes.group(1))

    ex = json.loads(prac.group(1))
    items = ex["items"]
    for i, it in enumerate(items):
        w = f"{where} item {i + 1}"
        t = it["type"]
        if t == "mcq":
            assert 0 <= it["answer"] < len(it["options"]), w
        elif t == "codes":
            it["answer"] = [norm(c) for c in it["answer"]]
            for c in it["answer"]:
                check_code(c, w)
            it["order"] = bool(it.get("order"))
        elif t == "text":
            it["answer"] = [a.strip().lower() for a in it["answer"]]
        else:
            raise SystemExit(f"{w}: unknown type {t}")
        assert it.get("why"), f"{w}: needs a 'why'"
        scan_text_codes(it["q"] + " " + it["why"], w)
        it["q_html"] = md(it["q"]).removeprefix("<p>").removesuffix("</p>")
        it["why_html"] = md(it["why"]).removeprefix("<p>").removesuffix("</p>")
    nf = f"mc{n:02}-{slug(title)}.md"
    return {
        "id": f"mc{n:02}",
        "mc": n,
        "track": stage[2],
        "order": n,
        "title": title,
        "blurb": re.sub(r"\*\*|`", "", goal.group(1)).strip(),
        "minutes": minutes_of(meta.get("time")),
        "section": stage[3],
        "meta": meta,
        "objectives": [],
        "notes": {"path": "notes/" + nf, "github": GH_VIEW + nf},
        "sections": sections,
        "exercise": {
            "kind": "check",
            "items": items,
            "pass": ex.get("pass", 1.0),
            "timer_minutes": ex.get("timer_minutes"),
            "done_html": md(done.group(1)) if done else "",
            "tests": [{"label": f"Q{i + 1}"} for i in range(len(items))],
        },
    }


def icd_lookup():
    allc = cm.get_all_codes(False)
    codes = [[cm.add_dot(c), cm.get_description(c)] for c in allc if cm.is_leaf(c) and "-" not in c and not cm.is_chapter(c)]
    chapters = [[c, cm.get_description(c)] for c in allc if cm.is_chapter(c)]
    return {"version": "ICD-10-CM FY2026 (1 Oct 2025 – 30 Sep 2026)", "chapters": chapters, "codes": codes}


def main():
    text = SRC.read_text(encoding="utf-8")
    scan_text_codes(text.split("## STAGE 1")[0], "intro")
    lessons_src = parse(text)
    assert sorted(lessons_src) == list(range(1, 29)), sorted(lessons_src)
    lessons = [build_lesson(n, *lessons_src[n]) for n in range(1, 29)]
    blocks = []
    for track, hdr in STAGE_HDR.items():
        m = re.search(r"^## " + hdr + r"[^\n]*\n(.*?)(?=^### Lesson)", text, re.S | re.M)
        blocks.append({"track": track, "sections": to_sections(m.group(1).replace("---", ""))})
    out = {"version": "2026-11-17", "codeset": "ICD-10-CM FY2026", "lessons": lessons, "blocks": blocks}
    (ROOT / "content" / "medcode.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    lk = icd_lookup()
    assert len(lk["codes"]) > 74000, len(lk["codes"])
    assert all(len(c) == 3 or c[3] == "." for c, _ in lk["codes"]), "codes must be written with the dot"
    (ROOT / "content" / "icd10cm.json").write_text(json.dumps(lk, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n_items = sum(len(l["exercise"]["items"]) for l in lessons)
    n_codes = sum(len(i["answer"]) for l in lessons for i in l["exercise"]["items"] if i["type"] == "codes")
    print(f"medcode.json: {len(lessons)} lessons, {n_items} graded checks, {n_codes} answer codes verified; "
          f"icd10cm.json: {len(lk['codes'])} billable codes")


if __name__ == "__main__":
    main()
