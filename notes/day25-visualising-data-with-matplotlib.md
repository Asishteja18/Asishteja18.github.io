# Day 25 — Visualising data with Matplotlib

> **AI-90** · Block 1 · Python + automation + real data · Day 25 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 25`)

[← Day 24](day24-pandas-on-real-data-cleaning-titanic.md) · [All 90 days](README.md) · [Day 26 →](day26-spreadsheet-automation-excel-reports.md)

---

**Dataset:** Iris + Titanic · **Time:** ~2 h

#### Visual

```text
 hist (age)              scatter (petal length vs width, coloured by species)
  ▇                       width │            ▲▲▲
  ▇▇▇                          │       ■■■■ ▲▲
 ▁▇▇▇▇▅▃▁                      │ ●●       
 0  20  40  60 80              └──────────── length
 fig, ax = plt.subplots()  →  ONE figure, ONE axes.  Always label axes + title.
```

#### Notes

- Use the object API: `fig, ax = plt.subplots()`, then `ax.hist`, `ax.scatter`, `ax.plot`, `ax.set_xlabel`, `ax.set_title`, `ax.legend()`.
- In scripts/servers use `matplotlib.use("Agg")` (no window) and `fig.savefig("out.png", dpi=120)`.
- Return the `Figure` from functions — callers decide to show or save; tests can inspect it.
- One chart, one message. Label axes with units.

#### Your task — `day25.py`

- `plot_hist(values, bins, title, xlabel)` → Figure with one axes.
- `plot_classes(X2, y, names, xlabel, ylabel)` → scatter, one `ax.scatter` per class, legend with `names`.
- `plot_bars(mapping, title)` → bar chart of a dict (e.g. survival rate by group).
- `save(fig, path)` → saves PNG, returns path.

#### Tests

```python
# file: test_day25.py
import tempfile
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import numpy as np  # noqa: E402

import day25 as ex  # noqa: E402


def test_hist():
    fig = ex.plot_hist([1, 2, 2, 3, 3, 3], 3, "Ages", "age (years)")
    ax = fig.axes[0]
    assert len(fig.axes) == 1 and ax.get_title() == "Ages" and ax.get_xlabel() == "age (years)"
    assert len(ax.patches) == 3


def test_classes():
    X = np.array([[1, 1], [2, 2], [5, 5]]); y = np.array([0, 0, 1])
    ax = ex.plot_classes(X, y, ["a", "b"], "x", "y").axes[0]
    assert len(ax.collections) == 2
    assert [t.get_text() for t in ax.get_legend().get_texts()] == ["a", "b"]


def test_bars_and_save():
    fig = ex.plot_bars({"female": 0.74, "male": 0.19}, "Survival")
    assert len(fig.axes[0].patches) == 2
    p = ex.save(fig, Path(tempfile.mkdtemp()) / "s.png")
    assert p.exists() and p.stat().st_size > 1000
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day25.py
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402


def plot_hist(values, bins, title, xlabel):
    fig, ax = plt.subplots()
    ax.hist(values, bins=bins, edgecolor="white")
    ax.set_title(title); ax.set_xlabel(xlabel); ax.set_ylabel("count")
    return fig


def plot_classes(X2, y, names, xlabel, ylabel):
    fig, ax = plt.subplots()
    for c, name in enumerate(names):
        pts = X2[np.asarray(y) == c]
        ax.scatter(pts[:, 0], pts[:, 1], label=name, s=18)
    ax.set_xlabel(xlabel); ax.set_ylabel(ylabel); ax.legend()
    return fig


def plot_bars(mapping, title):
    fig, ax = plt.subplots()
    ax.bar(list(map(str, mapping)), list(mapping.values()))
    ax.set_title(title)
    return fig


def save(fig, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=120, bbox_inches="tight")
    plt.close(fig)
    return path


if __name__ == "__main__":
    from day23 import load_iris_xy
    from day24 import clean_titanic, load_titanic
    X, y = load_iris_xy()
    save(plot_classes(X[:, 2:4], y, ["setosa", "versicolor", "virginica"], "petal length (cm)", "petal width (cm)"),
         "plots/iris.png")
    df = clean_titanic(load_titanic())
    save(plot_hist(df["age"], 30, "Titanic passenger ages", "age (years)"), "plots/titanic_age.png")
    save(plot_bars(df.groupby("sex")["survived"].mean().round(2).to_dict(), "Survival by sex"), "plots/survival.png")
    print("saved plots/")
```

</details>

**Done when:** green + three real PNGs in `plots/`. Open them — what's the clearest story in each?

---

[← Day 24](day24-pandas-on-real-data-cleaning-titanic.md) · [All 90 days](README.md) · [Day 26 →](day26-spreadsheet-automation-excel-reports.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
