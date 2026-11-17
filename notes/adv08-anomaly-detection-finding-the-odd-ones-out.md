# Advanced 8 — Anomaly detection: finding the odd ones out

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 8 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 7](adv07-t-sne-maps-of-high-dimensional-data.md) · [All notes](README.md) · [Advanced 9 →](adv09-recommender-systems-matrix-factorisation.md)

---

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

[← Advanced 7](adv07-t-sne-maps-of-high-dimensional-data.md) · [All notes](README.md) · [Advanced 9 →](adv09-recommender-systems-matrix-factorisation.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
