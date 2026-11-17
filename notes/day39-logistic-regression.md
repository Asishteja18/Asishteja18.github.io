# Day 39 — Logistic regression

> **AI-90** · Block 2 · Machine learning from scratch · Day 39 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 39`)

[← Day 38](day38-overfitting-polynomial-features-and-ridge-regres.md) · [All 90 days](README.md) · [Day 40 →](day40-classification-metrics.md)

---

**Dataset:** Breast Cancer Wisconsin (569 tumours, 30 features) — bundled `load_breast_cancer` · **Time:** ~2 h

#### Visual

```text
 σ(z) = 1/(1+e^-z)            p(malignant)
 1 ┤          ______           z = Xw + b
   │        ╱                  predict 1 if p ≥ 0.5
 .5┤ - - - ●                   loss = binary cross-entropy:
   │  ____╱                     −mean( y·log p + (1−y)·log(1−p) )
 0 ┼──────────── z             grad: dw = Xᵀ(p − y)/n   ← same shape as linear regression!
```

#### Notes

- Classification needs probabilities between 0 and 1 → squash the linear score with the sigmoid.
- MSE is a bad loss here; **cross-entropy** is convex for logistic regression and punishes confident mistakes.
- Clip probabilities (`1e-12…1−1e-12`) before `log` to avoid `log(0)`.
- Optional L2 term `λ‖w‖²` keeps weights sane on separable data.

#### Your task — `day39.py`

- `bce(y, p)` → binary cross-entropy (clipped).
- `class LogisticRegression(lr=0.1, epochs=1000, l2=0.0)` with `fit` (full-batch GD), `predict_proba` (P(y=1)), `predict(threshold=0.5)`, `loss_history_`.

#### Tests

```python
# file: test_day39.py
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression as SkLR

import day39 as ex
from day34 import StandardScaler
from day35 import train_test_split


def test_bce():
    assert np.isclose(ex.bce(np.array([1, 0]), np.array([0.9, 0.1])), -np.log(0.9))
    assert np.isfinite(ex.bce(np.array([1]), np.array([0.0])))


def test_breast_cancer():
    d = load_breast_cancer()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=0)
    s = StandardScaler().fit(Xtr)
    m = ex.LogisticRegression(lr=0.1, epochs=1000, l2=0.01).fit(s.transform(Xtr), ytr)
    acc = (m.predict(s.transform(Xte)) == yte).mean()
    sk = SkLR(max_iter=5000).fit(s.transform(Xtr), ytr).score(s.transform(Xte), yte)
    assert acc > 0.95 and acc >= sk - 0.03
    assert m.loss_history_[-1] < m.loss_history_[0]
    p = m.predict_proba(s.transform(Xte))
    assert p.min() >= 0 and p.max() <= 1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day39.py
import numpy as np

from day32 import sigmoid


def bce(y, p):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


class LogisticRegression:
    def __init__(self, lr=0.1, epochs=1000, l2=0.0):
        self.lr, self.epochs, self.l2 = lr, epochs, l2

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y, float)
        n, d = X.shape
        self.coef_, self.intercept_ = np.zeros(d), 0.0
        self.loss_history_ = []
        for _ in range(self.epochs):
            p = self.predict_proba(X)
            self.coef_ -= self.lr * (X.T @ (p - y) / n + 2 * self.l2 * self.coef_)
            self.intercept_ -= self.lr * float(np.mean(p - y))
            self.loss_history_.append(bce(y, p))
        return self

    def predict_proba(self, X):
        return sigmoid(np.asarray(X, float) @ self.coef_ + self.intercept_)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)
```

</details>

**Done when:** green — >95% on real tumour data with ~25 lines of your own code.

---

[← Day 38](day38-overfitting-polynomial-features-and-ridge-regres.md) · [All 90 days](README.md) · [Day 40 →](day40-classification-metrics.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
