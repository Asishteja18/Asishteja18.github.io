# Advanced 9 — Recommender systems: matrix factorisation

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 9 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 8](adv08-anomaly-detection-finding-the-odd-ones-out.md) · [All notes](README.md) · [Advanced 10 →](adv10-reinforcement-learning-bandits-and-q-learning.md)

---

**Dataset:** synthetic users × items with hidden tastes (30% of ratings seen) · **Time:** ~2 h

**Progress:** `Advanced 9/13` · **System after today:** a recommender that fills in missing ratings

**Goal:** Learn a small taste vector for every user and item, then recommend what's missing.

#### Visual

```text
        items →                  ≈   users × k     ·   k × items
  u1  [ 5  ?  1  ?  4 ]               [0.9 −0.2]       [ 1.1  … ]
  u2  [ ?  2  ?  5  ? ]               [−0.5 1.1]   ·   [−0.3  … ]
  u3  [ 4  ?  ?  1  ? ]               [ …  …  ]
  r̂ = μ + b_user + b_item + p_user · q_item       ? = predict these
```

#### Notes

- A ratings table is mostly empty. **Collaborative filtering** fills it using people with similar taste.
- **Matrix factorisation**: give each user a vector p and each item a vector q (k numbers, e.g. "action-ness", "romance-ness"; the model invents them). Rating ≈ p · q.
- Add **biases**: global mean μ, user bias (harsh rater?), item bias (just a good film?). Biases alone beat many fancy models.
- Train with **SGD on observed ratings only**: error `e = r − r̂`, then nudge `b_u, b_i, p_u, q_i` along e, with L2 regularisation.
- Evaluate on **held-out ratings** with RMSE; the global mean is your baseline.
- **Recommend** = highest predicted unseen items. Never re-recommend what they've seen.
- Real systems add implicit feedback (clicks), cold-start fallbacks and two-tower neural nets; same core idea.

#### Your task — `x09.py`

- `mf_train(ratings, n_users, n_items, k=8, epochs=40, lr=0.02, reg=0.05)` → model dict with `mu`, `bu`, `bi`, `P`, `Q`.
- `mf_predict(model, u, i)`, `rmse(model, ratings)`.
- `recommend(model, u, seen, n=5)` → top unseen item ids.

#### Tests

```python
# file: test_x09.py
import numpy as np

import x09 as ex


def _world(seed=0, users=60, items=40, k=3):
    """Hidden tastes -> ratings 1..5. We see 30% of them."""
    rng = np.random.default_rng(seed)
    U, V = rng.normal(0, 1, (users, k)), rng.normal(0, 1, (items, k))
    full = np.clip(3 + U @ V.T * 0.8, 1, 5)
    seen = rng.random((users, items)) < 0.3
    obs = [(u, i, full[u, i]) for u in range(users) for i in range(items) if seen[u, i]]
    hid = [(u, i, full[u, i]) for u in range(users) for i in range(items) if not seen[u, i]]
    return obs, hid, full, seen


def test_beats_the_average():
    obs, hid, _, _ = _world()
    m = ex.mf_train(obs, 60, 40, k=3, epochs=60)
    mean_rmse = np.sqrt(np.mean([(r - m["mu"]) ** 2 for _, _, r in hid]))
    assert ex.rmse(m, obs) < 0.5
    assert ex.rmse(m, hid) < 0.8 * mean_rmse, "must predict unseen ratings better than the global mean"


def test_recommend_skips_seen_and_finds_good_items():
    obs, _, full, seen = _world(1)
    m = ex.mf_train(obs, 60, 40, k=3, epochs=60)
    u = 0
    already = np.where(seen[u])[0].tolist()
    recs = ex.recommend(m, u, already, n=5)
    assert len(recs) == 5 and not set(recs) & set(already)
    unseen = [i for i in range(40) if i not in already]
    assert full[u, recs].mean() > np.mean(full[u, unseen])
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x09.py
"""Advanced 09 — Recommender systems: matrix factorisation with SGD."""
import numpy as np


def mf_train(ratings, n_users, n_items, k=8, epochs=40, lr=0.02, reg=0.05, seed=0):
    """ratings: list of (user, item, rating). Learns r ~ mu + bu + bi + P[u].Q[i]."""
    rng = np.random.default_rng(seed)
    R = np.asarray(ratings, float)
    model = {
        "mu": float(R[:, 2].mean()),
        "bu": np.zeros(n_users), "bi": np.zeros(n_items),
        "P": rng.normal(0, 0.1, (n_users, k)), "Q": rng.normal(0, 0.1, (n_items, k)),
    }
    P, Q, bu, bi = model["P"], model["Q"], model["bu"], model["bi"]
    for _ in range(epochs):
        for idx in rng.permutation(len(R)):
            u, i, r = int(R[idx, 0]), int(R[idx, 1]), R[idx, 2]
            err = r - (model["mu"] + bu[u] + bi[i] + P[u] @ Q[i])
            bu[u] += lr * (err - reg * bu[u])
            bi[i] += lr * (err - reg * bi[i])
            P[u], Q[i] = P[u] + lr * (err * Q[i] - reg * P[u]), Q[i] + lr * (err * P[u] - reg * Q[i])
    return model


def mf_predict(model, u, i):
    return float(model["mu"] + model["bu"][u] + model["bi"][i] + model["P"][u] @ model["Q"][i])


def rmse(model, ratings):
    return float(np.sqrt(np.mean([(r - mf_predict(model, int(u), int(i))) ** 2 for u, i, r in ratings])))


def recommend(model, u, seen, n=5):
    """Top-n unseen item ids for user u, best first."""
    scores = model["mu"] + model["bu"][u] + model["bi"] + model["Q"] @ model["P"][u]
    order = [int(i) for i in np.argsort(-scores) if int(i) not in set(seen)]
    return order[:n]
```

</details>

**Done when:** green + held-out RMSE at least 20% better than predicting the mean.

---

[← Advanced 8](adv08-anomaly-detection-finding-the-odd-ones-out.md) · [All notes](README.md) · [Advanced 10 →](adv10-reinforcement-learning-bandits-and-q-learning.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
