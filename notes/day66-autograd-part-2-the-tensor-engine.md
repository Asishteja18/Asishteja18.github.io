# Day 66 — Autograd, part 2: the Tensor engine

> **AI-90** · Block 3 · Build an AI from scratch · Day 66 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 66`)

[← Day 65](day65-a-neural-net-library-on-your-scalar-engine.md) · [All 90 days](README.md) · [Day 67 →](day67-autograd-part-3-the-ops-a-language-model-needs.md)

---

**Dataset:** none (gradient checks) · **Time:** ~3 h
**Progress:** `[██████░░░░░░░░░░░░░░░░░░░░░░░░] 6/30` · **System after today:** `tinytorch` is born — a vectorised autograd engine, the foundation of everything after.

#### Visual

```text
 Value (Day 64): one Python object per NUMBER      →  slow
 Tensor (today): one object per ARRAY, numpy maths →  ~1000× faster, same idea
 broadcasting in backward:  x (4,3) + b (3,)  →  out (4,3)
                            b.grad = out.grad.sum(axis=0)   ← "unbroadcast": sum the dims that were stretched
 matmul backward:  C = A @ B     dA = dC @ Bᵀ     dB = Aᵀ @ dC
```

#### Notes

- Same design as `Value`, but `data` and `grad` are NumPy arrays (float64 for exact gradient checks).
- **Unbroadcast**: if an input was broadcast to a bigger shape in the forward pass, sum the gradient back to its original shape.
- `sum(axis)` backward: expand the gradient back over the summed axis. `mean` = sum × 1/n.
- Use an iterative topological sort (deep graphs overflow Python's recursion limit).
- `grad_check(f, inputs)` is your safety net for every new op from now on.

#### Your task — `day66.py`

- `unbroadcast(grad, shape)`.
- `class Tensor(data)` with `data, grad, shape`, ops `+ - * / ** (number) @`, unary `-`, reversed ops, `sum(axis=None, keepdims=False)`, `mean(...)`, `relu()`, `tanh()`, `exp()`, `log()`, `detach()`, `backward()`.
- `grad_check(f, tensors, eps=1e-6)` → max relative error between `backward()` grads and numerical grads of the scalar `f()`.

#### Tests

```python
# file: test_day66.py
import numpy as np

import day66 as ex
from day66 import Tensor


def rnd(*shape, seed=0):
    return Tensor(np.random.default_rng(seed).normal(size=shape))


def test_unbroadcast():
    g = np.ones((4, 3))
    assert ex.unbroadcast(g, (3,)).tolist() == [4, 4, 4]
    assert ex.unbroadcast(g, (4, 1)).shape == (4, 1)


def test_linear_layer_grads():
    x, W, b = rnd(5, 3, seed=1), rnd(3, 4, seed=2), rnd(4, seed=3)
    assert ex.grad_check(lambda: ((x @ W + b).tanh() ** 2).mean(), [x, W, b]) < 1e-6


def test_elementwise_and_reductions():
    a, c = Tensor(np.random.default_rng(4).uniform(0.5, 2, (3, 4))), rnd(1, 4, seed=5)
    f = lambda: ((a * c - c / a + 2 - a).exp().sum(axis=1, keepdims=True).log() + (a - 1).relu().sum(axis=0)).mean()  # noqa: E731
    assert ex.grad_check(f, [a, c]) < 1e-6


def test_batched_matmul_broadcast():
    x, W = rnd(2, 5, 3, seed=6), rnd(3, 4, seed=7)
    assert ex.grad_check(lambda: (x @ W).sum(), [x, W]) < 1e-6


def test_reuse_and_detach():
    a = Tensor([2.0, 3.0])
    (a * a + a.detach()).sum().backward()
    assert a.grad.tolist() == [4.0, 6.0]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day66.py
"""tinytorch, part 1 — a NumPy tensor with reverse-mode autograd."""
import numpy as np


def unbroadcast(grad, shape):
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad


class Tensor:
    def __init__(self, data, _children=(), _op=""):
        self.data = np.asarray(data, dtype=np.float64)
        self.grad = np.zeros_like(self.data)
        self._backward, self._prev, self._op = (lambda: None), _children, _op

    shape = property(lambda self: self.data.shape)

    def __repr__(self):
        return f"Tensor(shape={self.data.shape}, op={self._op!r})"

    @staticmethod
    def ensure(x):
        return x if isinstance(x, Tensor) else Tensor(x)

    def __add__(self, other):
        other = Tensor.ensure(other)
        out = Tensor(self.data + other.data, (self, other), "+")

        def _backward():
            self.grad += unbroadcast(out.grad, self.data.shape)
            other.grad += unbroadcast(out.grad, other.data.shape)
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = Tensor.ensure(other)
        out = Tensor(self.data * other.data, (self, other), "*")

        def _backward():
            self.grad += unbroadcast(other.data * out.grad, self.data.shape)
            other.grad += unbroadcast(self.data * out.grad, other.data.shape)
        out._backward = _backward
        return out

    def __matmul__(self, other):
        other = Tensor.ensure(other)
        out = Tensor(self.data @ other.data, (self, other), "@")

        def _backward():
            self.grad += unbroadcast(out.grad @ np.swapaxes(other.data, -1, -2), self.data.shape)
            other.grad += unbroadcast(np.swapaxes(self.data, -1, -2) @ out.grad, other.data.shape)
        out._backward = _backward
        return out

    def __pow__(self, k):
        out = Tensor(self.data ** k, (self,), f"**{k}")

        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad
        out._backward = _backward
        return out

    def sum(self, axis=None, keepdims=False):
        out = Tensor(self.data.sum(axis=axis, keepdims=keepdims), (self,), "sum")

        def _backward():
            g = out.grad
            if axis is not None and not keepdims:
                g = np.expand_dims(g, axis)
            self.grad += np.broadcast_to(g, self.data.shape)
        out._backward = _backward
        return out

    def mean(self, axis=None, keepdims=False):
        s = self.sum(axis=axis, keepdims=keepdims)
        return s * (s.data.size / self.data.size)

    def _unary(self, value, local_grad, op):
        out = Tensor(value, (self,), op)

        def _backward():
            self.grad += local_grad() * out.grad
        out._backward = _backward
        return out

    def relu(self):
        return self._unary(np.maximum(self.data, 0), lambda: (self.data > 0).astype(float), "relu")

    def tanh(self):
        t = np.tanh(self.data)
        return self._unary(t, lambda: 1 - t ** 2, "tanh")

    def exp(self):
        e = np.exp(self.data)
        return self._unary(e, lambda: e, "exp")

    def log(self):
        return self._unary(np.log(self.data), lambda: 1 / self.data, "log")

    def detach(self):
        return Tensor(self.data.copy())

    def __neg__(self):
        return self * -1.0

    def __sub__(self, other):
        return self + (-Tensor.ensure(other))

    def __truediv__(self, other):
        return self * Tensor.ensure(other) ** -1

    def __radd__(self, other):
        return self + other

    def __rmul__(self, other):
        return self * other

    def __rsub__(self, other):
        return Tensor.ensure(other) - self

    def __rtruediv__(self, other):
        return Tensor.ensure(other) * self ** -1

    def backward(self):
        topo, seen, stack = [], set(), [(self, False)]
        while stack:
            node, done = stack.pop()
            if done:
                topo.append(node)
                continue
            if id(node) in seen:
                continue
            seen.add(id(node))
            stack.append((node, True))
            stack.extend((c, False) for c in node._prev if id(c) not in seen)
        self.grad = np.ones_like(self.data)
        for node in reversed(topo):
            node._backward()


def grad_check(f, tensors, eps=1e-6):
    for t in tensors:
        t.grad = np.zeros_like(t.data)
    f().backward()
    analytic = [t.grad.copy() for t in tensors]
    worst = 0.0
    for t, a in zip(tensors, analytic):
        for idx in np.ndindex(t.data.shape):
            old = t.data[idx]
            t.data[idx] = old + eps; fp = float(f().data)
            t.data[idx] = old - eps; fm = float(f().data)
            t.data[idx] = old
            num = (fp - fm) / (2 * eps)
            worst = max(worst, abs(num - a[idx]) / max(1e-4, abs(num) + abs(a[idx])))  # floor: ignore noise on ~0 grads
    return worst
```

</details>

**Done when:** green — every gradient matches finite differences to 1e-6.

---

[← Day 65](day65-a-neural-net-library-on-your-scalar-engine.md) · [All 90 days](README.md) · [Day 67 →](day67-autograd-part-3-the-ops-a-language-model-needs.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
