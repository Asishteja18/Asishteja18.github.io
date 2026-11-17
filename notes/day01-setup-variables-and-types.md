# Day 1 — Setup, variables and types

> **AI-90** · Block 1 · Python + automation + real data · Day 1 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 1`)

[All 90 days](README.md) · [Day 2 →](day02-strings.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 name        value      type
 ┌──────┐   ┌───────┐
 │ age  │──▶│  24   │   int
 │ price│──▶│ 3.50  │   float
 │ name │──▶│"Asish"│   str
 └──────┘   └───────┘
 3723 s ─┬─ // 3600 ──▶ 1 h
         ├─ %3600 //60 ▶ 2 min      f"{1:02}:{2:02}:{3:02}" ─▶ "01:02:03"
         └─ % 60 ──────▶ 3 s
```

**Goal:** get Python running, then store values in variables and turn them into readable text.

#### 1. Setup (30 min)

1. Install Python 3.13 or 3.14 from python.org (tick "Add to PATH" on Windows).
2. Install VS Code and its Python extension.
3. Check it works: open a terminal and run `python --version`.
4. Create a GitHub repo called `ai-90`, clone it, and copy this starter pack in.

#### 2. REPL vs script

Typing `python` opens the **REPL** — you type a line, it answers straight away. Great for testing ideas. A **script** is a `.py` file you run with `python file.py`. Real work lives in scripts.

#### 3. Variables and types

A variable is a name pointing at a value. Python works out the type for you.

```python
age = 24            # int   — whole number
price = 3.50        # float — decimal number
name = "Asish"      # str   — text
is_student = True   # bool  — True / False

print(type(price))  # <class 'float'>
```

Maths works as you'd expect, plus three you'll use constantly:

```python
7 / 2    # 3.5  — true division, always a float
7 // 2   # 3    — floor division, drops the remainder
7 % 2    # 1    — remainder (modulo)
2 ** 10  # 1024 — power
```

`//` and `%` together split a number into parts — that's how you turn 3723 seconds into 1 hour, 2 minutes, 3 seconds.

#### 4. f-strings

Put `f` before a string and drop variables inside `{}`:

```python
name = "Asish"
print(f"Hello, {name}!")           # Hello, Asish!
print(f"{3.14159:.2f}")            # 3.14   — 2 decimal places
print(f"{7:02}")                   # 07     — pad to width 2 with zeros
```

#### 5. return vs print

Exercises ask you to **return** a value, not print it. `print` shows it on screen; `return` hands it back so other code (and the checker) can use it.

#### Exercises

Open `day01.py`, replace each `raise NotImplementedError` with your code, then run:

```
python ai90.py check 1
```

Green = done. Yellow = not started. Red = wrong answer — read the message and try again.

**Bonus (automation):** write `convert.py` that asks for a temperature with `input()` and prints both units. Note `input()` always gives you a `str` — convert with `float()`.

#### Your task — write `ai90/work/day01.py` with: `c_to_f`, `greet`, `circle_area`, `seconds_to_hms`, `describe`

#### Tests

```python
# file: test_day01.py
import day01 as ex


def test_c_to_f():
    assert ex.c_to_f(100) == 212.0
    assert ex.c_to_f(0) == 32.0
    assert ex.c_to_f(-40) == -40.0


def test_greet():
    assert ex.greet("Asish") == "Hello, Asish!"
    assert ex.greet("world") == "Hello, world!"


def test_circle_area():
    assert ex.circle_area(2) == 12.57
    assert ex.circle_area(0) == 0


def test_seconds_to_hms():
    assert ex.seconds_to_hms(3723) == "01:02:03"
    assert ex.seconds_to_hms(59) == "00:00:59"
    assert ex.seconds_to_hms(86399) == "23:59:59"


def test_describe():
    assert ex.describe(3.0) == "float"
    assert ex.describe(3) == "int"
    assert ex.describe("3") == "str"
    assert ex.describe(True) == "bool"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day01.py
"""Day 1 — variables, types, f-strings."""


def c_to_f(celsius):
    """Convert Celsius to Fahrenheit. c_to_f(100) -> 212.0"""
    return celsius * 9 / 5 + 32


def greet(name):
    """Return 'Hello, <name>!' using an f-string. greet('Asish') -> 'Hello, Asish!'"""
    return f"Hello, {name}!"


def circle_area(radius):
    """Area of a circle rounded to 2 decimals. Use 3.14159 for pi. circle_area(2) -> 12.57"""
    return round(3.14159 * radius ** 2, 2)


def seconds_to_hms(total_seconds):
    """Format seconds as HH:MM:SS with zero padding. seconds_to_hms(3723) -> '01:02:03'"""
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02}:{minutes:02}:{seconds:02}"


def describe(value):
    """Return the type name of value as a string. describe(3.0) -> 'float'"""
    return type(value).__name__
```

</details>

**Done when:** `python ai90.py check 1` is all green → tick Day 1 in the tracker.

---

[All 90 days](README.md) · [Day 2 →](day02-strings.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
