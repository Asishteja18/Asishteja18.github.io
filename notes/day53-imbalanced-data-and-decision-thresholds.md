# Day 53 — Imbalanced data and decision thresholds

> **AI-90** · Block 2 · Machine learning from scratch · Day 53 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 53`)

[← Day 52](day52-gradient-boosting-from-scratch.md) · [All 90 days](README.md) · [Day 54 →](day54-time-series-forecasting-airline-passengers.md)

---

**Dataset:** Breast Cancer, artificially made rare (keep 10% of malignant cases) · **Time:** ~2 h

#### Visual

```text
 threshold  precision  recall   F1          moving the threshold trades precision ↔ recall
   0.9        0.95      0.40    0.56        ┌ high threshold: few alarms, misses cases
   0.5        0.85      0.70    0.77        │
   0.2        0.60      0.92    0.73 ◀ best recall for screening
 class weights: errors on the rare class cost MORE in the loss
```

#### Notes

- With 5% positives, "always negative" scores 95% accuracy and is useless. Use precision/recall/F1/AUC.
- Fixes: tune the threshold, weight classes in the loss, resample (over/under-sample).
- Pick the threshold on **validation** data for the metric you care about, then freeze it.

#### Your task — `day53.py`

- `make_imbalanced(X, y, keep_frac, seed=0)` → keep all class-0 rows and `keep_frac` of class-1 rows.
- `best_threshold(y, scores, metric)` → threshold (from the unique scores) maximising `metric(y, scores >= t)`.
- `class WeightedLogisticRegression(class_weight="balanced", lr=0.1, epochs=1000)` → logistic regression where each sample's gradient is multiplied by `n / (2·n_class)`.

#### Tests

```python
# file: test_day53.py
import numpy as np
from sklearn.datasets import load_breast_cancer

import day53 as ex
from day34 import StandardScaler
from day35 import train_test_split
from day39 import LogisticRegression
from day40 import f1, recall


def data():
    d = load_breast_cancer()
    y = 1 - d.target  # 1 = malignant
    X, y = ex.make_imbalanced(d.data, y, 0.1, seed=0)
    Xtr, Xte, ytr, yte = train_test_split(X, y, seed=3)
    s = StandardScaler().fit(Xtr)
    return s.transform(Xtr), s.transform(Xte), ytr, yte


def test_make_imbalanced():
    X, y = ex.make_imbalanced(np.zeros((10, 1)), np.array([0] * 5 + [1] * 5), 0.4)
    assert (y == 0).sum() == 5 and (y == 1).sum() == 2


def test_best_threshold():
    y = np.array([0, 0, 1, 1]); s = np.array([0.1, 0.4, 0.35, 0.8])
    assert ex.best_threshold(y, s, f1) == 0.35


def test_weighting_raises_recall():
    Xtr, Xte, ytr, yte = data()
    plain = LogisticRegression(epochs=300).fit(Xtr, ytr).predict(Xte)
    weighted = ex.WeightedLogisticRegression(epochs=300).fit(Xtr, ytr).predict(Xte)
    assert recall(yte, weighted) >= recall(yte, plain)
    assert 0.03 < ytr.mean() < 0.1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day53.py
import numpy as np

from day39 import LogisticRegression


def make_imbalanced(X, y, keep_frac, seed=0):
    X, y = np.asarray(X), np.asarray(y)
    rng = np.random.default_rng(seed)
    pos = np.flatnonzero(y == 1)
    keep = np.concatenate([np.flatnonzero(y == 0), rng.choice(pos, int(round(len(pos) * keep_frac)), replace=False)])
    keep.sort()
    return X[keep], y[keep]


def best_threshold(y, scores, metric):
    scores = np.asarray(scores)
    return float(max(np.unique(scores), key=lambda t: (metric(y, (scores >= t).astype(int)), -t)))


class WeightedLogisticRegression(LogisticRegression):
    def __init__(self, class_weight="balanced", lr=0.1, epochs=1000):
        super().__init__(lr=lr, epochs=epochs)
        self.class_weight = class_weight

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y, float)
        n = len(y)
        w = np.where(y == 1, n / (2 * max(y.sum(), 1)), n / (2 * max(n - y.sum(), 1)))
        self.coef_, self.intercept_, self.loss_history_ = np.zeros(X.shape[1]), 0.0, []
        for _ in range(self.epochs):
            g = w * (self.predict_proba(X) - y)
            self.coef_ -= self.lr * X.T @ g / n
            self.intercept_ -= self.lr * float(g.mean())
        return self
```

</details>

**Done when:** green. For a cancer screen, which threshold would you ship and why? Write it down.

---

[← Day 52](day52-gradient-boosting-from-scratch.md) · [All 90 days](README.md) · [Day 54 →](day54-time-series-forecasting-airline-passengers.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
