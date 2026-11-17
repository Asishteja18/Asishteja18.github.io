# Day 74 — Language model #2: embeddings + MLP (Bengio 2003)

> **AI-90** · Block 3 · Build an AI from scratch · Day 74 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 74`)

[← Day 73](day73-language-model-1-bigram-counts.md) · [All 90 days](README.md) · [Day 75 →](day75-preparing-text-for-a-gpt-tokenizer-and-batches.md)

---

**Dataset:** names · **Time:** ~2.5 h (Karpathy's makemore part 2)
**Progress:** `[██████████████░░░░░░░░░░░░░░░░] 14/30` · **System after today:** a neural language model with learned embeddings, trained on your engine — beats the bigram.

#### Visual

```text
 context (3 chars)   ". e m"  →  ids [0, 5, 13]
 embedding table C (27 × 10):  each char → a learned 10-number vector
 C[ids] → (3 × 10) → flatten (30) → Linear(30, 128) → tanh → Linear(128, 27) → logits → next char "m"
 similar letters end up with similar vectors (vowels cluster) — the first glimpse of "meaning"
```

#### Notes

- Embeddings turn discrete tokens into trainable vectors. Lookup = your Day 67 `__getitem__`.
- More context than one char → much better predictions.
- `build_dataset` slides a window of `block_size` over each name padded with `"."`.
- Same training loop as Day 71, now on text.

#### Your task — `day74.py`

- `build_dataset(words, stoi, block_size=3)` → `X (n, block_size)` int, `Y (n,)` int.
- `class MLPLM(Module)(vocab, block_size=3, n_embd=10, n_hidden=128, seed=0)`; `forward(X)` → logits `(n, vocab)`.
- `train_lm(model, X, Y, steps, lr=1e-2, batch=64, seed=0)` → list of losses (Adam).

#### Tests

```python
# file: test_day74.py
import numpy as np

import day74 as ex
from day67 import cross_entropy
from day73 import bigram_counts, build_vocab, nll, probs

WORDS = ["emma", "olivia", "ava", "isabella", "sophia", "mia", "amelia", "emily", "harper", "evelyn",
         "abigail", "ella", "elizabeth", "camila", "luna", "sofia", "avery", "mila", "aria", "scarlett"]


def test_dataset():
    stoi, _ = build_vocab(["ab"])
    X, Y = ex.build_dataset(["ab"], stoi, 3)
    assert X.tolist() == [[0, 0, 0], [0, 0, 1], [0, 1, 2]] and Y.tolist() == [1, 2, 0]


def test_beats_bigram_after_training():
    stoi, _ = build_vocab(WORDS)
    X, Y = ex.build_dataset(WORDS, stoi, 3)
    model = ex.MLPLM(len(stoi), 3, 10, 64, seed=0)
    from day66 import Tensor  # noqa: F401
    losses = ex.train_lm(model, X, Y, steps=400, lr=1e-2)
    assert losses[0] > 3.0
    final = float(cross_entropy(model(X), Y).data)
    bigram = nll(WORDS, probs(bigram_counts(WORDS, stoi)), stoi)
    assert final < bigram
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day74.py
import numpy as np

import day67  # noqa: F401
from day66 import Tensor
from day67 import cross_entropy
from day68 import Linear, Module
from day69 import Adam


def build_dataset(words, stoi, block_size=3):
    X, Y = [], []
    for w in words:
        ctx = [0] * block_size
        for ch in w + ".":
            X.append(ctx)
            Y.append(stoi[ch])
            ctx = ctx[1:] + [stoi[ch]]
    return np.array(X), np.array(Y)


class MLPLM(Module):
    def __init__(self, vocab, block_size=3, n_embd=10, n_hidden=128, seed=0):
        rng = np.random.default_rng(seed)
        self.C = Tensor(rng.normal(0, 1, (vocab, n_embd)))
        self.hidden = Linear(block_size * n_embd, n_hidden, seed=seed + 1)
        self.out = Linear(n_hidden, vocab, seed=seed + 2)
        self.block_size, self.n_embd = block_size, n_embd

    def forward(self, X):
        emb = self.C[np.asarray(X)].reshape(len(X), self.block_size * self.n_embd)
        return self.out(self.hidden(emb).tanh())


def train_lm(model, X, Y, steps, lr=1e-2, batch=64, seed=0):
    rng = np.random.default_rng(seed)
    opt = Adam(model.parameters(), lr=lr)
    losses = []
    for _ in range(steps):
        b = rng.integers(0, len(Y), batch)
        loss = cross_entropy(model(X[b]), Y[b])
        opt.zero_grad()
        loss.backward()
        opt.step()
        losses.append(float(loss.data))
    return losses


if __name__ == "__main__":
    from day22 import download
    from day73 import build_vocab
    words = open(download("names")).read().split()
    stoi, itos = build_vocab(words)
    X, Y = build_dataset(words, stoi)
    m = MLPLM(len(stoi))
    losses = train_lm(m, X, Y, steps=3000, lr=3e-3, batch=128)
    print("final loss:", round(float(np.mean(losses[-200:])), 3), "(bigram ≈ 2.45)")
```

</details>

**Done when:** green + real names loss below 2.45 with `python day74.py`.

---

[← Day 73](day73-language-model-1-bigram-counts.md) · [All 90 days](README.md) · [Day 75 →](day75-preparing-text-for-a-gpt-tokenizer-and-batches.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
