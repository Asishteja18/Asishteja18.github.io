# Day 85 — Turning it into a chat model (supervised fine-tuning)

> **AI-90** · Block 3 · Build an AI from scratch · Day 85 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 85`)

[← Day 84](day84-your-own-corpus-pretraining-and-checkpoints.md) · [All 90 days](README.md) · [Day 86 →](day86-rag-from-scratch-give-your-ai-a-memory.md)

---

**Dataset:** a small chat set you write (≥ 50 Q&A pairs about Python/ML — you know the material now) · **Time:** ~2.5 h
**Progress:** `[█████████████████████████░░░░░] 25/30` · **System after today:** your model answers in turns — a (tiny) chatbot.

#### Visual

```text
 chat template (special marker characters):
   ␁ What is a tensor? ␂ An array with autograd. ␃
   └user┘               └──── assistant ─────┘└end
 x = tokens[:-1]     y = tokens[1:]
 y masked:  -1 -1 -1 … -1  A  n  … .  ␃     ← loss ONLY on the assistant's reply (+ end marker)
 the model learns HOW TO ANSWER, not to imitate questions
```

#### Notes

- Pretraining teaches language; SFT teaches a **format**: user turn → assistant turn → stop.
- Mask the prompt: targets `-1` are ignored by your Day 67 `cross_entropy(ignore_index=-1)`.
- The end marker teaches the model when to stop talking.
- Start SFT from your pretrained checkpoint (Day 84) with a lower learning rate.

#### Your task — `day85.py`

- `USER, ASSISTANT, END = "\x01", "\x02", "\x03"`.
- `format_chat(messages)` → string from `[{"role": "user"|"assistant", "content": str}, ...]`: user → `USER + content`, assistant → `ASSISTANT + content + END`.
- `make_sft_example(tok, messages, block_size)` → `(x, y)` int arrays of length `block_size`; `y` is `-1` except at assistant content + END positions; right-pad `x` with 0 and `y` with -1; truncate if too long.
- `chat_reply(model, tok, question, rng, max_new_tokens=100)` → generated assistant text (stops at END).

#### Tests

```python
# file: test_day85.py
import numpy as np

import day85 as ex
from day75 import CharTokenizer


def tok():
    return CharTokenizer("abcdefghijklmnopqrstuvwxyz ?." + ex.USER + ex.ASSISTANT + ex.END)


def test_format():
    msgs = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "yo"}]
    assert ex.format_chat(msgs) == "\x01hi\x02yo\x03"


def test_mask():
    t = tok()
    msgs = [{"role": "user", "content": "hi?"}, {"role": "assistant", "content": "ok."}]
    x, y = ex.make_sft_example(t, msgs, 12)
    assert x.shape == y.shape == (12,)
    trained = t.decode([v for v in y if v != -1])
    assert trained == "ok.\x03"
    text = ex.format_chat(msgs)
    assert t.decode(x[:len(text) - 1]) == text[:-1] and (y[len(text) - 1:] == -1).all()


def test_truncate():
    x, y = ex.make_sft_example(tok(), [{"role": "user", "content": "a" * 30}, {"role": "assistant", "content": "b"}], 8)
    assert len(x) == len(y) == 8
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day85.py
import numpy as np

from day81 import generate

USER, ASSISTANT, END = "\x01", "\x02", "\x03"


def format_chat(messages):
    out = []
    for m in messages:
        out.append(USER + m["content"] if m["role"] == "user" else ASSISTANT + m["content"] + END)
    return "".join(out)


def make_sft_example(tok, messages, block_size):
    ids, train_mask = [], []
    for m in messages:
        if m["role"] == "user":
            part = tok.encode(USER + m["content"])
            ids += part; train_mask += [False] * len(part)
        else:
            head, body = tok.encode(ASSISTANT), tok.encode(m["content"] + END)
            ids += head + body; train_mask += [False] * len(head) + [True] * len(body)
    x, y = ids[:-1], [t if keep else -1 for t, keep in zip(ids[1:], train_mask[1:])]
    x, y = x[:block_size], y[:block_size]
    pad = block_size - len(x)
    return np.array(x + [0] * pad), np.array(y + [-1] * pad)


def chat_reply(model, tok, question, rng, max_new_tokens=100):
    prompt = tok.encode(USER + question + ASSISTANT)
    out = generate(model, prompt, max_new_tokens, rng, temperature=0.7, top_k=10)
    reply = tok.decode(out[len(prompt):])
    return reply.split(END)[0]
```

</details>

**Done when:** green + fine-tune your Day 84 model on your Q&A set and chat with it via `chat_reply`.

---

[← Day 84](day84-your-own-corpus-pretraining-and-checkpoints.md) · [All 90 days](README.md) · [Day 86 →](day86-rag-from-scratch-give-your-ai-a-memory.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
