# Day 63 — Backpropagation by hand

> **AI-90** · Block 3 · Build an AI from scratch · Day 63 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 63`)

[← Day 62](day62-multi-layer-networks-the-forward-pass.md) · [All 90 days](README.md) · [Day 64 →](day64-autograd-part-1-a-scalar-engine.md)

---

**Dataset:** XOR, then Breast Cancer · **Time:** ~2.5 h
**Progress:** `[███░░░░░░░░░░░░░░░░░░░░░░░░░░░] 3/30` · **System after today:** a network that LEARNS XOR by itself, gradients verified numerically.

#### Visual

```text
 forward  ──▶   X ─@W1+b1─▶ z1 ─tanh─▶ a1 ─@W2+b2─▶ z2 ─σ─▶ p ─BCE─▶ L
 backward ◀──   dz2 = p − y                       (sigmoid + BCE simplify beautifully)
                dW2 = a1ᵀ dz2 / n     db2 = mean(dz2)
                da1 = dz2 W2ᵀ
                dz1 = da1 · (1 − a1²)              (tanh' = 1 − tanh²)
                dW1 = Xᵀ dz1 / n      db1 = mean(dz1)
```

#### Notes

- Backprop = chain rule applied layer by layer from the loss backwards, reusing cached activations.
- Gradient checking: compare each analytic gradient with Day 32's numerical gradient. Relative error < 1e-6 → correct. **Always** do this when you write a backward pass by hand.
- Training loop: forward → loss → backward → update → repeat.

#### Your task — `day63.py`

- `bce_loss(params, X, y)` → scalar (uses Day 62 `forward`).
- `backward(params, cache, y)` → list of `(dW, db)` for a tanh-hidden, sigmoid-output network with BCE loss (any depth).
- `train(params, X, y, lr=0.5, epochs=2000)` → `(params, losses)`.

#### Tests

```python
# file: test_day63.py
import numpy as np

import day63 as ex
from day61 import GATES
from day62 import forward, init_mlp


def test_gradient_check():
    rng = np.random.default_rng(0)
    X, y = rng.normal(size=(6, 3)), rng.integers(0, 2, 6).astype(float)
    params = init_mlp([3, 4, 4, 1], seed=1)
    _, cache = forward(params, X)
    grads = ex.backward(params, cache, y)
    h = 1e-6
    for (W, b), (dW, db) in zip(params, grads):
        for M, dM in ((W, dW), (b, db)):
            for idx in [(0,) * M.ndim, tuple(s - 1 for s in M.shape)]:
                old = M[idx]
                M[idx] = old + h; lp = ex.bce_loss(params, X, y)
                M[idx] = old - h; lm = ex.bce_loss(params, X, y)
                M[idx] = old
                num = (lp - lm) / (2 * h)
                assert abs(num - dM[idx]) / max(1e-8, abs(num) + abs(dM[idx])) < 1e-5


def test_learns_xor():
    X, y = GATES["XOR"]
    params, losses = ex.train(init_mlp([2, 4, 1], seed=0), X, y.astype(float), lr=0.5, epochs=3000)
    out, _ = forward(params, X)
    assert ((out[:, 0] > 0.5).astype(int) == y).all() and losses[-1] < 0.1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day63.py
import numpy as np

from day62 import forward


def bce_loss(params, X, y):
    p, _ = forward(params, X)
    p = np.clip(p[:, 0], 1e-12, 1 - 1e-12)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


def backward(params, cache, y):
    n = len(y)
    grads = [None] * len(params)
    dz = cache[-1] - np.asarray(y, float).reshape(-1, 1)
    for i in range(len(params) - 1, -1, -1):
        a_prev = cache[i]
        grads[i] = (a_prev.T @ dz / n, dz.mean(axis=0))
        if i > 0:
            da = dz @ params[i][0].T
            dz = da * (1 - a_prev ** 2)
    return grads


def train(params, X, y, lr=0.5, epochs=2000):
    params = [(W.copy(), b.copy()) for W, b in params]
    losses = []
    for _ in range(epochs):
        _, cache = forward(params, X)
        grads = backward(params, cache, y)
        params = [(W - lr * dW, b - lr * db) for (W, b), (dW, db) in zip(params, grads)]
        losses.append(bce_loss(params, X, y))
    return params, losses
```

</details>

**Done when:** green — your network discovered XOR on its own. Plot `losses`.

---

[← Day 62](day62-multi-layer-networks-the-forward-pass.md) · [All 90 days](README.md) · [Day 64 →](day64-autograd-part-1-a-scalar-engine.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
