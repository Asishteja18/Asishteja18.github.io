# Advanced 5 — Gaussian mixtures and EM: soft clusters

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 5 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 4](adv04-kernels-curved-boundaries-with-linear-maths.md) · [All notes](README.md) · [Advanced 6 →](adv06-dbscan-and-hierarchical-clustering.md)

---

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

[← Advanced 4](adv04-kernels-curved-boundaries-with-linear-maths.md) · [All notes](README.md) · [Advanced 6 →](adv06-dbscan-and-hierarchical-clustering.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
