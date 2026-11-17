# Day 33 — Gradient descent

> **AI-90** · Block 2 · Machine learning from scratch · Day 33 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 33`)

[← Day 32](day32-derivatives-and-gradients.md) · [All 90 days](README.md) · [Day 34 →](day34-probability-and-statistics-for-ml.md)

---

**Dataset:** none (a 2-D bowl), then real data from Day 37 on · **Time:** ~2 h

#### Visual

```text
 contour of f(x,y) = x² + 10y²          lr too small: crawls
        ╭─────────────╮                  lr good:      ●→●→●→◎
     ╭──┤  ╭───────╮  ├──╮               lr too big:   ●↗ ↙● ↗  ↙ diverges
     │  │  │   ◎   │  │  │  ◎ = minimum
     ╰──┤  ╰───────╯  ├──╯
        ╰─────────────╯     update rule:  x ← x − lr · ∇f(x)
```

#### Notes

- Gradient descent: start somewhere, step against the gradient, repeat. Every neural net trains this way.
- Learning rate `lr`: too small = slow; too big = overshoot / diverge. Diagnose with a loss curve.
- Stop when the gradient is tiny (`‖∇f‖ < tol`) or after `max_steps`.
- Elongated bowls (very different curvature per direction) make GD zig-zag → why we standardise features (Day 34) and why Adam exists (Day 69).

#### Your task — `day33.py`

- `gradient_descent(grad, x0, lr, steps, tol=1e-8)` → `(x_final, path)` where `path` is a list of arrays including `x0`; stop early when `‖grad‖ < tol`.
- `bowl(v)` = `v[0]**2 + 10*v[1]**2` and `bowl_grad(v)`.
- `plot_path(path)` → Matplotlib Figure: contour of `bowl` plus the path.

#### Tests

```python
# file: test_day33.py
import matplotlib
matplotlib.use("Agg")
import numpy as np  # noqa: E402

import day33 as ex  # noqa: E402


def test_converges():
    x, path = ex.gradient_descent(ex.bowl_grad, np.array([3.0, 2.0]), lr=0.05, steps=500)
    assert np.allclose(x, 0, atol=1e-3)
    assert np.allclose(path[0], [3, 2]) and len(path) > 2


def test_early_stop():
    x, path = ex.gradient_descent(ex.bowl_grad, np.array([0.0, 0.0]), lr=0.05, steps=100)
    assert len(path) == 1


def test_diverges_with_big_lr():
    x, _ = ex.gradient_descent(ex.bowl_grad, np.array([1.0, 1.0]), lr=0.2, steps=50)
    assert ex.bowl(x) > 1e6


def test_plot():
    _, path = ex.gradient_descent(ex.bowl_grad, np.array([3.0, 2.0]), lr=0.05, steps=50)
    fig = ex.plot_path(path)
    assert len(fig.axes) >= 1 and len(fig.axes[0].lines) >= 1
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day33.py
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402


def bowl(v):
    return v[0] ** 2 + 10 * v[1] ** 2


def bowl_grad(v):
    return np.array([2 * v[0], 20 * v[1]])


def gradient_descent(grad, x0, lr, steps, tol=1e-8):
    x = np.asarray(x0, float).copy()
    path = [x.copy()]
    for _ in range(steps):
        g = grad(x)
        if np.linalg.norm(g) < tol:
            break
        x = x - lr * g
        path.append(x.copy())
    return x, path


def plot_path(path):
    P = np.array(path)
    xs, ys = np.meshgrid(np.linspace(-3.5, 3.5, 200), np.linspace(-2.5, 2.5, 200))
    fig, ax = plt.subplots()
    ax.contour(xs, ys, xs ** 2 + 10 * ys ** 2, levels=20, linewidths=0.6)
    ax.plot(P[:, 0], P[:, 1], "o-", ms=3)
    ax.set_title(f"gradient descent: {len(P) - 1} steps"); ax.set_xlabel("x"); ax.set_ylabel("y")
    return fig


if __name__ == "__main__":
    from day25 import save
    for lr in (0.01, 0.05, 0.095):
        _, path = gradient_descent(bowl_grad, np.array([3.0, 2.0]), lr=lr, steps=60)
        save(plot_path(path), f"plots/gd_lr{lr}.png")
```

</details>

**Done when:** green + three plots for different learning rates. Which lr zig-zags?

---

[← Day 32](day32-derivatives-and-gradients.md) · [All 90 days](README.md) · [Day 34 →](day34-probability-and-statistics-for-ml.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
