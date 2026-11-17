# Advanced 11 — Autoencoders: compression you can train

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 11 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 10](adv10-reinforcement-learning-bandits-and-q-learning.md) · [All notes](README.md) · [Advanced 12 →](adv12-production-ml-drift-and-experiment-tracking.md)

---

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

[← Advanced 10](adv10-reinforcement-learning-bandits-and-q-learning.md) · [All notes](README.md) · [Advanced 12 →](adv12-production-ml-drift-and-experiment-tracking.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
