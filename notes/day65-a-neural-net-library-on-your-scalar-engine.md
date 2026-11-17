# Day 65 — A neural-net library on your scalar engine

> **AI-90** · Block 3 · Build an AI from scratch · Day 65 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 65`)

[← Day 64](day64-autograd-part-1-a-scalar-engine.md) · [All 90 days](README.md) · [Day 66 →](day66-autograd-part-2-the-tensor-engine.md)

---

**Dataset:** two moons (`sklearn.datasets.make_moons`, 100 points) · **Time:** ~2 h
**Progress:** `[█████░░░░░░░░░░░░░░░░░░░░░░░░░] 5/30` · **System after today:** neurons, layers and MLPs built on your autograd, classifying a non-linear dataset.

#### Visual

```text
  moons:   ○○○○○                     decision boundary learned by your MLP(2→16→16→1)
         ○       ○   ●●●              ░░░░░░░▓▓▓▓
        ○         ○ ●   ●             ░░░░▓▓▓▓░░░▓▓
                   ●     ●            ░░░▓▓░░░░░░░░▓
                    ●●●●●             a straight line can't do this; your net can
 loss = mean hinge: max(0, 1 − y·score)  + α‖w‖²       y ∈ {−1, +1}
```

#### Notes

- `Neuron(nin)`: weights + bias as `Value`s; `__call__(x) = act(Σ wᵢxᵢ + b)`.
- `Layer(nin, nout)` = list of neurons; `MLP(nin, [16, 16, 1])` = list of layers (last one linear).
- `parameters()` lists every `Value` so the training loop can update them: `p.data -= lr * p.grad`, then **zero the grads**.
- Scalar autograd is slow (one Python object per number) — tomorrow you vectorise it.

#### Your task — `day65.py`

- `Neuron`, `Layer`, `MLP` classes with `__call__` and `parameters()`; `MLP.zero_grad()`.
- `train_moons(steps=60, seed=0)` → `(model, accuracy)` on 100 moons points with hinge loss + L2, SGD lr decaying from 1.0 to 0.1.

#### Tests

```python
# file: test_day65.py
import day65 as ex
from day64 import Value


def test_param_counts():
    assert len(ex.Neuron(3).parameters()) == 4
    assert len(ex.MLP(2, [16, 16, 1]).parameters()) == 2 * 16 + 16 + 16 * 16 + 16 + 16 + 1


def test_forward_and_zero_grad():
    m = ex.MLP(3, [4, 1])
    out = m([1.0, -2.0, 0.5])
    assert isinstance(out, Value)
    out.backward()
    assert any(p.grad != 0 for p in m.parameters())
    m.zero_grad()
    assert all(p.grad == 0 for p in m.parameters())


def test_moons():
    _, acc = ex.train_moons(steps=60, seed=0)
    assert acc >= 0.9
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day65.py
import random

from day64 import Value


class Neuron:
    def __init__(self, nin, nonlin=True):
        self.w = [Value(random.uniform(-1, 1)) for _ in range(nin)]
        self.b = Value(0.0)
        self.nonlin = nonlin

    def __call__(self, x):
        act = sum((wi * xi for wi, xi in zip(self.w, x)), self.b)
        return act.relu() if self.nonlin else act

    def parameters(self):
        return self.w + [self.b]


class Layer:
    def __init__(self, nin, nout, nonlin=True):
        self.neurons = [Neuron(nin, nonlin) for _ in range(nout)]

    def __call__(self, x):
        out = [n(x) for n in self.neurons]
        return out[0] if len(out) == 1 else out

    def parameters(self):
        return [p for n in self.neurons for p in n.parameters()]


class MLP:
    def __init__(self, nin, nouts):
        sz = [nin] + nouts
        self.layers = [Layer(sz[i], sz[i + 1], nonlin=i != len(nouts) - 1) for i in range(len(nouts))]

    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

    def parameters(self):
        return [p for layer in self.layers for p in layer.parameters()]

    def zero_grad(self):
        for p in self.parameters():
            p.grad = 0.0


def train_moons(steps=60, seed=0):
    from sklearn.datasets import make_moons
    random.seed(seed)
    X, y = make_moons(n_samples=100, noise=0.1, random_state=seed)
    y = y * 2 - 1
    model = MLP(2, [16, 16, 1])
    for k in range(steps):
        scores = [model(list(map(float, x))) for x in X]
        losses = [(1 + -float(yi) * s).relu() for yi, s in zip(y, scores)]
        loss = sum(losses) * (1.0 / len(losses)) + 1e-4 * sum(p * p for p in model.parameters())
        model.zero_grad()
        loss.backward()
        lr = 1.0 - 0.9 * k / steps
        for p in model.parameters():
            p.data -= lr * p.grad
    scores = [model(list(map(float, x))) for x in X]
    acc = sum((s.data > 0) == (yi > 0) for yi, s in zip(y, scores)) / len(y)
    return model, acc
```

</details>

**Done when:** green (≥ 90% on moons). Time one training step — note how slow scalar autograd is.

---

[← Day 64](day64-autograd-part-1-a-scalar-engine.md) · [All 90 days](README.md) · [Day 66 →](day66-autograd-part-2-the-tensor-engine.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
