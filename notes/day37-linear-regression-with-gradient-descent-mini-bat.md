# Day 37 — Linear regression with gradient descent (mini-batch)

> **AI-90** · Block 2 · Machine learning from scratch · Day 37 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 37`)

[← Day 36](day36-linear-regression-the-closed-form-solution.md) · [All 90 days](README.md) · [Day 38 →](day38-overfitting-polynomial-features-and-ridge-regres.md)

---

**Dataset:** Diabetes (standardised) · **Time:** ~2 h

#### Visual

```text
 loss │╲
      │ ╲_                    epoch = one pass over the training data
      │   ╲___                batch = a chunk of rows used for one update (Day 5's chunk!)
      │       ╲______________
      └────────────────────── epochs
 per step:  ŷ = Xb w + b;  dw = 2/m Xbᵀ(ŷ−yb);  db = 2/m Σ(ŷ−yb);  w −= lr·dw
```

#### Notes

- Closed form doesn't scale to millions of rows or to neural nets. Gradient descent does.
- Mini-batch: shuffle each epoch, update on batches of e.g. 32 rows — faster and slightly noisy (which helps).
- Standardise features first or GD crawls (Day 33).
- Record the full-data loss each epoch → `loss_history_` for plotting.

#### Your task — `day37.py`

- `class LinearRegressionGD(lr=0.05, epochs=200, batch_size=32, seed=0)` with `fit`, `predict`, `coef_`, `intercept_`, `loss_history_` (MSE per epoch).

#### Tests

```python
# file: test_day37.py
import numpy as np

import day37 as ex
from day34 import StandardScaler
from day35 import load_diabetes_xy, train_test_split
from day36 import LinearRegressionClosed


def data():
    X, y = load_diabetes_xy()
    Xtr, Xte, ytr, yte = train_test_split(X, y, seed=0)
    s = StandardScaler().fit(Xtr)
    return s.transform(Xtr), s.transform(Xte), ytr, yte


def test_loss_decreases():
    Xtr, _, ytr, _ = data()
    m = ex.LinearRegressionGD(epochs=50).fit(Xtr, ytr)
    h = m.loss_history_
    assert len(h) == 50 and h[-1] < h[0]
    assert h[-1] < 3400, "baseline MSE on this split is ~5800"


def test_close_to_closed_form():
    Xtr, Xte, ytr, yte = data()
    gd = ex.LinearRegressionGD(lr=0.02, epochs=400, batch_size=32).fit(Xtr, ytr)
    cf = LinearRegressionClosed().fit(Xtr, ytr)
    mse = lambda m: np.mean((m.predict(Xte) - yte) ** 2)  # noqa: E731
    assert mse(gd) < mse(cf) * 1.05
    assert abs(gd.intercept_ - cf.intercept_) < 2
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day37.py
import numpy as np


class LinearRegressionGD:
    def __init__(self, lr=0.05, epochs=200, batch_size=32, seed=0):
        self.lr, self.epochs, self.batch_size, self.seed = lr, epochs, batch_size, seed

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y, float)
        rng = np.random.default_rng(self.seed)
        self.coef_, self.intercept_ = np.zeros(X.shape[1]), float(y.mean())
        self.loss_history_ = []
        for _ in range(self.epochs):
            idx = rng.permutation(len(y))
            for start in range(0, len(y), self.batch_size):
                b = idx[start:start + self.batch_size]
                err = X[b] @ self.coef_ + self.intercept_ - y[b]
                self.coef_ -= self.lr * 2 / len(b) * X[b].T @ err
                self.intercept_ -= self.lr * 2 * err.mean()
            self.loss_history_.append(float(np.mean((self.predict(X) - y) ** 2)))
        return self

    def predict(self, X):
        return np.asarray(X, float) @ self.coef_ + self.intercept_
```

</details>

**Done when:** green + plot `loss_history_` with Day 25's tools.

---

[← Day 36](day36-linear-regression-the-closed-form-solution.md) · [All 90 days](README.md) · [Day 38 →](day38-overfitting-polynomial-features-and-ridge-regres.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
