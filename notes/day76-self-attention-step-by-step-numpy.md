# Day 76 — Self-attention, step by step (NumPy)

> **AI-90** · Block 3 · Build an AI from scratch · Day 76 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 76`)

[← Day 75](day75-preparing-text-for-a-gpt-tokenizer-and-batches.md) · [All 90 days](README.md) · [Day 77 →](day77-causal-multi-head-attention-as-a-trainable-layer.md)

---

**Dataset:** toy matrices · **Time:** ~2 h (Karpathy's "Let's build GPT", first hour)
**Progress:** `[████████████████░░░░░░░░░░░░░░] 16/30` · **System after today:** you understand the one mechanism behind every modern LLM.

#### Visual

```text
 each token makes: query q ("what am I looking for?"), key k ("what do I contain?"), value v ("what I'll share")
 scores = q·kᵀ / √d     →  causal mask (no peeking at the future)  →  softmax  →  weighted sum of v
              t1   t2   t3   t4                    weights after softmax
        t1 [ 2.1   ✗    ✗    ✗ ]                  t1 [1.00  0    0    0  ]
        t2 [ 0.3  1.7   ✗    ✗ ]       ──▶        t2 [0.20 0.80  0    0  ]
        t3 [ 1.2  0.1  0.9   ✗ ]                  t3 [0.46 0.15 0.39  0  ]
        t4 [ 0.4  0.8  0.2  1.5]                  t4 [0.15 0.23 0.12 0.50]   each row sums to 1
```

#### Notes

- Attention lets every token gather information from earlier tokens, weighted by relevance.
- Divide by `√d` so scores don't grow with dimension (which would make softmax too peaky).
- Causal mask: set future positions to `−∞` before softmax → weight 0. This is what makes it a *language model* (predict next, never see next).
- Today in plain NumPy (no autograd) so you can see every number; tomorrow it becomes a trainable layer.

#### Your task — `day76.py`

- `causal_mask(T)` → boolean lower-triangular `(T, T)`.
- `attention(q, k, v, causal=True)` → `(out, weights)`; works for `(T, d)` and batched `(..., T, d)`.

#### Tests

```python
# file: test_day76.py
import numpy as np

import day76 as ex


def test_mask():
    assert ex.causal_mask(3).tolist() == [[True, False, False], [True, True, False], [True, True, True]]


def test_causal_attention():
    rng = np.random.default_rng(0)
    q, k, v = rng.normal(size=(4, 8)), rng.normal(size=(4, 8)), rng.normal(size=(4, 8))
    out, w = ex.attention(q, k, v)
    assert np.allclose(w.sum(-1), 1) and np.allclose(np.triu(w, 1), 0)
    assert np.allclose(out[0], v[0]), "the first token can only attend to itself"
    s = q[2] @ k[:3].T / np.sqrt(8)
    p = np.exp(s - s.max()); p /= p.sum()
    assert np.allclose(out[2], p @ v[:3])


def test_batched_noncausal():
    rng = np.random.default_rng(1)
    q = rng.normal(size=(2, 3, 5, 4))
    out, w = ex.attention(q, q, q, causal=False)
    assert out.shape == (2, 3, 5, 4) and w.shape == (2, 3, 5, 5) and (w > 0).all()
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day76.py
import numpy as np


def causal_mask(T):
    return np.tril(np.ones((T, T), dtype=bool))


def attention(q, k, v, causal=True):
    d, T = q.shape[-1], q.shape[-2]
    scores = q @ np.swapaxes(k, -1, -2) / np.sqrt(d)
    if causal:
        scores = np.where(causal_mask(T), scores, -np.inf)
    w = np.exp(scores - scores.max(axis=-1, keepdims=True))
    w = w / w.sum(axis=-1, keepdims=True)
    return w @ v, w
```

</details>

**Done when:** green. Print the weights matrix for 4 random tokens and read it row by row.

---

[← Day 75](day75-preparing-text-for-a-gpt-tokenizer-and-batches.md) · [All 90 days](README.md) · [Day 77 →](day77-causal-multi-head-attention-as-a-trainable-layer.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
