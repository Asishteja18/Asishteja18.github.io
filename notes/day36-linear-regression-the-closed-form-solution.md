# Day 36 — Linear regression: the closed-form solution

> **AI-90** · Block 2 · Machine learning from scratch · Day 36 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 36`)

[← Day 35](day35-the-ml-workflow-splits-baselines-metrics.md) · [All 90 days](README.md) · [Day 37 →](day37-linear-regression-with-gradient-descent-mini-bat.md)

---

**Dataset:** Diabetes · **Time:** ~2 h

#### Visual

```text
 y │      ●   ╱          fit the line that minimises Σ(residual²)
   │   ●   ╱ ●            residual = vertical gap ● ↕ line
   │ ●  ╱●
   │  ╱ ●                 normal equation:  (XᵀX) w = Xᵀy
   └──────────── x        add a column of 1s to X → the bias comes for free
```

#### Notes

- Model: `ŷ = Xw + b`. Loss: MSE. Setting the gradient (Day 32) to zero gives `XᵀX w = Xᵀy`.
- Bias trick: prepend a column of ones; the first weight becomes the intercept.
- Solve with `np.linalg.lstsq` (robust even when `XᵀX` is nearly singular).
- Coefficients tell you how the prediction moves per unit of each feature.

#### Your task — `day36.py`

- `add_bias(X)` → ones column prepended.
- `class LinearRegressionClosed` with `fit` (stores `coef_`, `intercept_`) and `predict`.

#### Tests

```python
# file: test_day36.py
import numpy as np
from sklearn.linear_model import LinearRegression

import day36 as ex
from day35 import load_diabetes_xy, mse, r2, train_test_split


def test_add_bias():
    assert np.array_equal(ex.add_bias(np.array([[2.0], [3.0]])), [[1, 2], [1, 3]])


def test_exact_line():
    X = np.array([[0.0], [1], [2]]); y = 3 * X[:, 0] + 1
    m = ex.LinearRegressionClosed().fit(X, y)
    assert np.isclose(m.intercept_, 1) and np.allclose(m.coef_, [3])


def test_matches_sklearn_on_diabetes():
    X, y = load_diabetes_xy()
    Xtr, Xte, ytr, yte = train_test_split(X, y, seed=0)
    ours = ex.LinearRegressionClosed().fit(Xtr, ytr)
    sk = LinearRegression().fit(Xtr, ytr)
    assert np.allclose(ours.coef_, sk.coef_, atol=1e-6) and np.isclose(ours.intercept_, sk.intercept_)
    assert r2(yte, ours.predict(Xte)) > 0.35
    assert mse(yte, ours.predict(Xte)) < mse(yte, np.full_like(yte, ytr.mean()))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day36.py
import numpy as np


def add_bias(X):
    X = np.asarray(X, float)
    return np.hstack([np.ones((len(X), 1)), X])


class LinearRegressionClosed:
    def fit(self, X, y):
        w, *_ = np.linalg.lstsq(add_bias(X), np.asarray(y, float), rcond=None)
        self.intercept_, self.coef_ = float(w[0]), w[1:]
        return self

    def predict(self, X):
        return np.asarray(X, float) @ self.coef_ + self.intercept_


if __name__ == "__main__":
    from sklearn.datasets import load_diabetes
    from day35 import r2, train_test_split
    d = load_diabetes()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target)
    m = LinearRegressionClosed().fit(Xtr, ytr)
    print("test R²:", round(r2(yte, m.predict(Xte)), 3))
    for name, c in sorted(zip(d.feature_names, m.coef_), key=lambda t: -abs(t[1])):
        print(f"{name:5} {c:9.1f}")
```

</details>

**Done when:** green — identical coefficients to scikit-learn. Which feature matters most for diabetes progression?

---

[← Day 35](day35-the-ml-workflow-splits-baselines-metrics.md) · [All 90 days](README.md) · [Day 37 →](day37-linear-regression-with-gradient-descent-mini-bat.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
