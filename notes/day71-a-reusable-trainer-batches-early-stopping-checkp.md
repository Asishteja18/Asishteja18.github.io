# Day 71 — A reusable trainer: batches, early stopping, checkpoints

> **AI-90** · Block 3 · Build an AI from scratch · Day 71 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 71`)

[← Day 70](day70-layernorm-and-dropout.md) · [All 90 days](README.md) · [Day 72 →](day72-convolution-from-scratch.md)

---

**Dataset:** Digits · **Time:** ~2 h
**Progress:** `[███████████░░░░░░░░░░░░░░░░░░░] 11/30` · **System after today:** a training framework — load data, train, validate, stop early, save, reload.

#### Visual

```text
 epoch  train_loss  val_loss
   1      1.21       0.62
   2      0.41       0.31  ← best so far → save
   3      0.25       0.24  ← best → save
   4      0.17       0.25    patience 1/2
   5      0.12       0.27    patience 2/2 → STOP, restore best weights
```

#### Notes

- Every project repeats the same loop. Write it once: `DataLoader` (shuffled batches), `fit(...)` with validation each epoch.
- Early stopping: stop when validation loss hasn't improved for `patience` epochs; restore the best weights.
- Save parameters with `np.savez` (ordered list from `parameters()`); load back into an identically-built model.

#### Your task — `day71.py`

- `class DataLoader(X, y, batch_size=64, shuffle=True, seed=0)` — iterable of `(xb, yb)`; reshuffles each epoch.
- `fit(model, opt, train_loader, val_data, epochs, patience=3)` → history list of dicts `{epoch, train_loss, val_loss}`; restores the best weights.
- `save_params(model, path)` / `load_params(model, path)`.

#### Tests

```python
# file: test_day71.py
import tempfile
from pathlib import Path

import numpy as np
from sklearn.datasets import load_digits

import day71 as ex
from day34 import StandardScaler
from day35 import train_test_split
from day66 import Tensor
from day68 import Linear, ReLU, Sequential
from day69 import Adam


def test_loader():
    dl = ex.DataLoader(np.arange(10)[:, None], np.arange(10), batch_size=4, seed=0)
    batches = list(dl)
    assert [len(b[1]) for b in batches] == [4, 4, 2]
    assert sorted(np.concatenate([b[1] for b in batches])) == list(range(10))
    assert not np.array_equal(np.concatenate([b[1] for b in dl]), np.concatenate([b[1] for b in batches]))


def test_fit_early_stop_and_checkpoint():
    d = load_digits()
    Xtr, Xva, ytr, yva = train_test_split(d.data, d.target, seed=0)
    s = StandardScaler().fit(Xtr)
    model = Sequential(Linear(64, 64), ReLU(), Linear(64, 10, seed=1))
    hist = ex.fit(model, Adam(model.parameters(), lr=1e-2), ex.DataLoader(s.transform(Xtr), ytr),
                  (s.transform(Xva), yva), epochs=40, patience=2)
    assert len(hist) < 40, "should stop early"
    best = min(h["val_loss"] for h in hist)
    from day67 import cross_entropy
    assert np.isclose(cross_entropy(model(Tensor(s.transform(Xva))), yva).data, best)
    path = Path(tempfile.mkdtemp()) / "m.npz"
    ex.save_params(model, path)
    fresh = Sequential(Linear(64, 64, seed=5), ReLU(), Linear(64, 10, seed=6))
    ex.load_params(fresh, path)
    assert all(np.array_equal(a.data, b.data) for a, b in zip(model.parameters(), fresh.parameters()))
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day71.py
"""tinytorch, part 6 — DataLoader, fit loop with early stopping, checkpoints."""
import numpy as np

from day66 import Tensor
from day67 import cross_entropy


class DataLoader:
    def __init__(self, X, y, batch_size=64, shuffle=True, seed=0):
        self.X, self.y, self.bs, self.shuffle = np.asarray(X), np.asarray(y), batch_size, shuffle
        self.rng = np.random.default_rng(seed)

    def __iter__(self):
        idx = self.rng.permutation(len(self.y)) if self.shuffle else np.arange(len(self.y))
        for i in range(0, len(idx), self.bs):
            b = idx[i:i + self.bs]
            yield self.X[b], self.y[b]


def fit(model, opt, train_loader, val_data, epochs, patience=3):
    Xv, yv = val_data
    history, best, best_params, waited = [], np.inf, None, 0
    for epoch in range(1, epochs + 1):
        model.train()
        losses = []
        for xb, yb in train_loader:
            loss = cross_entropy(model(Tensor(xb)), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
            losses.append(float(loss.data))
        model.eval()
        val = float(cross_entropy(model(Tensor(Xv)), yv).data)
        history.append({"epoch": epoch, "train_loss": float(np.mean(losses)), "val_loss": val})
        if val < best:
            best, waited = val, 0
            best_params = [p.data.copy() for p in model.parameters()]
        else:
            waited += 1
            if waited >= patience:
                break
    for p, saved in zip(model.parameters(), best_params):
        p.data[...] = saved
    return history


def save_params(model, path):
    np.savez(path, *[p.data for p in model.parameters()])


def load_params(model, path):
    with np.load(path) as f:
        for i, p in enumerate(model.parameters()):
            p.data[...] = f[f"arr_{i}"]
```

</details>

**Done when:** green. Your engine now has the same training workflow as a real framework.

---

[← Day 70](day70-layernorm-and-dropout.md) · [All 90 days](README.md) · [Day 72 →](day72-convolution-from-scratch.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
