# AI-90 PLUS — Advanced ML (13 lessons)

Sits between Block 2 (Machine Learning) and Block 3 (Build your own AI).
Same format as AI90_MASTER.md: notes, a from-scratch task, tests, a reference solution.

## BLOCK 2.5 — ADVANCED ML: BEYOND THE BASICS (Advanced 1–13)

You can now train, tune and ship the classic models. This stage fills the gaps a working ML engineer is expected to know before deep learning:

- **Better models** (1–4): sparse models, honest probabilities, max-margin classifiers and kernels.
- **Beyond labels** (5–10): soft clustering, density clustering, maps of high-dimensional data, anomalies, recommenders and learning from rewards.
- **Bridge to AI + production** (11–13): an autoencoder with hand-written backprop, drift monitoring and fairness.

About 2 hours each, ~29 hours in total. Every lesson runs in your browser, like the rest of the course.

---

### Advanced 1 — Lasso: letting the model pick its features

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

### Advanced 2 — Calibration: can you trust the probability?

**Dataset:** synthetic over-confident scores (4,000 predictions) · **Time:** ~2 h

**Progress:** `Advanced 2/13` · **System after today:** probabilities that mean what they say

**Goal:** Measure whether a model's 80% really means 80%, then fix it with Platt scaling and isotonic regression.

#### Visual

```text
  fraction actually positive
  1 │                 ●  ╱
    │            ●   ╱        ● = over-confident model
    │        ●     ╱  ◆        ◆ = after Platt scaling
    │      ◆   ◆ ╱  ◆          ╱ = perfect calibration
    │  ● ◆   ◆ ╱
  0 └──────────────── 1  predicted probability
```

#### Notes

- A classifier can rank perfectly (great AUC) and still lie about confidence. If it says 0.9, nine in ten of those should be positive. That's **calibration**.
- **Reliability curve**: bin predictions by probability, plot mean predicted vs fraction positive per bin. On the diagonal = calibrated.
- **ECE** (expected calibration error): count-weighted average gap between those two. One number to track.
- **Brier score**: mean of `(p − y)²`. Lower is better; rewards both ranking and honesty.
- **Platt scaling**: fit `p = sigmoid(a·score + b)` on held-out data. Two parameters, so it can't overfit much. Over-confident models get `a < 1`.
- **Isotonic regression** (PAV, pool adjacent violators): the best non-decreasing fit. More flexible than Platt, needs more data.
- Where it matters: medical risk, credit, anything where a person acts on the number. Also before averaging models.

#### Your task — `x02.py`

- `brier(y, p)` → mean squared error of the probabilities.
- `reliability_curve(y, p, bins=10)` → (mean predicted, fraction positive, count) for each non-empty bin.
- `ece(y, p, bins=10)` → expected calibration error.
- `platt_fit(scores, y)` → (a, b); `platt_predict(scores, a, b)` → calibrated probabilities.
- `pav(y)` → closest non-decreasing sequence.

#### Tests

```python
# file: test_x02.py
import numpy as np

import x02 as ex


def _overconfident(n=4000, seed=0):
    rng = np.random.default_rng(seed)
    s = rng.normal(0, 3, n)                      # model scores
    y = (rng.random(n) < 1 / (1 + np.exp(-s / 3))).astype(float)   # truth is 3x less sure
    return s, y


def test_brier():
    assert ex.brier([1, 0, 1], [1, 0, 1]) == 0
    assert abs(ex.brier([1, 0], [0.5, 0.5]) - 0.25) < 1e-12


def test_reliability_curve():
    mp, fp, cnt = ex.reliability_curve([0, 0, 1, 1], [0.1, 0.12, 0.9, 0.95], bins=10)
    assert list(cnt) == [2, 2] and fp[0] == 0 and fp[-1] == 1


def test_platt_fixes_overconfidence():
    s, y = _overconfident()
    raw = 1 / (1 + np.exp(-s))
    a, b = ex.platt_fit(s, y)
    cal = ex.platt_predict(s, a, b)
    assert abs(a - 1 / 3) < 0.08, "Platt should learn to divide the scores by about 3"
    assert ex.ece(y, cal) < ex.ece(y, raw) / 2
    assert ex.brier(y, cal) < ex.brier(y, raw)


def test_pav():
    assert np.allclose(ex.pav([1, 3, 2, 4]), [1, 2.5, 2.5, 4])
    out = ex.pav([5, 1, 1, 1])
    assert np.allclose(out, [2, 2, 2, 2]) and np.all(np.diff(ex.pav(np.random.default_rng(1).random(50))) >= -1e-12)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x02.py
"""Advanced 02 — Probability calibration: reliability curves, Brier, Platt, isotonic."""
import numpy as np


def brier(y, p):
    """Mean squared error between probabilities and 0/1 outcomes."""
    return float(np.mean((np.asarray(p, float) - np.asarray(y, float)) ** 2))


def reliability_curve(y, p, bins=10):
    """For each non-empty bin of predicted probability: (mean predicted, fraction positive, count)."""
    y, p = np.asarray(y, float), np.asarray(p, float)
    idx = np.minimum((p * bins).astype(int), bins - 1)
    mp, fp, cnt = [], [], []
    for b in range(bins):
        m = idx == b
        if m.any():
            mp.append(p[m].mean()); fp.append(y[m].mean()); cnt.append(int(m.sum()))
    return np.array(mp), np.array(fp), np.array(cnt)


def ece(y, p, bins=10):
    """Expected calibration error: count-weighted gap between confidence and accuracy."""
    mp, fp, cnt = reliability_curve(y, p, bins)
    return float(np.sum(cnt * np.abs(mp - fp)) / cnt.sum())


def _sigmoid(z):
    return 1 / (1 + np.exp(-z))


def platt_fit(scores, y, iters=3000, lr=0.5):
    """Fit p = sigmoid(a * score + b) by gradient descent on log loss. Returns (a, b)."""
    s, y = np.asarray(scores, float), np.asarray(y, float)
    a, b = 1.0, 0.0
    for _ in range(iters):
        g = _sigmoid(a * s + b) - y
        a -= lr * np.mean(g * s)
        b -= lr * np.mean(g)
    return a, b


def platt_predict(scores, a, b):
    return _sigmoid(a * np.asarray(scores, float) + b)


def pav(y):
    """Pool adjacent violators: the closest non-decreasing sequence to y (isotonic regression)."""
    blocks = [[float(v), 1] for v in y]       # [mean, size]
    i = 0
    while i < len(blocks) - 1:
        if blocks[i][0] > blocks[i + 1][0]:
            m1, n1 = blocks[i]; m2, n2 = blocks[i + 1]
            blocks[i] = [(m1 * n1 + m2 * n2) / (n1 + n2), n1 + n2]
            del blocks[i + 1]
            i = max(i - 1, 0)
        else:
            i += 1
    out = []
    for m, n in blocks:
        out += [m] * n
    return np.array(out)
```

</details>

**Done when:** green + ECE drops by more than half after Platt scaling.

---

### Advanced 3 — Support vector machines: the widest street

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

### Advanced 4 — Kernels: curved boundaries with linear maths

**Dataset:** make_moons and make_circles (sklearn generators) · **Time:** ~2 h

**Progress:** `Advanced 4/13` · **System after today:** kernel machines: RBF, polynomial, linear

**Goal:** Lift data into a space where a straight line works, without ever computing that space.

#### Visual

```text
  2-D: no straight line works        3-D after φ(x) = (x1², √2·x1x2, x2²)
      ○ ○ ○ ○                          ○   ○   ○      ← outer ring lifted up
    ○  ● ● ●  ○                     ─────────────── plane separates them
    ○  ● ● ●  ○                          ● ● ●
      ○ ○ ○ ○                         inner dots stay low
  kernel trick:  φ(x)·φ(z) = (x·z)²   ← same number, never build φ
```

#### Notes

- Many algorithms only ever use **dot products** between points. Replace `x·z` with `k(x, z)` and you've moved to a new feature space for free. That's the **kernel trick**.
- **Polynomial**: `(x·z + c)^d`. Degree 2 on 2-D points = all the squares and cross terms. Circles become separable.
- **RBF** (Gaussian): `exp(−γ‖x − z‖²)`. Similarity that fades with distance; its feature space is infinite. γ big → wiggly; γ small → smooth.
- A valid kernel gives a **positive semi-definite** Gram matrix K (no negative eigenvalues). Test it.
- **Kernel ridge classifier**: `α = (K + λI)⁻¹·t`, predict `sign(Σ αᵢ k(x, xᵢ))`. Same idea as an SVM's dual, solved in one line.
- Cost: K is n × n. Fine for thousands of points, not millions. That's one reason deep nets took over for big data.

#### Your task — `x04.py`

- `phi(x)` → explicit degree-2 features for a 2-D point.
- `poly_kernel(A, B, degree=2, c=0)`, `rbf_kernel(A, B, gamma)`, `linear_kernel(A, B)`.
- `class KernelClassifier(kernel="rbf", gamma=1.0, degree=2, lam=1e-2)` with `fit`, `decision_function`, `predict`.

#### Tests

```python
# file: test_x04.py
import numpy as np
from sklearn.datasets import make_circles, make_moons

import x04 as ex


def test_kernel_trick_identity():
    x, z = np.array([1.0, 2.0]), np.array([3.0, -1.0])
    assert np.isclose(ex.phi(x) @ ex.phi(z), ex.poly_kernel(x[None], z[None])[0, 0])


def test_rbf_properties():
    X = np.random.default_rng(0).normal(size=(30, 2))
    K = ex.rbf_kernel(X, X, 0.5)
    assert np.allclose(np.diag(K), 1) and np.allclose(K, K.T)
    assert np.linalg.eigvalsh(K).min() > -1e-8, "an RBF kernel matrix is positive semi-definite"


def _acc(m, X, y):
    return (m.predict(X) == y).mean()


def test_moons():
    X, y = make_moons(300, noise=0.15, random_state=0)
    Xt, yt = make_moons(200, noise=0.15, random_state=1)
    lin = ex.KernelClassifier("linear").fit(X, y)
    rbf = ex.KernelClassifier("rbf", gamma=2.0).fit(X, y)
    assert _acc(rbf, Xt, yt) > 0.95 and _acc(rbf, Xt, yt) > _acc(lin, Xt, yt) + 0.05


def test_circles_need_a_kernel():
    X, y = make_circles(300, noise=0.08, factor=0.45, random_state=0)
    Xt, yt = make_circles(200, noise=0.08, factor=0.45, random_state=1)
    assert _acc(ex.KernelClassifier("linear").fit(X, y), Xt, yt) < 0.7
    assert _acc(ex.KernelClassifier("poly", degree=2).fit(X, y), Xt, yt) > 0.95
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x04.py
"""Advanced 04 — Kernels and the kernel trick."""
import numpy as np


def phi(x):
    """Explicit degree-2 feature map for 2-D x: (x1^2, sqrt(2) x1 x2, x2^2)."""
    x1, x2 = x
    return np.array([x1 * x1, np.sqrt(2) * x1 * x2, x2 * x2])


def poly_kernel(A, B, degree=2, c=0.0):
    return (np.asarray(A, float) @ np.asarray(B, float).T + c) ** degree


def rbf_kernel(A, B, gamma=1.0):
    A, B = np.asarray(A, float), np.asarray(B, float)
    sq = (A ** 2).sum(1)[:, None] + (B ** 2).sum(1)[None, :] - 2 * A @ B.T
    return np.exp(-gamma * np.maximum(sq, 0))


def linear_kernel(A, B):
    return np.asarray(A, float) @ np.asarray(B, float).T


class KernelClassifier:
    """Kernel ridge classification: alpha = (K + lam I)^-1 t, predict sign(K(x, X) alpha)."""

    def __init__(self, kernel="rbf", gamma=1.0, degree=2, lam=1e-2):
        self.kernel, self.gamma, self.degree, self.lam = kernel, gamma, degree, lam

    def _k(self, A, B):
        if self.kernel == "rbf":
            return rbf_kernel(A, B, self.gamma)
        if self.kernel == "poly":
            return poly_kernel(A, B, self.degree, 1.0)
        return linear_kernel(A, B) + 1.0

    def fit(self, X, y):
        self.X = np.asarray(X, float)
        t = np.where(np.asarray(y) == 1, 1.0, -1.0)
        K = self._k(self.X, self.X)
        self.alpha = np.linalg.solve(K + self.lam * np.eye(len(K)), t)
        return self

    def decision_function(self, X):
        return self._k(np.asarray(X, float), self.X) @ self.alpha

    def predict(self, X):
        return (self.decision_function(X) >= 0).astype(int)
```

</details>

**Done when:** green + RBF beats linear on moons by more than 5 points.

---

### Advanced 5 — Gaussian mixtures and EM: soft clusters

**Dataset:** two synthetic blobs, then Iris without labels · **Time:** ~2 h

**Progress:** `Advanced 5/13` · **System after today:** a probabilistic clusterer with soft memberships

**Goal:** Fit a mixture of Gaussians with expectation–maximisation and get a probability for every cluster.

#### Visual

```text
   k-means: hard edges              GMM: overlapping bells
   ●●●│○○○                          ╭─╮      ╭──╮
   ●●●│○○○                         ╱   ╲ ╱╲ ╱    ╲
   ●●●│○○○                     ───╯     ╳  ╳      ╰───
                                  0.9/0.1  0.5/0.5  ← soft membership
  E step: who owns each point?  →  M step: refit each bell to its points
```

#### Notes

- k-means (Day 47) gives each point one cluster. A **Gaussian mixture** says: data came from k bell curves; each point has a *probability* of belonging to each.
- Each component has a **weight** (share of data), a **mean** and a **covariance** (shape: round, stretched, tilted).
- **EM** loops two steps:
  - **E step**: responsibilities `R[i, j] = πⱼ·N(xᵢ | μⱼ, Σⱼ) / Σₖ(...)`.
  - **M step**: refit weights, means, covariances using R as soft counts.
- EM never decreases the **log-likelihood**. Test that: it's the best bug detector you have.
- Local optima are real. Run several starts (`n_init`) and keep the best log-likelihood.
- Add a tiny value to covariance diagonals (`reg`) so a component can't collapse onto one point.
- k-means is a GMM with tiny equal round covariances and hard assignments.

#### Your task — `x05.py`

- `gaussian_pdf(X, mean, cov)` → density at every row.
- `class GMM(k=2, iters=100, seed=0, n_init=5)` with `fit` (`weights_`, `means_`, `covs_`, `log_likelihood_`), `predict_proba`, `predict`.

#### Tests

```python
# file: test_x05.py
import numpy as np
from sklearn.datasets import load_iris

import x05 as ex


def test_pdf_standard_normal():
    p = ex.gaussian_pdf(np.zeros((1, 2)), np.zeros(2), np.eye(2))
    assert np.isclose(p[0], 1 / (2 * np.pi))


def test_two_blobs():
    rng = np.random.default_rng(0)
    X = np.vstack([rng.normal(0, 1, (150, 2)), rng.normal([6, 6], 0.5, (100, 2))])
    g = ex.GMM(k=2).fit(X)
    assert np.allclose(sorted(g.weights_), [0.4, 0.6], atol=0.03)
    big = np.argmax(g.weights_)
    assert np.allclose(g.means_[big], [0, 0], atol=0.3)
    assert np.allclose(g.predict_proba(X).sum(1), 1)


def test_em_never_goes_down():
    X = load_iris().data
    g = ex.GMM(k=3, iters=60).fit(X)
    ll = np.array(g.log_likelihood_)
    assert np.all(np.diff(ll) > -1e-6), "EM must not decrease the log-likelihood"


def test_iris_soft_clusters():
    d = load_iris()
    labels = ex.GMM(k=3, iters=200, seed=1).fit(d.data).predict(d.data)
    purity = sum(np.bincount(d.target[labels == c]).max() for c in np.unique(labels)) / len(d.target)
    assert purity > 0.85
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x05.py
"""Advanced 05 — Gaussian mixture models fitted with EM."""
import numpy as np


def gaussian_pdf(X, mean, cov):
    """Density of a multivariate normal at every row of X."""
    X = np.atleast_2d(np.asarray(X, float))
    d = X.shape[1]
    diff = X - mean
    inv = np.linalg.inv(cov)
    norm = 1.0 / np.sqrt((2 * np.pi) ** d * np.linalg.det(cov))
    return norm * np.exp(-0.5 * np.einsum("ij,jk,ik->i", diff, inv, diff))


class GMM:
    def __init__(self, k=2, iters=100, seed=0, reg=1e-6, n_init=5):
        self.k, self.iters, self.seed, self.reg, self.n_init = k, iters, seed, reg, n_init

    def _dens(self, X):
        return np.column_stack([self.weights_[j] * gaussian_pdf(X, self.means_[j], self.covs_[j])
                                for j in range(self.k)])

    def fit(self, X):
        """Run EM n_init times from different starts; keep the run with the best log-likelihood."""
        X = np.asarray(X, float)
        rng = np.random.default_rng(self.seed)
        best = None
        for _ in range(self.n_init):
            self._em(X, rng)
            if best is None or self.log_likelihood_[-1] > best[3][-1]:
                best = (self.weights_.copy(), self.means_.copy(), self.covs_.copy(), self.log_likelihood_)
        self.weights_, self.means_, self.covs_, self.log_likelihood_ = best
        return self

    def _em(self, X, rng):
        n, d = X.shape
        self.means_ = X[rng.choice(n, self.k, replace=False)]
        self.covs_ = np.array([np.cov(X.T) + self.reg * np.eye(d)] * self.k)
        self.weights_ = np.full(self.k, 1.0 / self.k)
        self.log_likelihood_ = []
        for _ in range(self.iters):
            dens = self._dens(X)                       # E step
            self.log_likelihood_.append(float(np.log(dens.sum(1)).sum()))
            R = dens / dens.sum(1, keepdims=True)
            Nk = R.sum(0)                              # M step
            self.weights_ = Nk / n
            self.means_ = (R.T @ X) / Nk[:, None]
            for j in range(self.k):
                diff = X - self.means_[j]
                self.covs_[j] = (R[:, j, None] * diff).T @ diff / Nk[j] + self.reg * np.eye(d)
            if len(self.log_likelihood_) > 1 and abs(self.log_likelihood_[-1] - self.log_likelihood_[-2]) < 1e-6:
                break
        return self

    def predict_proba(self, X):
        dens = self._dens(np.asarray(X, float))
        return dens / dens.sum(1, keepdims=True)

    def predict(self, X):
        return self.predict_proba(X).argmax(1)
```

</details>

**Done when:** green + log-likelihood never goes down + Iris purity above 0.85.

---

### Advanced 6 — DBSCAN and hierarchical clustering

**Dataset:** make_moons + synthetic blobs with noise · **Time:** ~2 h

**Progress:** `Advanced 6/13` · **System after today:** clusters of any shape, plus noise detection

**Goal:** Cluster by density and by merging, so moons and odd shapes come out right.

#### Visual

```text
  DBSCAN (eps, min_pts)                agglomerative (bottom-up)
   ◉ core: ≥ min_pts within eps          start: every point alone
   ○ border: near a core                 repeat: merge the 2 closest
   ✕ noise: neither                      ┌──┴──┐
    ◉◉◉◉○          ✕                     ┌┴┐   ┌┴─┐     ← dendrogram
   ◉◉  ◉◉○   ◉◉◉◉                        a b   c  d e
  single = nearest pair · complete = farthest pair · average = mean
```

#### Notes

- k-means and GMMs assume blobs. Real clusters can be moons, rings or chains.
- **DBSCAN**: a point is **core** if at least `min_pts` points are within `eps`. Clusters grow by flooding from core to core; **border** points join but don't spread; the rest is **noise** (label −1). No k needed.
- Picking eps: plot each point's distance to its k-th neighbour, sorted; eps sits at the knee.
- **Agglomerative**: start with n clusters, merge the closest pair until k remain. "Closest" is the **linkage**:
  - single (nearest pair) follows chains, so it gets the moons right but can merge through a thin bridge;
  - complete (farthest pair) makes compact clusters;
  - average sits between them.
- The merge history is a **dendrogram**. Cut it at any height for any k.
- Naive agglomerative is O(n³). Fine for a few hundred points; real libraries are smarter.

#### Your task — `x06.py`

- `dbscan(X, eps, min_pts)` → labels, −1 for noise.
- `agglomerative(X, k, linkage="single")` with `"single"`, `"complete"` and `"average"`.

#### Tests

```python
# file: test_x06.py
import numpy as np
from sklearn.datasets import make_moons

import x06 as ex


def _agree(a, b):
    """Same partition up to renaming the clusters."""
    return all(len(set(b[a == c])) == 1 for c in set(a)) and len(set(a)) == len(set(b))


def test_dbscan_moons():
    X, y = make_moons(200, noise=0.05, random_state=0)
    labels = ex.dbscan(X, eps=0.2, min_pts=5)
    assert set(labels) - {-1} == {0, 1}
    keep = labels != -1
    assert _agree(labels[keep], y[keep])


def test_dbscan_noise():
    rng = np.random.default_rng(0)
    X = np.vstack([rng.normal(0, 0.1, (30, 2)), [[5, 5], [-5, 5]]])
    labels = ex.dbscan(X, eps=0.3, min_pts=4)
    assert labels[-1] == -1 and labels[-2] == -1 and len(set(labels[:30])) == 1


def test_single_linkage_follows_chains():
    X, y = make_moons(120, noise=0.04, random_state=1)
    assert _agree(ex.agglomerative(X, 2, "single"), y)


def test_complete_linkage_is_compact():
    rng = np.random.default_rng(2)
    X = np.vstack([rng.normal(c, 0.3, (20, 2)) for c in ([0, 0], [4, 0], [2, 4])])
    y = np.repeat([0, 1, 2], 20)
    for link in ("complete", "average"):
        assert _agree(ex.agglomerative(X, 3, link), y)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x06.py
"""Advanced 06 — Density and hierarchy: DBSCAN and agglomerative clustering."""
import numpy as np


def _d2(A, B):
    return ((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)


def dbscan(X, eps, min_pts):
    """Labels 0, 1, ... for clusters and -1 for noise."""
    X = np.asarray(X, float)
    near = _d2(X, X) <= eps * eps
    core = near.sum(1) >= min_pts
    labels = np.full(len(X), -1)
    c = 0
    for i in range(len(X)):
        if labels[i] != -1 or not core[i]:
            continue
        labels[i] = c
        stack = [i]
        while stack:
            p = stack.pop()
            if not core[p]:
                continue
            for q in np.where(near[p])[0]:
                if labels[q] == -1:
                    labels[q] = c
                    stack.append(q)
        c += 1
    return labels


def agglomerative(X, k, linkage="single"):
    """Merge the two closest clusters until k remain. Returns labels 0..k-1."""
    X = np.asarray(X, float)
    D = np.sqrt(_d2(X, X))
    clusters = [[i] for i in range(len(X))]
    agg = min if linkage == "single" else max
    while len(clusters) > k:
        best = None
        for a in range(len(clusters)):
            for b in range(a + 1, len(clusters)):
                if linkage == "average":
                    dist = D[np.ix_(clusters[a], clusters[b])].mean()
                else:
                    dist = agg(D[np.ix_(clusters[a], clusters[b])].ravel())
                if best is None or dist < best[0]:
                    best = (dist, a, b)
        _, a, b = best
        clusters[a] += clusters.pop(b)
    labels = np.empty(len(X), int)
    for j, members in enumerate(clusters):
        labels[members] = j
    return labels
```

</details>

**Done when:** green + DBSCAN recovers both moons and flags the far points as noise.

---

### Advanced 7 — t-SNE: maps of high-dimensional data

**Dataset:** Digits 0, 1, 6 (8×8 pixel images) · **Time:** ~2–3 h

**Progress:** `Advanced 7/13` · **System after today:** a 2-D map where neighbours stay neighbours

**Goal:** Build t-SNE from scratch and turn 64-pixel digits into a 2-D map with clean islands.

#### Visual

```text
  64-D: P = who is near whom         2-D: Q from Student-t distances
  (Gaussian, width set by            move points to make Q look like P
   perplexity ≈ # neighbours)        ┌──────────────────┐
                                     │  000     666     │
   KL(P ‖ Q) ← minimise              │  000    6666     │
                                     │       111        │
                                     └──────────────────┘
```

#### Notes

- PCA (Day 48) keeps the big directions. **t-SNE** keeps **neighbourhoods**: points close in 64-D stay close in 2-D.
- High-D similarity: Gaussian around each point. Its width is set per point so the **perplexity** (≈ number of effective neighbours) is the same everywhere. Found by **binary search** on β = 1/(2σ²).
- Symmetrise: `P = (P_cond + P_condᵀ) / 2n`.
- Low-D similarity: **Student-t** with heavy tails, `1/(1 + ‖yᵢ − yⱼ‖²)`. Heavy tails let far clusters spread out instead of crowding the middle.
- Gradient: `4·Σⱼ (pᵢⱼ − qᵢⱼ)(yᵢ − yⱼ)/(1 + ‖yᵢ − yⱼ‖²)`. Add momentum, and **early exaggeration** (P × 4 for 100 steps) to form islands first.
- Read t-SNE maps carefully: cluster sizes and distances *between* clusters don't mean much. Only "who's near whom" does.
- UMAP is the faster modern cousin; same reading rules.

#### Your task — `x07.py`

- `sq_dists(X)` → all squared distances.
- `cond_probs(D_row, beta)` → (probabilities, entropy in bits).
- `joint_p(X, perplexity)` → symmetric P with binary-searched betas.
- `tsne(X, dims=2, perplexity=30, iters=300, lr=200, seed=0)` → the map.
- `kl_divergence(P, Y)` → how well the map keeps the neighbourhoods.

#### Tests

```python
# file: test_x07.py
import numpy as np
from sklearn.datasets import load_digits

import x07 as ex


def _digits(n=150):
    d = load_digits()
    keep = np.isin(d.target, [0, 1, 6])
    return d.data[keep][:n] / 16, d.target[keep][:n]


def test_perplexity_is_hit():
    X, _ = _digits(60)
    D = ex.sq_dists(X)
    P = ex.joint_p(X, perplexity=10)
    assert np.isclose(P.sum(), 1, atol=1e-6) and np.allclose(P, P.T)
    row = np.delete(D[0], 0)
    # rebuild row 0's conditional distribution and check its perplexity
    beta_lo, beta_hi = 1e-6, 1e6
    for _ in range(100):
        b = np.sqrt(beta_lo * beta_hi)
        _, H = ex.cond_probs(row, b)
        beta_lo, beta_hi = (b, beta_hi) if H > np.log2(10) else (beta_lo, b)
    assert abs(2 ** H - 10) < 0.1


def test_embedding_separates_digits():
    X, y = _digits()
    Y = ex.tsne(X, perplexity=20, iters=300)
    assert Y.shape == (len(X), 2)
    # 5-nearest-neighbour accuracy in the 2-D map
    D = ex.sq_dists(Y)
    np.fill_diagonal(D, np.inf)
    nn = np.argsort(D, 1)[:, :5]
    acc = np.mean([np.bincount(y[r]).argmax() == y[i] for i, r in enumerate(nn)])
    assert acc > 0.95


def test_kl_goes_down():
    X, _ = _digits(80)
    P = ex.joint_p(X, perplexity=15)
    early = ex.kl_divergence(P, ex.tsne(X, perplexity=15, iters=20))
    late = ex.kl_divergence(P, ex.tsne(X, perplexity=15, iters=250))
    assert late < early
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x07.py
"""Advanced 07 — t-SNE from scratch (exact, small n)."""
import numpy as np


def sq_dists(X):
    s = (X ** 2).sum(1)
    return np.maximum(s[:, None] + s[None, :] - 2 * X @ X.T, 0)


def cond_probs(D_row, beta):
    """p_j|i proportional to exp(-beta * d_ij) (D_row excludes i). Returns (P, entropy in bits)."""
    P = np.exp(-(D_row - D_row.min()) * beta)
    P /= P.sum()
    H = -np.sum(P * np.log2(np.maximum(P, 1e-12)))
    return P, H


def joint_p(X, perplexity=30.0, tol=1e-4):
    """Symmetric P matrix: binary-search each beta so 2**entropy == perplexity."""
    D = sq_dists(np.asarray(X, float))
    n = len(D)
    P = np.zeros((n, n))
    target = np.log2(perplexity)
    for i in range(n):
        lo, hi, beta = 0.0, np.inf, 1.0
        row = np.delete(D[i], i)
        for _ in range(60):
            Pi, H = cond_probs(row, beta)
            if abs(H - target) < tol:
                break
            if H > target:
                lo, beta = beta, beta * 2 if hi == np.inf else (beta + hi) / 2
            else:
                hi, beta = beta, (beta + lo) / 2
        P[i, np.arange(n) != i] = Pi
    P = (P + P.T) / (2 * n)
    return np.maximum(P, 1e-12)


def tsne(X, dims=2, perplexity=30.0, iters=300, lr=200.0, seed=0):
    P = joint_p(X, perplexity)
    n = len(P)
    rng = np.random.default_rng(seed)
    Y = rng.normal(0, 1e-4, (n, dims))
    vel = np.zeros_like(Y)
    for t in range(iters):
        exag = 4.0 if t < 100 else 1.0
        num = 1.0 / (1.0 + sq_dists(Y))
        np.fill_diagonal(num, 0)
        Q = np.maximum(num / num.sum(), 1e-12)
        PQ = (exag * P - Q) * num
        grad = 4 * (np.diag(PQ.sum(1)) - PQ) @ Y
        mom = 0.5 if t < 100 else 0.8
        vel = mom * vel - lr * grad
        Y += vel
        Y -= Y.mean(0)
    return Y


def kl_divergence(P, Y):
    num = 1.0 / (1.0 + sq_dists(Y))
    np.fill_diagonal(num, 0)
    Q = np.maximum(num / num.sum(), 1e-12)
    return float(np.sum(P * np.log(P / Q)))
```

</details>

**Done when:** green + 5-NN accuracy in the 2-D map above 95%.

---

### Advanced 8 — Anomaly detection: finding the odd ones out

**Dataset:** synthetic correlated sensors + two-blob data with planted anomalies · **Time:** ~2 h

**Progress:** `Advanced 8/13` · **System after today:** two anomaly scorers and an honest metric

**Goal:** Score how strange each point is with a Gaussian model and an isolation forest, and know when each one wins.

#### Visual

```text
  Mahalanobis: distance in the     isolation forest: random cuts
  data's own shape                  ┌────┬───────────┐
     ╱●●●╱                          │    │  ●●●  ●●  │  ✕ isolated in
    ╱●●●╱   ✕ ← plain distance OK   │ ✕  ├──────┬────┤    2 cuts
   ╱●●●╱       but far in shape     │    │ ●●●● │●●● │  ● needs ~8
                                    └────┴──────┴────┘
  short average path = anomaly · score = 2^(−path / c(n))
```

#### Notes

- Anomalies are rare and often unlabelled: fraud, faulty sensors, intrusions. Score every point; flag the top ones.
- **Gaussian density**: fit mean and covariance; score with **Mahalanobis distance** `(x − μ)ᵀΣ⁻¹(x − μ)`. Catches points that break a *correlation* even when each value looks normal alone.
- It assumes one blob. With two clusters, the mean lands in the empty middle and the model calls the empty middle "normal".
- **Isolation forest**: random trees with random cuts. Odd points get isolated in few cuts, so their average path is short. Score `2^(−E[h]/c(ψ))`, where `c(ψ)` is the average path in a random tree of ψ points. Near 1 = anomaly.
- Sub-sample (ψ = 128 or 256) per tree. It's faster *and* works better.
- Measure with **precision@k**: of the k you'd send to a human to check, how many were real? Accuracy is useless at 1% anomalies (Day 53).

#### Your task — `x08.py`

- `class GaussianDensity` with `fit(X)` and `score(X)` (squared Mahalanobis).
- `c_factor(n)` → average path length for n points.
- `class IsolationForest(n_trees=100, sample=128, seed=0)` with `fit` and `score`.
- `precision_at_k(scores, y, k)`.

#### Tests

```python
# file: test_x08.py
import numpy as np

import x08 as ex


def _data(seed=0):
    rng = np.random.default_rng(seed)
    normal = rng.multivariate_normal([0, 0], [[1, 0.9], [0.9, 1]], 400)
    # anomalies sit off the diagonal: each coordinate looks ordinary on its own
    odd = np.column_stack([rng.uniform(1.5, 2.5, 10), rng.uniform(-2.5, -1.5, 10)])
    X = np.vstack([normal, odd])
    y = np.r_[np.zeros(400), np.ones(10)]
    return X, y


def test_c_factor():
    assert ex.c_factor(1) == 0 and abs(ex.c_factor(256) - 10.24) < 0.05


def test_mahalanobis_sees_correlation():
    X, y = _data()
    g = ex.GaussianDensity().fit(X[y == 0])
    assert ex.precision_at_k(g.score(X), y, 10) >= 0.9
    plain = (X ** 2).sum(1)          # plain distance ignores the correlation
    assert ex.precision_at_k(plain, y, 10) < ex.precision_at_k(g.score(X), y, 10)


def test_isolation_forest_on_two_blobs():
    rng = np.random.default_rng(1)
    normal = np.vstack([rng.normal([-4, 0], 0.5, (200, 2)), rng.normal([4, 0], 0.5, (200, 2))])
    odd = np.column_stack([rng.uniform(-1.5, 1.5, 10), rng.uniform(-3, 3, 10)])  # the empty middle
    X, y = np.vstack([normal, odd]), np.r_[np.zeros(400), np.ones(10)]
    s = ex.IsolationForest(n_trees=60, seed=0).fit(X).score(X)
    assert s.shape == (len(X),) and np.all((s > 0) & (s < 1))
    assert ex.precision_at_k(s, y, 10) >= 0.8
    # one Gaussian puts its centre in the empty middle, so it misses them
    g = ex.GaussianDensity().fit(X)
    assert ex.precision_at_k(g.score(X), y, 10) < ex.precision_at_k(s, y, 10)


def test_precision_at_k():
    assert ex.precision_at_k([0.9, 0.1, 0.8, 0.2], [1, 0, 0, 1], 2) == 0.5
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x08.py
"""Advanced 08 — Anomaly detection: a Gaussian density model and an isolation forest."""
import numpy as np


class GaussianDensity:
    """Fit a mean and covariance; score = squared Mahalanobis distance (bigger = stranger)."""

    def fit(self, X):
        X = np.asarray(X, float)
        self.mean_ = X.mean(0)
        self.inv_ = np.linalg.pinv(np.cov(X.T) + 1e-6 * np.eye(X.shape[1]))
        return self

    def score(self, X):
        diff = np.asarray(X, float) - self.mean_
        return np.einsum("ij,jk,ik->i", diff, self.inv_, diff)


def c_factor(n):
    """Average path length of an unsuccessful search in a binary search tree of n points."""
    if n <= 1:
        return 0.0
    return 2 * (np.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n


class IsolationForest:
    def __init__(self, n_trees=100, sample=128, seed=0):
        self.n_trees, self.sample, self.seed = n_trees, sample, seed

    def _grow(self, X, depth, limit, rng):
        if depth >= limit or len(X) <= 1:
            return ("leaf", len(X))
        f = rng.integers(X.shape[1])
        lo, hi = X[:, f].min(), X[:, f].max()
        if lo == hi:
            return ("leaf", len(X))
        cut = rng.uniform(lo, hi)
        m = X[:, f] < cut
        return ("node", f, cut, self._grow(X[m], depth + 1, limit, rng), self._grow(X[~m], depth + 1, limit, rng))

    def fit(self, X):
        X = np.asarray(X, float)
        rng = np.random.default_rng(self.seed)
        self.psi_ = min(self.sample, len(X))
        limit = int(np.ceil(np.log2(self.psi_)))
        self.trees_ = [self._grow(X[rng.choice(len(X), self.psi_, replace=False)], 0, limit, rng)
                       for _ in range(self.n_trees)]
        return self

    def _path(self, x, node, depth=0):
        while node[0] == "node":
            node = node[3] if x[node[1]] < node[2] else node[4]
            depth += 1
        return depth + c_factor(node[1])

    def score(self, X):
        """Anomaly score in (0, 1): near 1 = isolated quickly = anomaly."""
        X = np.asarray(X, float)
        h = np.array([np.mean([self._path(x, t) for t in self.trees_]) for x in X])
        return 2 ** (-h / c_factor(self.psi_))


def precision_at_k(scores, y, k):
    """Of the k highest-scoring points, the fraction that really are anomalies (y == 1)."""
    top = np.argsort(-np.asarray(scores))[:k]
    return float(np.mean(np.asarray(y)[top]))
```

</details>

**Done when:** green + you can explain why each method wins one of the two tests.

---

### Advanced 9 — Recommender systems: matrix factorisation

**Dataset:** synthetic users × items with hidden tastes (30% of ratings seen) · **Time:** ~2 h

**Progress:** `Advanced 9/13` · **System after today:** a recommender that fills in missing ratings

**Goal:** Learn a small taste vector for every user and item, then recommend what's missing.

#### Visual

```text
        items →                  ≈   users × k     ·   k × items
  u1  [ 5  ?  1  ?  4 ]               [0.9 −0.2]       [ 1.1  … ]
  u2  [ ?  2  ?  5  ? ]               [−0.5 1.1]   ·   [−0.3  … ]
  u3  [ 4  ?  ?  1  ? ]               [ …  …  ]
  r̂ = μ + b_user + b_item + p_user · q_item       ? = predict these
```

#### Notes

- A ratings table is mostly empty. **Collaborative filtering** fills it using people with similar taste.
- **Matrix factorisation**: give each user a vector p and each item a vector q (k numbers, e.g. "action-ness", "romance-ness"; the model invents them). Rating ≈ p · q.
- Add **biases**: global mean μ, user bias (harsh rater?), item bias (just a good film?). Biases alone beat many fancy models.
- Train with **SGD on observed ratings only**: error `e = r − r̂`, then nudge `b_u, b_i, p_u, q_i` along e, with L2 regularisation.
- Evaluate on **held-out ratings** with RMSE; the global mean is your baseline.
- **Recommend** = highest predicted unseen items. Never re-recommend what they've seen.
- Real systems add implicit feedback (clicks), cold-start fallbacks and two-tower neural nets; same core idea.

#### Your task — `x09.py`

- `mf_train(ratings, n_users, n_items, k=8, epochs=40, lr=0.02, reg=0.05)` → model dict with `mu`, `bu`, `bi`, `P`, `Q`.
- `mf_predict(model, u, i)`, `rmse(model, ratings)`.
- `recommend(model, u, seen, n=5)` → top unseen item ids.

#### Tests

```python
# file: test_x09.py
import numpy as np

import x09 as ex


def _world(seed=0, users=60, items=40, k=3):
    """Hidden tastes -> ratings 1..5. We see 30% of them."""
    rng = np.random.default_rng(seed)
    U, V = rng.normal(0, 1, (users, k)), rng.normal(0, 1, (items, k))
    full = np.clip(3 + U @ V.T * 0.8, 1, 5)
    seen = rng.random((users, items)) < 0.3
    obs = [(u, i, full[u, i]) for u in range(users) for i in range(items) if seen[u, i]]
    hid = [(u, i, full[u, i]) for u in range(users) for i in range(items) if not seen[u, i]]
    return obs, hid, full, seen


def test_beats_the_average():
    obs, hid, _, _ = _world()
    m = ex.mf_train(obs, 60, 40, k=3, epochs=60)
    mean_rmse = np.sqrt(np.mean([(r - m["mu"]) ** 2 for _, _, r in hid]))
    assert ex.rmse(m, obs) < 0.5
    assert ex.rmse(m, hid) < 0.8 * mean_rmse, "must predict unseen ratings better than the global mean"


def test_recommend_skips_seen_and_finds_good_items():
    obs, _, full, seen = _world(1)
    m = ex.mf_train(obs, 60, 40, k=3, epochs=60)
    u = 0
    already = np.where(seen[u])[0].tolist()
    recs = ex.recommend(m, u, already, n=5)
    assert len(recs) == 5 and not set(recs) & set(already)
    unseen = [i for i in range(40) if i not in already]
    assert full[u, recs].mean() > np.mean(full[u, unseen])
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x09.py
"""Advanced 09 — Recommender systems: matrix factorisation with SGD."""
import numpy as np


def mf_train(ratings, n_users, n_items, k=8, epochs=40, lr=0.02, reg=0.05, seed=0):
    """ratings: list of (user, item, rating). Learns r ~ mu + bu + bi + P[u].Q[i]."""
    rng = np.random.default_rng(seed)
    R = np.asarray(ratings, float)
    model = {
        "mu": float(R[:, 2].mean()),
        "bu": np.zeros(n_users), "bi": np.zeros(n_items),
        "P": rng.normal(0, 0.1, (n_users, k)), "Q": rng.normal(0, 0.1, (n_items, k)),
    }
    P, Q, bu, bi = model["P"], model["Q"], model["bu"], model["bi"]
    for _ in range(epochs):
        for idx in rng.permutation(len(R)):
            u, i, r = int(R[idx, 0]), int(R[idx, 1]), R[idx, 2]
            err = r - (model["mu"] + bu[u] + bi[i] + P[u] @ Q[i])
            bu[u] += lr * (err - reg * bu[u])
            bi[i] += lr * (err - reg * bi[i])
            P[u], Q[i] = P[u] + lr * (err * Q[i] - reg * P[u]), Q[i] + lr * (err * P[u] - reg * Q[i])
    return model


def mf_predict(model, u, i):
    return float(model["mu"] + model["bu"][u] + model["bi"][i] + model["P"][u] @ model["Q"][i])


def rmse(model, ratings):
    return float(np.sqrt(np.mean([(r - mf_predict(model, int(u), int(i))) ** 2 for u, i, r in ratings])))


def recommend(model, u, seen, n=5):
    """Top-n unseen item ids for user u, best first."""
    scores = model["mu"] + model["bu"][u] + model["bi"] + model["Q"] @ model["P"][u]
    order = [int(i) for i in np.argsort(-scores) if int(i) not in set(seen)]
    return order[:n]
```

</details>

**Done when:** green + held-out RMSE at least 20% better than predicting the mean.

---

### Advanced 10 — Reinforcement learning: bandits and Q-learning

**Dataset:** simulated slot machines + a 4×4 grid world · **Time:** ~2–3 h

**Progress:** `Advanced 10/13` · **System after today:** agents that learn from rewards

**Goal:** Balance exploring and exploiting, then teach an agent to cross a grid without falling in a hole.

#### Visual

```text
  bandit: which arm pays most?     grid world (Q-learning)
   arm  0    1    2    3            S → → ↓ .      S start, G goal (+1)
   p   .20  .50  .75  .40           . H . ↓ .      H hole (−1)
   ε-greedy: random ε of the time   . . . ↓ H      arrows = argmax Q
   UCB: est + √(2 ln t / n)         H . . → G
  Q(s,a) ← Q(s,a) + α·(r + γ·max Q(s′) − Q(s,a))
```

#### Notes

- No labels here, only **rewards**. The agent must try things to learn what works.
- **Multi-armed bandit**: k machines, unknown payouts. **Explore** (try others) vs **exploit** (pull the best so far).
  - **ε-greedy**: random arm with probability ε, else the best estimate.
  - **UCB1**: pick the arm with the highest `estimate + √(2 ln t / n)`. The bonus shrinks as an arm is tried; optimism drives exploration.
  - Running mean: `est += (r − est)/n`. No list needed.
- **MDP**: states, actions, rewards, and a **discount** γ (future reward is worth a bit less).
- **Q-learning**: Q(s, a) = expected future reward. Update towards `r + γ·max Q(s′, ·)`. It learns the *optimal* policy even while acting ε-greedily (off-policy).
- The small step cost (−0.01) makes shorter paths better.
- Same ideas power A/B tests, ad placement, game agents, and the RLHF that tuned chat models (Day 88 territory).

#### Your task — `x10.py`

- `class Bandit(probs, seed)` with `pull(a)`.
- `epsilon_greedy(bandit, steps, eps=0.1)` and `ucb1(bandit, steps)` → (estimates, counts, total reward).
- `class GridWorld` with `reset()` and `step(a)` → (state, reward, done).
- `q_learning(env, episodes=500, alpha=0.5, gamma=0.95, eps=0.2)` → Q of shape (4, 4, 4).
- `greedy_path(env, Q)` → list of states.

#### Tests

```python
# file: test_x10.py
import numpy as np

import x10 as ex

PROBS = [0.2, 0.5, 0.75, 0.4]


def test_epsilon_greedy_finds_best_arm():
    est, n, total = ex.epsilon_greedy(ex.Bandit(PROBS, 0), 3000, eps=0.1)
    assert np.argmax(n) == 2 and abs(est[2] - 0.75) < 0.05
    assert total > 0.65 * 3000


def test_ucb_explores_then_commits():
    est, n, total = ex.ucb1(ex.Bandit(PROBS, 1), 3000)
    assert n.min() >= 1 and np.argmax(n) == 2 and n[2] > 0.7 * 3000


def test_gridworld_rules():
    env = ex.GridWorld()
    env.reset()
    assert env.step(0) == ((0, 0), -0.01, False), "bumping the wall keeps you in place"
    env.pos = (3, 2)
    assert env.step(3) == ((3, 3), 1.0, True)


def test_q_learning_reaches_goal_safely():
    env = ex.GridWorld()
    Q = ex.q_learning(env, episodes=800)
    path = ex.greedy_path(env, Q)
    assert path[-1] == (3, 3) and not set(path) & env.holes
    assert len(path) - 1 == 6, "the shortest safe route is 6 moves"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x10.py
"""Advanced 10 — Learning from rewards: bandits and Q-learning."""
import numpy as np


class Bandit:
    """k slot machines; arm a pays 1 with probability probs[a]."""

    def __init__(self, probs, seed=0):
        self.probs = np.asarray(probs, float)
        self.rng = np.random.default_rng(seed)

    def pull(self, a):
        return float(self.rng.random() < self.probs[a])


def epsilon_greedy(bandit, steps, eps=0.1, seed=0):
    """Returns (estimates, counts, total reward)."""
    rng = np.random.default_rng(seed)
    k = len(bandit.probs)
    est, n, total = np.zeros(k), np.zeros(k), 0.0
    for _ in range(steps):
        a = rng.integers(k) if rng.random() < eps else int(np.argmax(est))
        r = bandit.pull(a)
        n[a] += 1
        est[a] += (r - est[a]) / n[a]
        total += r
    return est, n, total


def ucb1(bandit, steps):
    k = len(bandit.probs)
    est, n, total = np.zeros(k), np.zeros(k), 0.0
    for t in range(steps):
        a = t if t < k else int(np.argmax(est + np.sqrt(2 * np.log(t + 1) / n)))
        r = bandit.pull(a)
        n[a] += 1
        est[a] += (r - est[a]) / n[a]
        total += r
    return est, n, total


class GridWorld:
    """4x4 grid. Start (0,0), goal (3,3) gives +1, holes give -1, each step costs 0.01."""
    MOVES = [(-1, 0), (1, 0), (0, -1), (0, 1)]   # up, down, left, right

    def __init__(self, holes=((1, 1), (2, 3), (3, 0))):
        self.holes = set(holes)
        self.size, self.goal = 4, (3, 3)

    def reset(self):
        self.pos = (0, 0)
        return self.pos

    def step(self, a):
        dr, dc = self.MOVES[a]
        r, c = self.pos
        self.pos = (min(max(r + dr, 0), 3), min(max(c + dc, 0), 3))
        if self.pos == self.goal:
            return self.pos, 1.0, True
        if self.pos in self.holes:
            return self.pos, -1.0, True
        return self.pos, -0.01, False


def q_learning(env, episodes=500, alpha=0.5, gamma=0.95, eps=0.2, seed=0):
    """Q[row, col, action] learned by Q(s,a) += alpha (r + gamma max Q(s') - Q(s,a))."""
    rng = np.random.default_rng(seed)
    Q = np.zeros((4, 4, 4))
    for _ in range(episodes):
        s, done, steps = env.reset(), False, 0
        while not done and steps < 100:
            a = rng.integers(4) if rng.random() < eps else int(np.argmax(Q[s]))
            s2, r, done = env.step(a)
            target = r if done else r + gamma * Q[s2].max()
            Q[s][a] += alpha * (target - Q[s][a])
            s, steps = s2, steps + 1
    return Q


def greedy_path(env, Q, max_steps=20):
    s, path = env.reset(), [env.reset()]
    for _ in range(max_steps):
        s, _, done = env.step(int(np.argmax(Q[s])))
        path.append(s)
        if done:
            break
    return path
```

</details>

**Done when:** green + the greedy path reaches G in 6 moves without touching a hole.

---

### Advanced 11 — Autoencoders: compression you can train

**Dataset:** Digits (400 images, 64 pixels) · **Time:** ~2–3 h

**Progress:** `Advanced 11/13` · **System after today:** a neural compressor with hand-written backprop

**Goal:** Squeeze 64 pixels into 8 numbers and back, with backprop and Adam written by hand: the bridge into Block 3.

#### Visual

```text
   64 pixels → [W1, tanh] → 8-number code → [W2] → 64 pixels
   ▓▓░░▓▓                         ▲                 ▓▓░░▓▓
   ░▓▓▓▓░      encoder        bottleneck  decoder   ░▓▓▓▓░
   loss = mean (x̂ − x)²   →   gradients flow right to left
   linear autoencoder ≡ PCA   ·   tanh lets it bend
```

#### Notes

- An **autoencoder** learns to copy its input through a narrow **bottleneck**. To succeed, the code has to keep what matters.
- Encoder `h = tanh(xW₁ + b₁)`, decoder `x̂ = hW₂ + b₂`, loss = mean squared error.
- **Backprop by hand** (the chain rule, right to left):
  - `dX̂ = 2(X̂ − X)/N`
  - `dW₂ = Hᵀ·dX̂`, `db₂ = Σ dX̂`
  - `dH = dX̂·W₂ᵀ`, `dZ = dH ⊙ (1 − H²)` (tanh′)
  - `dW₁ = Xᵀ·dZ`, `db₁ = Σ dZ`
- **Always gradient-check**: nudge one weight by ±1e−6, compare the slope to your formula.
- **Adam** (Day 69): momentum plus per-weight step sizes. Works well here with lr ≈ 0.01.
- Baseline: PCA with the same k. A *linear* autoencoder can only match PCA; the nonlinearity is what lets it do better.
- Uses: denoising, anomaly detection (high reconstruction error = odd), pretraining. VAEs and diffusion models grow from this.
- Next stage you build an autograd engine (Day 63) so you never write these gradients by hand again.

#### Your task — `x11.py`

- `pca_reconstruct(X, k)` → the PCA baseline.
- `class Autoencoder(n_in, n_code, seed=0)` with `encode`, `decode`, `loss`.
- `grads(X)` → (dW1, db1, dW2, db2) by hand.
- `fit(X, epochs, lr, batch)` → loss after each epoch (Adam).

#### Tests

```python
# file: test_x11.py
import numpy as np
from sklearn.datasets import load_digits

import x11 as ex


def _digits(n=400):
    return load_digits().data[:n] / 16


def test_gradients_match_finite_differences():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(5, 4))
    ae = ex.Autoencoder(4, 2, seed=1)
    analytic = ae.grads(X)
    for p, g in zip([ae.W1, ae.b1, ae.W2, ae.b2], analytic):
        idx = (0,) * p.ndim
        old = p[idx]
        p[idx] = old + 1e-6; up = ae.loss(X)
        p[idx] = old - 1e-6; down = ae.loss(X)
        p[idx] = old
        assert abs((up - down) / 2e-6 - g[idx]) < 1e-5


def test_pca_reconstruction():
    X = _digits()
    err = [np.mean((ex.pca_reconstruct(X, k) - X) ** 2) for k in (2, 8, 32, 64)]
    assert all(a > b for a, b in zip(err, err[1:])) and err[-1] < 1e-20


def test_autoencoder_learns_and_compresses():
    X = _digits()
    ae = ex.Autoencoder(64, 8, seed=0)
    hist = ae.fit(X, epochs=150, lr=0.01)
    assert hist[-1] < hist[0] / 2
    assert ae.encode(X).shape == (len(X), 8)
    pca8 = np.mean((ex.pca_reconstruct(X, 8) - X) ** 2)
    assert hist[-1] < 1.3 * pca8, "an 8-number code should rebuild digits about as well as PCA-8"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x11.py
"""Advanced 11 — An autoencoder in NumPy, with backprop written by hand."""
import numpy as np


def pca_reconstruct(X, k):
    """Project centred X onto its top-k principal directions and map back."""
    X = np.asarray(X, float)
    mu = X.mean(0)
    _, _, Vt = np.linalg.svd(X - mu, full_matrices=False)
    V = Vt[:k].T
    return (X - mu) @ V @ V.T + mu


class Autoencoder:
    """x -> tanh(x W1 + b1) = code -> code W2 + b2 = x_hat. Loss: mean squared error."""

    def __init__(self, n_in, n_code, seed=0):
        rng = np.random.default_rng(seed)
        self.W1 = rng.normal(0, 1 / np.sqrt(n_in), (n_in, n_code))
        self.b1 = np.zeros(n_code)
        self.W2 = rng.normal(0, 1 / np.sqrt(n_code), (n_code, n_in))
        self.b2 = np.zeros(n_in)

    def encode(self, X):
        return np.tanh(np.asarray(X, float) @ self.W1 + self.b1)

    def decode(self, H):
        return H @ self.W2 + self.b2

    def loss(self, X):
        X = np.asarray(X, float)
        return float(np.mean((self.decode(self.encode(X)) - X) ** 2))

    def grads(self, X):
        """Gradients of the loss for W1, b1, W2, b2 (same shapes)."""
        X = np.asarray(X, float)
        H = self.encode(X)
        Xh = self.decode(H)
        dXh = 2 * (Xh - X) / X.size
        dW2, db2 = H.T @ dXh, dXh.sum(0)
        dH = dXh @ self.W2.T
        dZ = dH * (1 - H ** 2)
        return X.T @ dZ, dZ.sum(0), dW2, db2

    def fit(self, X, epochs=300, lr=0.05, batch=64, seed=0):
        """Adam on mini-batches. Returns the loss after every epoch."""
        X = np.asarray(X, float)
        rng = np.random.default_rng(seed)
        params = [self.W1, self.b1, self.W2, self.b2]
        m = [np.zeros_like(p) for p in params]
        v = [np.zeros_like(p) for p in params]
        t, history = 0, []
        for _ in range(epochs):
            for s in range(0, len(X), batch):
                idx = rng.permutation(len(X))[:batch] if batch < len(X) else slice(None)
                g = self.grads(X[idx])
                t += 1
                for j, p in enumerate(params):
                    m[j] = 0.9 * m[j] + 0.1 * g[j]
                    v[j] = 0.999 * v[j] + 0.001 * g[j] ** 2
                    p -= lr * (m[j] / (1 - 0.9 ** t)) / (np.sqrt(v[j] / (1 - 0.999 ** t)) + 1e-8)
            history.append(self.loss(X))
        return history
```

</details>

**Done when:** green + your gradients match finite differences + the loss halves.

---

### Advanced 12 — Production ML: drift and experiment tracking

**Dataset:** synthetic training vs live feature columns · **Time:** ~2 h

**Progress:** `Advanced 12/13` · **System after today:** drift alarms + a run log you can trust

**Goal:** Notice when live data stops looking like training data, and keep a record of every experiment.

#### Visual

```text
  training data  ▁▃▆█▆▃▁            PSI per feature
  live (week 6)       ▁▃▆█▆▃▁       age     0.02  ✓ stable
                 ← shift →          income  0.61  ✗ drifted → retrain?
                                    visits  0.03  ✓
  runs.jsonl:  {"run": 3, "params": {...}, "metrics": {...}, "data": "a1b2c3"}
```

#### Notes

- Models fail quietly in production: the world changes, your training data doesn't. That's **data drift**.
- **PSI** (population stability index): bin the training column by quantiles, compare bin shares live vs train, sum `(a − e)·ln(a/e)`. Rule of thumb: < 0.1 stable, 0.1–0.25 watch, > 0.25 act.
- **KS statistic**: biggest gap between the two empirical CDFs. 0 = same, 1 = no overlap.
- Check every input feature *and* the model's output distribution. Label drift shows up later, when ground truth arrives.
- **Experiment tracking**: every run logs params, metrics and a **data hash**. "Which run was best, and on which data?" should be one line, not archaeology. MLflow and W&B do this at scale; JSONL is enough to start.
- Same data → same hash. Different data and same params is a different experiment.

#### Your task — `x12.py`

- `psi(expected, actual, bins=10)` and `ks_statistic(a, b)`.
- `drift_report(train, live, names, threshold=0.25)` → `{name: {"psi", "ks", "drift"}}`.
- `data_hash(X)` → 12-character fingerprint.
- `class Tracker(path)` with `log(params, metrics, data=None)`, `runs()`, `best(metric, higher=True)`.

#### Tests

```python
# file: test_x12.py
import os

import numpy as np

import x12 as ex


def test_psi_stable_vs_shifted():
    rng = np.random.default_rng(0)
    train = rng.normal(0, 1, 5000)
    assert ex.psi(train, rng.normal(0, 1, 5000)) < 0.1
    assert ex.psi(train, rng.normal(1, 1, 5000)) > 0.25


def test_ks():
    assert ex.ks_statistic([1, 2, 3], [1, 2, 3]) == 0
    assert ex.ks_statistic([0, 0, 0], [5, 5, 5]) == 1


def test_drift_report_flags_the_right_column():
    rng = np.random.default_rng(1)
    train = rng.normal(0, 1, (3000, 3))
    live = rng.normal(0, 1, (3000, 3)); live[:, 1] = live[:, 1] * 2 + 1
    rep = ex.drift_report(train, live, ["age", "income", "visits"])
    assert [k for k, v in rep.items() if v["drift"]] == ["income"]


def test_tracker_round_trip():
    path = "runs_test.jsonl"
    if os.path.exists(path):
        os.remove(path)
    t = ex.Tracker(path)
    X = np.arange(6.0).reshape(3, 2)
    t.log({"C": 0.1}, {"acc": 0.81}, data=X)
    t.log({"C": 1.0}, {"acc": 0.88}, data=X)
    t.log({"C": 10}, {"acc": 0.84}, data=X + 1)
    assert len(t.runs()) == 3 and t.best("acc")["params"] == {"C": 1.0}
    r = t.runs()
    assert r[0]["data"] == r[1]["data"] != r[2]["data"]
    os.remove(path)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x12.py
"""Advanced 12 — Production ML: drift detection and experiment tracking."""
import hashlib
import json

import numpy as np


def psi(expected, actual, bins=10):
    """Population stability index between a training column and a live column.
    Bins are quantiles of `expected`; < 0.1 stable, 0.1-0.25 watch, > 0.25 drifted."""
    expected, actual = np.asarray(expected, float), np.asarray(actual, float)
    edges = np.quantile(expected, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    e = np.histogram(expected, edges)[0] / len(expected)
    a = np.histogram(actual, edges)[0] / len(actual)
    e, a = np.maximum(e, 1e-6), np.maximum(a, 1e-6)
    return float(np.sum((a - e) * np.log(a / e)))


def ks_statistic(a, b):
    """Largest gap between the two empirical CDFs."""
    a, b = np.sort(np.asarray(a, float)), np.sort(np.asarray(b, float))
    grid = np.concatenate([a, b])
    ca = np.searchsorted(a, grid, side="right") / len(a)
    cb = np.searchsorted(b, grid, side="right") / len(b)
    return float(np.max(np.abs(ca - cb)))


def drift_report(train, live, names, threshold=0.25):
    """{name: {"psi": .., "ks": .., "drift": bool}} for every column."""
    train, live = np.asarray(train, float), np.asarray(live, float)
    out = {}
    for j, name in enumerate(names):
        p = psi(train[:, j], live[:, j])
        out[name] = {"psi": p, "ks": ks_statistic(train[:, j], live[:, j]), "drift": p > threshold}
    return out


def data_hash(X):
    """Short fingerprint of a dataset: same data -> same hash."""
    arr = np.ascontiguousarray(np.asarray(X, float))
    return hashlib.sha256(arr.tobytes() + str(arr.shape).encode()).hexdigest()[:12]


class Tracker:
    """Append one JSON line per run; find the best run later."""

    def __init__(self, path):
        self.path = path

    def log(self, params, metrics, data=None):
        row = {"run": len(self.runs()) + 1, "params": params, "metrics": metrics}
        if data is not None:
            row["data"] = data_hash(data)
        with open(self.path, "a") as f:
            f.write(json.dumps(row) + "\n")
        return row["run"]

    def runs(self):
        try:
            with open(self.path) as f:
                return [json.loads(line) for line in f if line.strip()]
        except FileNotFoundError:
            return []

    def best(self, metric, higher=True):
        runs = self.runs()
        return (max if higher else min)(runs, key=lambda r: r["metrics"][metric])
```

</details>

**Done when:** green + the report flags `income` and nothing else.

---

### Advanced 13 — Fairness: equal errors across groups

**Dataset:** synthetic loan decisions with a biased score · **Time:** ~2 h

**Progress:** `Advanced 13/13` · **System after today:** fairness metrics + a per-group threshold fix

**Goal:** Measure how a model's errors differ between groups and close the gap in true-positive rate.

#### Visual

```text
             one threshold            per-group thresholds
  group A    TPR 0.85  ████████▌      TPR 0.80  ████████
  group B    TPR 0.45  ████▌          TPR 0.80  ████████
             gap 0.40 ✗               gap 0.00 ✓
  demographic parity: same approval rate · equal opportunity: same TPR
```

#### Notes

- A model can be accurate overall and still fail one group much more. Measure per group.
- **Demographic parity**: approval (selection) rates equal across groups. Ignores whether people actually qualify.
- **Equal opportunity**: **true-positive rates** equal; qualified people get approved at the same rate whatever their group.
- **Equalised odds**: equal TPR *and* FPR.
- These can't all hold at once when base rates differ. Choosing one is a product and ethics decision, not a maths one. Write it down.
- One cheap fix after training: **per-group thresholds** set to hit the same TPR. Others: re-weight training data, constrained training, and fixing the biased feature itself (best).
- Check the law where you deploy. Using a protected attribute at decision time can itself be illegal; you may only be allowed to use it to audit.
- This closes Advanced ML. Next: build the engine behind deep learning, and then a GPT.

#### Your task — `x13.py`

- `group_rates(y, pred, group)` → selection, TPR and FPR per group.
- `demographic_parity_diff(pred, group)` and `equal_opportunity_diff(y, pred, group)`.
- `thresholds_for_equal_tpr(scores, y, group, target_tpr=0.8)` and `apply_thresholds(scores, group, thresholds)`.

#### Tests

```python
# file: test_x13.py
import numpy as np

import x13 as ex


def _loans(seed=0, n=4000):
    """Same true skill in both groups, but group B's scores are squashed (a biased feature)."""
    rng = np.random.default_rng(seed)
    group = np.where(rng.random(n) < 0.5, "A", "B")
    y = (rng.random(n) < 0.4).astype(int)
    raw = y * 1.5 + rng.normal(0, 1, n)
    score = np.where(group == "A", raw, raw * 0.6 - 0.4)
    return score, y, group


def test_group_rates_tiny():
    r = ex.group_rates([1, 0, 1, 0], [1, 1, 0, 0], ["a", "a", "b", "b"])
    assert r["a"] == {"selection": 1.0, "tpr": 1.0, "fpr": 1.0}
    assert r["b"] == {"selection": 0.0, "tpr": 0.0, "fpr": 0.0}


def test_one_threshold_is_unfair():
    s, y, g = _loans()
    pred = (s >= 0.5).astype(int)
    assert ex.equal_opportunity_diff(y, pred, g) > 0.2
    assert ex.demographic_parity_diff(pred, g) > 0.1


def test_per_group_thresholds_fix_tpr():
    s, y, g = _loans()
    th = ex.thresholds_for_equal_tpr(s, y, g, 0.8)
    assert th["B"] < th["A"]
    pred = ex.apply_thresholds(s, g, th)
    assert ex.equal_opportunity_diff(y, pred, g) < 0.02
    for r in ex.group_rates(y, pred, g).values():
        assert abs(r["tpr"] - 0.8) < 0.01
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x13.py
"""Advanced 13 — Fairness: measuring and fixing unequal error rates."""
import numpy as np


def group_rates(y, pred, group):
    """{g: {"selection": P(pred=1), "tpr": P(pred=1 | y=1), "fpr": P(pred=1 | y=0)}}."""
    y, pred, group = map(np.asarray, (y, pred, group))
    out = {}
    for g in np.unique(group).tolist():
        m = group == g
        out[g] = {
            "selection": float(pred[m].mean()),
            "tpr": float(pred[m & (y == 1)].mean()),
            "fpr": float(pred[m & (y == 0)].mean()),
        }
    return out


def demographic_parity_diff(pred, group):
    """Biggest gap in selection rate between groups."""
    pred, group = np.asarray(pred), np.asarray(group)
    rates = [pred[group == g].mean() for g in np.unique(group)]
    return float(max(rates) - min(rates))


def equal_opportunity_diff(y, pred, group):
    """Biggest gap in true-positive rate between groups."""
    tprs = [r["tpr"] for r in group_rates(y, pred, group).values()]
    return float(max(tprs) - min(tprs))


def thresholds_for_equal_tpr(scores, y, group, target_tpr=0.8):
    """One threshold per group so each group's TPR is (just) at least target_tpr."""
    scores, y, group = map(np.asarray, (scores, y, group))
    out = {}
    for g in np.unique(group).tolist():
        pos = np.sort(scores[(group == g) & (y == 1)])[::-1]
        k = int(np.ceil(target_tpr * len(pos)))
        out[g] = float(pos[k - 1])
    return out


def apply_thresholds(scores, group, thresholds):
    scores, group = np.asarray(scores), np.asarray(group)
    return np.array([int(s >= thresholds[g]) for s, g in zip(scores, group)])
```

</details>

**Done when:** green + the TPR gap drops from over 0.2 to under 0.02.

---
