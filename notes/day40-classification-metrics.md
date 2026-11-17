# Day 40 — Classification metrics

> **AI-90** · Block 2 · Machine learning from scratch · Day 40 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 40`)

[← Day 39](day39-logistic-regression.md) · [All 90 days](README.md) · [Day 41 →](day41-softmax-regression-multi-class.md)

---

**Dataset:** Breast Cancer predictions from Day 39 · **Time:** ~2 h

#### Visual

```text
                  predicted
                  0        1
 actual  0  │  TN   │  FP   │   precision = TP/(TP+FP)  "when I say 1, am I right?"
         1  │  FN   │  TP   │   recall    = TP/(TP+FN)  "did I find all the 1s?"
 F1 = 2PR/(P+R)    accuracy lies when classes are imbalanced (99% healthy → predict "healthy" = 99%)
 ROC: sweep threshold 1→0, plot TPR vs FPR; AUC = area (0.5 random, 1.0 perfect)
```

#### Notes

- For cancer screening a false negative (missed cancer) is far worse than a false positive → care about **recall**.
- AUC = probability a random positive gets a higher score than a random negative — threshold-free.
- Compute AUC with the rank method (Mann–Whitney): count pairs where positive score > negative score (ties = 0.5).

#### Your task — `day40.py`

- `confusion_matrix(y, p)` → 2×2 array `[[TN, FP], [FN, TP]]`.
- `precision`, `recall`, `f1` (return 0.0 when undefined).
- `roc_auc(y, scores)` (rank method).
- `report(y, p)` → dict of accuracy, precision, recall, f1 rounded to 3.

#### Tests

```python
# file: test_day40.py
import numpy as np
from sklearn.metrics import f1_score, roc_auc_score

import day40 as ex

Y = np.array([1, 0, 1, 1, 0, 0, 1, 0])
P = np.array([1, 0, 0, 1, 1, 0, 1, 0])


def test_confusion():
    assert ex.confusion_matrix(Y, P).tolist() == [[3, 1], [1, 3]]


def test_prf():
    assert ex.precision(Y, P) == 0.75 and ex.recall(Y, P) == 0.75
    assert np.isclose(ex.f1(Y, P), f1_score(Y, P))
    assert ex.precision([0, 0], [0, 0]) == 0.0


def test_auc():
    s = np.array([0.9, 0.1, 0.4, 0.8, 0.6, 0.2, 0.7, 0.3])
    assert np.isclose(ex.roc_auc(Y, s), roc_auc_score(Y, s))
    assert ex.roc_auc([0, 1], [0.5, 0.5]) == 0.5


def test_report():
    assert ex.report(Y, P) == {"accuracy": 0.75, "precision": 0.75, "recall": 0.75, "f1": 0.75}
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day40.py
import numpy as np


def confusion_matrix(y, p):
    y, p = np.asarray(y), np.asarray(p)
    return np.array([[np.sum((y == 0) & (p == 0)), np.sum((y == 0) & (p == 1))],
                     [np.sum((y == 1) & (p == 0)), np.sum((y == 1) & (p == 1))]])


def precision(y, p):
    (tn, fp), (fn, tp) = confusion_matrix(y, p)
    return float(tp / (tp + fp)) if tp + fp else 0.0


def recall(y, p):
    (tn, fp), (fn, tp) = confusion_matrix(y, p)
    return float(tp / (tp + fn)) if tp + fn else 0.0


def f1(y, p):
    pr, rc = precision(y, p), recall(y, p)
    return 2 * pr * rc / (pr + rc) if pr + rc else 0.0


def roc_auc(y, scores):
    y, s = np.asarray(y), np.asarray(scores, float)
    pos, neg = s[y == 1], s[y == 0]
    diff = pos[:, None] - neg[None, :]
    return float(((diff > 0) + 0.5 * (diff == 0)).mean())


def report(y, p):
    acc = float(np.mean(np.asarray(y) == np.asarray(p)))
    return {k: round(v, 3) for k, v in
            {"accuracy": acc, "precision": precision(y, p), "recall": recall(y, p), "f1": f1(y, p)}.items()}
```

</details>

**Done when:** green + print `report` and `roc_auc` for your Day 39 model on real tumour data.

---

[← Day 39](day39-logistic-regression.md) · [All 90 days](README.md) · [Day 41 →](day41-softmax-regression-multi-class.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
