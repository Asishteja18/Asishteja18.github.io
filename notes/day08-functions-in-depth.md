# Day 8 — Functions in depth

> **AI-90** · Block 1 · Python + automation + real data · Day 8 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 8`)

[← Day 7](day07-project-cli-expense-tracker.md) · [All 90 days](README.md) · [Day 9 →](day09-files-csv-and-json.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 make_multiplier(3) ──▶ returns a function that remembers n=3
 triple = make_multiplier(3)
 triple(5) ─▶ 15           functions are values: pass them, return them
 apply_n_times(f, x, n):  x ─f─▶ ─f─▶ ─f─▶ result
```

**Goal:** write functions that are flexible and reusable. In Phase 5, a neural-network layer is just a function you call over and over.

#### 1. Defaults and keyword arguments

```python
def power(base, exp=2):
    return base ** exp

power(3)          # 9
power(2, 5)       # 32
power(2, exp=5)   # 32 — keyword: clearer at the call site
```

Never use a mutable default like `def f(items=[])` — the same list is shared between calls. Use `items=None` and create it inside.

#### 2. *args and **kwargs

```python
def mean(*nums):          # nums is a tuple of all positional args
    return sum(nums) / len(nums)

def show(**opts):         # opts is a dict of all keyword args
    for k, v in opts.items():
        print(k, v)

mean(1, 2, 3)
show(lr=0.01, epochs=5)
mean(*[4, 6])             # * unpacks a list into positional args
```

You'll see `**kwargs` everywhere in ML libraries — e.g. passing hyperparameters through.

#### 3. Return vs print, one more time

A function that prints can't be reused. Return the value; let the caller decide.

#### 4. Scope

Variables made inside a function stay inside it. A function can **read** outer variables but should get what it needs through parameters.

#### 5. Functions are values

You can pass a function into another, and return one from another.

```python
def apply_twice(f, x):
    return f(f(x))

apply_twice(str.upper, "hi")

def make_adder(n):
    def add(x):
        return x + n      # remembers n — this is a "closure"
    return add

add5 = make_adder(5)
add5(10)   # 15
```

Optimisers, activation functions and loss functions all get passed around like this.

#### 6. Docstrings

The first string inside a function documents it. `help(power)` shows it. Write one for every function from today on.

#### Exercises

`python ai90.py check 8`. Then refactor your Day 7 `main()` — pull each menu action into its own small function.

#### Your task — write `ai90/work/day08.py` with: `power`, `mean`, `build_url`, `make_multiplier`, `apply_n_times`, `safe_divide`

#### Tests

```python
# file: test_day08.py
import day08 as ex


def test_power():
    assert ex.power(3) == 9
    assert ex.power(2, exp=5) == 32
    assert ex.power(2, 0) == 1


def test_mean():
    assert ex.mean(1, 2, 3) == 2.0
    assert ex.mean() == 0.0
    assert ex.mean(*[10, 20]) == 15.0


def test_build_url():
    assert ex.build_url("https://x.com/s", q="ai", page=2) == "https://x.com/s?page=2&q=ai"
    assert ex.build_url("https://x.com") == "https://x.com"


def test_make_multiplier():
    triple = ex.make_multiplier(3)
    assert triple(5) == 15
    assert ex.make_multiplier(0)(99) == 0


def test_apply_n_times():
    assert ex.apply_n_times(lambda v: v * 2, 1, 3) == 8
    assert ex.apply_n_times(str.upper, "ai", 1) == "AI"
    assert ex.apply_n_times(lambda v: v + 1, 0, 0) == 0


def test_safe_divide():
    assert ex.safe_divide(6, 3) == 2.0
    assert ex.safe_divide(1, 0) is None
    assert ex.safe_divide(1, 0, default=0) == 0
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day08.py
"""Day 8 — functions in depth."""


def power(base, exp=2):
    """base ** exp, exp defaults to 2. power(3) -> 9, power(2, exp=5) -> 32"""
    return base ** exp


def mean(*nums):
    """Mean of any number of positional args; 0.0 if none. mean(1, 2, 3) -> 2.0"""
    return sum(nums) / len(nums) if nums else 0.0


def build_url(base, **params):
    """Append query params sorted by key. build_url('https://x.com/s', q='ai', page=2)
    -> 'https://x.com/s?page=2&q=ai'. No params -> base unchanged."""
    if not params:
        return base
    query = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return f"{base}?{query}"


def make_multiplier(n):
    """Return a function that multiplies its input by n. make_multiplier(3)(5) -> 15"""
    def multiply(x):
        return x * n
    return multiply


def apply_n_times(f, x, n):
    """Apply f to x, n times. apply_n_times(lambda v: v * 2, 1, 3) -> 8"""
    for _ in range(n):
        x = f(x)
    return x


def safe_divide(a, b, default=None):
    """a / b, or `default` when b is 0."""
    return default if b == 0 else a / b
```

</details>

**Done when:** `python ai90.py check 8` is all green → tick Day 8 in the tracker.

---

[← Day 7](day07-project-cli-expense-tracker.md) · [All 90 days](README.md) · [Day 9 →](day09-files-csv-and-json.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
