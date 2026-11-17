# Day 64 — Autograd, part 1: a scalar engine

> **AI-90** · Block 3 · Build an AI from scratch · Day 64 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 64`)

[← Day 63](day63-backpropagation-by-hand.md) · [All 90 days](README.md) · [Day 65 →](day65-a-neural-net-library-on-your-scalar-engine.md)

---

**Dataset:** none · **Time:** ~2.5 h (follow along with Karpathy's "micrograd" lecture, Zero to Hero #1)
**Progress:** `[████░░░░░░░░░░░░░░░░░░░░░░░░░░] 4/30` · **System after today:** automatic differentiation — you never derive a gradient by hand again.

#### Visual

```text
 a=2 ─╮
       (*) ─▶ c=−6 ─╮
 b=−3 ─╯             (+) ─▶ e=4 ─▶ tanh ─▶ L
 d=10 ──────────────╯
 every Value remembers: data, grad, its parents, and a tiny _backward() for its op.
 L.backward(): topological sort, then call _backward() from L back to the leaves.
 a.grad = ∂L/∂a  — gradients ACCUMULATE (+=) when a value is used twice.
```

#### Notes

- Each operation creates a new `Value` and stores a closure that pushes gradient to its inputs (local derivative × output gradient).
- `+=` not `=` — a value used in two places receives gradient from both.
- Topological order guarantees a node's gradient is complete before it's passed on.

#### Your task — `day64.py`

- `class Value(data)` with `grad`, `+ - * / ** (number exponent)`, unary `-`, reversed ops (`2 * v`), `tanh()`, `exp()`, `relu()`, `backward()`.

#### Tests

```python
# file: test_day64.py
import math

from day64 import Value


def test_simple_graph():
    a, b, d = Value(2.0), Value(-3.0), Value(10.0)
    e = a * b + d
    L = e.tanh()
    L.backward()
    dt = 1 - math.tanh(4) ** 2
    assert math.isclose(L.data, math.tanh(4))
    assert math.isclose(a.grad, dt * -3) and math.isclose(b.grad, dt * 2) and math.isclose(d.grad, dt)


def test_reuse_accumulates():
    a = Value(3.0)
    (a * a + a).backward()
    assert a.grad == 7.0


def test_all_ops_vs_numeric():
    def f(x):
        return ((x * 2 + 1) ** 2 / (x - 5) - (-x).exp() + (x * 3).relu() + 2 - x / 4).tanh() * 3

    x = Value(0.7)
    f(x).backward()
    h = 1e-6
    num = (f(Value(0.7 + h)).data - f(Value(0.7 - h)).data) / (2 * h)
    assert abs(num - x.grad) < 1e-6
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day64.py
import math


class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = float(data), 0.0
        self._backward, self._prev, self._op = (lambda: None), _children, _op

    def __repr__(self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

    @staticmethod
    def _v(x):
        return x if isinstance(x, Value) else Value(x)

    def __add__(self, other):
        other = Value._v(other)
        out = Value(self.data + other.data, (self, other), "+")

        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = Value._v(other)
        out = Value(self.data * other.data, (self, other), "*")

        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __pow__(self, k):
        out = Value(self.data ** k, (self,), f"**{k}")

        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")

        def _backward():
            self.grad += (1 - t * t) * out.grad
        out._backward = _backward
        return out

    def exp(self):
        e = math.exp(self.data)
        out = Value(e, (self,), "exp")

        def _backward():
            self.grad += e * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,), "relu")

        def _backward():
            self.grad += (self.data > 0) * out.grad
        out._backward = _backward
        return out

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self + (-Value._v(other))

    def __truediv__(self, other):
        return self * Value._v(other) ** -1

    def __radd__(self, other):
        return self + other

    def __rmul__(self, other):
        return self * other

    def __rsub__(self, other):
        return Value._v(other) - self

    def __rtruediv__(self, other):
        return Value._v(other) * self ** -1

    def backward(self):
        topo, seen = [], set()

        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
```

</details>

**Done when:** green. Draw the graph for `test_simple_graph` with each node's grad written on it.

---

[← Day 63](day63-backpropagation-by-hand.md) · [All 90 days](README.md) · [Day 65 →](day65-a-neural-net-library-on-your-scalar-engine.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
