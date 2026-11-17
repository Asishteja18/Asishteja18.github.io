# Day 41 — Softmax regression (multi-class)

> **AI-90** · Block 2 · Machine learning from scratch · Day 41 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 41`)

[← Day 40](day40-classification-metrics.md) · [All 90 days](README.md) · [Day 42 →](day42-cross-validation.md)

---

**Dataset:** Wine (178 wines, 3 cultivars, 13 chemical features) · **Time:** ~2 h

#### Visual

```text
 logits z = XW + b  (n × K)       softmax: p_k = e^{z_k} / Σ_j e^{z_j}
 [2.0, 1.0, 0.1]  ──softmax──▶  [0.66, 0.24, 0.10]   sums to 1
 one-hot y=2 → [0, 0, 1]
 loss = −mean Σ_k y_k log p_k     grad: dW = Xᵀ(P − Y)/n   ← SAME pattern as Days 37 & 39
 stable softmax: subtract max(z) first (e^1000 overflows; e^0 doesn't)
```

#### Notes

- Logistic regression generalises to K classes with a weight **matrix** `W (d×K)`.
- Always subtract the row max before `exp` — same answer, no overflow. You'll reuse this softmax in your GPT.
- The gradient `P − Y` is the most important line in deep learning: it's the output-layer gradient of every classifier, including language models.

#### Your task — `day41.py`

- `softmax(Z)` (row-wise, stable), `one_hot(y, k)`, `cross_entropy(Y, P)`.
- `class SoftmaxRegression(lr=0.1, epochs=500)` with `fit`, `predict_proba`, `predict`.

#### Tests

```python
# file: test_day41.py
import numpy as np
from sklearn.datasets import load_wine

import day41 as ex
from day34 import StandardScaler
from day35 import train_test_split


def test_softmax():
    P = ex.softmax(np.array([[2.0, 1.0, 0.1], [1000, 1000, 1000]]))
    assert np.allclose(P.sum(1), 1) and np.allclose(P[1], 1 / 3)
    assert np.allclose(P[0], [0.659, 0.242, 0.099], atol=1e-3)


def test_one_hot_ce():
    Y = ex.one_hot(np.array([0, 2]), 3)
    assert Y.tolist() == [[1, 0, 0], [0, 0, 1]]
    assert np.isclose(ex.cross_entropy(Y, np.array([[0.5, 0.25, 0.25], [0.1, 0.1, 0.8]])),
                      -(np.log(0.5) + np.log(0.8)) / 2)


def test_wine():
    d = load_wine()
    Xtr, Xte, ytr, yte = train_test_split(d.data, d.target, seed=0)
    s = StandardScaler().fit(Xtr)
    m = ex.SoftmaxRegression().fit(s.transform(Xtr), ytr)
    assert (m.predict(s.transform(Xte)) == yte).mean() > 0.94
    assert np.allclose(m.predict_proba(s.transform(Xte)).sum(1), 1)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day41.py
import numpy as np


def softmax(Z):
    Z = np.asarray(Z, float)
    e = np.exp(Z - Z.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)


def one_hot(y, k):
    Y = np.zeros((len(y), k))
    Y[np.arange(len(y)), y] = 1
    return Y


def cross_entropy(Y, P):
    return float(-np.mean(np.sum(Y * np.log(np.clip(P, 1e-12, 1)), axis=1)))


class SoftmaxRegression:
    def __init__(self, lr=0.1, epochs=500):
        self.lr, self.epochs = lr, epochs

    def fit(self, X, y):
        X = np.asarray(X, float)
        self.k_ = int(np.max(y)) + 1
        Y = one_hot(y, self.k_)
        self.W_, self.b_ = np.zeros((X.shape[1], self.k_)), np.zeros(self.k_)
        for _ in range(self.epochs):
            G = (self.predict_proba(X) - Y) / len(X)
            self.W_ -= self.lr * X.T @ G
            self.b_ -= self.lr * G.sum(0)
        return self

    def predict_proba(self, X):
        return softmax(np.asarray(X, float) @ self.W_ + self.b_)

    def predict(self, X):
        return self.predict_proba(X).argmax(1)
```

</details>

**Done when:** green — >94% on real wine.

---

[← Day 40](day40-classification-metrics.md) · [All 90 days](README.md) · [Day 42 →](day42-cross-validation.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
