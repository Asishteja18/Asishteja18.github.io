# Day 17 — File automation: the folder organiser

> **AI-90** · Block 1 · Python + automation + real data · Day 17 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 17`)

[← Day 16](day16-cli-tools-argparse-and-logging.md) · [All 90 days](README.md) · [Day 18 →](day18-regular-expressions-log-parser.md)

---

**Dataset:** a messy test folder (made by the tests) · **Time:** ~2 h

#### Visual

```text
 Downloads/                         Downloads/
 ├── cv.pdf                         ├── documents/  cv.pdf, notes.txt
 ├── IMG_01.JPG       organise()    ├── images/     IMG_01.JPG
 ├── notes.txt       ──────────▶    ├── code/       train.py
 ├── train.py                       └── other/      song.mp3
 └── song.mp3
 dry_run=True → returns the plan, moves NOTHING
```

#### Notes

- `pathlib.Path.iterdir()` lists a folder; `p.is_file()` skips subfolders.
- `shutil.move(src, dst)` moves; `dst.parent.mkdir(parents=True, exist_ok=True)` creates folders safely.
- **Never overwrite**: if `documents/cv.pdf` exists, use `cv_1.pdf`, `cv_2.pdf`…
- **Dry run first** — every destructive script gets a `--dry-run` flag. Return the plan, print it, only then act.
- Reuse Day 3's `file_category` — your own code is now a library.

#### Your task — `day17.py`

- `unique_path(path)` → `path` if free, else `stem_1.ext`, `stem_2.ext`…
- `organise(folder, dry_run=False)` → sorted list of `(filename, category)`; moves each file into a subfolder named by `FOLDER = {"image": "images", "document": "documents", "code": "code", "other": "other"}` unless `dry_run`. Never overwrite (use `unique_path`).

#### Tests

```python
# file: test_day17.py
import tempfile
from pathlib import Path

import day17 as ex


def make():
    d = Path(tempfile.mkdtemp())
    for n in ["cv.pdf", "IMG_01.JPG", "notes.txt", "train.py", "song.mp3"]:
        (d / n).write_text(n)
    (d / "already_a_folder").mkdir()
    return d


def test_dry_run_moves_nothing():
    d = make()
    plan = ex.organise(d, dry_run=True)
    assert plan == [("IMG_01.JPG", "images"), ("cv.pdf", "documents"), ("notes.txt", "documents"),
                    ("song.mp3", "other"), ("train.py", "code")]
    assert (d / "cv.pdf").exists() and not (d / "documents").exists()


def test_organise_moves():
    d = make()
    ex.organise(d)
    assert (d / "documents" / "cv.pdf").read_text() == "cv.pdf"
    assert (d / "images" / "IMG_01.JPG").exists()
    assert not (d / "train.py").exists()
    assert (d / "already_a_folder").is_dir()


def test_no_overwrite():
    d = make()
    (d / "documents").mkdir()
    (d / "documents" / "cv.pdf").write_text("old")
    ex.organise(d)
    assert (d / "documents" / "cv.pdf").read_text() == "old"
    assert (d / "documents" / "cv_1.pdf").read_text() == "cv.pdf"


def test_unique_path():
    d = Path(tempfile.mkdtemp())
    assert ex.unique_path(d / "a.txt") == d / "a.txt"
    (d / "a.txt").write_text("x"); (d / "a_1.txt").write_text("x")
    assert ex.unique_path(d / "a.txt") == d / "a_2.txt"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day17.py
import shutil
from pathlib import Path

from day03 import file_category

FOLDER = {"image": "images", "document": "documents", "code": "code", "other": "other"}


def unique_path(path):
    path = Path(path)
    i, candidate = 1, path
    while candidate.exists():
        candidate = path.with_name(f"{path.stem}_{i}{path.suffix}")
        i += 1
    return candidate


def organise(folder, dry_run=False):
    folder = Path(folder)
    plan = sorted((p.name, FOLDER[file_category(p.name)]) for p in folder.iterdir() if p.is_file())
    if not dry_run:
        for name, sub in plan:
            dest_dir = folder / sub
            dest_dir.mkdir(exist_ok=True)
            shutil.move(str(folder / name), str(unique_path(dest_dir / name)))
    return plan
```

</details>

**Done when:** tests green, then run it with `dry_run=True` on a COPY of your real Downloads folder.

---

[← Day 16](day16-cli-tools-argparse-and-logging.md) · [All 90 days](README.md) · [Day 18 →](day18-regular-expressions-log-parser.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
