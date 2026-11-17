# Day 67 — Autograd, part 3: the ops a language model needs

> **AI-90** · Block 3 · Build an AI from scratch · Day 67 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 67`)

[← Day 66](day66-autograd-part-2-the-tensor-engine.md) · [All 90 days](README.md) · [Day 68 →](day68-nn-module-layers-on-your-engine.md)

---

**Dataset:** none (gradient checks) · **Time:** ~2.5 h
**Progress:** `[███████░░░░░░░░░░░░░░░░░░░░░░░] 7/30` · **System after today:** reshape, transpose, embedding lookup, softmax and cross-entropy — everything a GPT's maths needs.

#### Visual

```text
 embedding lookup = indexing:  E (vocab × C)   idx [[3, 1], [0, 3]]  →  E[idx]  (2 × 2 × C)
 backward: scatter-ADD rows back:  np.add.at(E.grad, idx, out.grad)   (row 3 used twice → gets both)
 fused cross-entropy (stable):  logp = z − max − log Σ e^{z−max};  loss = −mean logp[target]
 its gradient:  (softmax(z) − onehot(target)) / n         ignore_index rows → gradient 0
```

#### Notes

- Extend Day 66's `Tensor` by attaching new methods (`Tensor.reshape = ...`) — the engine grows day by day.
- `transpose(*axes)` backward = transpose by the inverse permutation (`np.argsort(axes)`).
- `__getitem__` backward uses `np.add.at` (plain `+=` with repeated indices would drop updates).
- Cross-entropy is implemented as **one fused op** — stable and fast. `ignore_index=-1` lets fine-tuning skip prompt tokens (Day 85).

#### Your task — `day67.py`

- Attach to `Tensor`: `reshape(*shape)`, `transpose(*axes)`, `__getitem__(idx)`.
- `softmax(x, axis=-1)` and `log_softmax(x, axis=-1)` built from existing ops (subtract the max as a constant).
- `cross_entropy(logits, targets, ignore_index=-1)` → scalar Tensor; logits `(N, C)`, targets int array `(N,)`.

#### Tests

```python
# file: test_day67.py
import numpy as np

import day67 as ex
from day66 import Tensor, grad_check


def rnd(*shape, seed=0):
    return Tensor(np.random.default_rng(seed).normal(size=shape))


def test_reshape_transpose():
    x = rnd(2, 3, 4)
    assert grad_check(lambda: (x.transpose(0, 2, 1).reshape(2, 12) * np.arange(24).reshape(2, 12)).sum(), [x]) < 1e-6


def test_embedding_lookup_accumulates():
    E = rnd(5, 3)
    idx = np.array([[3, 1], [0, 3]])
    out = E[idx]
    assert out.shape == (2, 2, 3)
    out.sum().backward()
    assert E.grad[3].tolist() == [2, 2, 2] and E.grad[2].tolist() == [0, 0, 0]


def test_softmax():
    x = rnd(3, 4)
    s = ex.softmax(x)
    assert np.allclose(s.data.sum(-1), 1)
    w = np.random.default_rng(9).normal(size=(3, 4))
    assert grad_check(lambda: (ex.softmax(x) * w).sum(), [x]) < 1e-6
    assert grad_check(lambda: (ex.log_softmax(x) * w).sum(), [x]) < 1e-6


def test_cross_entropy():
    logits = rnd(4, 5)
    t = np.array([1, 0, 4, -1])
    loss = ex.cross_entropy(logits, t)
    z = logits.data - logits.data.max(1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(1, keepdims=True))
    assert np.isclose(loss.data, -(logp[0, 1] + logp[1, 0] + logp[2, 4]) / 3)
    assert grad_check(lambda: ex.cross_entropy(logits, t), [logits]) < 1e-6
    loss.backward()
    assert np.allclose(logits.grad[3], 0)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day67.py
"""tinytorch, part 2 — shape ops, embedding lookup, softmax, cross-entropy."""
import numpy as np

from day66 import Tensor


def _reshape(self, *shape):
    if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
        shape = tuple(shape[0])
    out = Tensor(self.data.reshape(shape), (self,), "reshape")

    def _backward():
        self.grad += out.grad.reshape(self.data.shape)
    out._backward = _backward
    return out


def _transpose(self, *axes):
    axes = axes or tuple(reversed(range(self.data.ndim)))
    out = Tensor(self.data.transpose(axes), (self,), "transpose")

    def _backward():
        self.grad += out.grad.transpose(np.argsort(axes))
    out._backward = _backward
    return out


def _getitem(self, idx):
    if isinstance(idx, Tensor):
        idx = idx.data.astype(int)
    out = Tensor(self.data[idx], (self,), "getitem")

    def _backward():
        np.add.at(self.grad, idx, out.grad)
    out._backward = _backward
    return out


Tensor.reshape, Tensor.transpose, Tensor.__getitem__ = _reshape, _transpose, _getitem


def softmax(x, axis=-1):
    e = (x - x.data.max(axis=axis, keepdims=True)).exp()
    return e / e.sum(axis=axis, keepdims=True)


def log_softmax(x, axis=-1):
    z = x - x.data.max(axis=axis, keepdims=True)
    return z - z.exp().sum(axis=axis, keepdims=True).log()


def cross_entropy(logits, targets, ignore_index=-1):
    t = np.asarray(targets).astype(int)
    z = logits.data - logits.data.max(axis=1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(axis=1, keepdims=True))
    valid = t != ignore_index
    n = max(int(valid.sum()), 1)
    rows = np.arange(len(t))[valid]
    out = Tensor(-logp[rows, t[valid]].sum() / n, (logits,), "cross_entropy")

    def _backward():
        g = np.exp(logp)
        g[rows, t[valid]] -= 1
        g[~valid] = 0
        logits.grad += g / n * out.grad
    out._backward = _backward
    return out
```

</details>

**Done when:** green. Your engine can now compute a language model's loss.

---

[← Day 66](day66-autograd-part-2-the-tensor-engine.md) · [All 90 days](README.md) · [Day 68 →](day68-nn-module-layers-on-your-engine.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
