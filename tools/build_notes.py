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
    for old in out.glob("day*.md"):
        old.unlink()
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
                                                 "days": links}, indent=1, ensure_ascii=False), encoding="utf-8")
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
    (out / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {len(links)} notes + README.md + links.json to {out}")


if __name__ == "__main__":
    main()
