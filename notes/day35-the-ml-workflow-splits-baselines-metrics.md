# Day 35 — The ML workflow: splits, baselines, metrics

> **AI-90** · Block 2 · Machine learning from scratch · Day 35 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 35`)

[← Day 34](day34-probability-and-statistics-for-ml.md) · [All 90 days](README.md) · [Day 36 →](day36-linear-regression-the-closed-form-solution.md)

---

**Dataset:** Diabetes progression (442 patients, 10 features) — bundled `load_diabetes` · **Time:** ~2 h

#### Visual

```text
 all data (442) ──shuffle(seed)──▶ ┌──────── train 80% ────────┐┌─ test 20% ─┐
                                   fit models here               score ONCE at the end
 baseline = predict the train mean for everyone → any real model must beat this
 MSE = mean((y − ŷ)²)   MAE = mean|y − ŷ|   R² = 1 − SSE/SST  (1 perfect, 0 = baseline)
```

#### Notes

- **Always** hold out a test set and touch it last. Seeds make splits reproducible.
- A baseline tells you if your model learned anything. Regression: predict the mean. Classification: predict the most common class.
- MSE punishes big errors; MAE is in the target's units; R² is unitless.

#### Your task — `day35.py`

- `train_test_split(X, y, test_size=0.2, seed=0)` → `X_train, X_test, y_train, y_test` (shuffled with `np.random.default_rng(seed).permutation`).
- `mse`, `mae`, `r2` functions.
- `class MeanBaseline` with `fit(X, y)` and `predict(X)`.
- `load_diabetes_xy()`.

#### Tests

```python
# file: test_day35.py
import numpy as np
from sklearn.metrics import r2_score

import day35 as ex


def test_split():
    X, y = np.arange(20).reshape(10, 2), np.arange(10)
    a = ex.train_test_split(X, y, 0.3, seed=1)
    b = ex.train_test_split(X, y, 0.3, seed=1)
    assert [len(p) for p in a] == [7, 3, 7, 3]
    assert all(np.array_equal(p, q) for p, q in zip(a, b))
    assert np.array_equal(a[0][:, 0] // 2, a[2]), "rows and labels must stay paired"
    assert sorted(np.concatenate([a[2], a[3]])) == list(range(10))


def test_metrics():
    y, p = np.array([3.0, -0.5, 2, 7]), np.array([2.5, 0.0, 2, 8])
    assert ex.mse(y, p) == 0.375 and ex.mae(y, p) == 0.5
    assert np.isclose(ex.r2(y, p), r2_score(y, p))


def test_baseline_on_diabetes():
    X, y = ex.load_diabetes_xy()
    Xtr, Xte, ytr, yte = ex.train_test_split(X, y, seed=0)
    pred = ex.MeanBaseline().fit(Xtr, ytr).predict(Xte)
    assert pred.shape == yte.shape and np.allclose(pred, ytr.mean())
    assert ex.r2(yte, pred) < 0.01
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day35.py
import numpy as np
from sklearn.datasets import load_diabetes


def load_diabetes_xy():
    d = load_diabetes()
    return d.data, d.target


def train_test_split(X, y, test_size=0.2, seed=0):
    X, y = np.asarray(X), np.asarray(y)
    idx = np.random.default_rng(seed).permutation(len(y))
    n_test = int(round(len(y) * test_size))
    te, tr = idx[:n_test], idx[n_test:]
    return X[tr], X[te], y[tr], y[te]


def mse(y, p):
    return float(np.mean((np.asarray(y) - np.asarray(p)) ** 2))


def mae(y, p):
    return float(np.mean(np.abs(np.asarray(y) - np.asarray(p))))


def r2(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(1 - ((y - p) ** 2).sum() / ((y - y.mean()) ** 2).sum())


class MeanBaseline:
    def fit(self, X, y):
        self.mean_ = float(np.mean(y))
        return self

    def predict(self, X):
        return np.full(len(X), self.mean_)
```

</details>

**Done when:** green. Write the baseline test MSE on diabetes in your dev log — tomorrow you beat it.

---

[← Day 34](day34-probability-and-statistics-for-ml.md) · [All 90 days](README.md) · [Day 36 →](day36-linear-regression-the-closed-form-solution.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
