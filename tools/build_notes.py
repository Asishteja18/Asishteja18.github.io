"""Build per-day notes from the AI-90 master file.

    python3 tools/build_notes.py            # reads syllabus/AI90_MASTER.md

Writes:
  notes/dayNN-<slug>.md   one readable/downloadable note per day (GitHub renders them, Mermaid included)
  notes/README.md         the library: every day with Read / Download links
  notes/links.json        machine-readable links (the site and tools/build_ai90.py use slugs from here)

Edit the master file, never the notes — they are generated.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "https://github.com/Asishteja18/asishteja18.github.io"
GH_VIEW = REPO + "/blob/main/notes/"
SITE = "https://telugucoders.com/"
BLOCKS = [(1, 30, "Block 1 · Python + automation + real data"),
          (31, 60, "Block 2 · Machine learning from scratch"),
          (61, 90, "Block 3 · Build an AI from scratch")]


def slug(title):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower().replace("`", "")).strip("-")
    return s[:48].rstrip("-")


def filename(n, title):
    return f"day{n:02}-{slug(title)}.md"


PLUS_BLOCK = "Block 2.5 · Advanced ML: beyond the basics"


def adv_filename(n, title):
    return f"adv{n:02}-{slug(title)}.md"


def parse_plus(text):
    heads = list(re.finditer(r"^### Advanced (\d+) — (.+)$", text, re.M))
    out = {}
    for k, h in enumerate(heads):
        stop = heads[k + 1].start() if k + 1 < len(heads) else len(text)
        body = re.sub(r"\n---\s*$", "", text[h.end():stop].strip()).strip()
        out[int(h.group(1))] = (h.group(2).strip(), body)
    return out


def adv_note(n, adv):
    title, body = adv[n]
    nav = []
    if n > 1:
        nav.append(f"[← Advanced {n - 1}]({adv_filename(n - 1, adv[n - 1][0])})")
    nav.append("[All notes](README.md)")
    if n < len(adv):
        nav.append(f"[Advanced {n + 1} →]({adv_filename(n + 1, adv[n + 1][0])})")
    nav = " · ".join(nav)
    return "\n".join([
        f"# Advanced {n} — {title}", "",
        f"> **AI-90** · {PLUS_BLOCK} · Advanced {n} of {len(adv)}  ",
        f"> Practise it with live tests on [telugucoders.com]({SITE}) · "
        f"source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)", "",
        nav, "", "---", "", body, "", "---", "", nav, "",
        "<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>", ""])


MED_STAGES = [(1, 7, "Stage 1 · Healthcare foundations"), (8, 14, "Stage 2 · ICD-10-CM diagnosis coding"),
              (15, 21, "Stage 3 · CPT + HCPCS procedure coding"), (22, 28, "Stage 4 · Claims, compliance + career")]


def mc_filename(n, title):
    return f"mc{n:02}-{slug(title)}.md"


def parse_med(text):
    heads = list(re.finditer(r"^### Lesson (\d+) — (.+)$", text, re.M))
    out = {}
    for k, h in enumerate(heads):
        stop = heads[k + 1].start() if k + 1 < len(heads) else len(text)
        stop2 = text.find("\n## ", h.end())
        if 0 < stop2 < stop:
            stop = stop2
        out[int(h.group(1))] = (h.group(2).strip(), re.sub(r"\n---\s*$", "", text[h.end():stop].strip()).strip())
    return out


def practice_md(body):
    """Swap the graded JSON for a readable question list (answers stay on the site)."""
    m = re.search(r"#### Practice\n+```json\n(.*?)```", body, re.S)
    if not m:
        return body
    items = json.loads(m.group(1))["items"]
    lines = ["#### Practice", "", "Answer these, then check yourself with instant grading on "
             f"[telugucoders.com]({SITE}) (choose the Biological path).", ""]
    for i, it in enumerate(items, 1):
        lines.append(f"{i}. {it['q']}")
        if it["type"] == "mcq":
            lines += [f"   - {chr(97 + j)}) {o}" for j, o in enumerate(it["options"])]
        elif it["type"] == "codes":
            lines.append("   - Your codes: ______________")
    return body[:m.start()] + "\n".join(lines) + body[m.end():]


def mc_note(n, med):
    title, body = med[n]
    stage = next(name for lo, hi, name in MED_STAGES if lo <= n <= hi)
    nav = []
    if n > 1:
        nav.append(f"[← Lesson {n - 1}]({mc_filename(n - 1, med[n - 1][0])})")
    nav.append("[All notes](README.md)")
    if n < len(med):
        nav.append(f"[Lesson {n + 1} →]({mc_filename(n + 1, med[n + 1][0])})")
    nav = " · ".join(nav)
    return "\n".join([
        f"# Medical Coding {n} — {title}", "",
        f"> **AIM Biological path** · {stage} · Lesson {n} of {len(med)}  ",
        f"> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · "
        f"source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)", "",
        nav, "", "---", "", practice_md(body), "", "---", "", nav, "",
        "<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>", ""])


def block_of(n):
    return next(name for lo, hi, name in BLOCKS if lo <= n <= hi)


def parse(text):
    heads = list(re.finditer(r"^### Day (\d+) — (.+)$", text, re.M))
    ends = [m.start() for m in re.finditer(r"^## ", text, re.M)]
    days = {}
    for k, h in enumerate(heads):
        stop = heads[k + 1].start() if k + 1 < len(heads) else len(text)
        stop = min([stop] + [e for e in ends if e > h.start()])
        body = text[h.end():stop].strip()
        body = re.sub(r"\n---\s*$", "", body).strip()
        days[int(h.group(1))] = (h.group(2).strip(), body)
    return days


def meta(body):
    m = re.search(r"\*\*Dataset:\*\*\s*(.+?)\s*·\s*\*\*Time:\*\*\s*([^\n]+)", body)
    return (m.group(1).strip(), m.group(2).strip()) if m else ("", "")


def nav(n, days):
    parts = []
    if n > 1:
        parts.append(f"[← Day {n - 1}]({filename(n - 1, days[n - 1][0])})")
    parts.append("[All 90 days](README.md)")
    if n < 90:
        parts.append(f"[Day {n + 1} →]({filename(n + 1, days[n + 1][0])})")
    return " · ".join(parts)


def note(n, days):
    title, body = days[n]
    return "\n".join([
        f"# Day {n} — {title}", "",
        f"> **AI-90** · {block_of(n)} · Day {n} of 90  ",
        f"> Practise it with live tests on [telugucoders.com]({SITE}) · "
        f"run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check {n}`)", "",
        nav(n, days), "", "---", "",
        body, "", "---", "",
        nav(n, days), "",
        f"<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. "
        f"AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>", ""])


def main():
    text = (ROOT / "syllabus" / "AI90_MASTER.md").read_text(encoding="utf-8")
    days = parse(text)
    assert sorted(days) == list(range(1, 91)), sorted(days)[:5]
    out = ROOT / "notes"
    out.mkdir(exist_ok=True)
    for old in list(out.glob("day*.md")) + list(out.glob("adv*.md")) + list(out.glob("mc*.md")):
        old.unlink()
    med = parse_med((ROOT / "syllabus" / "MEDCODE_MASTER.md").read_text(encoding="utf-8"))
    med_links = []
    for n, (title, body) in sorted(med.items()):
        fn = mc_filename(n, title)
        (out / fn).write_text(mc_note(n, med), encoding="utf-8")
        dataset, time = meta(body)
        med_links.append({"mc": n, "title": title, "file": fn, "path": "notes/" + fn, "github": GH_VIEW + fn,
                          "download": SITE + "notes/" + fn, "dataset": re.sub(r"[`*]", "", dataset), "time": time,
                          "kb": round((out / fn).stat().st_size / 1024, 1)})
    adv = parse_plus((ROOT / "syllabus" / "AI90_PLUS.md").read_text(encoding="utf-8"))
    adv_links = []
    for n, (title, body) in sorted(adv.items()):
        fn = adv_filename(n, title)
        (out / fn).write_text(adv_note(n, adv), encoding="utf-8")
        dataset, time = meta(body)
        adv_links.append({"adv": n, "title": title.replace("`", ""), "block": PLUS_BLOCK, "file": fn,
                          "path": "notes/" + fn, "github": GH_VIEW + fn, "download": SITE + "notes/" + fn,
                          "dataset": re.sub(r"[`*]", "", dataset), "time": time,
                          "kb": round((out / fn).stat().st_size / 1024, 1)})
    links = []
    for n in range(1, 91):
        title = days[n][0]
        fn = filename(n, title)
        (out / fn).write_text(note(n, days), encoding="utf-8")
        dataset, time = meta(days[n][1])
        links.append({"day": n, "title": title.replace("`", ""), "block": block_of(n), "file": fn,
                      "path": "notes/" + fn, "github": GH_VIEW + fn, "download": SITE + "notes/" + fn,
                      "dataset": re.sub(r"[`*]", "", dataset), "time": time,
                      "kb": round((out / fn).stat().st_size / 1024, 1)})
    (out / "links.json").write_text(json.dumps({"repo": REPO, "all_in_one": SITE + "syllabus/AI90_MASTER.md",
                                                 "days": links, "advanced": adv_links, "medcode": med_links}, indent=1, ensure_ascii=False), encoding="utf-8")
    lines = ["# AI-90 notes — 90 days to build your own AI", "",
             "One note per day: visual, notes, worked code, your task, tests and a reference solution. "
             "Read them here on GitHub, or download any day as a Markdown file.", "",
             f"- **Practise with live tests:** [telugucoders.com]({SITE})",
             f"- **Everything in one file:** [AI90_MASTER.md](../syllabus/AI90_MASTER.md) "
             f"([download]({SITE}syllabus/AI90_MASTER.md))", ""]
    for lo, hi, name in BLOCKS:
        lines += [f"## {name}", "", "| Day | Topic | Dataset | Read | Download |", "| --- | --- | --- | --- | --- |"]
        for L in links[lo - 1:hi]:
            ds = L["dataset"].replace("|", "/")
            ds = ds if len(ds) <= 60 else ds[:57].rstrip() + "…"
            lines.append(f"| {L['day']} | {L['title']} | {ds} | [read]({L['file']}) | "
                         f"[.md · {L['kb']} KB]({L['download']}) |")
        lines.append("")
        if hi == 60:
            lines += [f"## {PLUS_BLOCK}", "", "| # | Topic | Dataset | Read | Download |",
                      "| --- | --- | --- | --- | --- |"]
            for L in adv_links:
                ds = L["dataset"].replace("|", "/")
                ds = ds if len(ds) <= 60 else ds[:57].rstrip() + "…"
                lines.append(f"| A{L['adv']} | {L['title']} | {ds} | [read]({L['file']}) | "
                             f"[.md · {L['kb']} KB]({L['download']}) |")
            lines.append("")
    lines += ["## Biological path · Medical Coding (CPC track)", "",
              "ICD-10-CM FY2026, CPT and HCPCS for the AAPC CPC exam. Graded practice on the site.", "",
              "| # | Topic | Read | Download |", "| --- | --- | --- | --- |"]
    for L in med_links:
        lines.append(f"| M{L['mc']} | {L['title']} | [read]({L['file']}) | [.md · {L['kb']} KB]({L['download']}) |")
    lines.append("")
    (out / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {len(links)} + {len(adv_links)} + {len(med_links)} notes + README.md + links.json to {out}")


if __name__ == "__main__":
    main()
