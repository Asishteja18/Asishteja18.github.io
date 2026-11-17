# Advanced 2 — Calibration: can you trust the probability?

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 2 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 1](adv01-lasso-letting-the-model-pick-its-features.md) · [All notes](README.md) · [Advanced 3 →](adv03-support-vector-machines-the-widest-street.md)

---

**Dataset:** synthetic over-confident scores (4,000 predictions) · **Time:** ~2 h

**Progress:** `Advanced 2/13` · **System after today:** probabilities that mean what they say

**Goal:** Measure whether a model's 80% really means 80%, then fix it with Platt scaling and isotonic regression.

#### Visual

```text
  fraction actually positive
  1 │                 ●  ╱
    │            ●   ╱        ● = over-confident model
    │        ●     ╱  ◆        ◆ = after Platt scaling
    │      ◆   ◆ ╱  ◆          ╱ = perfect calibration
    │  ● ◆   ◆ ╱
  0 └──────────────── 1  predicted probability
```

#### Notes

- A classifier can rank perfectly (great AUC) and still lie about confidence. If it says 0.9, nine in ten of those should be positive. That's **calibration**.
- **Reliability curve**: bin predictions by probability, plot mean predicted vs fraction positive per bin. On the diagonal = calibrated.
- **ECE** (expected calibration error): count-weighted average gap between those two. One number to track.
- **Brier score**: mean of `(p − y)²`. Lower is better; rewards both ranking and honesty.
- **Platt scaling**: fit `p = sigmoid(a·score + b)` on held-out data. Two parameters, so it can't overfit much. Over-confident models get `a < 1`.
- **Isotonic regression** (PAV, pool adjacent violators): the best non-decreasing fit. More flexible than Platt, needs more data.
- Where it matters: medical risk, credit, anything where a person acts on the number. Also before averaging models.

#### Your task — `x02.py`

- `brier(y, p)` → mean squared error of the probabilities.
- `reliability_curve(y, p, bins=10)` → (mean predicted, fraction positive, count) for each non-empty bin.
- `ece(y, p, bins=10)` → expected calibration error.
- `platt_fit(scores, y)` → (a, b); `platt_predict(scores, a, b)` → calibrated probabilities.
- `pav(y)` → closest non-decreasing sequence.

#### Tests

```python
# file: test_x02.py
import numpy as np

import x02 as ex


def _overconfident(n=4000, seed=0):
    rng = np.random.default_rng(seed)
    s = rng.normal(0, 3, n)                      # model scores
    y = (rng.random(n) < 1 / (1 + np.exp(-s / 3))).astype(float)   # truth is 3x less sure
    return s, y


def test_brier():
    assert ex.brier([1, 0, 1], [1, 0, 1]) == 0
    assert abs(ex.brier([1, 0], [0.5, 0.5]) - 0.25) < 1e-12


def test_reliability_curve():
    mp, fp, cnt = ex.reliability_curve([0, 0, 1, 1], [0.1, 0.12, 0.9, 0.95], bins=10)
    assert list(cnt) == [2, 2] and fp[0] == 0 and fp[-1] == 1


def test_platt_fixes_overconfidence():
    s, y = _overconfident()
    raw = 1 / (1 + np.exp(-s))
    a, b = ex.platt_fit(s, y)
    cal = ex.platt_predict(s, a, b)
    assert abs(a - 1 / 3) < 0.08, "Platt should learn to divide the scores by about 3"
    assert ex.ece(y, cal) < ex.ece(y, raw) / 2
    assert ex.brier(y, cal) < ex.brier(y, raw)


def test_pav():
    assert np.allclose(ex.pav([1, 3, 2, 4]), [1, 2.5, 2.5, 4])
    out = ex.pav([5, 1, 1, 1])
    assert np.allclose(out, [2, 2, 2, 2]) and np.all(np.diff(ex.pav(np.random.default_rng(1).random(50))) >= -1e-12)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x02.py
"""Advanced 02 — Probability calibration: reliability curves, Brier, Platt, isotonic."""
import numpy as np


def brier(y, p):
    """Mean squared error between probabilities and 0/1 outcomes."""
    return float(np.mean((np.asarray(p, float) - np.asarray(y, float)) ** 2))


def reliability_curve(y, p, bins=10):
    """For each non-empty bin of predicted probability: (mean predicted, fraction positive, count)."""
    y, p = np.asarray(y, float), np.asarray(p, float)
    idx = np.minimum((p * bins).astype(int), bins - 1)
    mp, fp, cnt = [], [], []
    for b in range(bins):
        m = idx == b
        if m.any():
            mp.append(p[m].mean()); fp.append(y[m].mean()); cnt.append(int(m.sum()))
    return np.array(mp), np.array(fp), np.array(cnt)


def ece(y, p, bins=10):
    """Expected calibration error: count-weighted gap between confidence and accuracy."""
    mp, fp, cnt = reliability_curve(y, p, bins)
    return float(np.sum(cnt * np.abs(mp - fp)) / cnt.sum())


def _sigmoid(z):
    return 1 / (1 + np.exp(-z))


def platt_fit(scores, y, iters=3000, lr=0.5):
    """Fit p = sigmoid(a * score + b) by gradient descent on log loss. Returns (a, b)."""
    s, y = np.asarray(scores, float), np.asarray(y, float)
    a, b = 1.0, 0.0
    for _ in range(iters):
        g = _sigmoid(a * s + b) - y
        a -= lr * np.mean(g * s)
        b -= lr * np.mean(g)
    return a, b


def platt_predict(scores, a, b):
    return _sigmoid(a * np.asarray(scores, float) + b)


def pav(y):
    """Pool adjacent violators: the closest non-decreasing sequence to y (isotonic regression)."""
    blocks = [[float(v), 1] for v in y]       # [mean, size]
    i = 0
    while i < len(blocks) - 1:
        if blocks[i][0] > blocks[i + 1][0]:
            m1, n1 = blocks[i]; m2, n2 = blocks[i + 1]
            blocks[i] = [(m1 * n1 + m2 * n2) / (n1 + n2), n1 + n2]
            del blocks[i + 1]
            i = max(i - 1, 0)
        else:
            i += 1
    out = []
    for m, n in blocks:
        out += [m] * n
    return np.array(out)
```

</details>

**Done when:** green + ECE drops by more than half after Platt scaling.

---

[← Advanced 1](adv01-lasso-letting-the-model-pick-its-features.md) · [All notes](README.md) · [Advanced 3 →](adv03-support-vector-machines-the-widest-street.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
