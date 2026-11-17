# Day 60 — Block 2 capstone: `minisklearn` benchmark

> **AI-90** · Block 2 · Machine learning from scratch · Day 60 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 60`)

[← Day 59](day59-explaining-models-permutation-importance.md) · [All 90 days](README.md) · [Day 61 →](day61-the-perceptron.md)

---

**Dataset:** Iris, Wine, Breast Cancer, Digits · **Time:** ~3 h

#### Visual

```text
 minisklearn/                       benchmark: yours vs scikit-learn (test accuracy)
 ├── linear.py   (Days 36-41)       dataset        model     yours   sklearn   Δ     (real run)
 ├── neighbors.py (43)              wine           softmax   0.972   0.972    0.000
 ├── tree.py     (45, 52)           digits         knn5      0.981   0.981    0.000
 ├── ensemble.py (46, 52)           digits         forest    0.972   0.978   -0.006
 ├── cluster.py  (47) decomp (48)   breast_cancer  forest    0.956   0.982   -0.026
 └── metrics.py  (35, 40)
```

#### Notes

- Collect your Block 2 classes into a package `minisklearn/` (copy the classes, keep tests).
- The benchmark proves it: same splits, same settings, yours vs the library.
- Write the README: what each model is, the table, what you learned. This repo is portfolio material.
- Block 3 starts tomorrow: from models you **fit** to networks you **train** — with your own autograd engine.

#### Your task — `day60.py`

- `DATASETS = {"iris": load_iris, "wine": load_wine, "breast_cancer": load_breast_cancer, "digits": load_digits}`.
- `benchmark(pairs, seed=0)` where `pairs` = list of `(dataset_name, model_name, ours_factory, sklearn_factory)` → list of dicts `{dataset, model, ours, sklearn, delta}` (accuracy on a seeded 80/20 split, features standardised on train, all rounded 3).
- `to_markdown(rows)` → table via Day 30's `md_table`.

#### Tests

```python
# file: test_day60.py
from sklearn.linear_model import LogisticRegression as SkLR
from sklearn.neighbors import KNeighborsClassifier

import day60 as ex
from day41 import SoftmaxRegression
from day43 import KNNClassifier


def test_benchmark():
    rows = ex.benchmark([("iris", "knn", lambda: KNNClassifier(5), lambda: KNeighborsClassifier(5)),
                         ("wine", "softmax", lambda: SoftmaxRegression(), lambda: SkLR(max_iter=2000))])
    assert [r["dataset"] for r in rows] == ["iris", "wine"]
    for r in rows:
        assert set(r) == {"dataset", "model", "ours", "sklearn", "delta"}
        assert r["ours"] >= 0.85 and abs(r["delta"]) <= 0.05 and r["delta"] == round(r["ours"] - r["sklearn"], 3)
    md = ex.to_markdown(rows)
    assert md.splitlines()[0] == "| dataset | model | ours | sklearn | delta |" and len(md.splitlines()) == 4
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day60.py
import numpy as np
from sklearn.datasets import load_breast_cancer, load_digits, load_iris, load_wine

from day30 import md_table
from day34 import StandardScaler
from day35 import train_test_split

DATASETS = {"iris": load_iris, "wine": load_wine, "breast_cancer": load_breast_cancer, "digits": load_digits}


def benchmark(pairs, seed=0):
    rows = []
    for ds, model, ours_f, sk_f in pairs:
        d = DATASETS[ds]()
        Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=seed)
        s = StandardScaler().fit(Xtr)
        a, b = s.transform(Xtr), s.transform(Xte)
        ours = round(float(np.mean(ours_f().fit(a, ytr).predict(b) == yte)), 3)
        sk = round(float(np.mean(sk_f().fit(a, ytr).predict(b) == yte)), 3)
        rows.append({"dataset": ds, "model": model, "ours": ours, "sklearn": sk, "delta": round(ours - sk, 3)})
    return rows


def to_markdown(rows):
    cols = ["dataset", "model", "ours", "sklearn", "delta"]
    return md_table([[r[c] for c in cols] for r in rows], cols)


if __name__ == "__main__":
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression as SkLR
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.tree import DecisionTreeClassifier
    from day41 import SoftmaxRegression
    from day43 import KNNClassifier
    from day45 import DecisionTree
    from day46 import RandomForest
    pairs = []
    for ds in DATASETS:
        pairs += [(ds, "softmax", SoftmaxRegression, lambda: SkLR(max_iter=3000)),
                  (ds, "knn5", lambda: KNNClassifier(5), lambda: KNeighborsClassifier(5)),
                  (ds, "tree5", lambda: DecisionTree(5), lambda: DecisionTreeClassifier(max_depth=5, random_state=0)),
                  (ds, "forest", lambda: RandomForest(30, 8), lambda: RandomForestClassifier(30, max_depth=8, random_state=0))]
    print(to_markdown(benchmark(pairs)))
```

</details>

**Done when:** green + the full real benchmark table in your `minisklearn` README. **Block 2 complete — `python ai90.py progress`.**

---

[← Day 59](day59-explaining-models-permutation-importance.md) · [All 90 days](README.md) · [Day 61 →](day61-the-perceptron.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
