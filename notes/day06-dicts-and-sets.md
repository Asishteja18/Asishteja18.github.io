# Day 6 — Dicts and sets

> **AI-90** · Block 1 · Python + automation + real data · Day 6 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 6`)

[← Day 5](day05-lists-and-tuples.md) · [All 90 days](README.md) · [Day 7 →](day07-project-cli-expense-tracker.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 word_freq("the cat. the hat!")
 ┌────────┬───────┐
 │ key    │ count │      vocab = {word: id}   ← a tokenizer is this dict
 ├────────┼───────┤
 │ "the"  │   2   │
 │ "cat"  │   1   │
 │ "hat"  │   1   │
 └────────┴───────┘
```

**Goal:** look things up by name instead of position. A tokenizer's vocabulary is literally a dict from word to number.

#### 1. Dicts

```python
ages = {"asish": 24, "sam": 30}
ages["asish"]            # 24
ages["new"] = 19         # add / overwrite
"sam" in ages            # True — checks KEYS
ages.get("bob")          # None  — no crash if missing
ages.get("bob", 0)       # 0     — your default
del ages["sam"]
```

#### 2. Looping

```python
for name in ages:                 # keys
for name, age in ages.items():    # key + value pairs
for age in ages.values():
```

#### 3. Counting — the pattern you'll use most

```python
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
```

`collections.Counter` does this in one line — but write it by hand first so you know what it does.

#### 4. Grouping

`setdefault` returns the existing list, or creates an empty one first:

```python
groups = {}
for name in files:
    ext = name.rsplit(".", 1)[-1]
    groups.setdefault(ext, []).append(name)
```

#### 5. Sorting a dict by value

```python
sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
# tie-break alphabetically: key=lambda p: (-p[1], p[0])
```

`lambda p: ...` is a tiny inline function. Day 12 explains it; for now read it as "sort by this".

#### 6. Sets

Unordered, no duplicates, very fast `in` checks.

```python
a = {1, 2, 3}; b = {2, 3, 4}
a & b    # {2, 3}  intersection
a | b    # {1, 2, 3, 4} union
a - b    # {1}
set([1, 1, 2])   # {1, 2} — instant dedupe (loses order)
```

#### Exercises

`python ai90.py check 6`. `group_by_extension` plus Day 3's `file_category` = the core of an automatic file organiser.

**Hint:** `"photo.jpg".rsplit(".", 1)` → `['photo', 'jpg']` — splits at the **last** dot only.

#### Your task — write `ai90/work/day06.py` with: `word_freq`, `most_common`, `group_by_extension`, `invert`, `common_items`, `has_duplicates`

#### Tests

```python
# file: test_day06.py
import day06 as ex


def test_word_freq():
    assert ex.word_freq("The cat. the hat!") == {"the": 2, "cat": 1, "hat": 1}
    assert ex.word_freq("") == {}


def test_most_common():
    text = "b a c a b a"
    assert ex.most_common(text, 2) == [("a", 3), ("b", 2)]
    assert ex.most_common("z y x", 2) == [("x", 1), ("y", 1)]


def test_group_by_extension():
    files = ["cv.pdf", "pic.JPG", "notes.txt", "scan.PDF", "Makefile"]
    assert ex.group_by_extension(files) == {
        ".pdf": ["cv.pdf", "scan.PDF"],
        ".jpg": ["pic.JPG"],
        ".txt": ["notes.txt"],
        "": ["Makefile"],
    }


def test_invert():
    assert ex.invert({"a": 1, "b": 2}) == {1: "a", 2: "b"}


def test_common_items():
    assert ex.common_items([3, 1, 2, 2], [2, 3, 5]) == [2, 3]


def test_has_duplicates():
    assert ex.has_duplicates([1, 2, 1]) is True
    assert ex.has_duplicates("abc") is False
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day06.py
"""Day 6 — dicts and sets."""

PUNCTUATION = ".,!?;:\"'()"


def word_freq(text):
    """Count words, lowercased, with .,!?;:"'() stripped from each word's ends.
    word_freq('The cat. the hat!') -> {'the': 2, 'cat': 1, 'hat': 1}"""
    counts = {}
    for raw in text.split():
        word = raw.strip(PUNCTUATION).lower()
        if word:
            counts[word] = counts.get(word, 0) + 1
    return counts


def most_common(text, n):
    """Top n (word, count) pairs: highest count first, ties alphabetical."""
    pairs = word_freq(text).items()
    return sorted(pairs, key=lambda p: (-p[1], p[0]))[:n]


def group_by_extension(filenames):
    """{'.pdf': ['a.pdf', ...], ...}; lowercase extension; files with no '.' go under ''."""
    groups = {}
    for name in filenames:
        ext = "." + name.rsplit(".", 1)[1].lower() if "." in name else ""
        groups.setdefault(ext, []).append(name)
    return groups


def invert(d):
    """Swap keys and values. invert({'a': 1, 'b': 2}) -> {1: 'a', 2: 'b'}"""
    return {v: k for k, v in d.items()}


def common_items(a, b):
    """Items in both lists, sorted, no duplicates."""
    return sorted(set(a) & set(b))


def has_duplicates(items):
    """True if any item appears twice."""
    return len(set(items)) != len(items)
```

</details>

**Done when:** `python ai90.py check 6` is all green → tick Day 6 in the tracker.

---

[← Day 5](day05-lists-and-tuples.md) · [All 90 days](README.md) · [Day 7 →](day07-project-cli-expense-tracker.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
