# Day 43 — k-Nearest Neighbours

> **AI-90** · Block 2 · Machine learning from scratch · Day 43 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 43`)

[← Day 42](day42-cross-validation.md) · [All 90 days](README.md) · [Day 44 →](day44-naive-bayes-an-sms-spam-filter.md)

---

**Dataset:** Iris + Wine · **Time:** ~2 h

#### Visual

```text
   ■ ■         ? ← new point, k=3 → nearest: ●, ●, ■  → vote "●"
 ■   ■   ●  ●
       ● ? ●       no training at all — just remember the data
         ●         cost moves to prediction: distance to EVERY training row
 distances all at once:  ‖a−b‖² = ‖a‖² + ‖b‖² − 2a·b   (one matrix product)
```

#### Notes

- kNN is "lazy": `fit` stores the data; `predict` finds the k closest rows and votes.
- Small k = wiggly boundary (overfit); large k = smooth (underfit). Pick k with CV.
- Scale features first — distance is dominated by the biggest-scale feature otherwise.
- Vectorised distances via the expansion above; clip tiny negatives to 0.

#### Your task — `day43.py`

- `pairwise_sq_dists(A, B)` → `(len(A), len(B))` squared distances.
- `class KNNClassifier(k=5)` with `fit`, `predict` (majority vote; ties → smallest label).
- `best_k(X, y, ks, folds=5)` → the k with highest mean CV accuracy (uses Day 42).

#### Tests

```python
# file: test_day43.py
import numpy as np
from sklearn.datasets import load_wine
from sklearn.neighbors import KNeighborsClassifier

import day43 as ex
from day34 import StandardScaler
from day35 import train_test_split


def test_dists():
    A, B = np.array([[0.0, 0], [1, 1]]), np.array([[3.0, 4]])
    assert np.allclose(ex.pairwise_sq_dists(A, B), [[25], [13]])


def test_matches_sklearn_on_wine():
    d = load_wine()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=0)
    s = StandardScaler().fit(Xtr)
    a, b = s.transform(Xtr), s.transform(Xte)
    ours = ex.KNNClassifier(5).fit(a, ytr).predict(b)
    sk = KNeighborsClassifier(5).fit(a, ytr).predict(b)
    assert (ours == sk).mean() > 0.97 and (ours == yte).mean() > 0.9


def test_best_k():
    X = np.vstack([np.zeros((10, 2)), np.ones((10, 2)) * 5])
    y = np.array([0] * 10 + [1] * 10)
    assert ex.best_k(X, y, [1, 3, 5]) == 1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day43.py
import numpy as np

from day42 import cross_val_score


def pairwise_sq_dists(A, B):
    A, B = np.asarray(A, float), np.asarray(B, float)
    d = (A ** 2).sum(1)[:, None] + (B ** 2).sum(1)[None, :] - 2 * A @ B.T
    return np.maximum(d, 0)


class KNNClassifier:
    def __init__(self, k=5):
        self.k = k

    def fit(self, X, y):
        self.X_, self.y_ = np.asarray(X, float), np.asarray(y)
        return self

    def predict(self, X):
        nn = np.argsort(pairwise_sq_dists(X, self.X_), axis=1, kind="stable")[:, :self.k]
        votes = self.y_[nn]
        return np.array([np.bincount(v).argmax() for v in votes])


def best_k(X, y, ks, folds=5):
    means = [cross_val_score(lambda: KNNClassifier(k), X, y, k=folds).mean() for k in ks]
    return ks[int(np.argmax(means))]
```

</details>

**Done when:** green. Use `best_k` on real wine — what k wins?

---

[← Day 42](day42-cross-validation.md) · [All 90 days](README.md) · [Day 44 →](day44-naive-bayes-an-sms-spam-filter.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
