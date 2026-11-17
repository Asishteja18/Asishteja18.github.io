# Advanced 12 — Production ML: drift and experiment tracking

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 12 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 11](adv11-autoencoders-compression-you-can-train.md) · [All notes](README.md) · [Advanced 13 →](adv13-fairness-equal-errors-across-groups.md)

---

**Dataset:** synthetic training vs live feature columns · **Time:** ~2 h

**Progress:** `Advanced 12/13` · **System after today:** drift alarms + a run log you can trust

**Goal:** Notice when live data stops looking like training data, and keep a record of every experiment.

#### Visual

```text
  training data  ▁▃▆█▆▃▁            PSI per feature
  live (week 6)       ▁▃▆█▆▃▁       age     0.02  ✓ stable
                 ← shift →          income  0.61  ✗ drifted → retrain?
                                    visits  0.03  ✓
  runs.jsonl:  {"run": 3, "params": {...}, "metrics": {...}, "data": "a1b2c3"}
```

#### Notes

- Models fail quietly in production: the world changes, your training data doesn't. That's **data drift**.
- **PSI** (population stability index): bin the training column by quantiles, compare bin shares live vs train, sum `(a − e)·ln(a/e)`. Rule of thumb: < 0.1 stable, 0.1–0.25 watch, > 0.25 act.
- **KS statistic**: biggest gap between the two empirical CDFs. 0 = same, 1 = no overlap.
- Check every input feature *and* the model's output distribution. Label drift shows up later, when ground truth arrives.
- **Experiment tracking**: every run logs params, metrics and a **data hash**. "Which run was best, and on which data?" should be one line, not archaeology. MLflow and W&B do this at scale; JSONL is enough to start.
- Same data → same hash. Different data and same params is a different experiment.

#### Your task — `x12.py`

- `psi(expected, actual, bins=10)` and `ks_statistic(a, b)`.
- `drift_report(train, live, names, threshold=0.25)` → `{name: {"psi", "ks", "drift"}}`.
- `data_hash(X)` → 12-character fingerprint.
- `class Tracker(path)` with `log(params, metrics, data=None)`, `runs()`, `best(metric, higher=True)`.

#### Tests

```python
# file: test_x12.py
import os

import numpy as np

import x12 as ex


def test_psi_stable_vs_shifted():
    rng = np.random.default_rng(0)
    train = rng.normal(0, 1, 5000)
    assert ex.psi(train, rng.normal(0, 1, 5000)) < 0.1
    assert ex.psi(train, rng.normal(1, 1, 5000)) > 0.25


def test_ks():
    assert ex.ks_statistic([1, 2, 3], [1, 2, 3]) == 0
    assert ex.ks_statistic([0, 0, 0], [5, 5, 5]) == 1


def test_drift_report_flags_the_right_column():
    rng = np.random.default_rng(1)
    train = rng.normal(0, 1, (3000, 3))
    live = rng.normal(0, 1, (3000, 3)); live[:, 1] = live[:, 1] * 2 + 1
    rep = ex.drift_report(train, live, ["age", "income", "visits"])
    assert [k for k, v in rep.items() if v["drift"]] == ["income"]


def test_tracker_round_trip():
    path = "runs_test.jsonl"
    if os.path.exists(path):
        os.remove(path)
    t = ex.Tracker(path)
    X = np.arange(6.0).reshape(3, 2)
    t.log({"C": 0.1}, {"acc": 0.81}, data=X)
    t.log({"C": 1.0}, {"acc": 0.88}, data=X)
    t.log({"C": 10}, {"acc": 0.84}, data=X + 1)
    assert len(t.runs()) == 3 and t.best("acc")["params"] == {"C": 1.0}
    r = t.runs()
    assert r[0]["data"] == r[1]["data"] != r[2]["data"]
    os.remove(path)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x12.py
"""Advanced 12 — Production ML: drift detection and experiment tracking."""
import hashlib
import json

import numpy as np


def psi(expected, actual, bins=10):
    """Population stability index between a training column and a live column.
    Bins are quantiles of `expected`; < 0.1 stable, 0.1-0.25 watch, > 0.25 drifted."""
    expected, actual = np.asarray(expected, float), np.asarray(actual, float)
    edges = np.quantile(expected, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    e = np.histogram(expected, edges)[0] / len(expected)
    a = np.histogram(actual, edges)[0] / len(actual)
    e, a = np.maximum(e, 1e-6), np.maximum(a, 1e-6)
    return float(np.sum((a - e) * np.log(a / e)))


def ks_statistic(a, b):
    """Largest gap between the two empirical CDFs."""
    a, b = np.sort(np.asarray(a, float)), np.sort(np.asarray(b, float))
    grid = np.concatenate([a, b])
    ca = np.searchsorted(a, grid, side="right") / len(a)
    cb = np.searchsorted(b, grid, side="right") / len(b)
    return float(np.max(np.abs(ca - cb)))


def drift_report(train, live, names, threshold=0.25):
    """{name: {"psi": .., "ks": .., "drift": bool}} for every column."""
    train, live = np.asarray(train, float), np.asarray(live, float)
    out = {}
    for j, name in enumerate(names):
        p = psi(train[:, j], live[:, j])
        out[name] = {"psi": p, "ks": ks_statistic(train[:, j], live[:, j]), "drift": p > threshold}
    return out


def data_hash(X):
    """Short fingerprint of a dataset: same data -> same hash."""
    arr = np.ascontiguousarray(np.asarray(X, float))
    return hashlib.sha256(arr.tobytes() + str(arr.shape).encode()).hexdigest()[:12]


class Tracker:
    """Append one JSON line per run; find the best run later."""

    def __init__(self, path):
        self.path = path

    def log(self, params, metrics, data=None):
        row = {"run": len(self.runs()) + 1, "params": params, "metrics": metrics}
        if data is not None:
            row["data"] = data_hash(data)
        with open(self.path, "a") as f:
            f.write(json.dumps(row) + "\n")
        return row["run"]

    def runs(self):
        try:
            with open(self.path) as f:
                return [json.loads(line) for line in f if line.strip()]
        except FileNotFoundError:
            return []

    def best(self, metric, higher=True):
        runs = self.runs()
        return (max if higher else min)(runs, key=lambda r: r["metrics"][metric])
```

</details>

**Done when:** green + the report flags `income` and nothing else.

---

[← Advanced 11](adv11-autoencoders-compression-you-can-train.md) · [All notes](README.md) · [Advanced 13 →](adv13-fairness-equal-errors-across-groups.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
