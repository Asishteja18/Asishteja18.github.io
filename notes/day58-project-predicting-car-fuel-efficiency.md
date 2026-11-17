# Day 58 — Project: predicting car fuel efficiency

> **AI-90** · Block 2 · Machine learning from scratch · Day 58 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 58`)

[← Day 57](day57-learning-curves-diagnosing-bias-vs-variance.md) · [All 90 days](README.md) · [Day 59 →](day59-explaining-models-permutation-importance.md)

---

**Dataset:** Car MPG (398 cars, 1970–82) — `download("mpg")` · **Time:** ~3 h

#### Visual

```text
 mpg vs weight                 model           CV R² (real run)
 45 ┤●                         ─────────────── ─────────────
    │ ●●●                      GBoost (yours)  0.867 ± 0.012
 30 ┤   ●●●●●                  Linear (yours)  0.844 ± 0.031
    │       ●●●●●●●            Ridge  (yours)  0.842 ± 0.032
 10 ┤            ●●●●●●●●      Mean baseline   0.000
    └──────────────────── weight
```

#### Notes

- Full project, regression this time: clean (horsepower has missing values), engineer (one-hot `origin`, `log(weight)`), compare models with CV R², explain results.
- Keep the whole thing in one reproducible script — someone else should get your numbers.

#### Your task — `day58.py`

- `mpg_features(df)` → `(X, names, y)`: drop rows with missing horsepower; numeric `cylinders, displacement, horsepower, weight, acceleration, model_year`, plus `log_weight`, plus one-hot `origin_europe, origin_japan, origin_usa` (sorted).
- `run(df, k=5)` → Day 51-style table for `linear`, `ridge` (alpha 1, scaled), `gboost` using R² (`metric=r2`).

#### Tests

```python
# file: test_day58.py
import numpy as np
import pandas as pd

import day58 as ex


def frame(n=80, seed=0):
    rng = np.random.default_rng(seed)
    w = rng.uniform(1600, 5000, n)
    df = pd.DataFrame({"cylinders": rng.choice([4, 6, 8], n), "displacement": w / 15, "horsepower": w / 30,
                       "weight": w, "acceleration": rng.uniform(8, 24, n), "model_year": rng.integers(70, 83, n),
                       "origin": rng.choice(["usa", "japan", "europe"], n)})
    df["mpg"] = 60 - 0.008 * w + 0.3 * (df.model_year - 70) + rng.normal(0, 1, n)
    df.loc[3, "horsepower"] = np.nan
    return df


def test_features():
    X, names, y = ex.mpg_features(frame())
    assert X.shape == (79, 10) and len(y) == 79
    assert names[-4:] == ["log_weight", "origin_europe", "origin_japan", "origin_usa"]


def test_run():
    table = ex.run(frame())
    assert {r[0] for r in table} == {"linear", "ridge", "gboost"} and table[0][1] > 0.8
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day58.py
import numpy as np

from day35 import r2
from day36 import LinearRegressionClosed
from day38 import Ridge
from day42 import cross_val_score
from day51 import Scaled
from day52 import GradientBoostingRegressor

NUM = ["cylinders", "displacement", "horsepower", "weight", "acceleration", "model_year"]


def mpg_features(df):
    df = df.dropna(subset=["horsepower"])
    cols = [df[c].to_numpy(float) for c in NUM] + [np.log(df["weight"].to_numpy(float))]
    names = NUM + ["log_weight"]
    for o in sorted(df["origin"].unique()):
        cols.append((df["origin"] == o).to_numpy(float))
        names.append(f"origin_{o}")
    return np.column_stack(cols), names, df["mpg"].to_numpy(float)


def run(df, k=5):
    X, _, y = mpg_features(df)
    models = {"linear": LinearRegressionClosed, "ridge": lambda: Scaled(lambda: Ridge(1.0)),
              "gboost": lambda: GradientBoostingRegressor(150, 0.05, 2)}
    rows = []
    for name, f in models.items():
        s = cross_val_score(f, X, y, k=k, metric=r2, seed=0)
        rows.append((name, round(float(s.mean()), 3), round(float(s.std()), 3)))
    return sorted(rows, key=lambda r: -r[1])


if __name__ == "__main__":
    import pandas as pd
    from day22 import download
    for row in run(pd.read_csv(download("mpg"))):
        print(row)
```

</details>

**Done when:** green + real MPG table + a 5-line write-up.

---

[← Day 57](day57-learning-curves-diagnosing-bias-vs-variance.md) · [All 90 days](README.md) · [Day 59 →](day59-explaining-models-permutation-importance.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
