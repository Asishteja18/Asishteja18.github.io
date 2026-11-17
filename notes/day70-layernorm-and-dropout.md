# Day 70 — LayerNorm and Dropout

> **AI-90** · Block 3 · Build an AI from scratch · Day 70 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 70`)

[← Day 69](day69-optimisers-sgd-momentum-adam.md) · [All 90 days](README.md) · [Day 71 →](day71-a-reusable-trainer-batches-early-stopping-checkp.md)

---

**Dataset:** none (gradient checks) · **Time:** ~2 h
**Progress:** `[██████████░░░░░░░░░░░░░░░░░░░░] 10/30` · **System after today:** the two layers that make deep transformers trainable.

#### Visual

```text
 LayerNorm over the LAST axis (each token's features):
   x = [2, 4, 6]  → mean 4, var 8/3 → x̂ = [−1.22, 0, 1.22] → γ·x̂ + β   (γ, β learned)
 Dropout(p=0.5) in TRAINING:  [a, b, c, d] → [2a, 0, 2c, 0]   (scale by 1/(1−p) so the mean is unchanged)
            in EVAL:          [a, b, c, d] → [a, b, c, d]
```

#### Notes

- LayerNorm keeps each token's activations at a steady scale, layer after layer. Built from ops you already have (`mean`, `**`), so autograd handles it for free.
- Dropout randomly zeroes activations while training → the network can't rely on any single unit. Must be **off** in `eval()`.
- Inverted dropout (scale at train time) means inference needs no change.

#### Your task — `day70.py`

- `class LayerNorm(Module)(dim, eps=1e-5)` with `gamma` (ones), `beta` (zeros).
- `class Dropout(Module)(p, seed=0)`.
- `def gelu(x)` → tanh approximation `0.5·x·(1 + tanh(√(2/π)·(x + 0.044715x³)))` from Tensor ops (used by the transformer on Day 78).

#### Tests

```python
# file: test_day70.py
import numpy as np

import day70 as ex
from day66 import Tensor, grad_check


def test_layernorm_stats_and_grad():
    x = Tensor(np.random.default_rng(0).normal(3, 5, (2, 4, 6)))
    ln = ex.LayerNorm(6)
    y = ln(x).data
    assert np.allclose(y.mean(-1), 0, atol=1e-7) and np.allclose(y.var(-1), 1, atol=1e-3)
    ln.gamma.data[:] = np.random.default_rng(1).normal(size=6)
    w = np.random.default_rng(2).normal(size=(2, 4, 6))
    assert grad_check(lambda: (ln(x) * w).sum(), [x, ln.gamma, ln.beta]) < 1e-5


def test_dropout_train_vs_eval():
    d = ex.Dropout(0.5, seed=0)
    x = Tensor(np.ones((1000,)))
    y = d(x).data
    assert set(np.unique(y)) <= {0.0, 2.0} and 0.4 < (y == 0).mean() < 0.6
    d.eval()
    assert np.array_equal(d(x).data, x.data)


def test_gelu():
    x = Tensor(np.array([-3.0, 0.0, 1.0, 3.0]))
    assert np.allclose(ex.gelu(x).data, [-0.00363739, 0.0, 0.84119199, 2.99636261], atol=1e-6)
    assert grad_check(lambda: ex.gelu(x).sum(), [x]) < 1e-6
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day70.py
"""tinytorch, part 5 — LayerNorm, Dropout, GELU."""
import numpy as np

from day66 import Tensor
from day68 import Module


class LayerNorm(Module):
    def __init__(self, dim, eps=1e-5):
        self.gamma, self.beta, self.eps = Tensor(np.ones(dim)), Tensor(np.zeros(dim)), eps

    def forward(self, x):
        mu = x.mean(axis=-1, keepdims=True)
        xc = x - mu
        var = (xc ** 2).mean(axis=-1, keepdims=True)
        return xc * (var + self.eps) ** -0.5 * self.gamma + self.beta


class Dropout(Module):
    def __init__(self, p, seed=0):
        self.p, self.rng = p, np.random.default_rng(seed)

    def forward(self, x):
        if not self.training or self.p == 0:
            return x
        mask = (self.rng.random(x.shape) >= self.p) / (1 - self.p)
        return x * mask


def gelu(x):
    return 0.5 * x * (1 + (np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)).tanh())
```

</details>

**Done when:** green.

---

[← Day 69](day69-optimisers-sgd-momentum-adam.md) · [All 90 days](README.md) · [Day 71 →](day71-a-reusable-trainer-batches-early-stopping-checkp.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
