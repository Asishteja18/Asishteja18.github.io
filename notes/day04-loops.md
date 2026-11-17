# Day 4 — Loops

> **AI-90** · Block 1 · Python + automation + real data · Day 4 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 4`)

[← Day 3](day03-conditionals.md) · [All 90 days](README.md) · [Day 5 →](day05-lists-and-tuples.md)

---

**Dataset:** none — pure Python · **Time:** ~2 h

#### Visual

```text
 accumulator pattern            while loop (Collatz 6)
 total = 0                      6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1
 for x in [3,4,5]:              steps:  1   2    3   4    5   6   7   8
   total += x   0→3→7→12
```

**Goal:** repeat work. A training loop is just a `for` loop that runs thousands of times — today you learn its shape.

#### 1. for + range

```python
for i in range(5):        # 0 1 2 3 4
    print(i)

range(1, 6)      # 1..5   — end excluded
range(0, 10, 2)  # 0 2 4 6 8
```

`for` walks over anything iterable: lists, strings, files, dict keys.

#### 2. while

Runs as long as a condition stays true. Use it when you don't know how many steps you need.

```python
n = 1000
steps = 0
while n > 1:
    n //= 2
    steps += 1
```

Make sure something inside changes the condition, or it never stops (Ctrl+C to escape).

#### 3. break and continue

```python
for x in data:
    if x < 0:
        continue      # skip this one, go to the next
    if x > 100:
        break         # stop the whole loop
    process(x)
```

#### 4. The accumulator pattern

Start with an empty/zero value, update it each pass, return it at the end. You'll write this hundreds of times.

```python
total = 0
for x in [3, 4, 5]:
    total += x        # total = total + x
```

#### 5. enumerate — index and value together

```python
for i, name in enumerate(["a", "b"]):
    print(i, name)    # 0 a, then 1 b
```

#### 6. Digits trick

`n % 10` is the last digit, `n // 10` drops it. Loop until `n` is 0 to visit every digit.

#### Exercises

`python ai90.py check 4`.

- `is_prime`: you only need to test divisors up to √n — loop `while i * i <= n`.
- `primes_up_to` can call your own `is_prime`. Reusing your own functions is the whole point.

**Bonus:** a number-guessing game — `import random`, `secret = random.randint(1, 100)`, loop on `input()` saying "higher" / "lower" until correct, then print the number of guesses.

#### Your task — write `ai90/work/day04.py` with: `fizzbuzz`, `sum_of_digits`, `is_prime`, `primes_up_to`, `collatz_steps`, `first_index_over`

#### Tests

```python
# file: test_day04.py
import day04 as ex


def test_fizzbuzz():
    assert ex.fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"]
    assert ex.fizzbuzz(15)[-1] == "FizzBuzz"
    assert len(ex.fizzbuzz(100)) == 100


def test_sum_of_digits():
    assert ex.sum_of_digits(1234) == 10
    assert ex.sum_of_digits(0) == 0
    assert ex.sum_of_digits(9999) == 36


def test_is_prime():
    assert [n for n in range(20) if ex.is_prime(n)] == [2, 3, 5, 7, 11, 13, 17, 19]


def test_primes_up_to():
    assert ex.primes_up_to(10) == [2, 3, 5, 7]
    assert ex.primes_up_to(1) == []
    assert len(ex.primes_up_to(100)) == 25


def test_collatz_steps():
    assert ex.collatz_steps(1) == 0
    assert ex.collatz_steps(6) == 8
    assert ex.collatz_steps(27) == 111


def test_first_index_over():
    assert ex.first_index_over([1, 5, 9, 12], 6) == 2
    assert ex.first_index_over([1, 2], 10) == -1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day04.py
"""Day 4 — loops."""


def fizzbuzz(n):
    """List for 1..n: 'Fizz' for multiples of 3, 'Buzz' for 5, 'FizzBuzz' for both, else the number as str."""
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out


def sum_of_digits(n):
    """Sum the digits of a non-negative int. sum_of_digits(1234) -> 10"""
    total = 0
    while n > 0:
        total += n % 10
        n //= 10
    return total


def is_prime(n):
    """True if n is prime."""
    if n < 2:
        return False
    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True


def primes_up_to(n):
    """All primes <= n in order. primes_up_to(10) -> [2, 3, 5, 7]"""
    return [k for k in range(2, n + 1) if is_prime(k)]


def collatz_steps(n):
    """Steps to reach 1: if even n//=2, else n=3n+1. collatz_steps(6) -> 8"""
    steps = 0
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        steps += 1
    return steps


def first_index_over(nums, limit):
    """Index of the first number > limit, or -1. Use break."""
    found = -1
    for i, x in enumerate(nums):
        if x > limit:
            found = i
            break
    return found
```

</details>

**Done when:** `python ai90.py check 4` is all green → tick Day 4 in the tracker.

---

[← Day 3](day03-conditionals.md) · [All 90 days](README.md) · [Day 5 →](day05-lists-and-tuples.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
