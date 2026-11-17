# Advanced 1 — Lasso: letting the model pick its features

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 1 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[All notes](README.md) · [Advanced 2 →](adv02-calibration-can-you-trust-the-probability.md)

---

**Dataset:** Diabetes (442 patients × 10 measurements) — bundled: `sklearn.datasets.load_diabetes()` · **Time:** ~2 h

**Progress:** `Advanced 1/13` · **System after today:** a regulariser that switches useless features off

**Goal:** Add an L1 penalty to linear regression and watch it set weights to exactly zero.

#### Visual

```text
        ridge (L2)                     lasso (L1)
   w2 │   ╭───╮                   w2 │    ◇
      │  (  ●  )  ← loss ellipse     │   ╱ ╲  ← corner on an axis
      │   ╰───╯     touches circle   │  ◇ ● ◇    ellipse hits the corner
      └────────── w1   anywhere      └────────── w1   → w1 = 0 exactly
   small weights, all non-zero       some weights switched OFF
```

#### Notes

- Day 38 added **ridge** (L2): penalty `λ·Σw²` shrinks every weight a bit. **Lasso** (L1) uses `α·Σ|w|` and does something ridge can't: it sets weights to **exactly 0**. That's free feature selection.
- Why exactly zero? `|w|` has a sharp corner at 0, so the optimum often lands on the corner. Picture above: the L1 ball is a diamond, its corners sit on the axes.
- No closed form, so we use **coordinate descent**: fix all weights but one, solve that one exactly, move on. For one weight the answer is the **soft threshold**: `S(ρ, α) = sign(ρ)·max(|ρ| − α, 0)`, where `ρ` is how much that feature explains of what's left of `y`.
- Keep a **residual** `r = y − Xw` and update it as each weight changes. That makes each step O(n) instead of O(n·d).
- Standardise X first, or the penalty punishes features just for their units.
- The **lasso path**: sweep α from small to big, watch weights drop out one by one. The last survivors are the strongest predictors (here: BMI, blood serum s5).
- Elastic net = L1 + L2 together; it's what you reach for when features are correlated.

#### Your task — `x01.py`

- `soft_threshold(z, t)` → shrink towards 0 by t, clip to exactly 0 inside ±t.
- `lasso_cd(X, y, alpha, iters=300)` → weights by cyclic coordinate descent on `(1/2n)‖y − Xw‖² + α‖w‖₁`.
- `lasso_path(X, y, alphas)` → array of weights, one row per alpha.
- `selected_features(w, names)` → names whose weight isn't zero.

#### Tests

```python
# file: test_x01.py
import numpy as np
from sklearn.datasets import load_diabetes
from sklearn.linear_model import Lasso

import x01 as ex


def _data():
    d = load_diabetes()
    X = (d.data - d.data.mean(0)) / d.data.std(0)
    y = d.target - d.target.mean()
    return X, y, d.feature_names


def test_soft_threshold():
    assert np.allclose(ex.soft_threshold(np.array([3.0, -3.0, 0.5, -0.5]), 1.0), [2, -2, 0, 0])


def test_zero_alpha_is_least_squares():
    X, y, _ = _data()
    w = ex.lasso_cd(X, y, 0.0, iters=500)
    w_ls = np.linalg.lstsq(X, y, rcond=None)[0]
    assert np.allclose(w, w_ls, atol=0.5), "alpha=0 should match ordinary least squares"


def test_matches_sklearn():
    X, y, _ = _data()
    w = ex.lasso_cd(X, y, 2.0)
    ref = Lasso(alpha=2.0, fit_intercept=False, max_iter=10000, tol=1e-8).fit(X, y).coef_
    assert np.allclose(w, ref, atol=1e-2)


def test_big_alpha_kills_everything():
    X, y, names = _data()
    w = ex.lasso_cd(X, y, 1e4)
    assert np.all(w == 0) and ex.selected_features(w, names) == []


def test_path_gets_sparser():
    X, y, names = _data()
    path = ex.lasso_path(X, y, [0.1, 2.0, 10.0, 30.0], iters=200)
    nz = [(np.abs(r) > 1e-8).sum() for r in path]
    assert nz[0] >= nz[-1] and nz[-1] < 10
    assert "bmi" in ex.selected_features(path[-1], names), "BMI is the strongest single predictor"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x01.py
"""Advanced 01 — Lasso (L1) and feature selection, by coordinate descent."""
import numpy as np


def soft_threshold(z, t):
    """Shrink z towards 0 by t; anything within t of 0 becomes exactly 0."""
    return np.sign(z) * np.maximum(np.abs(z) - t, 0.0)


def lasso_cd(X, y, alpha, iters=300):
    """Minimise (1/2n)||y - Xw||^2 + alpha * ||w||_1 by cyclic coordinate descent.
    X should be standardised and y centred (no intercept)."""
    X = np.asarray(X, float)
    y = np.asarray(y, float)
    n, d = X.shape
    w = np.zeros(d)
    r = y - X @ w
    col = (X ** 2).sum(axis=0) / n
    for _ in range(iters):
        for j in range(d):
            if col[j] == 0:
                continue
            r += X[:, j] * w[j]
            rho = X[:, j] @ r / n
            w[j] = soft_threshold(rho, alpha) / col[j]
            r -= X[:, j] * w[j]
    return w


def lasso_path(X, y, alphas, iters=300):
    """Weights for each alpha, shape (len(alphas), n_features)."""
    return np.array([lasso_cd(X, y, a, iters) for a in alphas])


def selected_features(w, names, tol=1e-8):
    """Names of the features whose weight is not (numerically) zero."""
    return [n for n, v in zip(names, w) if abs(v) > tol]
```

</details>

**Done when:** green + you can say which 3 diabetes features survive the biggest alpha.

---

[All notes](README.md) · [Advanced 2 →](adv02-calibration-can-you-trust-the-probability.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
