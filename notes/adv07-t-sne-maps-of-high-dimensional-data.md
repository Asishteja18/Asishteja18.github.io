# Advanced 7 — t-SNE: maps of high-dimensional data

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 7 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 6](adv06-dbscan-and-hierarchical-clustering.md) · [All notes](README.md) · [Advanced 8 →](adv08-anomaly-detection-finding-the-odd-ones-out.md)

---

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

[← Advanced 6](adv06-dbscan-and-hierarchical-clustering.md) · [All notes](README.md) · [Advanced 8 →](adv08-anomaly-detection-finding-the-odd-ones-out.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
