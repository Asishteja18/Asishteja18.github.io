# Day 69 — Optimisers: SGD, momentum, Adam

> **AI-90** · Block 3 · Build an AI from scratch · Day 69 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 69`)

[← Day 68](day68-nn-module-layers-on-your-engine.md) · [All 90 days](README.md) · [Day 70 →](day70-layernorm-and-dropout.md)

---

**Dataset:** a quadratic; Digits · **Time:** ~2 h
**Progress:** `[█████████░░░░░░░░░░░░░░░░░░░░░] 9/30` · **System after today:** the optimiser every modern LLM uses (AdamW), written by you.

#### Visual

```text
 SGD:      w ← w − lr·g
 Momentum: v ← μv + g;           w ← w − lr·v          (a ball rolling — keeps speed through flat bits)
 Adam:     m ← β1 m + (1−β1) g    (average direction)
           v ← β2 v + (1−β2) g²   (average size)
           w ← w − lr · m̂ / (√v̂ + ε)      m̂, v̂ = bias-corrected  → per-parameter step sizes
 AdamW: also w ← w − lr·λ·w  (weight decay, decoupled)
```

#### Notes

- Optimisers hold **state** per parameter (velocity, moments) — that's why they're objects.
- Adam's bias correction (`m / (1 − β1ᵗ)`) fixes the zero-initialised averages in early steps.
- Defaults that work: AdamW `lr=3e-4…1e-3, betas=(0.9, 0.999), weight_decay=0.01–0.1`.

#### Your task — `day69.py`

- `class SGD(params, lr, momentum=0.0)` with `step()` and `zero_grad()`.
- `class Adam(params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.0)` (AdamW-style decay).

#### Tests

```python
# file: test_day69.py
import numpy as np

import day69 as ex
from day66 import Tensor


def minimise(opt_cls, steps, **kw):
    w = Tensor(np.array([5.0, -3.0]))
    opt = opt_cls([w], **kw)
    for _ in range(steps):
        opt.zero_grad()
        ((w - np.array([1.0, 2.0])) ** 2).sum().backward()
        opt.step()
    return w.data


def test_sgd_and_momentum():
    assert np.allclose(minimise(ex.SGD, 200, lr=0.1), [1, 2], atol=1e-4)
    assert np.allclose(minimise(ex.SGD, 200, lr=0.05, momentum=0.9), [1, 2], atol=1e-3)


def test_adam():
    assert np.allclose(minimise(ex.Adam, 500, lr=0.1), [1, 2], atol=1e-3)


def test_adam_first_step_size():
    w = Tensor(np.array([1.0]))
    opt = ex.Adam([w], lr=0.01)
    w.grad = np.array([123.0])
    opt.step()
    assert np.isclose(w.data[0], 0.99, atol=1e-6)   # bias-corrected first step ≈ lr, whatever the gradient size


def test_weight_decay_shrinks():
    w = Tensor(np.array([10.0]))
    opt = ex.Adam([w], lr=0.1, weight_decay=0.5)
    w.grad = np.array([0.0])
    opt.step()
    assert w.data[0] < 10.0
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day69.py
"""tinytorch, part 4 — optimisers."""
import numpy as np


class SGD:
    def __init__(self, params, lr, momentum=0.0):
        self.params, self.lr, self.momentum = list(params), lr, momentum
        self.v = [np.zeros_like(p.data) for p in self.params]

    def zero_grad(self):
        for p in self.params:
            p.grad = np.zeros_like(p.data)

    def step(self):
        for p, v in zip(self.params, self.v):
            v *= self.momentum
            v += p.grad
            p.data -= self.lr * v


class Adam:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.0):
        self.params, self.lr, self.betas, self.eps, self.wd = list(params), lr, betas, eps, weight_decay
        self.m = [np.zeros_like(p.data) for p in self.params]
        self.v = [np.zeros_like(p.data) for p in self.params]
        self.t = 0

    def zero_grad(self):
        for p in self.params:
            p.grad = np.zeros_like(p.data)

    def step(self):
        self.t += 1
        b1, b2 = self.betas
        for p, m, v in zip(self.params, self.m, self.v):
            if self.wd:
                p.data -= self.lr * self.wd * p.data
            m[:] = b1 * m + (1 - b1) * p.grad
            v[:] = b2 * v + (1 - b2) * p.grad ** 2
            mhat, vhat = m / (1 - b1 ** self.t), v / (1 - b2 ** self.t)
            p.data -= self.lr * mhat / (np.sqrt(vhat) + self.eps)
```

</details>

**Done when:** green. Retrain Day 68's digits net with Adam(lr=1e-3) and compare loss curves.

---

[← Day 68](day68-nn-module-layers-on-your-engine.md) · [All 90 days](README.md) · [Day 70 →](day70-layernorm-and-dropout.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
