# Day 34 — Probability and statistics for ML

> **AI-90** · Block 2 · Machine learning from scratch · Day 34 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 34`)

[← Day 33](day33-gradient-descent.md) · [All 90 days](README.md) · [Day 35 →](day35-the-ml-workflow-splits-baselines-metrics.md)

---

**Dataset:** Wine (bundled) · **Time:** ~2 h

#### Visual

```text
 normal distribution                 standardise each feature:
         ▁▄█▄▁                        z = (x − mean) / std
       ▁▄█████▄▁                      alcohol  (≈13)   →  ≈0 ± 1
 ────▁▄█████████▄▁────               proline (≈750)   →  ≈0 ± 1   ← now comparable
     μ−2σ  μ  μ+2σ   (95% inside)
 fit on TRAIN only → transform train AND test (no peeking at test data)
```

#### Notes

- Mean, variance, standard deviation; the normal pdf `1/(σ√2π)·exp(−(x−μ)²/2σ²)`.
- Features on wildly different scales break GD and distance-based models → **standardise**.
- `fit` learns parameters (mean, std) from training data; `transform` applies them. Fitting on test data = **data leakage**, the most common ML mistake.
- Constant columns have std 0 → divide by 1 instead.

#### Your task — `day34.py`

- `class StandardScaler` with `fit(X)` (stores `mean_`, `scale_`), `transform(X)`, `fit_transform(X)`, `inverse_transform(Z)`.
- `normal_pdf(x, mu, sigma)`.
- `sample_stats(x)` → dict `mean, var, std` (population: divide by n).

#### Tests

```python
# file: test_day34.py
import numpy as np
from sklearn.datasets import load_wine
from sklearn.preprocessing import StandardScaler as SkScaler

import day34 as ex


def test_scaler_matches_sklearn_on_wine():
    X = load_wine().data
    ours, theirs = ex.StandardScaler().fit_transform(X), SkScaler().fit_transform(X)
    assert np.allclose(ours, theirs)


def test_constant_column_and_inverse():
    X = np.array([[1.0, 5], [3, 5]])
    s = ex.StandardScaler().fit(X)
    Z = s.transform(X)
    assert np.allclose(Z[:, 1], 0) and np.allclose(s.inverse_transform(Z), X)


def test_fit_on_train_only():
    s = ex.StandardScaler().fit(np.array([[0.0], [2.0]]))
    assert np.allclose(s.transform(np.array([[4.0]])), [[3.0]])


def test_normal_pdf_and_stats():
    assert np.isclose(ex.normal_pdf(0, 0, 1), 0.3989422804)
    assert ex.sample_stats([2, 4, 4, 4, 5, 5, 7, 9]) == {"mean": 5.0, "var": 4.0, "std": 2.0}
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day34.py
import numpy as np


class StandardScaler:
    def fit(self, X):
        X = np.asarray(X, float)
        self.mean_ = X.mean(axis=0)
        std = X.std(axis=0)
        self.scale_ = np.where(std == 0, 1.0, std)
        return self

    def transform(self, X):
        return (np.asarray(X, float) - self.mean_) / self.scale_

    def fit_transform(self, X):
        return self.fit(X).transform(X)

    def inverse_transform(self, Z):
        return np.asarray(Z) * self.scale_ + self.mean_


def normal_pdf(x, mu, sigma):
    return float(np.exp(-((x - mu) ** 2) / (2 * sigma ** 2)) / (sigma * np.sqrt(2 * np.pi)))


def sample_stats(x):
    x = np.asarray(x, float)
    return {"mean": float(x.mean()), "var": float(x.var()), "std": float(x.std())}
```

</details>

**Done when:** green — your scaler equals scikit-learn's on real wine data.

---

[← Day 33](day33-gradient-descent.md) · [All 90 days](README.md) · [Day 35 →](day35-the-ml-workflow-splits-baselines-metrics.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
