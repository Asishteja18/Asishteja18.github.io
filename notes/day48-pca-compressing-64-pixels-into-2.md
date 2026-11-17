# Day 48 — PCA: compressing 64 pixels into 2

> **AI-90** · Block 2 · Machine learning from scratch · Day 48 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 48`)

[← Day 47](day47-k-means-clustering.md) · [All 90 days](README.md) · [Day 49 →](day49-feature-engineering-titanic-model-ready-matrix.md)

---

**Dataset:** Digits (1,797 handwritten 8×8 images) — bundled `load_digits` · **Time:** ~2 h

#### Visual

```text
 64-D pixel space ──PCA──▶ 2-D map you can plot
          ▲ PC2                 ■ 0s    ● 1s    ▲ 7s   …  similar digits cluster together
        ■■■   ●●                PC1 = direction of MOST variance
       ■■      ●●●  ▲▲          PC2 = most remaining variance, ⟂ PC1
             ▲▲▲     ─▶ PC1     X_centered = U S Vᵀ   →  components = rows of Vᵀ
```

#### Notes

- Centre the data, take the SVD; principal directions are the rows of `Vt`; variance explained ∝ `S²`.
- `transform(X) = (X − mean) @ Vt[:k].T`; `inverse_transform(Z) = Z @ Vt[:k] + mean` (lossy reconstruction).
- Uses: visualisation, compression, denoising, speeding up other models.
- Signs of components are arbitrary — compare with sklearn using absolute values.

#### Your task — `day48.py`

- `class PCA(n_components)` with `fit` (`mean_`, `components_`, `explained_variance_ratio_`), `transform`, `inverse_transform`.
- `n_for_variance(X, target)` → smallest k explaining ≥ `target` of variance.

#### Tests

```python
# file: test_day48.py
import numpy as np
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA as SkPCA

import day48 as ex


def test_matches_sklearn_on_digits():
    X = load_digits().data
    ours, sk = ex.PCA(5).fit(X), SkPCA(5).fit(X)
    assert np.allclose(ours.explained_variance_ratio_, sk.explained_variance_ratio_)
    assert np.allclose(np.abs(ours.components_), np.abs(sk.components_), atol=1e-6)


def test_reconstruction_improves_with_k():
    X = load_digits().data
    err = [np.mean((X - (p := ex.PCA(k).fit(X)).inverse_transform(p.transform(X))) ** 2) for k in (2, 10, 40)]
    assert err[0] > err[1] > err[2]


def test_n_for_variance():
    X = load_digits().data
    k = ex.n_for_variance(X, 0.9)
    assert 15 <= k <= 30
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day48.py
import numpy as np


class PCA:
    def __init__(self, n_components):
        self.n_components = n_components

    def fit(self, X):
        X = np.asarray(X, float)
        self.mean_ = X.mean(0)
        _, S, Vt = np.linalg.svd(X - self.mean_, full_matrices=False)
        var = S ** 2
        self.components_ = Vt[:self.n_components]
        self.explained_variance_ratio_ = var[:self.n_components] / var.sum()
        return self

    def transform(self, X):
        return (np.asarray(X, float) - self.mean_) @ self.components_.T

    def inverse_transform(self, Z):
        return Z @ self.components_ + self.mean_


def n_for_variance(X, target):
    ratios = PCA(min(np.shape(X))).fit(X).explained_variance_ratio_
    return int(np.searchsorted(np.cumsum(ratios), target) + 1)


if __name__ == "__main__":
    from sklearn.datasets import load_digits
    from day25 import plot_classes, save
    d = load_digits()
    Z = PCA(2).fit(d.data).transform(d.data)
    save(plot_classes(Z, d.target, [str(i) for i in range(10)], "PC1", "PC2"), "plots/digits_pca.png")
```

</details>

**Done when:** green + `plots/digits_pca.png` — which digits overlap?

---

[← Day 47](day47-k-means-clustering.md) · [All 90 days](README.md) · [Day 49 →](day49-feature-engineering-titanic-model-ready-matrix.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
