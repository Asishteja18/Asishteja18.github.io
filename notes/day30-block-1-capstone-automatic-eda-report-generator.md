# Day 30 — Block 1 capstone: automatic EDA report generator

> **AI-90** · Block 1 · Python + automation + real data · Day 30 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 30`)

[← Day 29](day29-the-data-collector-bot.md) · [All 90 days](README.md) · [Day 31 →](day31-vectors-and-matrices-for-ml.md)

---

**Dataset:** run it on Titanic, Iris and Flights — any CSV · **Time:** ~3 h

#### Visual

```text
 any.csv ──▶ eda_report() ──▶ reports/titanic/
                                ├── report.md   ← shape, dtypes, missing, stats, top values
                                ├── hist_age.png
                                ├── hist_fare.png
                                └── …one histogram per numeric column
```

#### Notes

- Exploratory Data Analysis = the first hour with any new dataset. Automate it once, use it forever.
- Markdown tables: `df.to_markdown()` needs `tabulate`; build simple tables yourself to stay dependency-free.
- Reuse: Day 25 `plot_hist` + `save`, Day 27 `missing_report`.
- Block 1 retro: you can now fetch, scrape, schedule, clean, plot and report on real data. Block 2 makes predictions from it.

#### Your task — `day30.py`

- `md_table(rows, headers)` → Markdown table string.
- `eda_report(df, title)` → Markdown string containing: `# <title>`, `Rows: n · Columns: m`, a dtypes table, a missing-values section (or `No missing values.`), numeric summary (mean/std/min/max, 2 dp), top 3 values for each text column.
- `save_eda(df, title, out_dir)` → writes `report.md` + `hist_<col>.png` per numeric column; returns list of written paths.

#### Tests

```python
# file: test_day30.py
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

import day30 as ex


def frame():
    return pd.DataFrame({"age": [22.0, 38, np.nan, 35], "fare": [7.25, 71.28, 7.92, 53.1],
                         "sex": ["male", "female", "female", "female"]})


def test_md_table():
    assert ex.md_table([["a", 1]], ["k", "v"]) == "| k | v |\n| --- | --- |\n| a | 1 |"


def test_report_content():
    r = ex.eda_report(frame(), "Mini Titanic")
    assert r.startswith("# Mini Titanic")
    assert "Rows: 4 · Columns: 3" in r
    assert "| age | 1 | 25.0 |" in r          # missing row: column, n, pct
    assert "| fare | 34.89 |" in r            # numeric summary starts with the mean
    assert "female (3)" in r


def test_no_missing_message():
    assert "No missing values." in ex.eda_report(frame().dropna(), "x")


def test_save_eda():
    out = Path(tempfile.mkdtemp()) / "eda"
    paths = ex.save_eda(frame(), "t", out)
    assert {p.name for p in paths} == {"report.md", "hist_age.png", "hist_fare.png"}
    assert all(p.exists() for p in paths)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day30.py
from pathlib import Path

from day25 import plot_hist, save
from day27 import missing_report


def md_table(rows, headers):
    lines = ["| " + " | ".join(map(str, headers)) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    lines += ["| " + " | ".join(map(str, r)) + " |" for r in rows]
    return "\n".join(lines)


def eda_report(df, title):
    out = [f"# {title}", "", f"Rows: {len(df)} · Columns: {df.shape[1]}", "", "## Types", "",
           md_table([[c, str(t)] for c, t in df.dtypes.items()], ["column", "dtype"]), "", "## Missing values", ""]
    miss = missing_report(df)
    out.append(md_table(miss.values.tolist(), ["column", "n_missing", "pct"]) if len(miss) else "No missing values.")
    num = df.select_dtypes("number")
    if num.shape[1]:
        rows = [[c, *(round(float(v), 2) for v in (num[c].mean(), num[c].std(), num[c].min(), num[c].max()))]
                for c in num.columns]
        out += ["", "## Numeric summary", "", md_table(rows, ["column", "mean", "std", "min", "max"])]
    text = df.select_dtypes(exclude="number")
    if text.shape[1]:
        out += ["", "## Top values", ""]
        for c in text.columns:
            top = df[c].value_counts().head(3)
            out.append(f"- **{c}**: " + ", ".join(f"{k} ({v})" for k, v in top.items()))
    return "\n".join(out) + "\n"


def save_eda(df, title, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.md").write_text(eda_report(df, title), encoding="utf-8")
    paths = [out / "report.md"]
    for c in df.select_dtypes("number").columns:
        paths.append(save(plot_hist(df[c].dropna(), 20, f"{title}: {c}", c), out / f"hist_{c}.png"))
    return paths


if __name__ == "__main__":
    import pandas as pd
    from day22 import download
    for name in ("titanic", "flights"):
        print(save_eda(pd.read_csv(download(name)), name.title(), f"reports/{name}"))
```

</details>

**Done when:** green + `python day30.py` writes real reports for Titanic and Flights. **Block 1 complete — run `python ai90.py progress`.**

---

[← Day 29](day29-the-data-collector-bot.md) · [All 90 days](README.md) · [Day 31 →](day31-vectors-and-matrices-for-ml.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
