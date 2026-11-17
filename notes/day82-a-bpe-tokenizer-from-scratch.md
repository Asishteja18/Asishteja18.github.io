# Day 82 — A BPE tokenizer from scratch

> **AI-90** · Block 3 · Build an AI from scratch · Day 82 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 82`)

[← Day 81](day81-generating-text-temperature-top-k-top-p.md) · [All 90 days](README.md) · [Day 83 →](day83-training-like-the-pros-evaluation-clipping-sched.md)

---

**Dataset:** Tiny Shakespeare; test with English + Telugu + emoji · **Time:** ~2.5 h (Karpathy's "Let's build the GPT Tokenizer")
**Progress:** `[██████████████████████░░░░░░░░] 22/30` · **System after today:** a GPT-style byte-pair-encoding tokenizer that handles any language.

#### Visual

```text
 start: UTF-8 bytes   "aaabdaaabac" → [97,97,97,98,100,97,97,97,98,97,99]
 merge 1: most common pair (97,97)="aa" → new token 256:  [256,97,98,100,256,97,98,97,99]
 merge 2: most common pair (256,97)="aaa"→ 257:           [257,98,100,257,98,97,99]
 merge 3: (257,98)="aaab" → 258:                          [258,100,258,97,99]
 vocab grows 256 → 259, sequence shrinks 11 → 5   (GPT-4 does ~100k merges)
 "నమస్కారం" is 24 bytes → never an unknown token, any language works
```

#### Notes

- Byte-level BPE: base vocabulary = 256 bytes, so every string is encodable.
- Training: repeatedly merge the most frequent adjacent pair into a new token id.
- Encoding new text: apply learned merges in the order they were learned (lowest new id first).
- Fewer tokens per text = longer effective context and faster training. Trade-off: bigger vocab = bigger embedding table.

#### Your task — `day82.py`

- `get_stats(ids)` → dict `{(a, b): count}`; `merge(ids, pair, new_id)`.
- `class BPETokenizer` with `train(text, vocab_size)`, `encode(text)`, `decode(ids)`, `merges`, `vocab` (id → bytes).

#### Tests

```python
# file: test_day82.py
import day82 as ex


def test_stats_and_merge():
    assert ex.get_stats([1, 2, 1, 2, 3]) == {(1, 2): 2, (2, 1): 1, (2, 3): 1}
    assert ex.merge([1, 2, 1, 2, 3], (1, 2), 9) == [9, 9, 3]


def test_classic_example():
    t = ex.BPETokenizer().train("aaabdaaabac", 259)
    assert len(t.merges) == 3 and t.encode("aaabdaaabac") == [258, 100, 258, 97, 99]
    assert t.vocab[258] == b"aaab"


def test_round_trip_any_language():
    corpus = "the cat sat on the mat. the cat ate. " * 20
    t = ex.BPETokenizer().train(corpus, 300)
    for s in ["the cat", "a brand new sentence!", "నమస్కారం Asish 👋", ""]:
        assert t.decode(t.encode(s)) == s
    assert len(t.encode(corpus)) < len(corpus.encode()) / 3
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day82.py
def get_stats(ids):
    counts = {}
    for pair in zip(ids, ids[1:]):
        counts[pair] = counts.get(pair, 0) + 1
    return counts


def merge(ids, pair, new_id):
    out, i = [], 0
    while i < len(ids):
        if i < len(ids) - 1 and (ids[i], ids[i + 1]) == pair:
            out.append(new_id)
            i += 2
        else:
            out.append(ids[i])
            i += 1
    return out


class BPETokenizer:
    def __init__(self):
        self.merges, self.vocab = {}, {i: bytes([i]) for i in range(256)}

    def train(self, text, vocab_size):
        ids = list(text.encode("utf-8"))
        for new_id in range(256, vocab_size):
            stats = get_stats(ids)
            if not stats:
                break
            pair = max(stats, key=stats.get)
            ids = merge(ids, pair, new_id)
            self.merges[pair] = new_id
            self.vocab[new_id] = self.vocab[pair[0]] + self.vocab[pair[1]]
        return self

    def encode(self, text):
        ids = list(text.encode("utf-8"))
        while len(ids) >= 2:
            pair = min(get_stats(ids), key=lambda p: self.merges.get(p, float("inf")))
            if pair not in self.merges:
                break
            ids = merge(ids, pair, self.merges[pair])
        return ids

    def decode(self, ids):
        return b"".join(self.vocab[i] for i in ids).decode("utf-8", errors="replace")


if __name__ == "__main__":
    from day22 import download
    text = open(download("shakespeare"), encoding="utf-8").read()[:200_000]
    t = BPETokenizer().train(text, 512)
    sample = text[:20000]
    print("bytes per token:", round(len(sample.encode()) / len(t.encode(sample)), 2))
    print([t.vocab[i] for i in range(256, 276)])
```

</details>

**Done when:** green + look at your first 20 learned merges on Shakespeare — which words got their own token?

---

[← Day 81](day81-generating-text-temperature-top-k-top-p.md) · [All 90 days](README.md) · [Day 83 →](day83-training-like-the-pros-evaluation-clipping-sched.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
