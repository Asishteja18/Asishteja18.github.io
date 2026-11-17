# Day 47 — k-means clustering

> **AI-90** · Block 2 · Machine learning from scratch · Day 47 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 47`)

[← Day 46](day46-random-forests.md) · [All 90 days](README.md) · [Day 48 →](day48-pca-compressing-64-pixels-into-2.md)

---

**Dataset:** Iris without labels (then check against the real species) · **Time:** ~2 h

#### Visual

```text
 1 pick k centres (k-means++: spread out)      inertia vs k ("elbow")
 2 assign each point to nearest centre           │●
 3 move each centre to the mean of its points    │ ╲
 4 repeat until nothing changes                  │  ●╲_
   ✕   ● ●            ✕ = centre                 │     ●──●──●   ← elbow at k=3
 ● ● ✕ ●    ▲ ✕ ▲                                └────────────── k
```

#### Notes

- Unsupervised: no labels. The algorithm finds groups by distance.
- Result depends on the start → k-means++ initialisation + several restarts (`n_init`), keep the lowest **inertia** (sum of squared distances to assigned centre).
- Choose k with the elbow plot (or domain knowledge).
- Reuse Day 43's `pairwise_sq_dists`.

#### Your task — `day47.py`

- `kmeans_pp_init(X, k, rng)` → k initial centres.
- `class KMeans(k=3, n_init=5, max_iter=100, seed=0)` with `fit` (`centers_`, `labels_`, `inertia_`) and `predict`.
- `purity(labels, y)` → fraction of points whose cluster's majority true label matches theirs.

#### Tests

```python
# file: test_day47.py
import numpy as np

import day47 as ex
from day23 import load_iris_xy


def test_obvious_blobs():
    rng = np.random.default_rng(0)
    X = np.vstack([rng.normal(0, 0.1, (20, 2)), rng.normal(5, 0.1, (20, 2))])
    km = ex.KMeans(k=2, seed=0).fit(X)
    assert len(set(km.labels_[:20])) == 1 and km.labels_[0] != km.labels_[-1]
    assert np.array_equal(km.predict(X), km.labels_)


def test_iris_purity_and_elbow():
    X, y = load_iris_xy()
    km = ex.KMeans(k=3, seed=0).fit(X)
    assert ex.purity(km.labels_, y) > 0.85
    inertias = [ex.KMeans(k=k, seed=0).fit(X).inertia_ for k in (1, 2, 3, 4)]
    assert all(a > b for a, b in zip(inertias, inertias[1:]))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day47.py
import numpy as np

from day43 import pairwise_sq_dists


def kmeans_pp_init(X, k, rng):
    centers = [X[rng.integers(len(X))]]
    for _ in range(1, k):
        d2 = pairwise_sq_dists(X, np.array(centers)).min(1)
        centers.append(X[rng.choice(len(X), p=d2 / d2.sum())])
    return np.array(centers)


class KMeans:
    def __init__(self, k=3, n_init=5, max_iter=100, seed=0):
        self.k, self.n_init, self.max_iter, self.seed = k, n_init, max_iter, seed

    def _run(self, X, rng):
        C = kmeans_pp_init(X, self.k, rng)
        for _ in range(self.max_iter):
            labels = pairwise_sq_dists(X, C).argmin(1)
            newC = np.array([X[labels == j].mean(0) if np.any(labels == j) else C[j] for j in range(self.k)])
            if np.allclose(newC, C):
                break
            C = newC
        labels = pairwise_sq_dists(X, C).argmin(1)
        return C, labels, float(pairwise_sq_dists(X, C).min(1).sum())

    def fit(self, X):
        X = np.asarray(X, float)
        rng = np.random.default_rng(self.seed)
        self.centers_, self.labels_, self.inertia_ = min((self._run(X, rng) for _ in range(self.n_init)),
                                                         key=lambda r: r[2])
        return self

    def predict(self, X):
        return pairwise_sq_dists(X, self.centers_).argmin(1)


def purity(labels, y):
    labels, y = np.asarray(labels), np.asarray(y)
    return float(sum(np.bincount(y[labels == c]).max() for c in np.unique(labels)) / len(y))
```

</details>

**Done when:** green + elbow plot for iris k = 1…8.

---

[← Day 46](day46-random-forests.md) · [All 90 days](README.md) · [Day 48 →](day48-pca-compressing-64-pixels-into-2.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
