# Day 10 — Errors and debugging

> **AI-90** · Block 1 · Python + automation + real data · Day 10 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 10`)

[← Day 9](day09-files-csv-and-json.md) · [All 90 days](README.md) · [Day 11 →](day11-modules-and-the-standard-library.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 Traceback (most recent call last):     ← read BOTTOM-UP
   File "app.py", line 8, in <module>   ← where
     total += int(row["age"])           ← the line
 ValueError: invalid literal ... 'old'  ← what + which value
 retry: try ✗ ─wait 1s─ try ✗ ─wait 2s─ try ✓
```

**Goal:** stop scripts crashing on bad data, and find bugs fast. Automation that runs while you sleep must survive junk input.

#### 1. Reading a traceback

Read it **bottom-up**: the last line is the error type and message; the lines above show where it happened, most recent call last.

```
Traceback (most recent call last):
  File "app.py", line 8, in <module>
    total += int(row["age"])
ValueError: invalid literal for int() with base 10: 'old'
```

→ line 8, `int()` got `'old'`.

#### 2. try / except

```python
try:
    age = int(text)
except ValueError:
    age = None
```

Catch the **specific** error you expect. A bare `except:` hides real bugs.

Several at once: `except (ValueError, TypeError):`

#### 3. else and finally

```python
try:
    f = open(path)
except FileNotFoundError:
    print("missing")
else:
    data = f.read()     # only runs if no error
finally:
    print("always runs")  # cleanup
```

#### 4. Raising your own errors

```python
if age < 0:
    raise ValueError(f"age can't be negative: {age}")
```

A good message says **what** was wrong and **what value** caused it. `{x!r}` shows the value with quotes, so blanks and spaces are visible.

#### 5. The retry pattern

Networks fail. Automation retries:

```python
for attempt in range(3):
    try:
        return fetch()
    except ConnectionError:
        time.sleep(2 ** attempt)   # back off: 1s, 2s, 4s
```

You'll use this on Day 19 with real APIs.

#### 6. Debugging toolkit

- `print(f"{x=}")` prints `x=42` — quick and fine.
- `breakpoint()` drops you into the debugger: `n` next line, `s` step in, `p x` print, `c` continue.
- VS Code: click left of a line number to set a breakpoint, then F5.

#### Exercises

`python ai90.py check 10`.

#### Your task — write `ai90/work/day10.py` with: `to_number`, `safe_get`, `parse_record`, `average_valid`, `retry`

#### Tests

```python
# file: test_day10.py
import day10 as ex


def raises(func, exc=ValueError):
    try:
        func()
    except exc as e:
        return e
    raise AssertionError(f"expected {exc.__name__}")


def test_to_number():
    assert ex.to_number("3") == 3 and isinstance(ex.to_number("3"), int)
    assert ex.to_number("2.5") == 2.5
    assert ex.to_number("abc") is None
    assert ex.to_number(None, default=0) == 0


def test_safe_get():
    assert ex.safe_get([1, 2, 3], 1) == 2
    assert ex.safe_get([1, 2, 3], 10) is None
    assert ex.safe_get([], 0, default="x") == "x"


def test_parse_record_ok():
    assert ex.parse_record("Asish, 24") == {"name": "Asish", "age": 24}


def test_parse_record_errors():
    assert "2 fields" in str(raises(lambda: ex.parse_record("a,b,c")))
    assert "blank" in str(raises(lambda: ex.parse_record(" ,24")))
    assert "whole number" in str(raises(lambda: ex.parse_record("Sam,old")))
    assert "range" in str(raises(lambda: ex.parse_record("Sam,200")))


def test_average_valid():
    assert ex.average_valid(["1", "2", "x", None, "3"]) == (2.0, 2)
    assert ex.average_valid(["?"]) == (None, 1)


def test_retry():
    calls = []

    def flaky():
        calls.append(1)
        if len(calls) < 3:
            raise ConnectionError("down")
        return "ok"

    assert ex.retry(flaky, 5) == "ok"
    assert len(calls) == 3
    calls.clear()
    raises(lambda: ex.retry(flaky, 2), ConnectionError)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day10.py
"""Day 10 — errors and debugging."""


def to_number(text, default=None):
    """int if it looks like an int, else float, else `default`. to_number('3') -> 3, to_number('2.5') -> 2.5"""
    try:
        return int(text)
    except (ValueError, TypeError):
        pass
    try:
        return float(text)
    except (ValueError, TypeError):
        return default


def safe_get(items, index, default=None):
    """items[index], or default if the index is out of range."""
    try:
        return items[index]
    except IndexError:
        return default


def parse_record(line):
    """'name,age' -> {'name': 'Asish', 'age': 24}. Raise ValueError with a helpful message
    if there aren't exactly 2 fields, the name is blank, or age isn't a whole number 0-150."""
    parts = [p.strip() for p in line.split(",")]
    if len(parts) != 2:
        raise ValueError(f"expected 2 fields, got {len(parts)}: {line!r}")
    name, age_text = parts
    if not name:
        raise ValueError("name is blank")
    try:
        age = int(age_text)
    except ValueError:
        raise ValueError(f"age is not a whole number: {age_text!r}") from None
    if not 0 <= age <= 150:
        raise ValueError(f"age out of range: {age}")
    return {"name": name, "age": age}


def average_valid(values):
    """Average of entries that convert to float; return (average or None, count of bad entries)."""
    good, bad = [], 0
    for v in values:
        try:
            good.append(float(v))
        except (ValueError, TypeError):
            bad += 1
    return (sum(good) / len(good) if good else None, bad)


def retry(func, attempts):
    """Call func() up to `attempts` times; return the first success. If every try raises,
    re-raise the last exception."""
    last = None
    for _ in range(attempts):
        try:
            return func()
        except Exception as e:  # noqa: BLE001
            last = e
    raise last
```

</details>

**Done when:** `python ai90.py check 10` is all green → tick Day 10 in the tracker.

---

[← Day 9](day09-files-csv-and-json.md) · [All 90 days](README.md) · [Day 11 →](day11-modules-and-the-standard-library.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
