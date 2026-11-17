# Day 81 — Generating text: temperature, top-k, top-p

> **AI-90** · Block 3 · Build an AI from scratch · Day 81 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 81`)

[← Day 80](day80-train-your-gpt.md) · [All 90 days](README.md) · [Day 82 →](day82-a-bpe-tokenizer-from-scratch.md)

---

**Dataset:** your trained Shakespeare GPT · **Time:** ~2 h
**Progress:** `[█████████████████████░░░░░░░░░] 21/30` · **System after today:** your GPT **talks** — controllable text generation.

#### Visual

```text
 next-char probabilities after "To be or not to b":
   e ████████████████ 0.62     temperature 0.5 → sharper:  e ███████████████████████ 0.89
   a ████ 0.15                 temperature 1.5 → flatter:  e ██████████ 0.38, a █████ 0.20 …
   u ██ 0.08                   top-k=2  → only {e, a} can be picked
   … (62 more)                 top-p=0.8 → smallest set whose probabilities sum ≥ 0.8
 generation loop: ctx = last block_size ids → logits[-1] → filter → sample → append → repeat
```

#### Notes

- Temperature divides logits: `< 1` = safer/more repetitive; `> 1` = more creative/chaotic; `0` = greedy (always the most likely).
- Top-k and top-p (nucleus) cut off the long tail of unlikely tokens — they remove most nonsense.
- The context window slides: only the last `block_size` tokens are fed in.
- Switch the model to `eval()` before generating (turns dropout off).

#### Your task — `day81.py`

- `top_k_filter(logits, k)` → logits with all but the top k set to `-inf`.
- `top_p_filter(probs, p)` → probs zeroed outside the nucleus, renormalised (always keep the top token).
- `sample_next(logits, rng, temperature=1.0, top_k=None, top_p=None)` → int (temperature 0 → argmax).
- `generate(model, ids, max_new_tokens, rng, temperature=1.0, top_k=None, top_p=None)` → list of ids (prompt + new).

#### Tests

```python
# file: test_day81.py
import numpy as np

import day81 as ex
from day75 import CharTokenizer
from day79 import GPT
from day80 import train_gpt


def test_filters():
    z = np.array([1.0, 3.0, 2.0, 0.0])
    assert np.isinf(ex.top_k_filter(z, 2)[[0, 3]]).all() and ex.top_k_filter(z, 2)[1] == 3.0
    p = ex.top_p_filter(np.array([0.5, 0.3, 0.15, 0.05]), 0.75)
    assert np.allclose(p, [0.625, 0.375, 0, 0])
    assert ex.top_p_filter(np.array([0.9, 0.1]), 0.1).tolist() == [1.0, 0.0]


def test_sample_next():
    rng = np.random.default_rng(0)
    assert ex.sample_next(np.array([0.1, 5.0, 0.2]), rng, temperature=0) == 1
    picks = {ex.sample_next(np.array([5.0, 4.9, -9, -9]), rng, top_k=2) for _ in range(50)}
    assert picks == {0, 1}


def test_generate_continues_memorised_text():
    text = "hello world! " * 40
    tok = CharTokenizer(text)
    m = GPT(tok.vocab_size, 8, 16, 2, 1, seed=0)
    train_gpt(m, np.array(tok.encode(text)), steps=300, batch_size=8, lr=1e-2)
    out = ex.generate(m, tok.encode("hello"), 8, np.random.default_rng(0), temperature=0)
    assert len(out) == 13 and tok.decode(out).startswith("hello world")
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day81.py
import numpy as np


def top_k_filter(logits, k):
    logits = np.asarray(logits, float).copy()
    if k < len(logits):
        cut = np.sort(logits)[-k]
        logits[logits < cut] = -np.inf
    return logits


def top_p_filter(probs, p):
    probs = np.asarray(probs, float)
    order = np.argsort(-probs, kind="stable")
    keep_n = int(np.searchsorted(np.cumsum(probs[order]), p) + 1)
    out = np.zeros_like(probs)
    out[order[:keep_n]] = probs[order[:keep_n]]
    return out / out.sum()


def sample_next(logits, rng, temperature=1.0, top_k=None, top_p=None):
    logits = np.asarray(logits, float)
    if temperature == 0:
        return int(np.argmax(logits))
    z = logits / temperature
    if top_k:
        z = top_k_filter(z, top_k)
    probs = np.exp(z - z.max())
    probs /= probs.sum()
    if top_p:
        probs = top_p_filter(probs, top_p)
    return int(rng.choice(len(probs), p=probs))


def generate(model, ids, max_new_tokens, rng, temperature=1.0, top_k=None, top_p=None):
    ids = list(ids)
    model.eval()
    for _ in range(max_new_tokens):
        ctx = np.array([ids[-model.block_size:]])
        logits, _ = model(ctx)
        ids.append(sample_next(logits.data[0, -1], rng, temperature, top_k, top_p))
    model.train()
    return ids


if __name__ == "__main__":
    from day22 import download
    from day71 import load_params
    from day75 import CharTokenizer
    from day79 import GPT
    tok = CharTokenizer(open(download("shakespeare"), encoding="utf-8").read())
    model = GPT(tok.vocab_size, block_size=32, n_embd=64, n_head=4, n_layer=2)
    load_params(model, "models/gpt_shakespeare.npz")
    rng = np.random.default_rng(0)
    for t in (0.5, 0.8, 1.2):
        print(f"--- temperature {t} ---")
        print(tok.decode(generate(model, tok.encode("ROMEO:"), 200, rng, temperature=t, top_k=20)))
```

</details>

**Done when:** green + three real samples from your Shakespeare GPT at different temperatures.

---

[← Day 80](day80-train-your-gpt.md) · [All 90 days](README.md) · [Day 82 →](day82-a-bpe-tokenizer-from-scratch.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
