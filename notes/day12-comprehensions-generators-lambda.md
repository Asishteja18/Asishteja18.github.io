# Day 12 — Comprehensions, generators, lambda

> **AI-90** · Block 1 · Python + automation + real data · Day 12 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 12`)

[← Day 11](day11-modules-and-the-standard-library.md) · [All 90 days](README.md) · [Day 13 →](day13-classes-a-vector.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 [x*x for x in nums if x % 2 == 0]
   │        │            └── filter
   │        └── loop
   └── output
 generator: yields one batch at a time → memory stays flat
 list:   ████████████████ all in RAM
 gen:    █ → █ → █ → █
```

**Goal:** write data transformations in one clear line, and stream data without loading it all into memory.

#### 1. List comprehensions

```python
squares = [x * x for x in range(5)]               # [0, 1, 4, 9, 16]
evens   = [x for x in nums if x % 2 == 0]          # filter
labels  = ["pos" if s > 0 else "neg" for s in scores]   # if/else goes BEFORE for
```

Read it as: *"give me `x * x`, for each `x` in range(5)"*. Same result as a loop with `append`, in one line.

#### 2. Dict and set comprehensions

```python
lengths = {w: len(w) for w in words}
vocab   = {w.lower() for w in words}           # set — unique
index   = {w: i for i, w in enumerate(sorted(vocab))}   # word -> id: a tokenizer vocab!
```

#### 3. When NOT to use one

If it needs more than one `if` or nested loops, write a normal loop. Readability wins.

#### 4. Generators and `yield`

A generator produces values one at a time, on demand:

```python
def read_big_file(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.strip()

for line in read_big_file("huge.txt"):   # never holds the whole file in memory
    ...
```

Generator expression: `sum(x * x for x in range(10**6))` — round brackets, no list built.

PyTorch's DataLoader is a generator of batches. Today's `batches()` exercise is your own version.

#### 5. lambda and key functions

```python
sorted(words, key=len)                         # by length
sorted(people, key=lambda p: p["age"])         # by a field
sorted(people, key=lambda p: (-p["age"], p["name"]))   # age desc, then name
max(scores.items(), key=lambda kv: kv[1])      # dict entry with highest value
```

A tuple key sorts by the first item, then breaks ties with the next. Negating a number flips its order.

#### Exercises

`python ai90.py check 12`. `min_max_scale` is real ML preprocessing — you'll write the NumPy version on Day 34.

#### Your task — write `ai90/work/day12.py` with: `squares_of_evens`, `word_lengths`, `min_max_scale`, `batches`, `sort_people`, `clean_tokens`

#### Tests

```python
# file: test_day12.py
import inspect

import day12 as ex


def test_squares_of_evens():
    assert ex.squares_of_evens([1, 2, 3, 4]) == [4, 16]
    assert ex.squares_of_evens([]) == []


def test_word_lengths():
    assert ex.word_lengths(["ai", "robot"]) == {"ai": 2, "robot": 5}


def test_min_max_scale():
    assert ex.min_max_scale([10, 20, 30]) == [0.0, 0.5, 1.0]
    assert ex.min_max_scale([1, 2, 4]) == [0.0, 0.333, 1.0]
    assert ex.min_max_scale([5, 5]) == [0.0, 0.0]


def test_batches_is_generator():
    gen = ex.batches([1, 2, 3, 4, 5], 2)
    assert inspect.isgenerator(gen), "use yield"
    assert list(gen) == [[1, 2], [3, 4], [5]]


def test_sort_people():
    people = [{"name": "Zed", "age": 30}, {"name": "Amy", "age": 25}, {"name": "Bob", "age": 30}]
    assert [p["name"] for p in ex.sort_people(people)] == ["Bob", "Zed", "Amy"]


def test_clean_tokens():
    assert ex.clean_tokens("The AI is 2 smart, ok? Robots rule") == ["the", "robots", "rule"]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day12.py
"""Day 12 — comprehensions, generators, lambda. Aim for one line each where it stays readable."""


def squares_of_evens(nums):
    """[x*x for even x]. squares_of_evens([1, 2, 3, 4]) -> [4, 16]"""
    return [x * x for x in nums if x % 2 == 0]


def word_lengths(words):
    """{word: len(word)} using a dict comprehension."""
    return {w: len(w) for w in words}


def min_max_scale(nums):
    """Scale to 0..1: (x - min) / (max - min), rounded to 3 dp. All-equal input -> all 0.0."""
    lo, hi = min(nums), max(nums)
    if lo == hi:
        return [0.0 for _ in nums]
    return [round((x - lo) / (hi - lo), 3) for x in nums]


def batches(items, size):
    """GENERATOR yielding lists of `size` items (last may be shorter). Must use `yield`."""
    for i in range(0, len(items), size):
        yield items[i:i + size]


def sort_people(people):
    """List of dicts with 'name' and 'age': sort by age descending, then name ascending."""
    return sorted(people, key=lambda p: (-p["age"], p["name"]))


def clean_tokens(text):
    """Lowercase words longer than 2 letters, alphabetic only, in order. Use a comprehension."""
    return [w.lower() for w in text.split() if w.isalpha() and len(w) > 2]
```

</details>

**Done when:** `python ai90.py check 12` is all green → tick Day 12 in the tracker.

---

[← Day 11](day11-modules-and-the-standard-library.md) · [All 90 days](README.md) · [Day 13 →](day13-classes-a-vector.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
