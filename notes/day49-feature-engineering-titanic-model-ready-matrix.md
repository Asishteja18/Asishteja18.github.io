# Day 49 — Feature engineering: Titanic → model-ready matrix

> **AI-90** · Block 2 · Machine learning from scratch · Day 49 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 49`)

[← Day 48](day48-pca-compressing-64-pixels-into-2.md) · [All 90 days](README.md) · [Day 50 →](day50-scikit-learn-pipelines-and-grid-search.md)

---

**Dataset:** Titanic · **Time:** ~2 h

#### Visual

```text
 raw row:  sex="female" pclass=1 age=NaN fare=71.3 embarked="C" sibsp=1 parch=0
     │ fill age (median)  │ one-hot categoricals │ new features
     ▼                     ▼                        ▼
 [age=28, fare=71.3, family=1, alone=0, sex_female=1, sex_male=0, pclass_1=1, pclass_2=0, pclass_3=0, emb_C=1, …]
```

#### Notes

- Models need numbers. Categorical → **one-hot** (a 0/1 column per category). Don't encode categories as 1, 2, 3 — that invents an order.
- Create features that carry meaning: `family = sibsp + parch`, `alone = family == 0`.
- Fit-time statistics (median age, the category list) must come from **train** only; store them and reuse for test.
- Keep `feature_names_` — you'll need them to explain models (Day 59).

#### Your task — `day49.py`

- `class TitanicFeatures` with `fit(df)` (stores median age, categories for `sex`, `pclass`, `embarked`), `transform(df)` → `(X float array, feature_names list)`. Numeric columns first: `age, fare, family, alone`, then one-hot columns named like `sex_female`, `pclass_1`, `embarked_C` (sorted category order). Unseen categories → all zeros.

#### Tests

```python
# file: test_day49.py
import numpy as np
import pandas as pd

import day49 as ex


def frame():
    return pd.DataFrame({"sex": ["male", "female", "female"], "pclass": [3, 1, 2], "age": [22.0, np.nan, 30.0],
                         "fare": [7.25, 71.3, 13.0], "embarked": ["S", "C", "S"], "sibsp": [1, 1, 0], "parch": [0, 0, 0]})


def test_names_and_values():
    f = ex.TitanicFeatures().fit(frame())
    X, names = f.transform(frame())
    assert names == ["age", "fare", "family", "alone", "sex_female", "sex_male",
                     "pclass_1", "pclass_2", "pclass_3", "embarked_C", "embarked_S"]
    assert X.shape == (3, 11) and X.dtype == float
    assert X[1].tolist() == [26.0, 71.3, 1, 0, 1, 0, 1, 0, 0, 1, 0]


def test_unseen_category_and_train_stats():
    f = ex.TitanicFeatures().fit(frame())
    test = frame().iloc[:1].assign(embarked="Q", age=np.nan)
    X, names = f.transform(test)
    assert X[0, names.index("age")] == 26.0
    assert X[0, names.index("embarked_C")] == 0 and X[0, names.index("embarked_S")] == 0
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day49.py
import numpy as np

CATS = ["sex", "pclass", "embarked"]


class TitanicFeatures:
    def fit(self, df):
        self.age_median_ = float(df["age"].median())
        self.categories_ = {c: sorted(df[c].dropna().unique().tolist()) for c in CATS}
        return self

    def transform(self, df):
        family = (df["sibsp"] + df["parch"]).to_numpy(float)
        cols = [df["age"].fillna(self.age_median_).to_numpy(float), df["fare"].fillna(0).to_numpy(float),
                family, (family == 0).astype(float)]
        names = ["age", "fare", "family", "alone"]
        for c in CATS:
            for v in self.categories_[c]:
                cols.append((df[c] == v).to_numpy(float))
                names.append(f"{c}_{v}")
        return np.column_stack(cols).astype(float), names


if __name__ == "__main__":
    from day24 import load_titanic
    df = load_titanic()
    X, names = TitanicFeatures().fit(df).transform(df)
    print(X.shape, names)
```

</details>

**Done when:** green + the real Titanic becomes an 891 × 13 matrix.

---

[← Day 48](day48-pca-compressing-64-pixels-into-2.md) · [All 90 days](README.md) · [Day 50 →](day50-scikit-learn-pipelines-and-grid-search.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
