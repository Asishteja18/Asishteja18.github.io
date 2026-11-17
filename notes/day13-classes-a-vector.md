# Day 13 — Classes: a Vector

> **AI-90** · Block 1 · Python + automation + real data · Day 13 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 13`)

[← Day 12](day12-comprehensions-generators-lambda.md) · [All 90 days](README.md) · [Day 14 →](day14-dataclasses-type-hints-testing.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
       y
       │    v=(3,4)
     4 ┤      ●        norm(v) = √(3²+4²) = 5
       │    ／          dot(a,b) = Σ aᵢbᵢ   ← every neuron computes this
       │  ／
       │／____________ x
       0      3
```

**Goal:** bundle data with the functions that work on it. PyTorch's `nn.Module`, your Phase 5 `Value` autograd class and your Matrix library are all classes.

#### 1. A minimal class

```python
class Dog:
    def __init__(self, name, age):     # runs when you create one
        self.name = name               # attributes live on self
        self.age = age

    def describe(self):                # a method — always takes self first
        return f"{self.name} is {self.age}"

rex = Dog("Rex", 3)    # calls __init__
rex.describe()         # 'Rex is 3'
rex.age                # 3
```

`self` is the specific object the method was called on.

#### 2. Dunder ("double underscore") methods

These hook your class into Python's syntax:

| You write | Python calls |
| --- | --- |
| `repr(v)` / shown in REPL | `v.__repr__()` |
| `len(v)` | `v.__len__()` |
| `v[0]` | `v.__getitem__(0)` |
| `a == b` | `a.__eq__(b)` |
| `a + b` | `a.__add__(b)` |
| `a - b` | `a.__sub__(b)` |
| `a * 3` | `a.__mul__(3)` |

Implement `__add__` and suddenly `Vector(1, 2) + Vector(3, 4)` just works. That's exactly how NumPy arrays and PyTorch tensors support `+`.

#### 3. Returning new objects

`__add__` should **return a new Vector**, not change `self`. Vectors behave like numbers: `a + b` doesn't modify `a`.

```python
def __add__(self, other):
    return Vector(*(x + y for x, y in zip(self.components, other.components)))
```

`Vector(*something)` unpacks the generator into positional arguments — `*args` from Day 8.

#### 4. Private helpers

A leading underscore (`_check`) means "internal — not part of the public API". Put shared validation there instead of repeating it.

#### 5. The maths

- **dot product:** `(1,2,3)·(4,5,6) = 1·4 + 2·5 + 3·6 = 32`
- **norm (length):** `√(v·v)` → `(3,4)` has length 5

Every neuron computes a dot product. You're writing the core of ML today.

#### Exercises

`python ai90.py check 13`.

#### Your task — write `ai90/work/day13.py` with: `Vector`

#### Tests

```python
# file: test_day13.py
from day13 import Vector


def raises(func, exc=ValueError):
    try:
        func()
    except exc:
        return
    raise AssertionError(f"expected {exc.__name__}")


def test_create_and_repr():
    v = Vector(1, 2)
    assert v.components == (1.0, 2.0)
    assert repr(v) == "Vector(1.0, 2.0)"
    raises(lambda: Vector())


def test_len_getitem_eq():
    v = Vector(3, 4, 5)
    assert len(v) == 3
    assert v[0] == 3.0 and v[-1] == 5.0
    assert v == Vector(3, 4, 5)
    assert v != Vector(3, 4)
    assert v != (3, 4, 5)


def test_add_sub():
    assert Vector(1, 2) + Vector(3, 4) == Vector(4, 6)
    assert Vector(5, 5) - Vector(1, 2) == Vector(4, 3)
    raises(lambda: Vector(1, 2) + Vector(1, 2, 3))


def test_scalar_mul():
    assert Vector(1, -2) * 3 == Vector(3, -6)


def test_dot_norm():
    assert Vector(1, 2, 3).dot(Vector(4, 5, 6)) == 32.0
    assert Vector(3, 4).norm() == 5.0
    raises(lambda: Vector(1).dot(Vector(1, 2)))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day13.py
"""Day 13 — classes. Build a Vector you'll reuse in Phase 3."""
import math


class Vector:
    """An n-dimensional vector. Vector(1, 2, 3)"""

    def __init__(self, *components):
        """Store components as a tuple of floats. Vector() with no components raises ValueError."""
        if not components:
            raise ValueError("a vector needs at least one component")
        self.components = tuple(float(c) for c in components)

    def __repr__(self):
        """Vector(1.0, 2.0)"""
        return f"Vector({', '.join(str(c) for c in self.components)})"

    def __len__(self):
        """Number of components."""
        return len(self.components)

    def __getitem__(self, i):
        """v[i] -> component i."""
        return self.components[i]

    def __eq__(self, other):
        """Equal if both are Vectors with the same components."""
        return isinstance(other, Vector) and self.components == other.components

    def _check(self, other):
        if len(self) != len(other):
            raise ValueError(f"length mismatch: {len(self)} vs {len(other)}")

    def __add__(self, other):
        """Element-wise sum. Different lengths raise ValueError."""
        self._check(other)
        return Vector(*(a + b for a, b in zip(self.components, other.components)))

    def __sub__(self, other):
        """Element-wise difference. Different lengths raise ValueError."""
        self._check(other)
        return Vector(*(a - b for a, b in zip(self.components, other.components)))

    def __mul__(self, scalar):
        """v * 3 -> each component times 3."""
        return Vector(*(c * scalar for c in self.components))

    def dot(self, other):
        """Sum of products of components. Different lengths raise ValueError."""
        self._check(other)
        return sum(a * b for a, b in zip(self.components, other.components))

    def norm(self):
        """Length: square root of v.dot(v)."""
        return math.sqrt(self.dot(self))
```

</details>

**Done when:** `python ai90.py check 13` is all green → tick Day 13 in the tracker.

---

[← Day 12](day12-comprehensions-generators-lambda.md) · [All 90 days](README.md) · [Day 14 →](day14-dataclasses-type-hints-testing.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
