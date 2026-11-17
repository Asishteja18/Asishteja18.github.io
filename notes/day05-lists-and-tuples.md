# Day 5 — Lists and tuples

> **AI-90** · Block 1 · Python + automation + real data · Day 5 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 5`)

[← Day 4](day04-loops.md) · [All 90 days](README.md) · [Day 6 →](day06-dicts-and-sets.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 chunk(items, 2)   = mini-batches, exactly what a DataLoader does
 [1, 2, 3, 4, 5]
  └─┬─┘ └─┬─┘ └┘
  [1,2] [3,4] [5]
 running_mean([2,4,6]) → [2.0, 3.0, 4.0]
```

**Goal:** hold many values and work through them. Datasets, batches and model weights all start life as lists.

#### 1. Lists

```python
nums = [3, 1, 4]
nums.append(1)        # [3, 1, 4, 1]
nums.extend([5, 9])   # [3, 1, 4, 1, 5, 9]
nums[0] = 10          # lists ARE mutable
len(nums)             # 6
4 in nums             # True
nums.pop()            # removes and returns the last item
```

Slicing works exactly like strings: `nums[1:3]`, `nums[-2:]`, `nums[::-1]`.

#### 2. sorted vs .sort

```python
data = [5, 1, 9]
sorted(data)              # [1, 5, 9]  — NEW list, data unchanged
sorted(data, reverse=True)
data.sort()               # sorts data IN PLACE, returns None
```

If a function shouldn't change its input, use `sorted()` or slice a copy (`data[:]`).

#### 3. Tuples

Like lists but **immutable** — good for fixed records and returning several values.

```python
point = (3, 4)
x, y = point          # unpacking
def stats(nums):
    return min(nums), max(nums)   # returns a tuple
lo, hi = stats([2, 8, 5])
```

#### 4. zip and enumerate

```python
names = ["a", "b"]; scores = [90, 75]
for name, score in zip(names, scores):
    print(name, score)

for i, x in enumerate(nums, start=1):   # counting from 1
    ...
```

#### 5. Batching with range steps

ML trains on **mini-batches**. A step in `range` + slicing does it:

```python
items = list(range(7))
[items[i:i + 3] for i in range(0, len(items), 3)]   # [[0,1,2],[3,4,5],[6]]
```

(That `[... for ...]` is a list comprehension — Day 12 covers it properly. A plain loop with `append` works too.)

#### Exercises

`python ai90.py check 5`. `running_mean` is how you'll smooth noisy loss curves; `chunk` is your first data loader.

#### Your task — write `ai90/work/day05.py` with: `running_mean`, `top_k`, `flatten`, `chunk`, `dedupe`, `min_max`

#### Tests

```python
# file: test_day05.py
import day05 as ex


def test_running_mean():
    assert ex.running_mean([2, 4, 6]) == [2.0, 3.0, 4.0]
    assert ex.running_mean([]) == []


def test_top_k():
    data = [5, 1, 9, 3, 7]
    assert ex.top_k(data, 2) == [9, 7]
    assert data == [5, 1, 9, 3, 7], "input list must not change"
    assert ex.top_k(data, 10) == [9, 7, 5, 3, 1]


def test_flatten():
    assert ex.flatten([[1, 2], [3], []]) == [1, 2, 3]
    assert ex.flatten([]) == []


def test_chunk():
    assert ex.chunk([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]
    assert ex.chunk([1, 2, 3], 3) == [[1, 2, 3]]
    assert ex.chunk([], 4) == []


def test_dedupe():
    assert ex.dedupe([3, 1, 3, 2, 1]) == [3, 1, 2]
    assert ex.dedupe(list("banana")) == ["b", "a", "n"]


def test_min_max():
    assert ex.min_max([4, -2, 9, 0]) == (-2, 9)
    assert ex.min_max([7]) == (7, 7)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day05.py
"""Day 5 — lists and tuples."""


def running_mean(nums):
    """Mean of everything seen so far. running_mean([2, 4, 6]) -> [2.0, 3.0, 4.0]"""
    out, total = [], 0
    for i, x in enumerate(nums, start=1):
        total += x
        out.append(total / i)
    return out


def top_k(nums, k):
    """The k largest values, biggest first. Do not change the input list."""
    return sorted(nums, reverse=True)[:k]


def flatten(nested):
    """Flatten one level. flatten([[1, 2], [3], []]) -> [1, 2, 3]"""
    out = []
    for inner in nested:
        out.extend(inner)
    return out


def chunk(items, size):
    """Split into batches of `size`; the last may be shorter. chunk([1,2,3,4,5], 2) -> [[1,2],[3,4],[5]]"""
    return [items[i:i + size] for i in range(0, len(items), size)]


def dedupe(items):
    """Remove duplicates, keeping the first occurrence order."""
    seen, out = [], []
    for x in items:
        if x not in seen:
            seen.append(x)
            out.append(x)
    return out


def min_max(nums):
    """Return (smallest, largest) as a tuple without using min() or max()."""
    lo = hi = nums[0]
    for x in nums[1:]:
        if x < lo:
            lo = x
        if x > hi:
            hi = x
    return (lo, hi)
```

</details>

**Done when:** `python ai90.py check 5` is all green → tick Day 5 in the tracker.

---

[← Day 4](day04-loops.md) · [All 90 days](README.md) · [Day 6 →](day06-dicts-and-sets.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
