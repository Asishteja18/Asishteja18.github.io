# Day 57 — Learning curves: diagnosing bias vs variance

> **AI-90** · Block 2 · Machine learning from scratch · Day 57 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 57`)

[← Day 56](day56-saving-models-and-serving-predictions.md) · [All 90 days](README.md) · [Day 58 →](day58-project-predicting-car-fuel-efficiency.md)

---

**Dataset:** Digits · **Time:** ~2 h

#### Visual

```text
 accuracy                     HIGH BIAS (underfit)        HIGH VARIANCE (overfit)
 1.0 ┤ train ───────          train ────┐                 train ━━━━━━━━━━━━ 1.0
     │        ╲___                       ↓ both low          gap ↕ big
     │ val ___╱‾‾‾  converge   val ─────┘ → bigger model   val ────── → more data / regularise
     └──────────── training-set size
```

#### Notes

- Train on growing subsets; record train and validation scores.
- Both low and close → **high bias**: more features, bigger model.
- Train high, validation much lower → **high variance**: more data, regularisation, simpler model.
- This plot tells you what to do next — far better than guessing.

#### Your task — `day57.py`

- `learning_curve(make_model, X, y, sizes, seed=0)` → `(train_scores, val_scores)` lists; holds out a fixed 25% validation set (seeded), trains on the first `size` rows of the shuffled training part.
- `diagnose(train_score, val_score, target=0.9, gap=0.05)` → `"high bias"` if train < target; elif train − val > gap → `"high variance"`; else `"ok"`.

#### Tests

```python
# file: test_day57.py
from sklearn.datasets import load_digits

import day57 as ex
from day43 import KNNClassifier
from day45 import DecisionTree


def test_curve_shapes_and_trend():
    d = load_digits()
    tr, va = ex.learning_curve(lambda: KNNClassifier(3), d.data, d.target, [50, 200, 800])
    assert len(tr) == len(va) == 3 and va[-1] > va[0]


def test_diagnose():
    assert ex.diagnose(0.7, 0.68) == "high bias"
    assert ex.diagnose(1.0, 0.8) == "high variance"
    assert ex.diagnose(0.95, 0.93) == "ok"


def test_deep_tree_overfits_digits():
    d = load_digits()
    tr, va = ex.learning_curve(lambda: DecisionTree(max_depth=12), d.data, d.target, [600])
    assert ex.diagnose(tr[0], va[0]) == "high variance"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day57.py
import numpy as np


def learning_curve(make_model, X, y, sizes, seed=0):
    X, y = np.asarray(X), np.asarray(y)
    idx = np.random.default_rng(seed).permutation(len(y))
    n_val = len(y) // 4
    va, tr = idx[:n_val], idx[n_val:]
    train_scores, val_scores = [], []
    for s in sizes:
        part = tr[:s]
        m = make_model().fit(X[part], y[part])
        train_scores.append(float(np.mean(m.predict(X[part]) == y[part])))
        val_scores.append(float(np.mean(m.predict(X[va]) == y[va])))
    return train_scores, val_scores


def diagnose(train_score, val_score, target=0.9, gap=0.05):
    if train_score < target:
        return "high bias"
    if train_score - val_score > gap:
        return "high variance"
    return "ok"
```

</details>

**Done when:** green + plot the kNN and deep-tree curves on digits side by side.

---

[← Day 56](day56-saving-models-and-serving-predictions.md) · [All 90 days](README.md) · [Day 58 →](day58-project-predicting-car-fuel-efficiency.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
