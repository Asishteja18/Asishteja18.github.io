# Day 22 — Real dataset #1: Titanic, by hand

> **AI-90** · Block 1 · Python + automation + real data · Day 22 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 22`)

[← Day 21](day21-scheduling-and-idempotent-jobs.md) · [All 90 days](README.md) · [Day 23 →](day23-numpy-on-a-real-dataset-iris.md)

---

**Dataset:** Titanic passengers (891 rows) — `https://raw.githubusercontent.com/mwaskom/seaborn-data/master/titanic.csv` · **Time:** ~2 h

#### Visual

```text
 survival rate by sex (full dataset)
 female │████████████████████████████████████████▌ 0.74
 male   │███████████▍                             0.19
        └──────────────────────────────────────────
 ascii_bar(0.74, width=40) → "█" * round(0.74*40)
```

#### Notes

- This file builds your **dataset downloader with a cache** — every later day loads data through it.
- Pattern: if `data/titanic.csv` exists, use it; else download once and save. Never re-download on every run.
- Before pandas, do it by hand with `csv.DictReader`: everything is a string, blanks are `""`.
- Group → rate: count survivors and totals per group, divide.

#### Your task — `day22.py`

- `DATASETS` dict: `titanic`, `flights`, `sms`, `shakespeare`, `names`, `mpg`, `penguins` → `(url, filename)` (see solution).
- `download(name, folder="data", get=None)` → `Path`; uses cache; `get` defaults to `requests.get`.
- `survival_rate_by(rows, column)` → `{value: rate rounded to 3}` skipping blank values.
- `ascii_bar(fraction, width=40)` → `"█"` repeated `round(fraction*width)`.

#### Tests

```python
# file: test_day22.py
import csv
import io
import tempfile
from pathlib import Path

import day22 as ex

SAMPLE = """survived,pclass,sex,age
1,1,female,38
0,3,male,22
1,3,female,26
0,1,male,
1,2,male,4
"""


def rows():
    return list(csv.DictReader(io.StringIO(SAMPLE)))


def test_survival_rate_by():
    assert ex.survival_rate_by(rows(), "sex") == {"female": 1.0, "male": 0.333}
    assert ex.survival_rate_by(rows(), "pclass") == {"1": 0.5, "3": 0.5, "2": 1.0}


def test_ascii_bar():
    assert ex.ascii_bar(0.5, 10) == "█████"
    assert ex.ascii_bar(0, 10) == ""


def test_download_uses_cache():
    folder = Path(tempfile.mkdtemp())
    calls = []

    class R:
        text = SAMPLE
        def raise_for_status(self): pass

    def get(url, timeout):
        calls.append(url)
        return R()

    p1 = ex.download("titanic", folder, get=get)
    p2 = ex.download("titanic", folder, get=get)
    assert p1 == p2 == folder / "titanic.csv"
    assert len(calls) == 1 and p1.read_text().startswith("survived")
    assert set(ex.DATASETS) >= {"titanic", "flights", "sms", "shakespeare", "names"}
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day22.py
from pathlib import Path

GH = "https://raw.githubusercontent.com"
DATASETS = {
    "titanic": (f"{GH}/mwaskom/seaborn-data/master/titanic.csv", "titanic.csv"),
    "flights": (f"{GH}/mwaskom/seaborn-data/master/flights.csv", "flights.csv"),
    "sms": (f"{GH}/justmarkham/pycon-2016-tutorial/master/data/sms.tsv", "sms.tsv"),
    "shakespeare": (f"{GH}/karpathy/char-rnn/master/data/tinyshakespeare/input.txt", "shakespeare.txt"),
    "names": (f"{GH}/karpathy/makemore/master/names.txt", "names.txt"),
    "mpg": (f"{GH}/mwaskom/seaborn-data/master/mpg.csv", "mpg.csv"),
    "penguins": (f"{GH}/mwaskom/seaborn-data/master/penguins.csv", "penguins.csv"),
}


def download(name, folder="data", get=None):
    url, filename = DATASETS[name]
    path = Path(folder) / filename
    if path.exists():
        return path
    if get is None:
        import requests
        get = requests.get
    r = get(url, timeout=30)
    r.raise_for_status()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(r.text, encoding="utf-8")
    return path


def survival_rate_by(rows, column):
    tot, surv = {}, {}
    for r in rows:
        v = r[column]
        if v == "":
            continue
        tot[v] = tot.get(v, 0) + 1
        surv[v] = surv.get(v, 0) + int(r["survived"])
    return {k: round(surv[k] / tot[k], 3) for k in tot}


def ascii_bar(fraction, width=40):
    return "█" * round(fraction * width)


if __name__ == "__main__":
    import csv
    with open(download("titanic"), newline="", encoding="utf-8") as f:
        data = list(csv.DictReader(f))
    for col in ("sex", "pclass", "embarked"):
        print(f"\nsurvival by {col}")
        for k, v in sorted(survival_rate_by(data, col).items()):
            print(f"  {k:8} {ascii_bar(v)} {v}")
```

</details>

**Done when:** green + `python day22.py` prints real Titanic bars (female ≈ 0.742, male ≈ 0.189).

---

[← Day 21](day21-scheduling-and-idempotent-jobs.md) · [All 90 days](README.md) · [Day 23 →](day23-numpy-on-a-real-dataset-iris.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
