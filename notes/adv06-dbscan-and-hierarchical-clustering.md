# Advanced 6 — DBSCAN and hierarchical clustering

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 6 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 5](adv05-gaussian-mixtures-and-em-soft-clusters.md) · [All notes](README.md) · [Advanced 7 →](adv07-t-sne-maps-of-high-dimensional-data.md)

---

**Dataset:** make_moons + synthetic blobs with noise · **Time:** ~2 h

**Progress:** `Advanced 6/13` · **System after today:** clusters of any shape, plus noise detection

**Goal:** Cluster by density and by merging, so moons and odd shapes come out right.

#### Visual

```text
  DBSCAN (eps, min_pts)                agglomerative (bottom-up)
   ◉ core: ≥ min_pts within eps          start: every point alone
   ○ border: near a core                 repeat: merge the 2 closest
   ✕ noise: neither                      ┌──┴──┐
    ◉◉◉◉○          ✕                     ┌┴┐   ┌┴─┐     ← dendrogram
   ◉◉  ◉◉○   ◉◉◉◉                        a b   c  d e
  single = nearest pair · complete = farthest pair · average = mean
```

#### Notes

- k-means and GMMs assume blobs. Real clusters can be moons, rings or chains.
- **DBSCAN**: a point is **core** if at least `min_pts` points are within `eps`. Clusters grow by flooding from core to core; **border** points join but don't spread; the rest is **noise** (label −1). No k needed.
- Picking eps: plot each point's distance to its k-th neighbour, sorted; eps sits at the knee.
- **Agglomerative**: start with n clusters, merge the closest pair until k remain. "Closest" is the **linkage**:
  - single (nearest pair) follows chains, so it gets the moons right but can merge through a thin bridge;
  - complete (farthest pair) makes compact clusters;
  - average sits between them.
- The merge history is a **dendrogram**. Cut it at any height for any k.
- Naive agglomerative is O(n³). Fine for a few hundred points; real libraries are smarter.

#### Your task — `x06.py`

- `dbscan(X, eps, min_pts)` → labels, −1 for noise.
- `agglomerative(X, k, linkage="single")` with `"single"`, `"complete"` and `"average"`.

#### Tests

```python
# file: test_x06.py
import numpy as np
from sklearn.datasets import make_moons

import x06 as ex


def _agree(a, b):
    """Same partition up to renaming the clusters."""
    return all(len(set(b[a == c])) == 1 for c in set(a)) and len(set(a)) == len(set(b))


def test_dbscan_moons():
    X, y = make_moons(200, noise=0.05, random_state=0)
    labels = ex.dbscan(X, eps=0.2, min_pts=5)
    assert set(labels) - {-1} == {0, 1}
    keep = labels != -1
    assert _agree(labels[keep], y[keep])


def test_dbscan_noise():
    rng = np.random.default_rng(0)
    X = np.vstack([rng.normal(0, 0.1, (30, 2)), [[5, 5], [-5, 5]]])
    labels = ex.dbscan(X, eps=0.3, min_pts=4)
    assert labels[-1] == -1 and labels[-2] == -1 and len(set(labels[:30])) == 1


def test_single_linkage_follows_chains():
    X, y = make_moons(120, noise=0.04, random_state=1)
    assert _agree(ex.agglomerative(X, 2, "single"), y)


def test_complete_linkage_is_compact():
    rng = np.random.default_rng(2)
    X = np.vstack([rng.normal(c, 0.3, (20, 2)) for c in ([0, 0], [4, 0], [2, 4])])
    y = np.repeat([0, 1, 2], 20)
    for link in ("complete", "average"):
        assert _agree(ex.agglomerative(X, 3, link), y)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x06.py
"""Advanced 06 — Density and hierarchy: DBSCAN and agglomerative clustering."""
import numpy as np


def _d2(A, B):
    return ((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)


def dbscan(X, eps, min_pts):
    """Labels 0, 1, ... for clusters and -1 for noise."""
    X = np.asarray(X, float)
    near = _d2(X, X) <= eps * eps
    core = near.sum(1) >= min_pts
    labels = np.full(len(X), -1)
    c = 0
    for i in range(len(X)):
        if labels[i] != -1 or not core[i]:
            continue
        labels[i] = c
        stack = [i]
        while stack:
            p = stack.pop()
            if not core[p]:
                continue
            for q in np.where(near[p])[0]:
                if labels[q] == -1:
                    labels[q] = c
                    stack.append(q)
        c += 1
    return labels


def agglomerative(X, k, linkage="single"):
    """Merge the two closest clusters until k remain. Returns labels 0..k-1."""
    X = np.asarray(X, float)
    D = np.sqrt(_d2(X, X))
    clusters = [[i] for i in range(len(X))]
    agg = min if linkage == "single" else max
    while len(clusters) > k:
        best = None
        for a in range(len(clusters)):
            for b in range(a + 1, len(clusters)):
                if linkage == "average":
                    dist = D[np.ix_(clusters[a], clusters[b])].mean()
                else:
                    dist = agg(D[np.ix_(clusters[a], clusters[b])].ravel())
                if best is None or dist < best[0]:
                    best = (dist, a, b)
        _, a, b = best
        clusters[a] += clusters.pop(b)
    labels = np.empty(len(X), int)
    for j, members in enumerate(clusters):
        labels[members] = j
    return labels
```

</details>

**Done when:** green + DBSCAN recovers both moons and flags the far points as noise.

---

[← Advanced 5](adv05-gaussian-mixtures-and-em-soft-clusters.md) · [All notes](README.md) · [Advanced 7 →](adv07-t-sne-maps-of-high-dimensional-data.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
