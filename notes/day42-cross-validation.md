# Day 42 — Cross-validation

> **AI-90** · Block 2 · Machine learning from scratch · Day 42 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 42`)

[← Day 41](day41-softmax-regression-multi-class.md) · [All 90 days](README.md) · [Day 43 →](day43-k-nearest-neighbours.md)

---

**Dataset:** Wine + Diabetes · **Time:** ~2 h

#### Visual

```text
 5-fold CV — every row is in the test fold exactly once
 fold 1: [TEST][train][train][train][train]
 fold 2: [train][TEST][train][train][train]
 fold 3: [train][train][TEST][train][train]   score = mean ± std of the 5
 fold 4: [train][train][train][TEST][train]
 fold 5: [train][train][train][train][TEST]
```

#### Notes

- One split is noisy: you might get lucky. K-fold gives a mean and a spread.
- Use CV to **choose** settings (alpha, k, depth). Keep the final test set for one last check.
- Preprocessing (scaling) must be fit **inside** each fold — otherwise you leak. Pass a factory that builds a fresh model each fold.

#### Your task — `day42.py`

- `kfold_indices(n, k, seed=0)` → list of `(train_idx, test_idx)`; shuffled; folds differ in size by at most 1; every index in exactly one test fold.
- `cross_val_score(make_model, X, y, k=5, metric=None, seed=0)` → array of k scores; `make_model()` returns a new unfitted model; default metric = accuracy.

#### Tests

```python
# file: test_day42.py
import numpy as np
from sklearn.datasets import load_wine

import day42 as ex
from day36 import LinearRegressionClosed
from day35 import load_diabetes_xy, r2
from day41 import SoftmaxRegression


def test_folds():
    folds = ex.kfold_indices(11, 3, seed=0)
    tests = np.concatenate([t for _, t in folds])
    assert sorted(tests) == list(range(11)) and sorted(len(t) for _, t in folds) == [3, 4, 4]
    for tr, te in folds:
        assert not set(tr) & set(te) and len(tr) + len(te) == 11


class ScaledSoftmax:
    def fit(self, X, y):
        self.m, self.s = X.mean(0), X.std(0)
        self.model = SoftmaxRegression().fit((X - self.m) / self.s, y)
        return self

    def predict(self, X):
        return self.model.predict((X - self.m) / self.s)


def test_cv_wine():
    d = load_wine()
    scores = ex.cross_val_score(ScaledSoftmax, d.data, d.target, k=5)
    assert len(scores) == 5 and scores.mean() > 0.94


def test_cv_regression_metric():
    X, y = load_diabetes_xy()
    scores = ex.cross_val_score(LinearRegressionClosed, X, y, k=5, metric=r2)
    assert 0.3 < scores.mean() < 0.6
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day42.py
import numpy as np


def kfold_indices(n, k, seed=0):
    idx = np.random.default_rng(seed).permutation(n)
    folds = np.array_split(idx, k)
    return [(np.concatenate(folds[:i] + folds[i + 1:]), folds[i]) for i in range(k)]


def cross_val_score(make_model, X, y, k=5, metric=None, seed=0):
    X, y = np.asarray(X), np.asarray(y)
    metric = metric or (lambda t, p: float(np.mean(t == p)))
    scores = []
    for tr, te in kfold_indices(len(y), k, seed):
        model = make_model().fit(X[tr], y[tr])
        scores.append(metric(y[te], model.predict(X[te])))
    return np.array(scores)
```

</details>

**Done when:** green. Report "mean ± std" from now on, never a single split.

---

[← Day 41](day41-softmax-regression-multi-class.md) · [All 90 days](README.md) · [Day 43 →](day43-k-nearest-neighbours.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
