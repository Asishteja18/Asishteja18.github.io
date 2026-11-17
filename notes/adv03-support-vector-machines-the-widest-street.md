# Advanced 3 — Support vector machines: the widest street

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 3 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 2](adv02-calibration-can-you-trust-the-probability.md) · [All notes](README.md) · [Advanced 4 →](adv04-kernels-curved-boundaries-with-linear-maths.md)

---

**Dataset:** Iris (2 species) and Breast Cancer (569 tumours × 30 features) — bundled with sklearn · **Time:** ~2 h

**Progress:** `Advanced 3/13` · **System after today:** a max-margin classifier trained on the hinge loss

**Goal:** Train a linear SVM from scratch and see how C trades a wide margin for fewer mistakes.

#### Visual

```text
     ○      ○                 the street = margin = 2 / ‖w‖
        ○  ┆ ○  ┆                ● ○ on the dashed edge = support vectors
     ○    ┆○    ┆   ●           everything else could move and the
          ┆  ═══┆════ w·x+b=0   line wouldn't change
        ● ┆    ●┆  ●
          ┆●    ┆     ●          small C → wide street, a few points inside
              ●                 big C  → narrow street, fewer errors
```

#### Notes

- Logistic regression finds *a* separating line. An SVM finds the one with the **widest margin**: the biggest gap between the classes.
- **Hinge loss**: `max(0, 1 − t·(w·x + b))` with labels t = ±1. Zero once a point is correctly classified *and* outside the street; linear penalty otherwise.
- Objective: `λ/2·‖w‖² + mean(hinge)`. The `‖w‖²` term widens the street (margin = 2/‖w‖); the hinge term pays for violations. `C = 1/(λn)` sets the balance.
- **Support vectors**: points on or inside the margin. Only they decide the line. That sparsity is the SVM's party trick.
- We train with **Pegasos**: sub-gradient descent with step `1/(λt)`, plus a projection that keeps ‖w‖ ≤ 1/√λ.
- Scale features first. SVMs measure distance, so units matter.
- Next lesson swaps the dot product for a **kernel** and the street curves.

#### Your task — `x03.py`

- `class LinearSVM(C=1.0, epochs=300)` with `fit(X, y)` for 0/1 labels.
- `decision_function(X)` → signed scores; `predict(X)` → 0/1.
- `margin()` → `2 / ‖w‖`.
- `support_vectors(X, y)` → indices of points on or inside the margin.

#### Tests

```python
# file: test_x03.py
import numpy as np
from sklearn.datasets import load_breast_cancer, load_iris

import x03 as ex


def test_separable_toy():
    X = np.array([[0, 0], [0, 1], [1, 0], [3, 3], [3, 4], [4, 3]], float)
    y = np.array([0, 0, 0, 1, 1, 1])
    m = ex.LinearSVM(C=10, epochs=500).fit(X, y)
    assert (m.predict(X) == y).all()
    assert len(m.support_vectors(X, y)) < len(X)


def test_iris_setosa_vs_versicolor():
    d = load_iris()
    keep = d.target < 2
    X, y = d.data[keep][:, 2:], d.target[keep]
    assert (ex.LinearSVM(C=10).fit(X, y).predict(X) == y).mean() == 1.0


def test_breast_cancer_holdout():
    d = load_breast_cancer()
    X = (d.data - d.data.mean(0)) / d.data.std(0)
    rng = np.random.default_rng(0)
    idx = rng.permutation(len(X)); tr, te = idx[:455], idx[455:]
    m = ex.LinearSVM(C=1.0).fit(X[tr], d.target[tr])
    assert (m.predict(X[te]) == d.target[te]).mean() > 0.92


def test_C_controls_the_margin():
    d = load_breast_cancer()
    X = (d.data - d.data.mean(0)) / d.data.std(0)
    soft = ex.LinearSVM(C=0.01).fit(X, d.target).margin()
    hard = ex.LinearSVM(C=100).fit(X, d.target).margin()
    assert soft > hard, "a small C buys a wider street"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x03.py
"""Advanced 03 — A linear support vector machine trained on the hinge loss (Pegasos)."""
import numpy as np


class LinearSVM:
    def __init__(self, C=1.0, epochs=300):
        self.C, self.epochs = C, epochs

    def fit(self, X, y):
        """Labels 0/1. Minimises lam/2 ||w||^2 + mean(max(0, 1 - y(w.x + b))), lam = 1 / (C n)."""
        X = np.asarray(X, float)
        t = np.where(np.asarray(y) == 1, 1.0, -1.0)
        n, d = X.shape
        lam = 1.0 / (self.C * n)
        self.w, self.b = np.zeros(d), 0.0
        for step in range(1, self.epochs + 1):
            eta = 1.0 / (lam * step)
            viol = t * (X @ self.w + self.b) < 1
            self.w = (1 - eta * lam) * self.w + eta * (t[viol] @ X[viol]) / n
            self.b += eta * t[viol].sum() / n * 0.1
            norm = np.linalg.norm(self.w)
            if norm > 0:                                  # Pegasos projection step
                self.w *= min(1.0, (1 / np.sqrt(lam)) / norm)
        return self

    def decision_function(self, X):
        return np.asarray(X, float) @ self.w + self.b

    def predict(self, X):
        return (self.decision_function(X) >= 0).astype(int)

    def margin(self):
        """Width of the street between the classes: 2 / ||w||."""
        return 2.0 / np.linalg.norm(self.w)

    def support_vectors(self, X, y, tol=1e-3):
        """Indices of points on or inside the margin."""
        t = np.where(np.asarray(y) == 1, 1.0, -1.0)
        return np.where(t * self.decision_function(X) <= 1 + tol)[0]
```

</details>

**Done when:** green + over 92% on held-out breast-cancer tumours.

---

[← Advanced 2](adv02-calibration-can-you-trust-the-probability.md) · [All notes](README.md) · [Advanced 4 →](adv04-kernels-curved-boundaries-with-linear-maths.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
