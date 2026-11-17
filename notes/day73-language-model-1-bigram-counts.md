# Day 73 — Language model #1: bigram counts

> **AI-90** · Block 3 · Build an AI from scratch · Day 73 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 73`)

[← Day 72](day72-convolution-from-scratch.md) · [All 90 days](README.md) · [Day 74 →](day74-language-model-2-embeddings-mlp-bengio-2003.md)

---

**Dataset:** 32,033 real first names — `download("names")` · **Time:** ~2 h (Karpathy's makemore part 1)
**Progress:** `[█████████████░░░░░░░░░░░░░░░░░] 13/30` · **System after today:** your first text generator — it invents new names.

#### Visual

```text
 ".emma." → pairs: (.,e) (e,m) (m,m) (m,a) (a,.)      "." marks start AND end
 counts N[27×27]:  row = current char, column = next char
          .    a    b    …
   .   [  0  4410 1306 …]   ← names start with "a" most often
   a   [6640  556  541 …]
 P = (N + 1) / row sums        sample: start at ".", draw next char from P[row], repeat until "."
 quality = average negative log-likelihood (lower is better; uniform guessing = ln 27 ≈ 3.30)
```

#### Notes

- A language model assigns probabilities to the next token given the previous ones. Bigram = only the previous **one** character.
- Smoothing (`+1`) stops any probability being zero (which would make NLL infinite).
- NLL is the same cross-entropy you minimised in Day 41 — now you'll minimise it with networks.

#### Your task — `day73.py`

- `build_vocab(words)` → `(stoi, itos)` with `"."` at index 0 and letters sorted.
- `bigram_counts(words, stoi)` → int matrix.
- `probs(counts, smoothing=1)`, `nll(words, P, stoi)` → mean negative log-likelihood per character.
- `sample(P, itos, rng, max_len=30)` → one generated name.

#### Tests

```python
# file: test_day73.py
import numpy as np

import day73 as ex

WORDS = ["emma", "olivia", "ava", "isabella", "sophia", "mia", "amelia", "emily"]


def test_vocab():
    stoi, itos = ex.build_vocab(WORDS)
    assert itos[0] == "." and stoi["a"] == 1 and len(stoi) == len(set("".join(WORDS))) + 1


def test_counts():
    stoi, _ = ex.build_vocab(["ab"])
    N = ex.bigram_counts(["ab"], stoi)
    assert N[0, 1] == 1 and N[1, 2] == 1 and N[2, 0] == 1 and N.sum() == 3


def test_nll_and_sample():
    stoi, itos = ex.build_vocab(WORDS)
    P = ex.probs(ex.bigram_counts(WORDS, stoi))
    assert np.allclose(P.sum(1), 1)
    assert ex.nll(WORDS, P, stoi) < np.log(len(stoi))
    rng = np.random.default_rng(0)
    names = [ex.sample(P, itos, rng) for _ in range(20)]
    assert all(set(n) <= set(stoi) - {"."} for n in names)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day73.py
import numpy as np


def build_vocab(words):
    chars = sorted(set("".join(words)))
    stoi = {".": 0, **{c: i + 1 for i, c in enumerate(chars)}}
    return stoi, {i: c for c, i in stoi.items()}


def bigram_counts(words, stoi):
    N = np.zeros((len(stoi), len(stoi)), dtype=int)
    for w in words:
        seq = ["."] + list(w) + ["."]
        for a, b in zip(seq, seq[1:]):
            N[stoi[a], stoi[b]] += 1
    return N


def probs(counts, smoothing=1):
    P = counts + smoothing
    return P / P.sum(axis=1, keepdims=True)


def nll(words, P, stoi):
    total, n = 0.0, 0
    for w in words:
        seq = ["."] + list(w) + ["."]
        for a, b in zip(seq, seq[1:]):
            total -= np.log(P[stoi[a], stoi[b]])
            n += 1
    return total / n


def sample(P, itos, rng, max_len=30):
    out, ix = [], 0
    for _ in range(max_len):
        ix = rng.choice(len(P), p=P[ix])
        if ix == 0:
            break
        out.append(itos[ix])
    return "".join(out)


if __name__ == "__main__":
    from day22 import download
    words = open(download("names")).read().split()
    stoi, itos = build_vocab(words)
    P = probs(bigram_counts(words, stoi))
    print("NLL:", round(nll(words, P, stoi), 3), "(uniform:", round(np.log(27), 3), ")")
    rng = np.random.default_rng(42)
    print([sample(P, itos, rng) for _ in range(10)])
```

</details>

**Done when:** green + real NLL on 32k names (≈ 2.45) + 10 invented names in your dev log.

---

[← Day 72](day72-convolution-from-scratch.md) · [All 90 days](README.md) · [Day 74 →](day74-language-model-2-embeddings-mlp-bengio-2003.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
