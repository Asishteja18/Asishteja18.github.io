# Day 78 — The transformer block

> **AI-90** · Block 3 · Build an AI from scratch · Day 78 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 78`)

[← Day 77](day77-causal-multi-head-attention-as-a-trainable-layer.md) · [All 90 days](README.md) · [Day 79 →](day79-gpt-the-whole-model.md)

---

**Dataset:** none · **Time:** ~2 h
**Progress:** `[██████████████████░░░░░░░░░░░░] 18/30` · **System after today:** the full repeating unit of GPT.

#### Visual

```text
        x ─────────────────────┐                  pre-norm transformer block (GPT-2 style)
        │                      │
   LayerNorm → CausalSelfAttention ─(+)─▶ x'       "communicate": tokens exchange information
        x' ────────────────────┐
        │                      │
   LayerNorm → Linear(C,4C) → GELU → Linear(4C,C) ─(+)─▶ out    "compute": each token thinks alone
 the (+) residual paths let gradients flow straight through many stacked blocks
```

#### Notes

- Attention mixes information **across** tokens; the MLP processes each token **independently**.
- Residual connections (`x + f(x)`) are why 100-layer transformers train at all.
- Pre-norm (LayerNorm before each sub-layer) is the stable modern choice.
- Check every parameter receives a gradient — a common bug is a layer that's created but never used.

#### Your task — `day78.py`

- `class FeedForward(Module)(n_embd, seed=0)` → `Linear(C,4C) → gelu → Linear(4C,C)`.
- `class Block(Module)(n_embd, n_head, seed=0)` with `ln1, attn, ln2, mlp`.

#### Tests

```python
# file: test_day78.py
import numpy as np

import day78 as ex
from day66 import Tensor, grad_check


def test_shape_and_params():
    b = ex.Block(8, 2)
    assert b(Tensor(np.zeros((2, 4, 8)))).shape == (2, 4, 8)
    assert b.num_params() == 12 * 8 * 8 + 13 * 8


def test_every_param_gets_gradient():
    b = ex.Block(8, 2, seed=1)
    b(Tensor(np.random.default_rng(0).normal(size=(2, 4, 8)))).sum().backward()
    assert all(np.abs(p.grad).sum() > 0 for p in b.parameters())


def test_gradcheck_small():
    b = ex.Block(4, 2, seed=2)
    x = Tensor(np.random.default_rng(1).normal(size=(1, 2, 4)))
    w = np.random.default_rng(2).normal(size=(1, 2, 4))
    assert grad_check(lambda: (b(x) * w).sum(), [x] + b.parameters()) < 1e-4
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day78.py
from day68 import Linear, Module
from day70 import LayerNorm, gelu
from day77 import CausalSelfAttention


class FeedForward(Module):
    def __init__(self, n_embd, seed=0):
        self.fc = Linear(n_embd, 4 * n_embd, seed=seed)
        self.proj = Linear(4 * n_embd, n_embd, seed=seed + 1)

    def forward(self, x):
        return self.proj(gelu(self.fc(x)))


class Block(Module):
    def __init__(self, n_embd, n_head, seed=0):
        self.ln1, self.ln2 = LayerNorm(n_embd), LayerNorm(n_embd)
        self.attn = CausalSelfAttention(n_embd, n_head, seed=seed)
        self.mlp = FeedForward(n_embd, seed=seed + 2)

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        return x + self.mlp(self.ln2(x))
```

</details>

**Done when:** green.

---

[← Day 77](day77-causal-multi-head-attention-as-a-trainable-layer.md) · [All 90 days](README.md) · [Day 79 →](day79-gpt-the-whole-model.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
