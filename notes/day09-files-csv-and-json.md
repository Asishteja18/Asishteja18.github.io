# Day 9 — Files, CSV and JSON

> **AI-90** · Block 1 · Python + automation + real data · Day 9 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 9`)

[← Day 8](day08-functions-in-depth.md) · [All 90 days](README.md) · [Day 10 →](day10-errors-and-debugging.md)

---

**Dataset:** files you create · **Time:** ~2 h

#### Visual

```text
 people.csv                         read_csv()
 ┌───────────┐                      [{"name":"Asish","age":"24"},
 │name,age   │  ── DictReader ──▶    {"name":"Sam","age":"30"}]
 │Asish,24   │                      (values are STRINGS — convert!)
 │Sam,30     │
 └───────────┘
```

**Goal:** save and load data. Every dataset, config and model checkpoint you'll ever touch is a file.

#### 1. Opening files with `with`

```python
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")

with open("notes.txt", encoding="utf-8") as f:
    for line in f:            # reads one line at a time — works on huge files
        print(line.strip())
```

`with` closes the file for you, even if something crashes. Modes: `"r"` read (default), `"w"` write (overwrites!), `"a"` append.

Always pass `encoding="utf-8"` — Windows otherwise defaults to something else and breaks on £ or Telugu text.

#### 2. pathlib — paths as objects

```python
from pathlib import Path

p = Path("data") / "raw" / "prices.csv"   # / joins paths on any OS
p.name        # 'prices.csv'
p.suffix      # '.csv'
p.stem        # 'prices'
p.exists()
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("hi", encoding="utf-8")
for child in Path("data").iterdir():
    ...
```

#### 3. CSV

```python
import csv

with open("people.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))     # [{'name': 'Asish', 'age': '24'}, ...]

with open("out.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["name", "age"])
    w.writeheader()
    w.writerows(rows)
```

CSV values come back as **strings** — convert with `int()` / `float()` yourself. `newline=""` stops blank lines appearing on Windows.

#### 4. JSON

JSON maps straight onto dicts and lists — perfect for configs and API responses.

```python
import json
text = json.dumps({"lr": 0.01}, indent=2)   # dict -> str
data = json.loads(text)                     # str -> dict
```

#### Exercises

`python ai90.py check 9`. Tests write to a temporary folder, so nothing in your project gets touched.

**Apply it:** make your Day 7 tracker load `expenses.json` on start and save on quit.

#### Your task — write `ai90/work/day09.py` with: `write_lines`, `count_lines`, `read_csv`, `write_csv`, `save_json`, `load_json`, `list_files`

#### Tests

```python
# file: test_day09.py
import tempfile
from pathlib import Path

import day09 as ex


def tmp():
    return Path(tempfile.mkdtemp())


def test_write_and_count_lines():
    p = tmp() / "notes.txt"
    ex.write_lines(p, ["one", "", "three"])
    assert p.read_text(encoding="utf-8") == "one\n\nthree\n"
    assert ex.count_lines(p) == 2


def test_csv_round_trip():
    p = tmp() / "people.csv"
    rows = [{"name": "Asish", "age": "24"}, {"name": "Sam", "age": "30"}]
    ex.write_csv(p, rows)
    assert p.read_text(encoding="utf-8").splitlines()[0] == "name,age"
    assert ex.read_csv(p) == rows


def test_json_round_trip():
    p = tmp() / "cfg.json"
    ex.save_json(p, {"lr": 0.01, "layers": [64, 32]})
    assert ex.load_json(p) == {"lr": 0.01, "layers": [64, 32]}
    assert "\n  " in p.read_text(encoding="utf-8"), "use indent=2"


def test_load_json_missing():
    assert ex.load_json(tmp() / "nope.json", default={}) == {}


def test_list_files():
    d = tmp()
    for name in ["b.CSV", "a.csv", "c.txt"]:
        (d / name).write_text("x")
    (d / "sub.csv").mkdir()
    assert ex.list_files(d, ".csv") == ["a.csv", "b.CSV"]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day09.py
"""Day 9 — files, CSV and JSON."""
import csv
import json
from pathlib import Path


def write_lines(path, lines):
    """Write each string in `lines` on its own line (UTF-8). Overwrites the file."""
    with open(path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")


def count_lines(path):
    """Number of non-empty lines in a text file."""
    with open(path, encoding="utf-8") as f:
        return sum(1 for line in f if line.strip())


def read_csv(path):
    """Read a CSV with a header row into a list of dicts (all values stay strings)."""
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, rows):
    """Write a list of dicts to CSV, header taken from the first row's keys. Empty rows -> empty file."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        if not rows:
            return
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def save_json(path, data):
    """Save data as pretty JSON (indent=2)."""
    Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")


def load_json(path, default=None):
    """Load JSON; return `default` if the file doesn't exist."""
    p = Path(path)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def list_files(folder, ext):
    """Sorted file NAMES (not paths) in `folder` ending with `ext`, case-insensitive."""
    return sorted(p.name for p in Path(folder).iterdir()
                  if p.is_file() and p.name.lower().endswith(ext.lower()))
```

</details>

**Done when:** `python ai90.py check 9` is all green → tick Day 9 in the tracker.

---

[← Day 8](day08-functions-in-depth.md) · [All 90 days](README.md) · [Day 10 →](day10-errors-and-debugging.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
