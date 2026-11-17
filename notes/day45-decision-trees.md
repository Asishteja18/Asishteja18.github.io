# Day 45 — Decision trees

> **AI-90** · Block 2 · Machine learning from scratch · Day 45 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 45`)

[← Day 44](day44-naive-bayes-an-sms-spam-filter.md) · [All 90 days](README.md) · [Day 46 →](day46-random-forests.md)

---

**Dataset:** Iris, then Titanic · **Time:** ~2.5 h

#### Visual

```text
                 petal_len ≤ 2.45 ?
                 ╱ yes          ╲ no
          [setosa 50]       petal_wid ≤ 1.75 ?
                             ╱ yes        ╲ no
                      [versicolor 49,   [virginica 45,
                       virginica 5]      versicolor 1]
 Gini(node) = 1 − Σ p_k²     pure node → 0      best split = biggest drop in weighted Gini
```

#### Notes

- A tree asks yes/no questions on one feature at a time, chosen greedily to make children purer.
- For each feature, try thresholds at midpoints between sorted unique values.
- Stop at `max_depth`, at `min_samples_split`, or when a node is pure. Leaf predicts majority class.
- Recursion: `build(X, y, depth)` calls itself on the left and right subsets.
- Trees overfit easily → limit depth, or average many trees (Day 46).

#### Your task — `day45.py`

- `gini(y)` → impurity.
- `best_split(X, y)` → `(feature, threshold, gain)` or `None` if no split helps.
- `class DecisionTree(max_depth=5, min_samples_split=2)` with `fit`, `predict`, `depth()`; nodes are dicts `{"leaf": label}` or `{"f", "t", "left", "right"}`.

#### Tests

```python
# file: test_day45.py
import numpy as np
from sklearn.tree import DecisionTreeClassifier

import day45 as ex
from day23 import load_iris_xy
from day35 import train_test_split


def test_gini():
    assert ex.gini(np.array([0, 0, 0])) == 0.0 and ex.gini(np.array([0, 1])) == 0.5


def test_best_split_iris_root():
    X, y = load_iris_xy()
    f, t, gain = ex.best_split(X, y)
    assert f in (2, 3) and gain > 0.3   # a petal feature isolates setosa


def test_no_split_when_pure():
    assert ex.best_split(np.array([[1.0], [2.0]]), np.array([1, 1])) is None


def test_iris_accuracy_and_depth():
    X, y = load_iris_xy()
    Xtr, Xte, ytr, yte = train_test_split(X, y, seed=0)
    t = ex.DecisionTree(max_depth=3).fit(Xtr, ytr)
    sk = DecisionTreeClassifier(max_depth=3, random_state=0).fit(Xtr, ytr).score(Xte, yte)
    acc = (t.predict(Xte) == yte).mean()
    assert t.depth() <= 3 and acc > 0.85 and abs(acc - sk) < 0.07
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day45.py
import numpy as np


def gini(y):
    if len(y) == 0:
        return 0.0
    p = np.bincount(y) / len(y)
    return float(1 - (p ** 2).sum())


def best_split(X, y):
    parent, n = gini(y), len(y)
    best = None
    for f in range(X.shape[1]):
        vals = np.unique(X[:, f])
        for t in (vals[:-1] + vals[1:]) / 2:
            left = X[:, f] <= t
            g = parent - (left.sum() * gini(y[left]) + (~left).sum() * gini(y[~left])) / n
            if g > 1e-12 and (best is None or g > best[2]):
                best = (f, float(t), float(g))
    return best


class DecisionTree:
    def __init__(self, max_depth=5, min_samples_split=2):
        self.max_depth, self.min_samples_split = max_depth, min_samples_split

    def _build(self, X, y, depth):
        majority = int(np.bincount(y).argmax())
        if depth >= self.max_depth or len(y) < self.min_samples_split or gini(y) == 0:
            return {"leaf": majority}
        split = best_split(X, y)
        if split is None:
            return {"leaf": majority}
        f, t, _ = split
        m = X[:, f] <= t
        return {"f": f, "t": t, "left": self._build(X[m], y[m], depth + 1),
                "right": self._build(X[~m], y[~m], depth + 1)}

    def fit(self, X, y):
        self.root_ = self._build(np.asarray(X, float), np.asarray(y), 0)
        return self

    def _one(self, x, node):
        while "leaf" not in node:
            node = node["left"] if x[node["f"]] <= node["t"] else node["right"]
        return node["leaf"]

    def predict(self, X):
        return np.array([self._one(x, self.root_) for x in np.asarray(X, float)])

    def depth(self, node=None):
        node = node or self.root_
        return 0 if "leaf" in node else 1 + max(self.depth(node["left"]), self.depth(node["right"]))
```

</details>

**Done when:** green. Print your tree's root question on iris — does it match the visual?

---

[← Day 44](day44-naive-bayes-an-sms-spam-filter.md) · [All 90 days](README.md) · [Day 46 →](day46-random-forests.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
