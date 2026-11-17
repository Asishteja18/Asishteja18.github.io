# Day 31 — Vectors and matrices for ML

> **AI-90** · Block 2 · Machine learning from scratch · Day 31 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 31`)

[← Day 30](day30-block-1-capstone-automatic-eda-report-generator.md) · [All 90 days](README.md) · [Day 32 →](day32-derivatives-and-gradients.md)

---

**Dataset:** Iris (bundled) · **Time:** ~2 h

#### Visual

```text
 cosine similarity = how much two vectors point the same way
        b                     cos = a·b / (|a||b|)
       ／  θ small → cos ≈ 1    1 = same direction, 0 = unrelated, -1 = opposite
      ／___ a
 projection of b onto a:  (a·b / a·a) · a        ← the core of linear regression + PCA
 X (n×d) @ w (d,) → predictions (n,)              ← every linear model in one line
```

#### Notes

- A data row is a vector; a dataset is a matrix `X` with shape `(n_samples, n_features)`.
- Dot product `a @ b`; norm `np.linalg.norm(a)`; matrix product `X @ W` (Day 15, now 100× faster).
- Cosine similarity compares direction, ignoring length — used for search, embeddings and RAG (Day 86).
- `np.linalg.solve(A, b)` solves `A x = b`; never compute `inv(A) @ b` yourself (slower, less stable).

#### Your task — `day31.py`

- `cosine_similarity(a, b)` → float.
- `most_similar(X, query, k)` → indices of the k rows of `X` most cosine-similar to `query`, best first.
- `project(b, a)` → projection of `b` onto `a`.
- `linear_predict(X, w, b)` → `X @ w + b`.

#### Tests

```python
# file: test_day31.py
import numpy as np

import day31 as ex
from day23 import load_iris_xy


def test_cosine():
    assert ex.cosine_similarity([1, 0], [5, 0]) == 1.0
    assert abs(ex.cosine_similarity([1, 0], [0, 3])) < 1e-12
    assert np.isclose(ex.cosine_similarity([1, 1], [-1, -1]), -1)


def test_most_similar_on_iris():
    X, y = load_iris_xy()
    idx = ex.most_similar(X, X[0], 5)
    assert idx[0] == 0 and len(idx) == 5
    assert (y[idx] == 0).all(), "the flowers closest to a setosa are setosas"


def test_project():
    assert np.allclose(ex.project(np.array([2.0, 3]), np.array([1.0, 0])), [2, 0])


def test_linear_predict():
    X = np.array([[1.0, 2], [3, 4]])
    assert np.allclose(ex.linear_predict(X, np.array([1.0, -1]), 0.5), [-0.5, -0.5])
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day31.py
import numpy as np


def cosine_similarity(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))


def most_similar(X, query, k):
    X, q = np.asarray(X, float), np.asarray(query, float)
    sims = X @ q / (np.linalg.norm(X, axis=1) * np.linalg.norm(q))
    return np.argsort(-sims, kind="stable")[:k]


def project(b, a):
    return (a @ b) / (a @ a) * a


def linear_predict(X, w, b):
    return X @ w + b
```

</details>

**Done when:** green. Explain to yourself why cosine is better than raw distance for comparing documents of different lengths.

---

[← Day 30](day30-block-1-capstone-automatic-eda-report-generator.md) · [All 90 days](README.md) · [Day 32 →](day32-derivatives-and-gradients.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
