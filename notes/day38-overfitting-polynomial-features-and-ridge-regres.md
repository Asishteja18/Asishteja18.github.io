# Day 38 — Overfitting: polynomial features and ridge regression

> **AI-90** · Block 2 · Machine learning from scratch · Day 38 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 38`)

[← Day 37](day37-linear-regression-with-gradient-descent-mini-bat.md) · [All 90 days](README.md) · [Day 39 →](day39-logistic-regression.md)

---

**Dataset:** Car MPG (`download("mpg")`) for the real run; synthetic sine for tests · **Time:** ~2 h

#### Visual

```text
 degree 1 (underfit)    degree 4 (good)       degree 15 (overfit)
   ●   ●  ___●            ● ╭─●─╮               ●╮╭●╮ ╭●
 ●___──●   ●            ●─╯     ╰─●            ●╯╰╯ ╰─╯╰●
 train err high          train ok, test ok     train ≈ 0, test HUGE
 ridge:  loss = MSE + α·‖w‖²   → shrinks wild weights;  w = (XᵀX + αI)⁻¹ Xᵀy  (don't penalise bias)
```

#### Notes

- More capacity → lower train error, but test error eventually rises: **overfitting**.
- Fixes: more data, simpler model, **regularisation**. L2 (ridge) shrinks weights smoothly; L1 (lasso) pushes some to exactly zero.
- Polynomial features turn a linear model into a curve fitter: `[x, x², x³, …]`.
- Always standardise before regularising (penalty should treat features fairly).

#### Your task — `day38.py`

- `poly_features(x, degree)` → columns `x¹…x^degree` for 1-D `x`.
- `class Ridge(alpha)` → closed form with unpenalised intercept (centre X and y, solve, recover intercept).

#### Tests

```python
# file: test_day38.py
import numpy as np
from sklearn.linear_model import Ridge as SkRidge

import day38 as ex
from day35 import mse


def test_poly():
    assert np.array_equal(ex.poly_features(np.array([2.0, 3.0]), 3), [[2, 4, 8], [3, 9, 27]])


def test_ridge_matches_sklearn():
    rng = np.random.default_rng(0)
    X, y = rng.normal(size=(40, 5)), rng.normal(size=40)
    ours, sk = ex.Ridge(alpha=3.0).fit(X, y), SkRidge(alpha=3.0).fit(X, y)
    assert np.allclose(ours.coef_, sk.coef_) and np.isclose(ours.intercept_, sk.intercept_)


def test_ridge_tames_overfitting():
    rng = np.random.default_rng(1)
    x = rng.uniform(-1, 1, 30); xt = np.linspace(-1, 1, 200)
    f = lambda v: np.sin(3 * v)  # noqa: E731
    y = f(x) + rng.normal(0, 0.2, 30)
    Xp, Xtp = ex.poly_features(x, 15), ex.poly_features(xt, 15)
    plain = ex.Ridge(alpha=0.0).fit(Xp, y)
    ridge = ex.Ridge(alpha=1e-3).fit(Xp, y)
    assert mse(f(xt), ridge.predict(Xtp)) < mse(f(xt), plain.predict(Xtp))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day38.py
import numpy as np


def poly_features(x, degree):
    x = np.asarray(x, float)
    return np.column_stack([x ** d for d in range(1, degree + 1)])


class Ridge:
    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, X, y):
        X, y = np.asarray(X, float), np.asarray(y, float)
        xm, ym = X.mean(0), y.mean()
        Xc, yc = X - xm, y - ym
        A = Xc.T @ Xc + self.alpha * np.eye(X.shape[1])
        self.coef_ = np.linalg.lstsq(A, Xc.T @ yc, rcond=None)[0]
        self.intercept_ = float(ym - xm @ self.coef_)
        return self

    def predict(self, X):
        return np.asarray(X, float) @ self.coef_ + self.intercept_


if __name__ == "__main__":
    import pandas as pd
    from day22 import download
    from day34 import StandardScaler
    from day35 import r2, train_test_split
    df = pd.read_csv(download("mpg")).dropna()
    X, y = df[["horsepower", "weight", "displacement", "acceleration", "model_year"]].values, df["mpg"].values
    Xtr, Xte, ytr, yte = train_test_split(X, y)
    s = StandardScaler().fit(Xtr)
    for a in (0, 1, 10, 100):
        m = Ridge(a).fit(s.transform(Xtr), ytr)
        print(f"alpha={a:<4} test R²={r2(yte, m.predict(s.transform(Xte))):.3f}")
```

</details>

**Done when:** green + run on real car MPG. Plot degree 1/4/15 fits on the sine data — that picture is overfitting.

---

[← Day 37](day37-linear-regression-with-gradient-descent-mini-bat.md) · [All 90 days](README.md) · [Day 39 →](day39-logistic-regression.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
