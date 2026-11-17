# Day 26 — Spreadsheet automation: Excel reports

> **AI-90** · Block 1 · Python + automation + real data · Day 26 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 26`)

[← Day 25](day25-visualising-data-with-matplotlib.md) · [All 90 days](README.md) · [Day 27 →](day27-a-reusable-data-cleaning-pipeline.md)

---

**Dataset:** Flights — monthly airline passengers 1949–1960 (`download("flights")`) · **Time:** ~2 h

#### Visual

```text
 flights.csv (long)              pivot_flights() (wide)            → report.xlsx
 year  month  passengers         month  1949 1950 … 1960           ┌──────────────┐
 1949  Jan    112       ──────▶  Jan     112  115 … 417            │ bold header  │
 1949  Feb    118                Feb     118  126 … 391            │ widths fit   │
 …                               … (12 rows × 12 years)            └──────────────┘
```

#### Notes

- Long vs wide: `df.pivot(index="month", columns="year", values="passengers")`.
- Keep month order: `pd.Categorical(df.month, categories=[...], ordered=True)` or reindex with a month list.
- Write: `with pd.ExcelWriter(path, engine="openpyxl") as w: df.to_excel(w, sheet_name="...")`.
- Style with openpyxl after writing: `ws["A1"].font = Font(bold=True)`, `ws.column_dimensions["A"].width = 12`.
- This is the "weekly report nobody has to make by hand" pattern — useful at any job.

#### Your task — `day26.py`

- `MONTHS` list Jan…Dec.
- `pivot_flights(df)` → months (in calendar order) × years table of passengers.
- `yearly_totals(df)` → Series year → total passengers.
- `write_report(sheets, path)` → writes a dict `{sheet_name: DataFrame}` to xlsx with bold header row; returns path.

#### Tests

```python
# file: test_day26.py
import tempfile
from pathlib import Path

import pandas as pd
from openpyxl import load_workbook

import day26 as ex


def frame():
    rows = [(y, m, 100 + i + 10 * (y - 1949)) for y in (1949, 1950) for i, m in enumerate(ex.MONTHS)]
    return pd.DataFrame(rows, columns=["year", "month", "passengers"]).sample(frac=1, random_state=0)


def test_pivot_order():
    p = ex.pivot_flights(frame())
    assert list(p.index) == ex.MONTHS and list(p.columns) == [1949, 1950]
    assert p.loc["Jan", 1949] == 100 and p.loc["Dec", 1950] == 121


def test_yearly_totals():
    t = ex.yearly_totals(frame())
    assert t[1949] == sum(range(100, 112))


def test_write_report():
    path = Path(tempfile.mkdtemp()) / "r.xlsx"
    ex.write_report({"pivot": ex.pivot_flights(frame()), "totals": ex.yearly_totals(frame()).to_frame()}, path)
    wb = load_workbook(path)
    assert wb.sheetnames == ["pivot", "totals"]
    assert wb["pivot"]["B1"].font.bold
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day26.py
from pathlib import Path

import pandas as pd
from openpyxl.styles import Font

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def pivot_flights(df):
    p = df.pivot(index="month", columns="year", values="passengers")
    return p.reindex(MONTHS)


def yearly_totals(df):
    return df.groupby("year")["passengers"].sum()


def write_report(sheets, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        for name, frame in sheets.items():
            frame.to_excel(w, sheet_name=name)
            ws = w.sheets[name]
            for cell in ws[1]:
                cell.font = Font(bold=True)
            ws.column_dimensions["A"].width = 12
    return path


if __name__ == "__main__":
    from day22 import download
    df = pd.read_csv(download("flights"))
    print(write_report({"by month": pivot_flights(df), "yearly": yearly_totals(df).to_frame()}, "reports/flights.xlsx"))
```

</details>

**Done when:** green + open `reports/flights.xlsx` and spot the summer peak every year.

---

[← Day 25](day25-visualising-data-with-matplotlib.md) · [All 90 days](README.md) · [Day 27 →](day27-a-reusable-data-cleaning-pipeline.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
