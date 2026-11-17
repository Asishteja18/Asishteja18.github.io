# Day 32 — Derivatives and gradients

> **AI-90** · Block 2 · Machine learning from scratch · Day 32 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 32`)

[← Day 31](day31-vectors-and-matrices-for-ml.md) · [All 90 days](README.md) · [Day 33 →](day33-gradient-descent.md)

---

**Dataset:** none (functions) · **Time:** ~2 h

#### Visual

```text
 f(x) = x²            slope at x = how fast f changes
   │ ╲         ╱      numerical:  f'(x) ≈ (f(x+h) − f(x−h)) / 2h     (h = 1e-5)
   │  ╲       ╱ ← slope 4 at x=2
   │   ╲_____╱
 gradient of f(x, y) = [∂f/∂x, ∂f/∂y]  → points uphill; ML walks the OTHER way
 chain rule: d/dx f(g(x)) = f'(g(x)) · g'(x)    ← backprop is just this, repeated
```

#### Notes

- Derivative = slope = sensitivity of output to input.
- Rules you need: `(xⁿ)' = n·xⁿ⁻¹`, `(eˣ)' = eˣ`, `(ln x)' = 1/x`, sum rule, product rule, chain rule.
- **Numerical gradient** (central difference) is slow but always right — you'll use it forever to check hand-written gradients ("gradient checking", Day 63).
- Partial derivative: wiggle one input, hold the others still. Gradient = vector of all partials.

#### Your task — `day32.py`

- `numerical_derivative(f, x, h=1e-5)` (central difference).
- `numerical_grad(f, x, h=1e-5)` → gradient array for `f` taking a 1-D array.
- `mse_grad(w, X, y)` → analytic gradient of `mean((X@w − y)²)` = `2/n · Xᵀ(Xw − y)`.
- `sigmoid(z)` and `sigmoid_grad(z)` = `σ(z)(1 − σ(z))`.

#### Tests

```python
# file: test_day32.py
import numpy as np

import day32 as ex


def test_derivative():
    assert abs(ex.numerical_derivative(lambda x: x ** 2, 2.0) - 4) < 1e-6
    assert abs(ex.numerical_derivative(np.sin, 0.0) - 1) < 1e-6


def test_grad():
    f = lambda v: v[0] ** 2 + 3 * v[0] * v[1]  # noqa: E731
    assert np.allclose(ex.numerical_grad(f, np.array([1.0, 2.0])), [8, 3], atol=1e-5)


def test_mse_grad_matches_numeric():
    rng = np.random.default_rng(0)
    X, y, w = rng.normal(size=(20, 3)), rng.normal(size=20), rng.normal(size=3)
    numeric = ex.numerical_grad(lambda v: np.mean((X @ v - y) ** 2), w)
    assert np.allclose(ex.mse_grad(w, X, y), numeric, atol=1e-6)


def test_sigmoid_grad():
    z = np.linspace(-4, 4, 9)
    assert np.allclose(ex.sigmoid_grad(z), [ex.numerical_derivative(ex.sigmoid, v) for v in z], atol=1e-8)
    assert ex.sigmoid(0) == 0.5
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day32.py
import numpy as np


def numerical_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)


def numerical_grad(f, x, h=1e-5):
    x = np.asarray(x, float)
    g = np.zeros_like(x)
    for i in range(x.size):
        e = np.zeros_like(x); e.flat[i] = h
        g.flat[i] = (f(x + e) - f(x - e)) / (2 * h)
    return g


def mse_grad(w, X, y):
    return 2 / len(y) * X.T @ (X @ w - y)


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def sigmoid_grad(z):
    s = sigmoid(z)
    return s * (1 - s)
```

</details>

**Done when:** green. On paper: derive `d/dw (wx − y)²` with the chain rule.

---

[← Day 31](day31-vectors-and-matrices-for-ml.md) · [All 90 days](README.md) · [Day 33 →](day33-gradient-descent.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
