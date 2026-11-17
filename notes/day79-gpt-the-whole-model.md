# Day 79 — GPT: the whole model

> **AI-90** · Block 3 · Build an AI from scratch · Day 79 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 79`)

[← Day 78](day78-the-transformer-block.md) · [All 90 days](README.md) · [Day 80 →](day80-train-your-gpt.md)

---

**Dataset:** none (shape + initial-loss checks) · **Time:** ~2 h
**Progress:** `[███████████████████░░░░░░░░░░░] 19/30` · **System after today:** a complete GPT architecture — same design as GPT-2, at toy size, on your own engine.

#### Visual

```text
 idx (B,T) ──▶ token embedding (V×C)[idx]  +  position embedding (block×C)[0..T-1]
           ──▶ Block × n_layer
           ──▶ LayerNorm ──▶ Linear(C, V) ──▶ logits (B,T,V)  ──▶ cross-entropy vs targets (B,T)
 untrained model ≈ uniform guess → loss ≈ ln(V)   (V=65 chars → 4.17)  ← your first sanity check
 params = V·C + block·C + n_layer·(12C² + 13C) + 2C + C·V
```

#### Notes

- Position embeddings tell the model *where* each token is (attention itself is order-blind).
- Initialise embeddings small (`N(0, 0.02)`) and the output head small, so the starting loss is ≈ `ln V`. If it isn't, something is wrong — check before training.
- Reject sequences longer than `block_size` (there's no position embedding for them).

#### Your task — `day79.py`

- `class GPT(Module)(vocab_size, block_size, n_embd=32, n_head=4, n_layer=2, seed=0)`; `forward(idx, targets=None)` → `(logits, loss or None)`; raise `ValueError` if `T > block_size`.

#### Tests

```python
# file: test_day79.py
import numpy as np

import day79 as ex


def test_shapes_and_loss_at_init():
    V = 65
    m = ex.GPT(V, block_size=16, n_embd=32, n_head=4, n_layer=2)
    idx = np.random.default_rng(0).integers(0, V, (3, 16))
    logits, loss = m(idx, idx)
    assert logits.shape == (3, 16, V)
    assert abs(float(loss.data) - np.log(V)) < 0.3
    assert m(idx)[1] is None


def test_param_count():
    V, B, C, L = 20, 8, 16, 3
    m = ex.GPT(V, B, C, 2, L)
    assert m.num_params() == V * C + B * C + L * (12 * C * C + 13 * C) + 2 * C + C * V


def test_too_long():
    m = ex.GPT(10, 4, 8, 2, 1)
    try:
        m(np.zeros((1, 5), dtype=int))
    except ValueError:
        return
    raise AssertionError("expected ValueError for T > block_size")
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day79.py
import numpy as np

from day66 import Tensor
from day67 import cross_entropy
from day68 import Linear, Module
from day70 import LayerNorm
from day78 import Block


class GPT(Module):
    def __init__(self, vocab_size, block_size, n_embd=32, n_head=4, n_layer=2, seed=0):
        rng = np.random.default_rng(seed)
        self.vocab_size, self.block_size = vocab_size, block_size
        self.tok_emb = Tensor(rng.normal(0, 0.02, (vocab_size, n_embd)))
        self.pos_emb = Tensor(rng.normal(0, 0.02, (block_size, n_embd)))
        self.blocks = [Block(n_embd, n_head, seed=seed + 10 * (i + 1)) for i in range(n_layer)]
        self.ln_f = LayerNorm(n_embd)
        self.head = Linear(n_embd, vocab_size, bias=False, seed=seed + 1)
        self.head.W.data *= 0.1

    def forward(self, idx, targets=None):
        idx = np.asarray(idx)
        B, T = idx.shape
        if T > self.block_size:
            raise ValueError(f"sequence length {T} > block_size {self.block_size}")
        x = self.tok_emb[idx] + self.pos_emb[np.arange(T)]
        for block in self.blocks:
            x = block(x)
        logits = self.head(self.ln_f(x))
        if targets is None:
            return logits, None
        loss = cross_entropy(logits.reshape(B * T, self.vocab_size), np.asarray(targets).reshape(-1))
        return logits, loss
```

</details>

**Done when:** green — the starting loss is ≈ ln V, so the model is wired correctly.

---

[← Day 78](day78-the-transformer-block.md) · [All 90 days](README.md) · [Day 80 →](day80-train-your-gpt.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
