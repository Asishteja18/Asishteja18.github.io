# Day 68 — `nn.Module`: layers on your engine

> **AI-90** · Block 3 · Build an AI from scratch · Day 68 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 68`)

[← Day 67](day67-autograd-part-3-the-ops-a-language-model-needs.md) · [All 90 days](README.md) · [Day 69 →](day69-optimisers-sgd-momentum-adam.md)

---

**Dataset:** Digits (8×8 handwritten, 1,797 images) · **Time:** ~2.5 h
**Progress:** `[████████░░░░░░░░░░░░░░░░░░░░░░] 8/30` · **System after today:** a PyTorch-style layer library on your own engine — a digit classifier at >93%.

#### Visual

```text
 class Module                       Sequential(
   parameters()  → walks attributes   Linear(64, 64),   ← W (64×64), b (64)
   zero_grad()                         ReLU(),
   train() / eval()                    Linear(64, 10))   ← logits for 10 digits
   __call__ → forward                  → cross_entropy(logits, labels) → backward → step
 Linear init: W ~ N(0, 1/fan_in) keeps activations from exploding or vanishing
```

#### Notes

- `Module.parameters()` finds every `Tensor` attribute, and recurses into child `Module`s and lists.
- `Linear(in, out)`: `x @ W + b` — works for `(N, in)` and `(B, T, in)` thanks to batched matmul.
- One training step: `logits = model(Tensor(xb))` → `loss = cross_entropy(logits, yb)` → `model.zero_grad()` → `loss.backward()` → update.
- Same API as PyTorch on purpose — Day 90 ports it in minutes.

#### Your task — `day68.py`

- `class Module` (`parameters`, `zero_grad`, `train`, `eval`, `num_params`, `__call__`).
- `Linear(in_f, out_f, bias=True, seed=0)`, `ReLU`, `Tanh`, `Sequential(*layers)`.
- `train_digits(epochs=30, lr=0.1, seed=0)` → `(model, test_accuracy)` with an 80/20 split, standardised pixels, plain SGD on mini-batches of 64.

#### Tests

```python
# file: test_day68.py
import numpy as np

import day68 as ex
from day66 import Tensor


def test_params_and_counts():
    m = ex.Sequential(ex.Linear(64, 32), ex.ReLU(), ex.Linear(32, 10))
    assert len(m.parameters()) == 4 and m.num_params() == 64 * 32 + 32 + 32 * 10 + 10


def test_linear_3d_input():
    out = ex.Linear(5, 7)(Tensor(np.ones((2, 3, 5))))
    assert out.shape == (2, 3, 7)


def test_zero_grad_and_modes():
    m = ex.Sequential(ex.Linear(3, 2), ex.Tanh())
    m(Tensor(np.ones((4, 3)))).sum().backward()
    assert any(np.abs(p.grad).sum() > 0 for p in m.parameters())
    m.zero_grad()
    assert all(np.abs(p.grad).sum() == 0 for p in m.parameters())
    m.eval()
    assert m.training is False and m.layers[0].training is False


def test_digits():
    _, acc = ex.train_digits(epochs=30)
    assert acc > 0.93
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day68.py
"""tinytorch, part 3 — nn.Module, Linear, activations, Sequential."""
import numpy as np

from day66 import Tensor
from day67 import cross_entropy


class Module:
    training = True

    def _children(self):
        for v in vars(self).values():
            items = v if isinstance(v, (list, tuple)) else [v]
            for it in items:
                if isinstance(it, (Tensor, Module)):
                    yield it

    def parameters(self):
        out, seen = [], set()
        for c in self._children():
            for p in ([c] if isinstance(c, Tensor) else c.parameters()):
                if id(p) not in seen:
                    seen.add(id(p))
                    out.append(p)
        return out

    def zero_grad(self):
        for p in self.parameters():
            p.grad = np.zeros_like(p.data)

    def train(self, mode=True):
        self.training = mode
        for c in self._children():
            if isinstance(c, Module):
                c.train(mode)
        return self

    def eval(self):
        return self.train(False)

    def num_params(self):
        return sum(p.data.size for p in self.parameters())

    def __call__(self, *args, **kwargs):
        return self.forward(*args, **kwargs)


class Linear(Module):
    def __init__(self, in_f, out_f, bias=True, seed=0):
        rng = np.random.default_rng(seed)
        self.W = Tensor(rng.normal(0, 1, (in_f, out_f)) / np.sqrt(in_f))
        self.b = Tensor(np.zeros(out_f)) if bias else None

    def forward(self, x):
        out = x @ self.W
        return out + self.b if self.b is not None else out


class ReLU(Module):
    def forward(self, x):
        return x.relu()


class Tanh(Module):
    def forward(self, x):
        return x.tanh()


class Sequential(Module):
    def __init__(self, *layers):
        self.layers = list(layers)

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x


def train_digits(epochs=30, lr=0.1, seed=0):
    from sklearn.datasets import load_digits
    from day34 import StandardScaler
    from day35 import train_test_split
    d = load_digits()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=seed)
    s = StandardScaler().fit(Xtr)
    Xtr, Xte = s.transform(Xtr), s.transform(Xte)
    model = Sequential(Linear(64, 64, seed=seed), ReLU(), Linear(64, 10, seed=seed + 1))
    rng = np.random.default_rng(seed)
    for _ in range(epochs):
        idx = rng.permutation(len(ytr))
        for i in range(0, len(idx), 64):
            b = idx[i:i + 64]
            loss = cross_entropy(model(Tensor(Xtr[b])), ytr[b])
            model.zero_grad()
            loss.backward()
            for p in model.parameters():
                p.data -= lr * p.grad
    acc = float((model(Tensor(Xte)).data.argmax(1) == yte).mean())
    return model, acc
```

</details>

**Done when:** green — a neural network on your own engine reads handwriting.

---

[← Day 67](day67-autograd-part-3-the-ops-a-language-model-needs.md) · [All 90 days](README.md) · [Day 69 →](day69-optimisers-sgd-momentum-adam.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
