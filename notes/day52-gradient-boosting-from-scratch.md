# Day 52 — Gradient boosting from scratch

> **AI-90** · Block 2 · Machine learning from scratch · Day 52 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 52`)

[← Day 51](day51-project-titanic-your-models-vs-scikit-learn.md) · [All 90 days](README.md) · [Day 53 →](day53-imbalanced-data-and-decision-thresholds.md)

---

**Dataset:** Diabetes · **Time:** ~2.5 h

#### Visual

```text
 F0 = mean(y)
 residuals r = y − F0 ──▶ fit small tree h1 to r ──▶ F1 = F0 + lr·h1
 residuals r = y − F1 ──▶ fit small tree h2 to r ──▶ F2 = F1 + lr·h2   … 200 times
 each tree fixes what the previous ones got wrong.   (XGBoost / LightGBM = this, heavily optimised)
```

#### Notes

- Boosting builds trees **in sequence**, each on the current residuals (for MSE, residual = negative gradient).
- Small learning rate + many shallow trees generalises best.
- You need a regression tree: split to minimise squared error, leaves predict the mean. A depth-limited version is ~30 lines.

#### Your task — `day52.py`

- `class RegressionTree(max_depth=2, min_leaf=5)` with `fit`, `predict` (variance-reduction splits).
- `class GradientBoostingRegressor(n_estimators=200, lr=0.05, max_depth=2)` with `fit`, `predict`, `train_loss_` (MSE after each tree).

#### Tests

```python
# file: test_day52.py
import numpy as np

import day52 as ex
from day35 import load_diabetes_xy, r2, train_test_split


def test_tree_fits_step():
    X = np.arange(20, dtype=float)[:, None]; y = (X[:, 0] >= 10) * 5.0
    t = ex.RegressionTree(max_depth=1, min_leaf=1).fit(X, y)
    assert np.allclose(t.predict(X), y)


def test_boosting_on_diabetes():
    X, y = load_diabetes_xy()
    Xtr, Xte, ytr, yte = train_test_split(X, y, seed=0)
    gb = ex.GradientBoostingRegressor(n_estimators=150, lr=0.05, max_depth=2).fit(Xtr, ytr)
    assert gb.train_loss_[-1] < gb.train_loss_[0]
    assert r2(yte, gb.predict(Xte)) > 0.35
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day52.py
import numpy as np


class RegressionTree:
    def __init__(self, max_depth=2, min_leaf=5):
        self.max_depth, self.min_leaf = max_depth, min_leaf

    def _build(self, X, y, depth):
        if depth == self.max_depth or len(y) < 2 * self.min_leaf:
            return {"leaf": float(y.mean())}
        best, base = None, ((y - y.mean()) ** 2).sum()
        for f in range(X.shape[1]):
            order = np.argsort(X[:, f], kind="stable")
            xs, ys = X[order, f], y[order]
            csum, csq = np.cumsum(ys), np.cumsum(ys ** 2)
            for i in range(self.min_leaf, len(y) - self.min_leaf + 1):
                if xs[i - 1] == xs[i]:
                    continue
                nl, nr = i, len(y) - i
                sl, sr = csum[i - 1], csum[-1] - csum[i - 1]
                sse = (csq[i - 1] - sl ** 2 / nl) + (csq[-1] - csq[i - 1] - sr ** 2 / nr)
                if best is None or sse < best[0]:
                    best = (sse, f, (xs[i - 1] + xs[i]) / 2)
        if best is None or best[0] >= base:
            return {"leaf": float(y.mean())}
        _, f, t = best
        m = X[:, f] <= t
        return {"f": f, "t": t, "left": self._build(X[m], y[m], depth + 1), "right": self._build(X[~m], y[~m], depth + 1)}

    def fit(self, X, y):
        self.root_ = self._build(np.asarray(X, float), np.asarray(y, float), 0)
        return self

    def predict(self, X):
        out = []
        for x in np.asarray(X, float):
            n = self.root_
            while "leaf" not in n:
                n = n["left"] if x[n["f"]] <= n["t"] else n["right"]
            out.append(n["leaf"])
        return np.array(out)


class GradientBoostingRegressor:
    def __init__(self, n_estimators=200, lr=0.05, max_depth=2):
        self.n_estimators, self.lr, self.max_depth = n_estimators, lr, max_depth

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y, float)
        self.f0_ = float(y.mean())
        F = np.full(len(y), self.f0_)
        self.trees_, self.train_loss_ = [], []
        for _ in range(self.n_estimators):
            t = RegressionTree(self.max_depth).fit(X, y - F)
            F += self.lr * t.predict(X)
            self.trees_.append(t)
            self.train_loss_.append(float(np.mean((y - F) ** 2)))
        return self

    def predict(self, X):
        return self.f0_ + self.lr * sum(t.predict(X) for t in self.trees_)
```

</details>

**Done when:** green. Plot `train_loss_` — boosting's loss curve looks like a neural net's.

---

[← Day 51](day51-project-titanic-your-models-vs-scikit-learn.md) · [All 90 days](README.md) · [Day 53 →](day53-imbalanced-data-and-decision-thresholds.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
