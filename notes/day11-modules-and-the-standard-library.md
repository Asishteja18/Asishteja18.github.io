# Day 11 — Modules and the standard library

> **AI-90** · Block 1 · Python + automation + real data · Day 11 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 11`)

[← Day 10](day10-errors-and-debugging.md) · [All 90 days](README.md) · [Day 12 →](day12-comprehensions-generators-lambda.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 expenses/              python -m expenses
 ├── __init__.py
 ├── core.py      ◀── import expenses.core
 ├── storage.py
 └── __main__.py  ◀── runs on python -m
 .venv/  ← isolated packages per project (never commit it)
```

**Goal:** split code across files, use the standard library instead of reinventing it, and install packages cleanly.

#### 1. Importing

```python
import math                       # use as math.sqrt(2)
from pathlib import Path          # use as Path(...)
from collections import Counter
import numpy as np                # alias (Phase 3)
```

Any `.py` file is a module. If you have `helpers.py` next to `app.py`, then `import helpers` works.

#### 2. `if __name__ == "__main__":`

```python
def main():
    ...

if __name__ == "__main__":
    main()
```

Code under that line runs only when you execute the file directly, not when another file imports it. Every script you write from now on gets this.

#### 3. Packages

A folder of modules is a package:

```
expenses/
    __init__.py
    core.py        # add_expense, total ...
    storage.py     # load / save JSON
    __main__.py    # the CLI — run with: python -m expenses
```

#### 4. Virtual environments

Each project gets its own isolated set of packages:

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install requests
pip freeze > requirements.txt
```

`uv` does the same, much faster: `uv venv`, `uv pip install requests`. Add `.venv/` to `.gitignore`.

#### 5. Standard-library tour (no install needed)

| Module | Use it for |
| --- | --- |
| `math` | `sqrt`, `ceil`, `log`, `exp`, `dist` |
| `random` | `random.Random(seed)` — reproducible randomness, vital in ML |
| `collections` | `Counter`, `defaultdict`, `deque` |
| `datetime` | dates, durations, `fromisoformat` |
| `pathlib` | paths |
| `json`, `csv` | data files |
| `itertools` | `chain`, `combinations`, `islice` |

#### Exercises

`python ai90.py check 11`. Each function should be 1–3 lines — the point is knowing which tool to grab.

**Apply it:** turn your expense tracker into the package layout above.

#### Your task — write `ai90/work/day11.py` with: `top_words`, `days_between`, `distance`, `seeded_sample`, `split_path`, `ceil_div`

#### Tests

```python
# file: test_day11.py
import day11 as ex


def test_top_words():
    assert ex.top_words(["a", "b", "a", "c", "a", "b"], 2) == [("a", 3), ("b", 2)]


def test_days_between():
    assert ex.days_between("2026-11-16", "2027-02-14") == 90
    assert ex.days_between("2026-01-02", "2026-01-01") == -1


def test_distance():
    assert ex.distance((0, 0), (3, 4)) == 5.0
    assert ex.distance((1, 1, 1), (2, 2, 2)) == 1.7321


def test_seeded_sample():
    items = list(range(100))
    a = ex.seeded_sample(items, 5, seed=42)
    assert a == ex.seeded_sample(items, 5, seed=42)
    assert len(set(a)) == 5


def test_split_path():
    assert ex.split_path("data/raw/prices.csv") == ("data/raw", "prices", ".csv")
    assert ex.split_path("README") == (".", "README", "")


def test_ceil_div():
    assert ex.ceil_div(10, 3) == 4
    assert ex.ceil_div(9, 3) == 3
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day11.py
"""Day 11 — modules and the standard library. Use the imports below; don't reinvent them."""
import math
import random
from collections import Counter
from datetime import date
from pathlib import PurePosixPath


def top_words(words, n):
    """Most common n words as (word, count) pairs using collections.Counter."""
    return Counter(words).most_common(n)


def days_between(a, b):
    """Days from ISO date string a to b. days_between('2026-11-16', '2027-02-14') -> 90"""
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def distance(p, q):
    """Euclidean distance between two points (tuples), rounded to 4 dp. Use math."""
    return round(math.dist(p, q), 4)


def seeded_sample(items, k, seed):
    """k items chosen with random.Random(seed).sample — same seed, same result."""
    return random.Random(seed).sample(items, k)


def split_path(path):
    """'data/raw/prices.csv' -> ('data/raw', 'prices', '.csv') using PurePosixPath."""
    p = PurePosixPath(path)
    return (str(p.parent), p.stem, p.suffix)


def ceil_div(a, b):
    """How many batches of size b to cover a items. ceil_div(10, 3) -> 4"""
    return math.ceil(a / b)
```

</details>

**Done when:** `python ai90.py check 11` is all green → tick Day 11 in the tracker.

---

[← Day 10](day10-errors-and-debugging.md) · [All 90 days](README.md) · [Day 12 →](day12-comprehensions-generators-lambda.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
