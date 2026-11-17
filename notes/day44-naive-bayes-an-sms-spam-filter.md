# Day 44 — Naive Bayes: an SMS spam filter

> **AI-90** · Block 2 · Machine learning from scratch · Day 44 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 44`)

[← Day 43](day43-k-nearest-neighbours.md) · [All 90 days](README.md) · [Day 45 →](day45-decision-trees.md)

---

**Dataset:** SMS Spam Collection (5,572 real texts) — `download("sms")` (tab-separated: label, message) · **Time:** ~2 h

#### Visual

```text
 P(spam | words) ∝ P(spam) · Π P(word | spam)          ← "naive": words assumed independent
 "WIN a FREE prize now"          log-space (no underflow):
   spam  score: log P(spam) + log P(win|spam) + log P(free|spam) + …   = −21.3  ◀ higher
   ham   score: log P(ham)  + log P(win|ham)  + …                      = −30.8
 Laplace smoothing: (count + 1) / (total + |vocab|)  → unseen words don't zero everything
```

#### Notes

- Bag of words: a message becomes word counts; order ignored.
- Multiply many small probabilities → underflow. Add logs instead.
- Smoothing: never let a probability be 0.
- Fast, tiny, strong baseline for text — still used in production filters.

#### Your task — `day44.py`

- `tokenize(text)` → lowercase words of letters/digits (regex `[a-z0-9']+`).
- `class NaiveBayesText(alpha=1.0)` with `fit(texts, labels)`, `predict_log_scores(text)` → `{label: score}`, `predict(texts)`.
- `load_sms(folder="data")` → `(texts, labels)` from the real file.

#### Tests

```python
# file: test_day44.py
import day44 as ex

TEXTS = ["win a free prize now", "free entry win cash", "call me when you get home",
         "are we still on for lunch", "urgent claim your free cash prize", "see you at home tonight"]
LABELS = ["spam", "spam", "ham", "ham", "spam", "ham"]


def test_tokenize():
    assert ex.tokenize("WIN a £1000 prize!! Don't wait") == ["win", "a", "1000", "prize", "don't", "wait"]


def test_predict():
    m = ex.NaiveBayesText().fit(TEXTS, LABELS)
    assert m.predict(["free cash prize", "lunch at home"]) == ["spam", "ham"]


def test_unseen_words_ok():
    m = ex.NaiveBayesText().fit(TEXTS, LABELS)
    s = m.predict_log_scores("zxqv blorp")
    assert set(s) == {"spam", "ham"} and all(v > -1e9 for v in s.values())
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day44.py
import csv
import math
import re
from collections import Counter

from day22 import download


def tokenize(text):
    return re.findall(r"[a-z0-9']+", text.lower())


class NaiveBayesText:
    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, texts, labels):
        self.classes_ = sorted(set(labels))
        self.prior_ = {c: math.log(labels.count(c) / len(labels)) for c in self.classes_}
        self.counts_ = {c: Counter() for c in self.classes_}
        for t, c in zip(texts, labels):
            self.counts_[c].update(tokenize(t))
        self.vocab_ = set().union(*self.counts_.values())
        self.totals_ = {c: sum(self.counts_[c].values()) for c in self.classes_}
        return self

    def predict_log_scores(self, text):
        V = len(self.vocab_)
        out = {}
        for c in self.classes_:
            s = self.prior_[c]
            for w in tokenize(text):
                s += math.log((self.counts_[c][w] + self.alpha) / (self.totals_[c] + self.alpha * V))
            out[c] = s
        return out

    def predict(self, texts):
        return [max((s, c) for c, s in self.predict_log_scores(t).items())[1] for t in texts]


def load_sms(folder="data"):
    with open(download("sms", folder), encoding="utf-8") as f:
        rows = [r for r in csv.reader(f, delimiter="\t") if len(r) == 2]
    return [r[1] for r in rows], [r[0] for r in rows]


if __name__ == "__main__":
    import numpy as np
    from day35 import train_test_split
    texts, labels = load_sms()
    Xtr, Xte, ytr, yte = train_test_split(np.array(texts, dtype=object), np.array(labels), seed=0)
    m = NaiveBayesText().fit(list(Xtr), list(ytr))
    pred = np.array(m.predict(list(Xte)))
    print("accuracy:", round(float((pred == yte).mean()), 4))
```

</details>

**Done when:** green + `python day44.py` on the real 5,572 texts (expect ~98% accuracy).

---

[← Day 43](day43-k-nearest-neighbours.md) · [All 90 days](README.md) · [Day 45 →](day45-decision-trees.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
