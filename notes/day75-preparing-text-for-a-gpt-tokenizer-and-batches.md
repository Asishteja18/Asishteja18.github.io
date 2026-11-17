# Day 75 — Preparing text for a GPT: tokenizer and batches

> **AI-90** · Block 3 · Build an AI from scratch · Day 75 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 75`)

[← Day 74](day74-language-model-2-embeddings-mlp-bengio-2003.md) · [All 90 days](README.md) · [Day 76 →](day76-self-attention-step-by-step-numpy.md)

---

**Dataset:** Tiny Shakespeare (1.1 M characters) — `download("shakespeare")` · **Time:** ~2 h
**Progress:** `[███████████████░░░░░░░░░░░░░░░] 15/30` · **System after today:** the data pipeline your GPT will eat — text → token ids → (input, target) batches.

#### Visual

```text
 text:     "First Citizen:\nBefore we proceed…"
 encode →  [18, 47, 56, 57, 58, 1, 15, 47, …]           (65 unique characters)
 block_size = 8 →  one training example holds 8 predictions:
   x = [18, 47, 56, 57, 58,  1, 15, 47]
   y = [47, 56, 57, 58,  1, 15, 47, 58]     ← x shifted left by one
   given "F" predict "i"; given "Fi" predict "r"; … given "First Ci" predict "t"
```

#### Notes

- Character-level tokenizer: vocabulary = sorted unique characters. Simple, no unknown tokens. (BPE on Day 82.)
- Split 90/10 by position (the end of the text is validation — no shuffling text).
- `get_batch` picks random start positions and returns `x (B, T)` and `y (B, T)` = `x` shifted by one.

#### Your task — `day75.py`

- `class CharTokenizer(text)` with `vocab_size`, `stoi`, `itos`, `encode(s)`, `decode(ids)`.
- `split(ids, frac=0.9)` → `(train, val)` arrays.
- `get_batch(data, block_size, batch_size, rng)` → `(x, y)`.

#### Tests

```python
# file: test_day75.py
import numpy as np

import day75 as ex

TEXT = "First Citizen:\nBefore we proceed any further, hear me speak.\n"


def test_tokenizer_round_trip():
    tok = ex.CharTokenizer(TEXT)
    assert tok.vocab_size == len(set(TEXT)) and tok.itos[0] == "\n"
    assert tok.decode(tok.encode("hear me")) == "hear me"


def test_split_and_batch():
    tok = ex.CharTokenizer(TEXT)
    ids = np.array(tok.encode(TEXT))
    tr, va = ex.split(ids, 0.9)
    assert len(tr) == int(len(ids) * 0.9) and np.array_equal(np.concatenate([tr, va]), ids)
    x, y = ex.get_batch(tr, 8, 4, np.random.default_rng(0))
    assert x.shape == y.shape == (4, 8)
    assert np.array_equal(x[:, 1:], y[:, :-1])
    for row in x:
        start = next(i for i in range(len(tr) - 8) if np.array_equal(tr[i:i + 8], row))
        assert start + 8 < len(tr)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day75.py
import numpy as np


class CharTokenizer:
    def __init__(self, text):
        chars = sorted(set(text))
        self.stoi = {c: i for i, c in enumerate(chars)}
        self.itos = {i: c for i, c in enumerate(chars)}
        self.vocab_size = len(chars)

    def encode(self, s):
        return [self.stoi[c] for c in s]

    def decode(self, ids):
        return "".join(self.itos[int(i)] for i in ids)


def split(ids, frac=0.9):
    n = int(len(ids) * frac)
    return ids[:n], ids[n:]


def get_batch(data, block_size, batch_size, rng):
    starts = rng.integers(0, len(data) - block_size - 1, batch_size)
    x = np.stack([data[s:s + block_size] for s in starts])
    y = np.stack([data[s + 1:s + block_size + 1] for s in starts])
    return x, y


if __name__ == "__main__":
    from day22 import download
    text = open(download("shakespeare"), encoding="utf-8").read()
    tok = CharTokenizer(text)
    print(len(text), "chars,", tok.vocab_size, "tokens:", repr("".join(tok.itos.values())))
```

</details>

**Done when:** green. The data pipeline for your GPT is ready.

---

[← Day 74](day74-language-model-2-embeddings-mlp-bengio-2003.md) · [All 90 days](README.md) · [Day 76 →](day76-self-attention-step-by-step-numpy.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
