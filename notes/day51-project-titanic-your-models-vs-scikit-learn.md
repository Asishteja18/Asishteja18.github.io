# Day 51 — Project: Titanic, your models vs scikit-learn

> **AI-90** · Block 2 · Machine learning from scratch · Day 51 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 51`)

[← Day 50](day50-scikit-learn-pipelines-and-grid-search.md) · [All 90 days](README.md) · [Day 52 →](day52-gradient-boosting-from-scratch.md)

---

**Dataset:** Titanic · **Time:** ~3 h

#### Visual

```text
 model                       CV accuracy (5-fold)
 ─────────────────────────── ────────────────────
 RandomForest (yours)        0.816 ± 0.024  ████████████████▎
 DecisionTree d=4 (yours)    0.800 ± 0.010  ████████████████
 LogisticRegression (yours)  0.797 ± 0.031  ███████████████▉
 kNN k=7 (yours)             0.793 ± 0.004  ███████████████▊
 always "died" baseline      0.616          ████████████▎      (real run of this day's script)
```

#### Notes

- Project rhythm: features (Day 49) → several models → same CV folds for all → table → pick → final test once.
- Scale inside each fold for distance/gradient models. Wrap "scaler + model" in a small class.
- Write up what you'd try next (feature ideas: title from name, cabin deck, fare per person).

#### Your task — `day51.py`

- `class Scaled(model_factory)` → `fit` standardises (Day 34) then fits; `predict` transforms then predicts.
- `compare(models, X, y, k=5)` → list of `(name, mean, std)` sorted by mean desc (rounded 3), using Day 42's `cross_val_score` with the same seed for every model.

#### Tests

```python
# file: test_day51.py
import numpy as np

import day51 as ex
from day39 import LogisticRegression
from day43 import KNNClassifier
from day45 import DecisionTree


def blobs(seed=0):
    rng = np.random.default_rng(seed)
    X = np.vstack([rng.normal(0, 1, (60, 3)), rng.normal(2.5, 1, (60, 3))]) * [1, 100, 0.01]
    return X, np.array([0] * 60 + [1] * 60)


def test_scaled_helps_knn():
    X, y = blobs()
    raw = ex.compare({"knn": lambda: KNNClassifier(5)}, X, y)[0][1]
    scaled = ex.compare({"knn": lambda: ex.Scaled(lambda: KNNClassifier(5))}, X, y)[0][1]
    assert scaled > raw


def test_compare_sorted():
    X, y = blobs()
    table = ex.compare({"tree": lambda: DecisionTree(3), "logreg": lambda: ex.Scaled(LogisticRegression)}, X, y)
    assert [len(r) for r in table] == [3, 3] and table[0][1] >= table[1][1]
    assert {r[0] for r in table} == {"tree", "logreg"}
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day51.py
import numpy as np

from day34 import StandardScaler
from day42 import cross_val_score


class Scaled:
    def __init__(self, model_factory):
        self.model_factory = model_factory

    def fit(self, X, y):
        self.scaler_ = StandardScaler().fit(X)
        self.model_ = self.model_factory().fit(self.scaler_.transform(X), y)
        return self

    def predict(self, X):
        return self.model_.predict(self.scaler_.transform(X))


def compare(models, X, y, k=5):
    rows = []
    for name, factory in models.items():
        s = cross_val_score(factory, X, y, k=k, seed=0)
        rows.append((name, round(float(s.mean()), 3), round(float(s.std()), 3)))
    return sorted(rows, key=lambda r: -r[1])


if __name__ == "__main__":
    from day24 import load_titanic
    from day39 import LogisticRegression
    from day43 import KNNClassifier
    from day45 import DecisionTree
    from day46 import RandomForest
    from day49 import TitanicFeatures
    df = load_titanic()
    X, names = TitanicFeatures().fit(df).transform(df)
    y = df["survived"].to_numpy()
    table = compare({"logreg": lambda: Scaled(lambda: LogisticRegression(l2=0.01)),
                     "knn7": lambda: Scaled(lambda: KNNClassifier(7)),
                     "tree4": lambda: DecisionTree(4), "forest": lambda: RandomForest(50, 6)}, X, y)
    for name, m, s in table:
        print(f"{name:8} {m:.3f} ± {s:.3f}")
```

</details>

**Done when:** green + your real Titanic table in the dev log.

---

[← Day 50](day50-scikit-learn-pipelines-and-grid-search.md) · [All 90 days](README.md) · [Day 52 →](day52-gradient-boosting-from-scratch.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
