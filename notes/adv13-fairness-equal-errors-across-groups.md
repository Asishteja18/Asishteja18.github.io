# Advanced 13 — Fairness: equal errors across groups

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 13 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 12](adv12-production-ml-drift-and-experiment-tracking.md) · [All notes](README.md)

---

**Dataset:** synthetic loan decisions with a biased score · **Time:** ~2 h

**Progress:** `Advanced 13/13` · **System after today:** fairness metrics + a per-group threshold fix

**Goal:** Measure how a model's errors differ between groups and close the gap in true-positive rate.

#### Visual

```text
             one threshold            per-group thresholds
  group A    TPR 0.85  ████████▌      TPR 0.80  ████████
  group B    TPR 0.45  ████▌          TPR 0.80  ████████
             gap 0.40 ✗               gap 0.00 ✓
  demographic parity: same approval rate · equal opportunity: same TPR
```

#### Notes

- A model can be accurate overall and still fail one group much more. Measure per group.
- **Demographic parity**: approval (selection) rates equal across groups. Ignores whether people actually qualify.
- **Equal opportunity**: **true-positive rates** equal; qualified people get approved at the same rate whatever their group.
- **Equalised odds**: equal TPR *and* FPR.
- These can't all hold at once when base rates differ. Choosing one is a product and ethics decision, not a maths one. Write it down.
- One cheap fix after training: **per-group thresholds** set to hit the same TPR. Others: re-weight training data, constrained training, and fixing the biased feature itself (best).
- Check the law where you deploy. Using a protected attribute at decision time can itself be illegal; you may only be allowed to use it to audit.
- This closes Advanced ML. Next: build the engine behind deep learning, and then a GPT.

#### Your task — `x13.py`

- `group_rates(y, pred, group)` → selection, TPR and FPR per group.
- `demographic_parity_diff(pred, group)` and `equal_opportunity_diff(y, pred, group)`.
- `thresholds_for_equal_tpr(scores, y, group, target_tpr=0.8)` and `apply_thresholds(scores, group, thresholds)`.

#### Tests

```python
# file: test_x13.py
import numpy as np

import x13 as ex


def _loans(seed=0, n=4000):
    """Same true skill in both groups, but group B's scores are squashed (a biased feature)."""
    rng = np.random.default_rng(seed)
    group = np.where(rng.random(n) < 0.5, "A", "B")
    y = (rng.random(n) < 0.4).astype(int)
    raw = y * 1.5 + rng.normal(0, 1, n)
    score = np.where(group == "A", raw, raw * 0.6 - 0.4)
    return score, y, group


def test_group_rates_tiny():
    r = ex.group_rates([1, 0, 1, 0], [1, 1, 0, 0], ["a", "a", "b", "b"])
    assert r["a"] == {"selection": 1.0, "tpr": 1.0, "fpr": 1.0}
    assert r["b"] == {"selection": 0.0, "tpr": 0.0, "fpr": 0.0}


def test_one_threshold_is_unfair():
    s, y, g = _loans()
    pred = (s >= 0.5).astype(int)
    assert ex.equal_opportunity_diff(y, pred, g) > 0.2
    assert ex.demographic_parity_diff(pred, g) > 0.1


def test_per_group_thresholds_fix_tpr():
    s, y, g = _loans()
    th = ex.thresholds_for_equal_tpr(s, y, g, 0.8)
    assert th["B"] < th["A"]
    pred = ex.apply_thresholds(s, g, th)
    assert ex.equal_opportunity_diff(y, pred, g) < 0.02
    for r in ex.group_rates(y, pred, g).values():
        assert abs(r["tpr"] - 0.8) < 0.01
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x13.py
"""Advanced 13 — Fairness: measuring and fixing unequal error rates."""
import numpy as np


def group_rates(y, pred, group):
    """{g: {"selection": P(pred=1), "tpr": P(pred=1 | y=1), "fpr": P(pred=1 | y=0)}}."""
    y, pred, group = map(np.asarray, (y, pred, group))
    out = {}
    for g in np.unique(group).tolist():
        m = group == g
        out[g] = {
            "selection": float(pred[m].mean()),
            "tpr": float(pred[m & (y == 1)].mean()),
            "fpr": float(pred[m & (y == 0)].mean()),
        }
    return out


def demographic_parity_diff(pred, group):
    """Biggest gap in selection rate between groups."""
    pred, group = np.asarray(pred), np.asarray(group)
    rates = [pred[group == g].mean() for g in np.unique(group)]
    return float(max(rates) - min(rates))


def equal_opportunity_diff(y, pred, group):
    """Biggest gap in true-positive rate between groups."""
    tprs = [r["tpr"] for r in group_rates(y, pred, group).values()]
    return float(max(tprs) - min(tprs))


def thresholds_for_equal_tpr(scores, y, group, target_tpr=0.8):
    """One threshold per group so each group's TPR is (just) at least target_tpr."""
    scores, y, group = map(np.asarray, (scores, y, group))
    out = {}
    for g in np.unique(group).tolist():
        pos = np.sort(scores[(group == g) & (y == 1)])[::-1]
        k = int(np.ceil(target_tpr * len(pos)))
        out[g] = float(pos[k - 1])
    return out


def apply_thresholds(scores, group, thresholds):
    scores, group = np.asarray(scores), np.asarray(group)
    return np.array([int(s >= thresholds[g]) for s, g in zip(scores, group)])
```

</details>

**Done when:** green + the TPR gap drops from over 0.2 to under 0.02.

---

[← Advanced 12](adv12-production-ml-drift-and-experiment-tracking.md) · [All notes](README.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
