# Day 15 — Capstone: Matrix library

> **AI-90** · Block 1 · Python + automation + real data · Day 15 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 15`)

[← Day 14](day14-dataclasses-type-hints-testing.md) · [All 90 days](README.md) · [Day 16 →](day16-cli-tools-argparse-and-logging.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
  x (1×3)        W (3×2)            x@W (1×2)     ReLU
 [1, -2, .5]  @ [[ .2, .5],    =  [-0.9, 1.15]  → [0.0, 1.15]
                [ .4,-.1],
                [-.6, .9]]
 shape rule: (a×b) @ (b×c) → (a×c)   ← a neural-network layer
```

**Goal:** build the data structure every neural network runs on, using only what you learned in Phase 1. When you finish, you've written a working neural-network layer in pure Python.

#### Why matrices?

A layer of a neural network takes an input row and multiplies it by a weight matrix:

```
inputs (1 x 3)  @  weights (3 x 2)  =  outputs (1 x 2)
```

Each output is a dot product (Day 13) of the input with one column of weights. Do that for many neurons at once and you have matrix multiplication.

#### Shapes

A matrix with 2 rows and 3 columns has shape `(2, 3)`. The rule for `A @ B`:

```
(a x b) @ (b x c) -> (a x c)     inner sizes must match
```

Getting shapes right is 80% of debugging in deep learning. Your library must raise a clear `ValueError` when they don't match.

#### The operations

**Transpose** — rows become columns. `zip(*rows)` does it in one line: it pairs up the 1st items of each row, then the 2nd items, and so on.

**Matmul** — element `[i, j]` of the result = row `i` of A · column `j` of B:

```
[1 2]   [5 6]   [1·5+2·7  1·6+2·8]   [19 22]
[3 4] @ [7 8] = [3·5+4·7  3·6+4·8] = [43 50]
```

Trick: transpose B first, so its columns become easy-to-loop rows.

**apply** — run a function on every element. With `relu = lambda x: max(0, x)` that's an activation function.

#### Python features you'll use

- `@classmethod` — `Matrix.identity(3)` builds a new matrix without an existing one. `cls` is the class itself.
- `@property` — `m.shape` looks like an attribute but runs a method.
- `__matmul__` — makes the `@` operator work (exactly what NumPy uses).
- `__getitem__` with a tuple — `m[1, 0]` passes `(1, 0)` as one argument.
- Copy the input rows in `__init__` so outside changes can't corrupt your matrix.

#### Steps

1. `__init__` + validation + `shape` → run `python ai90.py check 15`, watch the first tests go green.
2. `__repr__`, `__eq__`, `__getitem__`.
3. `zeros`, `identity`, `transpose`.
4. `__add__`, `__mul__`.
5. `__matmul__` — the big one.
6. `apply`, then look at `test_tiny_neural_layer`: that's a real forward pass.

#### Finish Phase 1

- Push `ai-90` to GitHub with a README: what's in Phase 1 and a screenshot of all checks green.
- DEVLOG: Phase 1 retro — hardest day, what clicked, what to revisit.
- Run `python check.py` with no number — every day 1–15 should be green.

Next: Phase 2, automation — making Python do real work on its own.

#### Your task — write `ai90/work/day15.py` with: `Matrix`

#### Tests

```python
# file: test_day15.py
from day15 import Matrix


def raises(func, exc=ValueError):
    try:
        func()
    except exc:
        return
    raise AssertionError(f"expected {exc.__name__}")


A = [[1, 2], [3, 4]]


def test_create_and_validate():
    m = Matrix(A)
    assert m.rows == [[1.0, 2.0], [3.0, 4.0]]
    assert m.shape == (2, 2)
    assert Matrix([[1, 2, 3]]).shape == (1, 3)
    raises(lambda: Matrix([]))
    raises(lambda: Matrix([[1, 2], [3]]))


def test_does_not_share_input():
    src = [[1, 2]]
    m = Matrix(src)
    src[0][0] = 99
    assert m[0, 0] == 1.0


def test_repr_eq_getitem():
    m = Matrix(A)
    assert repr(m) == "Matrix([[1.0, 2.0], [3.0, 4.0]])"
    assert m == Matrix(A) and m != Matrix([[1, 2]])
    assert m[1, 0] == 3.0


def test_zeros_identity():
    assert Matrix.zeros(2, 3).rows == [[0.0] * 3] * 2
    assert Matrix.identity(3)[1, 1] == 1.0 and Matrix.identity(3)[0, 2] == 0.0


def test_transpose():
    assert Matrix([[1, 2, 3], [4, 5, 6]]).transpose() == Matrix([[1, 4], [2, 5], [3, 6]])


def test_add_and_scale():
    assert Matrix(A) + Matrix(A) == Matrix(A) * 2
    raises(lambda: Matrix(A) + Matrix([[1, 2, 3]]))


def test_matmul():
    m = Matrix(A)
    assert m @ Matrix([[5, 6], [7, 8]]) == Matrix([[19, 22], [43, 50]])
    assert m @ Matrix.identity(2) == m
    assert (Matrix([[1, 2, 3]]) @ Matrix([[1], [1], [1]])).rows == [[6.0]]
    raises(lambda: m @ Matrix([[1, 2, 3]]))


def test_apply_relu():
    relu = lambda x: max(0.0, x)  # noqa: E731
    assert Matrix([[-1, 2], [3, -4]]).apply(relu) == Matrix([[0, 2], [3, 0]])


def test_tiny_neural_layer():
    # one dense layer: inputs (1x3) @ weights (3x2), then ReLU — a real neural-network forward pass
    x = Matrix([[1.0, -2.0, 0.5]])
    w = Matrix([[0.2, 0.5], [0.4, -0.1], [-0.6, 0.9]])
    out = (x @ w).apply(lambda v: round(max(0.0, v), 4))
    assert out.shape == (1, 2)
    assert out == Matrix([[0.0, 1.15]])  # neuron 1 is switched off by ReLU, neuron 2 fires
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day15.py
"""Day 15 — Capstone: a pure-Python Matrix library.

This is the same maths NumPy and PyTorch do — just slower. On Day 27 you'll extend
it and on Day 28 race it against NumPy.
"""


class Matrix:
    """A 2-D matrix stored as a list of row lists. Matrix([[1, 2], [3, 4]])"""

    def __init__(self, rows):
        """Copy rows as floats. Empty matrices or ragged rows (different lengths) raise ValueError."""
        if not rows or not rows[0]:
            raise ValueError("matrix must have at least one row and column")
        width = len(rows[0])
        if any(len(r) != width for r in rows):
            raise ValueError("all rows must have the same length")
        self.rows = [[float(x) for x in r] for r in rows]

    @property
    def shape(self):
        """(number of rows, number of columns)"""
        return (len(self.rows), len(self.rows[0]))

    def __repr__(self):
        """Matrix([[1.0, 2.0], [3.0, 4.0]])"""
        return f"Matrix({self.rows})"

    def __eq__(self, other):
        """Equal if other is a Matrix with identical rows."""
        return isinstance(other, Matrix) and self.rows == other.rows

    def __getitem__(self, ij):
        """m[i, j] -> the element at row i, column j."""
        i, j = ij
        return self.rows[i][j]

    @classmethod
    def zeros(cls, n_rows, n_cols):
        """An n_rows x n_cols matrix of 0.0."""
        return cls([[0.0] * n_cols for _ in range(n_rows)])

    @classmethod
    def identity(cls, n):
        """n x n identity: 1.0 on the diagonal, 0.0 elsewhere."""
        return cls([[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)])

    def transpose(self):
        """Rows become columns."""
        return Matrix([list(col) for col in zip(*self.rows)])

    def __add__(self, other):
        """Element-wise sum. Different shapes raise ValueError."""
        if self.shape != other.shape:
            raise ValueError(f"shape mismatch: {self.shape} vs {other.shape}")
        return Matrix([[a + b for a, b in zip(r1, r2)] for r1, r2 in zip(self.rows, other.rows)])

    def __mul__(self, scalar):
        """m * 2 -> every element times 2."""
        return Matrix([[x * scalar for x in r] for r in self.rows])

    def __matmul__(self, other):
        """Matrix product self @ other. (a x b) @ (b x c) -> (a x c); inner sizes must match
        or raise ValueError."""
        if self.shape[1] != other.shape[0]:
            raise ValueError(f"cannot multiply {self.shape} by {other.shape}")
        cols = other.transpose().rows
        return Matrix([[sum(a * b for a, b in zip(row, col)) for col in cols] for row in self.rows])

    def apply(self, func):
        """New matrix with func applied to every element (e.g. an activation function)."""
        return Matrix([[func(x) for x in r] for r in self.rows])
```

</details>

**Done when:** `python ai90.py check 15` is all green → tick Day 15 in the tracker.

---

[← Day 14](day14-dataclasses-type-hints-testing.md) · [All 90 days](README.md) · [Day 16 →](day16-cli-tools-argparse-and-logging.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
