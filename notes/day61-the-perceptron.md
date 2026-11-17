# Day 61 — The perceptron

> **AI-90** · Block 3 · Build an AI from scratch · Day 61 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 61`)

[← Day 60](day60-block-2-capstone-minisklearn-benchmark.md) · [All 90 days](README.md) · [Day 62 →](day62-multi-layer-networks-the-forward-pass.md)

---

**Dataset:** logic gates; then Iris setosa vs rest · **Time:** ~2 h
**Progress:** `[█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 1/30` · **System after today:** one artificial neuron that learns linear rules.

#### Visual

```text
 x1 ──w1──╮
           Σ + b ──▶ step(z) ──▶ 0 / 1          update on a mistake:  w ← w + lr·(y − ŷ)·x
 x2 ──w2──╯
 AND, OR: separable by one line ✔          XOR:  (0,1)●  ○(1,1)     no single line splits ● from ○
                                                  (0,0)○  ●(1,0)     → need hidden layers (Day 62)
```

#### Notes

- Rosenblatt's perceptron (1958): weighted sum, threshold, learn only from mistakes.
- Converges when the data is linearly separable; never converges on XOR. That limit is why we stack layers.

#### Your task — `day61.py`

- `class Perceptron(lr=0.1, epochs=50)` with `fit(X, y)` (labels 0/1), `predict(X)`, `errors_` (mistakes per epoch).
- `GATES = {"AND": ..., "OR": ..., "XOR": ...}` → `(X, y)` for each.

#### Tests

```python
# file: test_day61.py
import numpy as np

import day61 as ex
from day23 import load_iris_xy


def test_and_or_learned():
    for g in ("AND", "OR"):
        X, y = ex.GATES[g]
        p = ex.Perceptron().fit(X, y)
        assert (p.predict(X) == y).all() and p.errors_[-1] == 0


def test_xor_impossible():
    X, y = ex.GATES["XOR"]
    p = ex.Perceptron(epochs=100).fit(X, y)
    assert (p.predict(X) == y).mean() < 1.0 and min(p.errors_) > 0


def test_setosa():
    X, y = load_iris_xy()
    yb = (y == 0).astype(int)
    assert (ex.Perceptron().fit(X, yb).predict(X) == yb).all()
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day61.py
import numpy as np

_X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
GATES = {"AND": (_X, np.array([0, 0, 0, 1])), "OR": (_X, np.array([0, 1, 1, 1])), "XOR": (_X, np.array([0, 1, 1, 0]))}


class Perceptron:
    def __init__(self, lr=0.1, epochs=50):
        self.lr, self.epochs = lr, epochs

    def fit(self, X, y):
        X = np.asarray(X, float)
        self.w_, self.b_, self.errors_ = np.zeros(X.shape[1]), 0.0, []
        for _ in range(self.epochs):
            errs = 0
            for xi, yi in zip(X, y):
                update = self.lr * (yi - self.predict(xi[None])[0])
                self.w_ += update * xi
                self.b_ += update
                errs += int(update != 0)
            self.errors_.append(errs)
        return self

    def predict(self, X):
        return (np.asarray(X, float) @ self.w_ + self.b_ > 0).astype(int)
```

</details>

**Done when:** green. Write one sentence on why XOR fails — the answer motivates all of deep learning.

---

[← Day 60](day60-block-2-capstone-minisklearn-benchmark.md) · [All 90 days](README.md) · [Day 62 →](day62-multi-layer-networks-the-forward-pass.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
