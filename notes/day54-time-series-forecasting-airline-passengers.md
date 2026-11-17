# Day 54 — Time series: forecasting airline passengers

> **AI-90** · Block 2 · Machine learning from scratch · Day 54 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 54`)

[← Day 53](day53-imbalanced-data-and-decision-thresholds.md) · [All 90 days](README.md) · [Day 55 →](day55-text-as-numbers-bag-of-words-and-tf-idf.md)

---

**Dataset:** Flights 1949–1960 (144 months) — and later your own Day 29 weather CSV · **Time:** ~2 h

#### Visual

```text
 passengers                                            ╱╲
 600 ┤                                      ╱╲  ╱╲  ╱  ╲
 400 ┤                     ╱╲  ╱╲  ╱╲  ╱╲ ╱  ╲╱  ╲╱
 200 ┤ ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱  ╲╱  ╲╱  ╲╱    trend ↑ + yearly season
     └─────────────────────────────────────────────── month
 NEVER shuffle a time series:  [──── train (past) ────][─ test (future) ─]
 lag features: predict y_t from y_{t-1}, y_{t-12}, …   seasonal naive: ŷ_t = y_{t-12}
```

#### Notes

- Random splits leak the future into training. Split by time.
- Baselines: naive (`last value`) and seasonal naive (`same month last year`). Beat both or don't bother.
- Turn forecasting into regression with **lag features**; any model from this block can then forecast.
- Multiplicative growth → model `log(y)` and exponentiate back.

#### Your task — `day54.py`

- `make_lags(series, lags)` → `(X, y)` where row t holds `series[t-l]` for each lag, starting at `max(lags)`.
- `time_split(X, y, test_size)` → last `test_size` rows as test.
- `seasonal_naive(series, season, horizon)` → last `horizon` predictions `series[t-season]`.
- `mape(y, p)` → mean absolute percentage error (%).

#### Tests

```python
# file: test_day54.py
import numpy as np

import day54 as ex
from day36 import LinearRegressionClosed


def series():
    t = np.arange(144)
    return 100 + 2 * t + 30 * np.sin(2 * np.pi * t / 12)


def test_make_lags():
    X, y = ex.make_lags(np.arange(10.0), [1, 3])
    assert X.shape == (7, 2) and y[0] == 3 and X[0].tolist() == [2, 0]


def test_time_split():
    Xtr, Xte, ytr, yte = ex.time_split(np.arange(10)[:, None], np.arange(10), 3)
    assert yte.tolist() == [7, 8, 9] and ytr[-1] == 6


def test_lag_model_beats_seasonal_naive():
    s = series()
    X, y = ex.make_lags(s, [1, 2, 12])
    Xtr, Xte, ytr, yte = ex.time_split(X, y, 24)
    lin = LinearRegressionClosed().fit(Xtr, ytr).predict(Xte)
    naive = ex.seasonal_naive(s, 12, 24)
    assert ex.mape(yte, lin) < ex.mape(yte, naive)
    assert np.isclose(ex.mape([100, 200], [110, 180]), 10.0)
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day54.py
import numpy as np


def make_lags(series, lags):
    s = np.asarray(series, float)
    start = max(lags)
    X = np.column_stack([s[start - l:len(s) - l] for l in lags])
    return X, s[start:]


def time_split(X, y, test_size):
    return X[:-test_size], X[-test_size:], y[:-test_size], y[-test_size:]


def seasonal_naive(series, season, horizon):
    s = np.asarray(series, float)
    return s[len(s) - horizon - season:len(s) - season]


def mape(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.mean(np.abs((y - p) / y)) * 100)


if __name__ == "__main__":
    import pandas as pd
    from day22 import download
    from day36 import LinearRegressionClosed
    s = pd.read_csv(download("flights"))["passengers"].to_numpy(float)
    X, y = make_lags(np.log(s), [1, 2, 12])
    Xtr, Xte, ytr, yte = time_split(X, y, 24)
    pred = np.exp(LinearRegressionClosed().fit(Xtr, ytr).predict(Xte))
    print("lag model MAPE:", round(mape(np.exp(yte), pred), 2), "%")
    print("seasonal naive MAPE:", round(mape(s[-24:], seasonal_naive(s, 12, 24)), 2), "%")
```

</details>

**Done when:** green + real flights MAPE for both models (reference run: lag model 3.3%, seasonal naive 10.5%).

---

[← Day 53](day53-imbalanced-data-and-decision-thresholds.md) · [All 90 days](README.md) · [Day 55 →](day55-text-as-numbers-bag-of-words-and-tf-idf.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
