# Day 24 — Pandas on real data: cleaning Titanic

> **AI-90** · Block 1 · Python + automation + real data · Day 24 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 24`)

[← Day 23](day23-numpy-on-a-real-dataset-iris.md) · [All 90 days](README.md) · [Day 25 →](day25-visualising-data-with-matplotlib.md)

---

**Dataset:** Titanic (via Day 22's `download`) · **Time:** ~2 h

#### Visual

```text
 df.isna().sum()          before       after clean_titanic()
 age        177  ─────▶  median fill   0
 embarked     2  ─────▶  mode fill     0
 deck       688  ─────▶  column dropped
 duplicates 107  ─────▶  dropped
 survival_table(df):        pclass   1     2     3
                     sex  female   0.97  0.92  0.47
                          male     0.37  0.18  0.16      (real run)
```

#### Notes

- `pd.read_csv(path)`, `df.head()`, `df.info()`, `df.describe()`, `df.isna().sum()`.
- Select: `df["age"]`, `df[["age","sex"]]`, filter `df[df.age > 30]`, `df.loc[rows, cols]`.
- Fill missing: `df["age"] = df["age"].fillna(df["age"].median())` — assign back (pandas 3 is copy-on-write; `inplace` on a column won't stick).
- Group: `df.groupby(["sex","pclass"])["survived"].mean().unstack()`.
- Return a **new** cleaned frame (`df = df.copy()` first) — never mutate the caller's data.

#### Your task — `day24.py`

- `load_titanic(folder="data")` → DataFrame (uses `day22.download`).
- `clean_titanic(df)` → copy with: duplicates dropped, `deck` dropped if present, `age` NaN → median, `embarked` NaN → mode, index reset.
- `survival_table(df)` → sex × pclass mean survival, rounded to 2.

#### Tests

```python
# file: test_day24.py
import numpy as np
import pandas as pd

import day24 as ex


def frame():
    return pd.DataFrame({
        "survived": [1, 0, 1, 0, 0, 0],
        "pclass": [1, 3, 3, 1, 3, 3],
        "sex": ["female", "male", "female", "male", "male", "male"],
        "age": [38.0, 22.0, np.nan, 54.0, 22.0, 22.0],
        "embarked": ["C", "S", None, "S", "S", "S"],
        "deck": ["C", None, None, "E", None, None],
    })


def test_clean():
    raw = frame()
    df = ex.clean_titanic(raw)
    assert "deck" not in df.columns
    assert df["age"].isna().sum() == 0 and df["embarked"].isna().sum() == 0
    assert len(df) == 4, "duplicates (rows 1, 4, 5 are identical) must go"
    assert df.loc[2, "age"] == 38.0  # median of the ages left after dedupe: 38, 22, 54
    assert df.loc[2, "embarked"] == "S"  # mode of C, S, S
    assert raw["age"].isna().sum() == 1, "don't modify the input"


def test_survival_table():
    t = ex.survival_table(ex.clean_titanic(frame()))
    assert t.loc["female", 1] == 1.0 and t.loc["male", 3] == 0.0
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day24.py
import pandas as pd

from day22 import download


def load_titanic(folder="data"):
    return pd.read_csv(download("titanic", folder))


def clean_titanic(df):
    df = df.copy().drop_duplicates()
    if "deck" in df.columns:
        df = df.drop(columns="deck")
    df["age"] = df["age"].fillna(df["age"].median())
    df["embarked"] = df["embarked"].fillna(df["embarked"].mode()[0])
    return df.reset_index(drop=True)


def survival_table(df):
    return df.groupby(["sex", "pclass"])["survived"].mean().unstack().round(2)


if __name__ == "__main__":
    raw = load_titanic()
    print(raw.isna().sum(), "\n")
    print(survival_table(clean_titanic(raw)))
```

</details>

**Done when:** green + `python day24.py` shows the real sex × class table.

---

[← Day 23](day23-numpy-on-a-real-dataset-iris.md) · [All 90 days](README.md) · [Day 25 →](day25-visualising-data-with-matplotlib.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
