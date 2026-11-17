# Day 46 — Random forests

> **AI-90** · Block 2 · Machine learning from scratch · Day 46 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 46`)

[← Day 45](day45-decision-trees.md) · [All 90 days](README.md) · [Day 47 →](day47-k-means-clustering.md)

---

**Dataset:** Breast Cancer · **Time:** ~2 h

#### Visual

```text
 bootstrap sample 1 ──▶ 🌳 tree 1 (random features) ─┐
 bootstrap sample 2 ──▶ 🌳 tree 2 (random features) ─┼─▶ majority vote ─▶ prediction
 bootstrap sample 3 ──▶ 🌳 tree 3 (random features) ─┘
 one deep tree = high variance.  Average many DIFFERENT trees → variance drops, bias stays low.
```

#### Notes

- **Bagging** = train each model on a bootstrap sample (draw n rows *with replacement*).
- **Random features** make the trees disagree more, so averaging helps more. Each split only looks at a random √d of the features (subclass your Day 45 tree and override `_build`).
- Out-of-bag rows (~37% not drawn) give a free validation estimate.
- Forests are a strong default for tabular data. Gradient boosting (Day 52) is the other one.

#### Your task — `day46.py`

- `bootstrap(n, rng)` → index array of size n drawn with replacement.
- `class ForestTree(DecisionTree)` — same as Day 45 but each split searches a random subset of `m` features.
- `class RandomForest(n_trees=25, max_depth=6, max_features="sqrt", seed=0)` → `trees_` list; `predict` = majority vote.

#### Tests

```python
# file: test_day46.py
import numpy as np
from sklearn.datasets import load_breast_cancer

import day46 as ex
from day35 import train_test_split
from day45 import DecisionTree


def test_bootstrap():
    idx = ex.bootstrap(1000, np.random.default_rng(0))
    assert len(idx) == 1000 and 0.55 < len(set(idx)) / 1000 < 0.70  # ≈ 63% unique


def test_forest_beats_or_matches_tree():
    d = load_breast_cancer()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=2)
    forest = ex.RandomForest(n_trees=25, max_depth=6, seed=0).fit(Xtr, ytr)
    tree = DecisionTree(max_depth=6).fit(Xtr, ytr)
    f_acc, t_acc = (forest.predict(Xte) == yte).mean(), (tree.predict(Xte) == yte).mean()
    assert len(forest.trees_) == 25 and f_acc > 0.93 and f_acc >= t_acc - 0.01
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day46.py
import numpy as np

from day45 import DecisionTree, best_split


def bootstrap(n, rng):
    return rng.integers(0, n, size=n)


class ForestTree(DecisionTree):
    """A Day 45 tree that only looks at a random subset of m features at each split."""

    def __init__(self, max_depth, m, rng):
        super().__init__(max_depth)
        self.m, self.rng = m, rng

    def _build(self, X, y, depth):
        majority = int(np.bincount(y).argmax())
        if depth >= self.max_depth or len(y) < self.min_samples_split or np.all(y == y[0]):
            return {"leaf": majority}
        feats = np.sort(self.rng.choice(X.shape[1], self.m, replace=False))
        split = best_split(X[:, feats], y)
        if split is None:
            return {"leaf": majority}
        f, t = int(feats[split[0]]), split[1]
        mask = X[:, f] <= t
        return {"f": f, "t": t, "left": self._build(X[mask], y[mask], depth + 1),
                "right": self._build(X[~mask], y[~mask], depth + 1)}


class RandomForest:
    def __init__(self, n_trees=25, max_depth=6, max_features="sqrt", seed=0):
        self.n_trees, self.max_depth, self.max_features, self.seed = n_trees, max_depth, max_features, seed

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y)
        rng = np.random.default_rng(self.seed)
        d = X.shape[1]
        m = max(1, int(np.sqrt(d))) if self.max_features == "sqrt" else d
        self.trees_ = []
        for _ in range(self.n_trees):
            rows = bootstrap(len(y), rng)
            self.trees_.append(ForestTree(self.max_depth, m, rng).fit(X[rows], y[rows]))
        return self

    def predict(self, X):
        votes = np.array([t.predict(X) for t in self.trees_])
        return np.array([np.bincount(col).argmax() for col in votes.T])
```

</details>

**Done when:** green. Try `n_trees` = 1, 5, 25, 100 and plot test accuracy vs number of trees.

---

[← Day 45](day45-decision-trees.md) · [All 90 days](README.md) · [Day 47 →](day47-k-means-clustering.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
