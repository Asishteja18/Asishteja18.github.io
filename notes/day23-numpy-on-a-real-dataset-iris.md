# Day 23 — NumPy on a real dataset: Iris

> **AI-90** · Block 1 · Python + automation + real data · Day 23 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 23`)

[← Day 22](day22-real-dataset-1-titanic-by-hand.md) · [All 90 days](README.md) · [Day 24 →](day24-pandas-on-real-data-cleaning-titanic.md)

---

**Dataset:** Iris (150 flowers × 4 measurements, 3 species) — bundled: `sklearn.datasets.load_iris()` · **Time:** ~2 h

#### Visual

```text
 X shape (150, 4)        y shape (150,)
 ┌ sepal_len sepal_w petal_len petal_w ┐      [0 0 … 1 1 … 2 2]
 │   5.1      3.5      1.4      0.2    │ ← one flower = one row
 │   …                                 │
 └                                     ┘
 axis=0 ↓ (down the rows → per-column stats)   axis=1 → (across a row)
 nearest centroid:  ● new flower → distance to each class mean → pick closest
```

#### Notes

- `np.array`, `.shape`, `.dtype`; `X.mean(axis=0)` = one mean per column.
- **Broadcasting:** `(150,4) - (4,)` subtracts the column means from every row — no loop.
- Boolean masks: `X[y == 0]` = all rows of class 0.
- Distances to many centroids at once: `((X[:, None, :] - C[None, :, :]) ** 2).sum(-1)` → shape `(n_samples, n_classes)`; then `argmin(axis=1)`.
- This is your first classifier — no ML library, ~95% accuracy.

#### Your task — `day23.py`

- `load_iris_xy()` → `(X, y)` NumPy arrays.
- `standardize(X)` → zero-mean, unit-std columns.
- `class_means(X, y)` → array `(n_classes, n_features)`.
- `nearest_centroid_predict(X, centroids)` → predicted class per row.
- `accuracy(y_true, y_pred)` → float.

#### Tests

```python
# file: test_day23.py
import numpy as np

import day23 as ex


def test_load():
    X, y = ex.load_iris_xy()
    assert X.shape == (150, 4) and y.shape == (150,) and set(y) == {0, 1, 2}


def test_standardize():
    Z = ex.standardize(np.array([[1.0, 10], [3, 30]]))
    assert np.allclose(Z.mean(0), 0) and np.allclose(Z.std(0), 1)


def test_class_means():
    X = np.array([[0.0, 0], [2, 2], [10, 10]]); y = np.array([0, 0, 1])
    assert np.allclose(ex.class_means(X, y), [[1, 1], [10, 10]])


def test_nearest_centroid_on_real_iris():
    X, y = ex.load_iris_xy()
    pred = ex.nearest_centroid_predict(X, ex.class_means(X, y))
    assert pred.shape == (150,)
    assert ex.accuracy(y, pred) > 0.9
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day23.py
import numpy as np
from sklearn.datasets import load_iris


def load_iris_xy():
    d = load_iris()
    return d.data, d.target


def standardize(X):
    return (X - X.mean(axis=0)) / X.std(axis=0)


def class_means(X, y):
    return np.array([X[y == c].mean(axis=0) for c in np.unique(y)])


def nearest_centroid_predict(X, centroids):
    d2 = ((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=-1)
    return d2.argmin(axis=1)


def accuracy(y_true, y_pred):
    return float((np.asarray(y_true) == np.asarray(y_pred)).mean())
```

</details>

**Done when:** green. Print the accuracy — you just built a classifier from scratch on real data.

---

[← Day 22](day22-real-dataset-1-titanic-by-hand.md) · [All 90 days](README.md) · [Day 24 →](day24-pandas-on-real-data-cleaning-titanic.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
