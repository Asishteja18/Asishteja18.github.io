# Day 80 — Train your GPT

> **AI-90** · Block 3 · Build an AI from scratch · Day 80 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 80`)

[← Day 79](day79-gpt-the-whole-model.md) · [All 90 days](README.md) · [Day 81 →](day81-generating-text-temperature-top-k-top-p.md)

---

**Dataset:** Tiny Shakespeare · **Time:** ~3 h (training runs in the background while you read)
**Progress:** `[████████████████████░░░░░░░░░░] 20/30` · **System after today:** **your own GPT, trained by your own engine, writing Shakespeare-ish text.** 🎯

#### Visual

```text
 REAL run of this day's script: 110,464 params, 1,500 steps, batch 16, ~0.075 s/step on a laptop CPU (~2 min)
 loss
 4.16 ┤●                      step    0: random characters
      │
 2.70 ┤  ●                    step  250: letters, spaces, line breaks
 2.34 ┤    ●
 2.18 ┤      ●                step 1000: words, names, speaker labels
 2.07 ┤        ●
 1.99 ┤          ●            step 1500: train 1.89 · val 1.99
      └────────────────── steps (×250)
 sample at temperature 0.8, top-k 20, prompt "ROMEO:":
   ROMEO:
   Hadgive wich this keared you, fare my hears, boke.
   I have a dand dreast withis slest.
```

#### Notes

- Loop: `get_batch` (Day 75) → `model(x, y)` → `zero_grad` → `backward` → `Adam.step` → log.
- Sanity check first: a model must be able to **memorise** a tiny repeated text. If it can't, there's a bug — don't train for hours.
- Expect ≈ 2.0 validation loss after 1,500 steps (~2 min on CPU) at this size; ~1.7 with 5,000+ steps and n_embd=128. Real GPTs are this exact loop with more data, parameters and GPUs (Day 90).
- Print a sample every few hundred steps — watching it learn spelling is the best moment of the course.

#### Your task — `day80.py`

- `train_gpt(model, data, steps, batch_size, lr=3e-3, seed=0, log_every=0, log=print)` → list of losses (Adam).
- `memorise_check(text, steps=150, seed=0)` → `(first_loss, last_loss)` for a tiny model on a repeated text.

#### Tests

```python
# file: test_day80.py
import numpy as np

import day80 as ex
from day75 import CharTokenizer
from day79 import GPT


def test_memorise_tiny_text():
    first, last = ex.memorise_check("hello world! " * 40, steps=150)
    assert first > 2.0 and last < first * 0.35


def test_train_returns_history():
    tok = CharTokenizer("abcabcabc abc")
    data = np.array(tok.encode("abcabcabc abc" * 10))
    m = GPT(tok.vocab_size, 8, 16, 2, 1)
    hist = ex.train_gpt(m, data, steps=20, batch_size=4)
    assert len(hist) == 20 and all(np.isfinite(hist))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day80.py
import numpy as np

from day69 import Adam
from day75 import CharTokenizer, get_batch
from day79 import GPT


def train_gpt(model, data, steps, batch_size, lr=3e-3, seed=0, log_every=0, log=print):
    rng = np.random.default_rng(seed)
    opt = Adam(model.parameters(), lr=lr)
    model.train()
    history = []
    for step in range(steps):
        x, y = get_batch(data, model.block_size, batch_size, rng)
        _, loss = model(x, y)
        opt.zero_grad()
        loss.backward()
        opt.step()
        history.append(float(loss.data))
        if log_every and step % log_every == 0:
            log(f"step {step:5d}  loss {np.mean(history[-log_every:]):.3f}")
    return history


def memorise_check(text, steps=150, seed=0):
    tok = CharTokenizer(text)
    data = np.array(tok.encode(text))
    model = GPT(tok.vocab_size, block_size=8, n_embd=16, n_head=2, n_layer=1, seed=seed)
    h = train_gpt(model, data, steps, batch_size=8, lr=1e-2, seed=seed)
    return float(np.mean(h[:5])), float(np.mean(h[-10:]))


if __name__ == "__main__":
    from day22 import download
    from day71 import save_params
    from day75 import split
    text = open(download("shakespeare"), encoding="utf-8").read()
    tok = CharTokenizer(text)
    train, val = split(np.array(tok.encode(text)))
    model = GPT(tok.vocab_size, block_size=32, n_embd=64, n_head=4, n_layer=2)
    print(f"{model.num_params():,} parameters")
    train_gpt(model, train, steps=1500, batch_size=16, lr=3e-3, log_every=100)
    save_params(model, "models/gpt_shakespeare.npz")
```

</details>

**Done when:** green + `python day80.py` trains on real Shakespeare and saves `models/gpt_shakespeare.npz`. Log the loss curve in your dev log.

---

[← Day 79](day79-gpt-the-whole-model.md) · [All 90 days](README.md) · [Day 81 →](day81-generating-text-temperature-top-k-top-p.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
