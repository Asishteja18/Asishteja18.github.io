# Day 59 — Explaining models: permutation importance

> **AI-90** · Block 2 · Machine learning from scratch · Day 59 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 59`)

[← Day 58](day58-project-predicting-car-fuel-efficiency.md) · [All 90 days](README.md) · [Day 60 →](day60-block-2-capstone-minisklearn-benchmark.md)

---

**Dataset:** Car MPG / Titanic · **Time:** ~2 h

#### Visual

```text
 shuffle ONE column → how much does the score drop?
 weight        ████████████████████  0.41   ← model relies on it heavily
 model_year    ████████▌             0.17
 horsepower    ███                   0.06
 acceleration  ▏                     0.00   ← shuffling it changes nothing
```

#### Notes

- Model-agnostic: works for any model with `predict`.
- Shuffling breaks the link between that feature and the target while keeping its distribution.
- Measure on **validation** data. Repeat a few shuffles and average.
- Correlated features share importance (shuffling one, the model leans on its twin).

#### Your task — `day59.py`

- `permutation_importance(model, X, y, metric, n_repeats=5, seed=0)` → array of mean score drops per feature.
- `rank_features(importances, names)` → list of `(name, importance rounded 3)` sorted desc.

#### Tests

```python
# file: test_day59.py
import numpy as np

import day59 as ex
from day35 import r2
from day36 import LinearRegressionClosed


def test_finds_the_real_feature():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(300, 3))
    y = 5 * X[:, 0] + 0.5 * X[:, 2] + rng.normal(0, 0.1, 300)
    m = LinearRegressionClosed().fit(X, y)
    imp = ex.permutation_importance(m, X, y, r2)
    assert imp.argmax() == 0 and abs(imp[1]) < 0.01 and imp[2] > imp[1]
    assert ex.rank_features(imp, ["a", "b", "c"])[0][0] == "a"


def test_does_not_modify_input():
    X = np.arange(12, dtype=float).reshape(4, 3); y = X[:, 0]
    copy = X.copy()
    ex.permutation_importance(LinearRegressionClosed().fit(X, y), X, y, r2)
    assert np.array_equal(X, copy)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day59.py
import numpy as np


def permutation_importance(model, X, y, metric, n_repeats=5, seed=0):
    X = np.asarray(X, float)
    rng = np.random.default_rng(seed)
    base = metric(y, model.predict(X))
    out = np.zeros(X.shape[1])
    for j in range(X.shape[1]):
        drops = []
        for _ in range(n_repeats):
            Xp = X.copy()
            Xp[:, j] = rng.permutation(Xp[:, j])
            drops.append(base - metric(y, model.predict(Xp)))
        out[j] = np.mean(drops)
    return out


def rank_features(importances, names):
    return sorted(((n, round(float(v), 3)) for n, v in zip(names, importances)), key=lambda t: -t[1])
```

</details>

**Done when:** green + importance ranking for your real MPG gradient-boosting model.

---

[← Day 58](day58-project-predicting-car-fuel-efficiency.md) · [All 90 days](README.md) · [Day 60 →](day60-block-2-capstone-minisklearn-benchmark.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
