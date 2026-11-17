# Day 62 — Multi-layer networks: the forward pass

> **AI-90** · Block 3 · Build an AI from scratch · Day 62 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 62`)

[← Day 61](day61-the-perceptron.md) · [All 90 days](README.md) · [Day 63 →](day63-backpropagation-by-hand.md)

---

**Dataset:** XOR · **Time:** ~2 h
**Progress:** `[██░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 2/30` · **System after today:** a network with hidden layers that CAN represent XOR (with hand-set weights).

#### Visual

```text
 input (2) ──W1 (2×2)──▶ hidden (2, tanh) ──W2 (2×1)──▶ output (1, sigmoid)
 shapes for a batch of n:  X (n,2) @ W1 (2,h) + b1 → (n,h) → tanh → @ W2 (h,1) + b2 → (n,1)
 XOR by hand: h1 = OR(x),  h2 = AND(x),  out = h1 AND NOT h2
```

#### Notes

- A layer = matrix multiply + bias + non-linearity. Without the non-linearity, stacked layers collapse into one linear layer.
- Keep a **cache** of every layer's input and output — backprop needs them tomorrow.
- Initialise weights small and random (`N(0,1)/√fan_in`), biases zero. All-zero weights → every neuron learns the same thing.

#### Your task — `day62.py`

- `init_mlp(sizes, seed=0)` → list of `(W, b)` with `W ~ N(0,1)/√fan_in`.
- `forward(params, X, hidden=np.tanh)` → `(output_probs, cache)`; hidden layers use `hidden`, the last layer uses sigmoid; `cache` = list of activations, input first.
- `XOR_PARAMS` → hand-made weights that solve XOR.

#### Tests

```python
# file: test_day62.py
import numpy as np

import day62 as ex
from day61 import GATES


def test_init_shapes():
    p = ex.init_mlp([4, 8, 3], seed=0)
    assert [w.shape for w, _ in p] == [(4, 8), (8, 3)] and [b.shape for _, b in p] == [(8,), (3,)]
    assert abs(p[0][0].std() - 0.5) < 0.2


def test_forward_shapes():
    p = ex.init_mlp([2, 5, 1])
    out, cache = ex.forward(p, np.zeros((7, 2)))
    assert out.shape == (7, 1) and len(cache) == 3 and cache[0].shape == (7, 2)


def test_hand_xor():
    X, y = GATES["XOR"]
    out, _ = ex.forward(ex.XOR_PARAMS, X)
    assert ((out[:, 0] > 0.5).astype(int) == y).all()
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day62.py
import numpy as np

from day32 import sigmoid


def init_mlp(sizes, seed=0):
    rng = np.random.default_rng(seed)
    return [(rng.normal(0, 1, (a, b)) / np.sqrt(a), np.zeros(b)) for a, b in zip(sizes, sizes[1:])]


def forward(params, X, hidden=np.tanh):
    a = np.asarray(X, float)
    cache = [a]
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        a = sigmoid(z) if i == len(params) - 1 else hidden(z)
        cache.append(a)
    return a, cache


# hidden unit 1 ≈ OR, hidden unit 2 ≈ AND; output = h1 AND NOT h2
XOR_PARAMS = [(np.array([[10.0, 10.0], [10.0, 10.0]]), np.array([-5.0, -15.0])),
              (np.array([[10.0], [-10.0]]), np.array([-5.0]))]
```

</details>

**Done when:** green. Trace `[1, 0]` through `XOR_PARAMS` by hand.

---

[← Day 61](day61-the-perceptron.md) · [All 90 days](README.md) · [Day 63 →](day63-backpropagation-by-hand.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
