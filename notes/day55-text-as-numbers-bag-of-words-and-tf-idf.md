# Day 55 — Text as numbers: bag-of-words and TF-IDF

> **AI-90** · Block 2 · Machine learning from scratch · Day 55 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 55`)

[← Day 54](day54-time-series-forecasting-airline-passengers.md) · [All 90 days](README.md) · [Day 56 →](day56-saving-models-and-serving-predictions.md)

---

**Dataset:** SMS Spam · **Time:** ~2 h

#### Visual

```text
 docs: d1 "free cash now"   d2 "call me now"
 vocab:  call cash free me now
 BoW d1: [0,   1,   1,   0,  1]
 idf(t) = ln((1+N)/(1+df(t))) + 1   → common words ("now") get LOW weight, rare ones HIGH
 tf-idf = count × idf, then each row scaled to length 1 (L2)
```

#### Notes

- Text → vectors is step one of every NLP system. Tokens → vocabulary (word→index dict, Day 6!) → vectors.
- TF-IDF down-weights words that appear everywhere.
- Match scikit-learn's defaults so you can verify: tokens = 2+ word characters, lowercase, smooth idf, L2 rows.
- These vectors + logistic regression = a strong text classifier. Embeddings (Block 3) are the learned, dense version.

#### Your task — `day55.py`

- `tokens(text)` → `re.findall(r"(?u)\b\w\w+\b", text.lower())`.
- `class TfidfVectorizer` with `fit(docs)` (`vocabulary_` sorted alphabetically → index, `idf_`), `transform(docs)` → dense array, `fit_transform`.

#### Tests

```python
# file: test_day55.py
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer as SkTfidf

import day55 as ex

DOCS = ["Free cash now!", "Call me now", "free free entry, win cash", "see you at home"]


def test_tokens():
    assert ex.tokens("Win £1000 a FREE prize") == ["win", "1000", "free", "prize"]


def test_matches_sklearn():
    ours = ex.TfidfVectorizer().fit(DOCS)
    sk = SkTfidf().fit(DOCS)
    assert ours.vocabulary_ == sk.vocabulary_
    assert np.allclose(ours.idf_, sk.idf_)
    assert np.allclose(ours.transform(DOCS), sk.transform(DOCS).toarray())


def test_unknown_words_ignored():
    v = ex.TfidfVectorizer().fit(DOCS)
    assert np.allclose(v.transform(["zzz qqq"]), 0)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day55.py
import re
from collections import Counter

import numpy as np


def tokens(text):
    return re.findall(r"(?u)\b\w\w+\b", text.lower())


class TfidfVectorizer:
    def fit(self, docs):
        toks = [tokens(d) for d in docs]
        self.vocabulary_ = {w: i for i, w in enumerate(sorted({w for t in toks for w in t}))}
        df = np.zeros(len(self.vocabulary_))
        for t in toks:
            for w in set(t):
                df[self.vocabulary_[w]] += 1
        self.idf_ = np.log((1 + len(docs)) / (1 + df)) + 1
        return self

    def transform(self, docs):
        M = np.zeros((len(docs), len(self.vocabulary_)))
        for i, d in enumerate(docs):
            for w, c in Counter(tokens(d)).items():
                if w in self.vocabulary_:
                    M[i, self.vocabulary_[w]] = c
        M *= self.idf_
        norms = np.linalg.norm(M, axis=1, keepdims=True)
        return M / np.where(norms == 0, 1, norms)

    def fit_transform(self, docs):
        return self.fit(docs).transform(docs)


if __name__ == "__main__":
    from day35 import train_test_split
    from day39 import LogisticRegression
    from day44 import load_sms
    texts, labels = load_sms()
    y = np.array([1 if l == "spam" else 0 for l in labels])
    tr_t, te_t, ytr, yte = train_test_split(np.array(texts, dtype=object), y, seed=0)
    v = TfidfVectorizer().fit(list(tr_t))
    m = LogisticRegression(lr=20.0, epochs=500).fit(  # sparse unit-length rows need a big lr
        v.transform(list(tr_t)), ytr)
    print("tf-idf + your logistic regression accuracy:", round(float((m.predict(v.transform(list(te_t))) == yte).mean()), 4))
```

</details>

**Done when:** green + real SMS accuracy (≈ 98.3%; the always-ham baseline is 87.3%). Compare with Day 44's Naive Bayes (≈ 97.9%).

---

[← Day 54](day54-time-series-forecasting-airline-passengers.md) · [All 90 days](README.md) · [Day 56 →](day56-saving-models-and-serving-predictions.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
