# Day 83 — Training like the pros: evaluation, clipping, schedules

> **AI-90** · Block 3 · Build an AI from scratch · Day 83 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 83`)

[← Day 82](day82-a-bpe-tokenizer-from-scratch.md) · [All 90 days](README.md) · [Day 84 →](day84-your-own-corpus-pretraining-and-checkpoints.md)

---

**Dataset:** Shakespeare train/val · **Time:** ~2 h
**Progress:** `[███████████████████████░░░░░░░] 23/30` · **System after today:** honest validation numbers and stable training (the tricks from real LLM training runs).

#### Visual

```text
 learning rate schedule (warmup + cosine decay)
 max_lr ┤     ╭──────╮
        │    ╱        ╲__
        │   ╱             ╲___
 min_lr ┤──╯                  ╲________
        └─warmup─┴───── cosine ──────┴── step
 gradient clipping:  if ‖g‖ > 1.0 → g ← g · 1.0/‖g‖   (stops one bad batch from wrecking training)
 perplexity = e^loss  ("the model is as unsure as choosing between N tokens")
```

#### Notes

- One batch's loss is noisy. `estimate_loss` averages many batches on train **and** val, with the model in eval mode.
- Train loss ≪ val loss → overfitting (more data, dropout, smaller model).
- Warmup avoids huge early updates while Adam's statistics settle; cosine decay finishes gently.
- Clip the **global** norm over all parameters, not each one separately.

#### Your task — `day83.py`

- `perplexity(loss)`.
- `estimate_loss(model, splits, iters, batch_size, rng)` → `{name: mean loss}` for each data array in `splits`.
- `clip_grad_norm(params, max_norm)` → total norm before clipping (scales grads in place).
- `lr_at(step, warmup, max_steps, max_lr, min_lr)` → linear warmup `(step+1)/warmup·max_lr`, cosine to `min_lr` at `max_steps`, `min_lr` after.

#### Tests

```python
# file: test_day83.py
import numpy as np

import day83 as ex
from day66 import Tensor
from day79 import GPT


def test_perplexity():
    assert np.isclose(ex.perplexity(np.log(65)), 65)


def test_clip():
    a, b = Tensor(np.zeros(2)), Tensor(np.zeros(1))
    a.grad, b.grad = np.array([3.0, 0.0]), np.array([4.0])
    assert ex.clip_grad_norm([a, b], 1.0) == 5.0
    assert np.isclose(np.sqrt((a.grad ** 2).sum() + (b.grad ** 2).sum()), 1.0)
    a.grad = np.array([0.3, 0.0]); b.grad = np.array([0.4])
    ex.clip_grad_norm([a, b], 1.0)
    assert np.allclose(a.grad, [0.3, 0])


def test_schedule():
    f = lambda s: ex.lr_at(s, warmup=10, max_steps=110, max_lr=1e-3, min_lr=1e-4)  # noqa: E731
    assert np.isclose(f(0), 1e-4) and np.isclose(f(9), 1e-3)
    assert np.isclose(f(60), 5.5e-4) and np.isclose(f(110), 1e-4) and np.isclose(f(500), 1e-4)
    assert all(f(s) >= f(s + 1) for s in range(10, 109))


def test_estimate_loss():
    m = GPT(10, 8, 16, 2, 1)
    data = np.random.default_rng(0).integers(0, 10, 500)
    out = ex.estimate_loss(m, {"train": data[:400], "val": data[400:]}, iters=3, batch_size=4, rng=np.random.default_rng(0))
    assert set(out) == {"train", "val"} and all(abs(v - np.log(10)) < 0.5 for v in out.values())
    assert m.training is True
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day83.py
import math

import numpy as np

from day75 import get_batch


def perplexity(loss):
    return float(np.exp(loss))


def estimate_loss(model, splits, iters, batch_size, rng):
    model.eval()
    out = {}
    for name, data in splits.items():
        losses = []
        for _ in range(iters):
            x, y = get_batch(data, model.block_size, batch_size, rng)
            losses.append(float(model(x, y)[1].data))
        out[name] = float(np.mean(losses))
    model.train()
    return out


def clip_grad_norm(params, max_norm):
    total = float(np.sqrt(sum((p.grad ** 2).sum() for p in params)))
    if total > max_norm:
        for p in params:
            p.grad *= max_norm / total
    return total


def lr_at(step, warmup, max_steps, max_lr, min_lr):
    if step < warmup:
        return max_lr * (step + 1) / warmup
    if step >= max_steps:
        return min_lr
    ratio = (step - warmup) / (max_steps - warmup)
    return min_lr + 0.5 * (1 + math.cos(math.pi * ratio)) * (max_lr - min_lr)
```

</details>

**Done when:** green. Add `estimate_loss` every 200 steps + clipping + the schedule to your Day 80 training script and re-train.

---

[← Day 82](day82-a-bpe-tokenizer-from-scratch.md) · [All 90 days](README.md) · [Day 84 →](day84-your-own-corpus-pretraining-and-checkpoints.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
