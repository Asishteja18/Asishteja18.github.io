# Day 2 — Strings

> **AI-90** · Block 1 · Python + automation + real data · Day 2 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 2`)

[← Day 1](day01-setup-variables-and-types.md) · [All 90 days](README.md) · [Day 3 →](day03-conditionals.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
  index:   0   1   2   3   4   5
           p   y   t   h   o   n
  neg:    -6  -5  -4  -3  -2  -1
  s[0:3] = "pyt"   s[2:] = "thon"   s[::-1] = "nohtyp"
  slugify:  "  My Photos (2026)!! " ─▶ "my-photos-2026"
```

**Goal:** slice, search and reshape text — the raw material for every tokenizer and data-cleaning script you'll write later.

#### 1. Indexing and slicing

A string is a sequence of characters, numbered from 0. Negative numbers count from the end.

```python
s = "python"
s[0]      # 'p'
s[-1]     # 'n'
s[0:3]    # 'pyt'   — start included, end excluded
s[2:]     # 'thon'
s[::-1]   # 'nohtyp' — step -1 reverses
len(s)    # 6
```

#### 2. Strings are immutable

You can't change a character in place (`s[0] = "P"` fails). You build a **new** string instead: `"P" + s[1:]`.

#### 3. Methods you'll use every day

```python
"  Hi There ".strip()        # 'Hi There'   — remove outer whitespace
"Hi There".lower()           # 'hi there'
"a,b,c".split(",")           # ['a', 'b', 'c']
"one two  three".split()     # ['one', 'two', 'three'] — any whitespace
"-".join(["a", "b", "c"])    # 'a-b-c'
"report.pdf".endswith(".pdf")  # True
"data".replace("a", "4")     # 'd4t4'
"x7".isalnum()               # True  — letters or digits only
"hello".count("l")           # 2
```

#### 4. Looping over characters

```python
for ch in "abc":
    print(ch)
```

A **generator expression** inside `sum()` is a neat way to count:

```python
sum(1 for ch in "banana" if ch == "a")   # 3
```

#### 5. Building strings piece by piece

Appending to a list and joining once at the end is the clean pattern:

```python
parts = []
for word in ["ai", "is", "fun"]:
    parts.append(word.upper())
"_".join(parts)   # 'AI_IS_FUN'
```

#### Exercises

`python ai90.py check 2`. The last one, `slugify`, is real automation: it turns messy titles into safe filenames. You'll reuse it on Day 17's folder organiser.

**Hint for slugify:** walk the characters; keep letters/digits; for anything else add a `-` only if the last thing you added wasn't already a `-`. Strip `-` from both ends at the end.

#### Your task — write `ai90/work/day02.py` with: `count_vowels`, `longest_word`, `initials`, `is_palindrome`, `slugify`

#### Tests

```python
# file: test_day02.py
import day02 as ex


def test_count_vowels():
    assert ex.count_vowels("Hello World") == 3
    assert ex.count_vowels("rhythm") == 0
    assert ex.count_vowels("AEIOU") == 5


def test_longest_word():
    assert ex.longest_word("a bb ccc dd") == "ccc"
    assert ex.longest_word("one two six") == "one"
    assert ex.longest_word("") == ""


def test_initials():
    assert ex.initials("asish teja vinnakota") == "ATV"
    assert ex.initials("Ada Lovelace") == "AL"


def test_is_palindrome():
    assert ex.is_palindrome("A man, a plan, a canal: Panama") is True
    assert ex.is_palindrome("racecar") is True
    assert ex.is_palindrome("python") is False


def test_slugify():
    assert ex.slugify("  My Holiday Photos (2026)!! ") == "my-holiday-photos-2026"
    assert ex.slugify("Report_FINAL v2.docx") == "report-final-v2-docx"
    assert ex.slugify("---") == ""
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day02.py
"""Day 2 — strings."""


def count_vowels(text):
    """Count a, e, i, o, u (any case). count_vowels('Hello World') -> 3"""
    return sum(1 for ch in text.lower() if ch in "aeiou")


def longest_word(text):
    """Return the longest word; on a tie, the first one. longest_word('a bb ccc dd') -> 'ccc'"""
    best = ""
    for word in text.split():
        if len(word) > len(best):
            best = word
    return best


def initials(full_name):
    """Uppercase initials. initials('asish teja vinnakota') -> 'ATV'"""
    return "".join(part[0].upper() for part in full_name.split())


def is_palindrome(text):
    """True if text reads the same backwards, ignoring case and non-letters/digits.
    is_palindrome('A man, a plan, a canal: Panama') -> True"""
    cleaned = "".join(ch.lower() for ch in text if ch.isalnum())
    return cleaned == cleaned[::-1]


def slugify(title):
    """Make a safe filename: lowercase, any run of non-alphanumeric chars becomes one '-',
    no '-' at either end. slugify('  My Holiday Photos (2026)!! ') -> 'my-holiday-photos-2026'"""
    out = []
    for ch in title.lower():
        if ch.isalnum():
            out.append(ch)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-")
```

</details>

**Done when:** `python ai90.py check 2` is all green → tick Day 2 in the tracker.

---

[← Day 1](day01-setup-variables-and-types.md) · [All 90 days](README.md) · [Day 3 →](day03-conditionals.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
