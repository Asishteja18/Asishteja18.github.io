# Advanced 10 — Reinforcement learning: bandits and Q-learning

> **AI-90** · Block 2.5 · Advanced ML: beyond the basics · Advanced 10 of 13  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · source: [AI90_PLUS.md](../syllabus/AI90_PLUS.md)

[← Advanced 9](adv09-recommender-systems-matrix-factorisation.md) · [All notes](README.md) · [Advanced 11 →](adv11-autoencoders-compression-you-can-train.md)

---

**Dataset:** simulated slot machines + a 4×4 grid world · **Time:** ~2–3 h

**Progress:** `Advanced 10/13` · **System after today:** agents that learn from rewards

**Goal:** Balance exploring and exploiting, then teach an agent to cross a grid without falling in a hole.

#### Visual

```text
  bandit: which arm pays most?     grid world (Q-learning)
   arm  0    1    2    3            S → → ↓ .      S start, G goal (+1)
   p   .20  .50  .75  .40           . H . ↓ .      H hole (−1)
   ε-greedy: random ε of the time   . . . ↓ H      arrows = argmax Q
   UCB: est + √(2 ln t / n)         H . . → G
  Q(s,a) ← Q(s,a) + α·(r + γ·max Q(s′) − Q(s,a))
```

#### Notes

- No labels here, only **rewards**. The agent must try things to learn what works.
- **Multi-armed bandit**: k machines, unknown payouts. **Explore** (try others) vs **exploit** (pull the best so far).
  - **ε-greedy**: random arm with probability ε, else the best estimate.
  - **UCB1**: pick the arm with the highest `estimate + √(2 ln t / n)`. The bonus shrinks as an arm is tried; optimism drives exploration.
  - Running mean: `est += (r − est)/n`. No list needed.
- **MDP**: states, actions, rewards, and a **discount** γ (future reward is worth a bit less).
- **Q-learning**: Q(s, a) = expected future reward. Update towards `r + γ·max Q(s′, ·)`. It learns the *optimal* policy even while acting ε-greedily (off-policy).
- The small step cost (−0.01) makes shorter paths better.
- Same ideas power A/B tests, ad placement, game agents, and the RLHF that tuned chat models (Day 88 territory).

#### Your task — `x10.py`

- `class Bandit(probs, seed)` with `pull(a)`.
- `epsilon_greedy(bandit, steps, eps=0.1)` and `ucb1(bandit, steps)` → (estimates, counts, total reward).
- `class GridWorld` with `reset()` and `step(a)` → (state, reward, done).
- `q_learning(env, episodes=500, alpha=0.5, gamma=0.95, eps=0.2)` → Q of shape (4, 4, 4).
- `greedy_path(env, Q)` → list of states.

#### Tests

```python
# file: test_x10.py
import numpy as np

import x10 as ex

PROBS = [0.2, 0.5, 0.75, 0.4]


def test_epsilon_greedy_finds_best_arm():
    est, n, total = ex.epsilon_greedy(ex.Bandit(PROBS, 0), 3000, eps=0.1)
    assert np.argmax(n) == 2 and abs(est[2] - 0.75) < 0.05
    assert total > 0.65 * 3000


def test_ucb_explores_then_commits():
    est, n, total = ex.ucb1(ex.Bandit(PROBS, 1), 3000)
    assert n.min() >= 1 and np.argmax(n) == 2 and n[2] > 0.7 * 3000


def test_gridworld_rules():
    env = ex.GridWorld()
    env.reset()
    assert env.step(0) == ((0, 0), -0.01, False), "bumping the wall keeps you in place"
    env.pos = (3, 2)
    assert env.step(3) == ((3, 3), 1.0, True)


def test_q_learning_reaches_goal_safely():
    env = ex.GridWorld()
    Q = ex.q_learning(env, episodes=800)
    path = ex.greedy_path(env, Q)
    assert path[-1] == (3, 3) and not set(path) & env.holes
    assert len(path) - 1 == 6, "the shortest safe route is 6 moves"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: x10.py
"""Advanced 10 — Learning from rewards: bandits and Q-learning."""
import numpy as np


class Bandit:
    """k slot machines; arm a pays 1 with probability probs[a]."""

    def __init__(self, probs, seed=0):
        self.probs = np.asarray(probs, float)
        self.rng = np.random.default_rng(seed)

    def pull(self, a):
        return float(self.rng.random() < self.probs[a])


def epsilon_greedy(bandit, steps, eps=0.1, seed=0):
    """Returns (estimates, counts, total reward)."""
    rng = np.random.default_rng(seed)
    k = len(bandit.probs)
    est, n, total = np.zeros(k), np.zeros(k), 0.0
    for _ in range(steps):
        a = rng.integers(k) if rng.random() < eps else int(np.argmax(est))
        r = bandit.pull(a)
        n[a] += 1
        est[a] += (r - est[a]) / n[a]
        total += r
    return est, n, total


def ucb1(bandit, steps):
    k = len(bandit.probs)
    est, n, total = np.zeros(k), np.zeros(k), 0.0
    for t in range(steps):
        a = t if t < k else int(np.argmax(est + np.sqrt(2 * np.log(t + 1) / n)))
        r = bandit.pull(a)
        n[a] += 1
        est[a] += (r - est[a]) / n[a]
        total += r
    return est, n, total


class GridWorld:
    """4x4 grid. Start (0,0), goal (3,3) gives +1, holes give -1, each step costs 0.01."""
    MOVES = [(-1, 0), (1, 0), (0, -1), (0, 1)]   # up, down, left, right

    def __init__(self, holes=((1, 1), (2, 3), (3, 0))):
        self.holes = set(holes)
        self.size, self.goal = 4, (3, 3)

    def reset(self):
        self.pos = (0, 0)
        return self.pos

    def step(self, a):
        dr, dc = self.MOVES[a]
        r, c = self.pos
        self.pos = (min(max(r + dr, 0), 3), min(max(c + dc, 0), 3))
        if self.pos == self.goal:
            return self.pos, 1.0, True
        if self.pos in self.holes:
            return self.pos, -1.0, True
        return self.pos, -0.01, False


def q_learning(env, episodes=500, alpha=0.5, gamma=0.95, eps=0.2, seed=0):
    """Q[row, col, action] learned by Q(s,a) += alpha (r + gamma max Q(s') - Q(s,a))."""
    rng = np.random.default_rng(seed)
    Q = np.zeros((4, 4, 4))
    for _ in range(episodes):
        s, done, steps = env.reset(), False, 0
        while not done and steps < 100:
            a = rng.integers(4) if rng.random() < eps else int(np.argmax(Q[s]))
            s2, r, done = env.step(a)
            target = r if done else r + gamma * Q[s2].max()
            Q[s][a] += alpha * (target - Q[s][a])
            s, steps = s2, steps + 1
    return Q


def greedy_path(env, Q, max_steps=20):
    s, path = env.reset(), [env.reset()]
    for _ in range(max_steps):
        s, _, done = env.step(int(np.argmax(Q[s])))
        path.append(s)
        if done:
            break
    return path
```

</details>

**Done when:** green + the greedy path reaches G in 6 moves without touching a hole.

---

[← Advanced 9](adv09-recommender-systems-matrix-factorisation.md) · [All notes](README.md) · [Advanced 11 →](adv11-autoencoders-compression-you-can-train.md)

<sub>Generated from `syllabus/AI90_PLUS.md` by `tools/build_notes.py`.</sub>
