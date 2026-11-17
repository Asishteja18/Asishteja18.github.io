# Day 77 — Causal multi-head attention as a trainable layer

> **AI-90** · Block 3 · Build an AI from scratch · Day 77 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 77`)

[← Day 76](day76-self-attention-step-by-step-numpy.md) · [All 90 days](README.md) · [Day 78 →](day78-the-transformer-block.md)

---

**Dataset:** none (gradient checks) · **Time:** ~2.5 h
**Progress:** `[█████████████████░░░░░░░░░░░░░] 17/30` · **System after today:** a differentiable multi-head self-attention layer in your own engine.

#### Visual

```text
 x (B,T,C) ──Linear(C, 3C)──▶ q | k | v  each (B,T,C)
   split into h heads:  (B,T,C) → reshape (B,T,h,C/h) → transpose → (B,h,T,C/h)
   per head: softmax(q kᵀ/√d + mask) v         heads run in parallel (batched matmul)
   merge: (B,h,T,d) → transpose → (B,T,h,d) → reshape (B,T,C) ──Linear(C,C)──▶ out
 multiple heads = multiple "questions" asked at once (one tracks syntax, one tracks names, …)
```

#### Notes

- One `Linear(C, 3C)` computes q, k, v together; slice with `qkv[:, :, :C]` etc. (your `__getitem__` handles slices).
- Mask as an additive constant: `0` where allowed, `−1e9` where not (avoids `inf − inf = nan`).
- Test causality directly: change the last token; outputs for earlier positions must not change.
- Fun fact your gradient check will reveal: the **key** bias gets zero gradient — adding the same number to every score in a row doesn't change a softmax.

#### Your task — `day77.py`

- `class CausalSelfAttention(Module)(n_embd, n_head, seed=0)` with `qkv` and `proj` Linear layers; `forward(x)` for `x` of shape `(B, T, C)`.

#### Tests

```python
# file: test_day77.py
import numpy as np

import day77 as ex
from day66 import Tensor, grad_check


def test_shape_and_params():
    a = ex.CausalSelfAttention(16, 4)
    assert a(Tensor(np.zeros((2, 5, 16)))).shape == (2, 5, 16)
    assert a.num_params() == 16 * 48 + 48 + 16 * 16 + 16


def test_causal():
    a = ex.CausalSelfAttention(8, 2, seed=1)
    x = np.random.default_rng(0).normal(size=(1, 6, 8))
    y1 = a(Tensor(x)).data
    x2 = x.copy(); x2[0, -1] += 5.0
    y2 = a(Tensor(x2)).data
    assert np.allclose(y1[0, :-1], y2[0, :-1]) and not np.allclose(y1[0, -1], y2[0, -1])


def test_gradients():
    a = ex.CausalSelfAttention(4, 2, seed=2)
    x = Tensor(np.random.default_rng(3).normal(size=(1, 3, 4)))
    w = np.random.default_rng(4).normal(size=(1, 3, 4))
    assert grad_check(lambda: (a(x) * w).sum(), [x] + a.parameters()) < 1e-5
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day77.py
import numpy as np

import day67  # noqa: F401
from day67 import softmax
from day68 import Linear, Module


class CausalSelfAttention(Module):
    def __init__(self, n_embd, n_head, seed=0):
        assert n_embd % n_head == 0
        self.qkv = Linear(n_embd, 3 * n_embd, seed=seed)
        self.proj = Linear(n_embd, n_embd, seed=seed + 1)
        self.n_head = n_head

    def forward(self, x):
        B, T, C = x.shape
        h, d = self.n_head, C // self.n_head
        qkv = self.qkv(x)
        q, k, v = (qkv[:, :, i * C:(i + 1) * C].reshape(B, T, h, d).transpose(0, 2, 1, 3) for i in range(3))
        mask = np.where(np.tril(np.ones((T, T))) == 1, 0.0, -1e9)
        att = softmax((q @ k.transpose(0, 1, 3, 2)) * (d ** -0.5) + mask)
        y = (att @ v).transpose(0, 2, 1, 3).reshape(B, T, C)
        return self.proj(y)
```

</details>

**Done when:** green — gradients through attention verified to 1e-5.

---

[← Day 76](day76-self-attention-step-by-step-numpy.md) · [All 90 days](README.md) · [Day 78 →](day78-the-transformer-block.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
