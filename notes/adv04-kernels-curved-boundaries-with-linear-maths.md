# Advanced 4 — Kernels: curved boundaries with linear maths

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 4 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 3](adv03-support-vector-machines-the-widest-street.md) · [All notes](README.md) · [Advanced 5 →](adv05-gaussian-mixtures-and-em-soft-clusters.md)

---

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

[← Advanced 3](adv03-support-vector-machines-the-widest-street.md) · [All notes](README.md) · [Advanced 5 →](adv05-gaussian-mixtures-and-em-soft-clusters.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
