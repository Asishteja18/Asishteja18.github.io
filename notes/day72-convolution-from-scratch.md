# Day 72 — Convolution from scratch

> **AI-90** · Block 3 · Build an AI from scratch · Day 72 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 72`)

[← Day 71](day71-a-reusable-trainer-batches-early-stopping-checkp.md) · [All 90 days](README.md) · [Day 73 →](day73-language-model-1-bigram-counts.md)

---

**Dataset:** Digits as 1×8×8 images · **Time:** ~2.5 h
**Progress:** `[████████████░░░░░░░░░░░░░░░░░░] 12/30` · **System after today:** your engine can see — a differentiable 2-D convolution layer.

#### Visual

```text
 image 8×8        kernel 3×3        feature map 6×6
 ┌─────────┐      ┌───┐
 │▒▒▒░     │  ✱   │1 0│ slide over every 3×3 patch:  out[i,j] = Σ patch · kernel
 │░▒▒▒░    │      │0 1│
 └─────────┘      └───┘
 im2col trick: unfold every patch into a column → convolution becomes ONE matrix multiply
   x (N,C,H,W) ─unfold─▶ cols (N, C·k·k, Ho·Wo);   W (F, C·k·k) @ cols → (N, F, Ho·Wo)
```

#### Notes

- A conv layer shares one small kernel across the whole image → far fewer weights than a Linear layer, and it detects a pattern wherever it appears.
- `unfold` (im2col) is the only new op; its backward "folds" gradients back, adding where patches overlap.
- `np.lib.stride_tricks.sliding_window_view` builds the patches without loops.
- Stride 1, no padding today: output size `H − k + 1`.

#### Your task — `day72.py`

- `unfold(x, k)` → Tensor `(N, C·k·k, Ho·Wo)` with a correct backward.
- `conv2d(x, w, b=None)` with `w (F, C, k, k)`, `b (F,)` → `(N, F, Ho, Wo)`.
- `class Conv2d(Module)(in_c, out_c, k, seed=0)`.

#### Tests

```python
# file: test_day72.py
import numpy as np

import day72 as ex
from day66 import Tensor, grad_check


def naive(x, w, b):
    N, C, H, W = x.shape; F, _, k, _ = w.shape
    out = np.zeros((N, F, H - k + 1, W - k + 1))
    for n in range(N):
        for f in range(F):
            for i in range(H - k + 1):
                for j in range(W - k + 1):
                    out[n, f, i, j] = (x[n, :, i:i + k, j:j + k] * w[f]).sum() + b[f]
    return out


def test_forward_matches_loops():
    rng = np.random.default_rng(0)
    x, w, b = rng.normal(size=(2, 3, 6, 5)), rng.normal(size=(4, 3, 3, 3)), rng.normal(size=4)
    out = ex.conv2d(Tensor(x), Tensor(w), Tensor(b))
    assert out.shape == (2, 4, 4, 3) and np.allclose(out.data, naive(x, w, b))


def test_gradients():
    rng = np.random.default_rng(1)
    x, w, b = Tensor(rng.normal(size=(1, 2, 4, 4))), Tensor(rng.normal(size=(2, 2, 3, 3))), Tensor(rng.normal(size=2))
    assert grad_check(lambda: (ex.conv2d(x, w, b) ** 2).sum(), [x, w, b]) < 1e-6


def test_module():
    layer = ex.Conv2d(1, 8, 3)
    assert layer(Tensor(np.zeros((5, 1, 8, 8)))).shape == (5, 8, 6, 6) and layer.num_params() == 8 * 9 + 8
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day72.py
"""tinytorch, part 7 — im2col convolution."""
import numpy as np

import day67  # noqa: F401  (adds reshape/transpose to Tensor)
from day66 import Tensor
from day68 import Module


def unfold(x, k):
    N, C, H, W = x.shape
    Ho, Wo = H - k + 1, W - k + 1
    win = np.lib.stride_tricks.sliding_window_view(x.data, (k, k), axis=(2, 3))  # N,C,Ho,Wo,k,k
    cols = win.transpose(0, 1, 4, 5, 2, 3).reshape(N, C * k * k, Ho * Wo)
    out = Tensor(cols, (x,), "unfold")

    def _backward():
        g = out.grad.reshape(N, C, k, k, Ho, Wo)
        for i in range(k):
            for j in range(k):
                x.grad[:, :, i:i + Ho, j:j + Wo] += g[:, :, i, j]
    out._backward = _backward
    return out


def conv2d(x, w, b=None):
    N, C, H, W = x.shape
    F, _, k, _ = w.shape
    out = (w.reshape(F, C * k * k) @ unfold(x, k)).reshape(N, F, H - k + 1, W - k + 1)
    return out + b.reshape(1, F, 1, 1) if b is not None else out


class Conv2d(Module):
    def __init__(self, in_c, out_c, k, seed=0):
        rng = np.random.default_rng(seed)
        self.w = Tensor(rng.normal(0, 1, (out_c, in_c, k, k)) / np.sqrt(in_c * k * k))
        self.b = Tensor(np.zeros(out_c))

    def forward(self, x):
        return conv2d(x, self.w, self.b)
```

</details>

**Done when:** green. Optional: a `Conv2d(1,8,3) → ReLU → reshape → Linear(288,10)` digit classifier with your trainer.

---

[← Day 71](day71-a-reusable-trainer-batches-early-stopping-checkp.md) · [All 90 days](README.md) · [Day 73 →](day73-language-model-1-bigram-counts.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
