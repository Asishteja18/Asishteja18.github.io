# Day 28 — Git + GitHub Actions: run jobs in the cloud

> **AI-90** · Block 1 · Python + automation + real data · Day 28 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 28`)

[← Day 27](day27-a-reusable-data-cleaning-pipeline.md) · [All 90 days](README.md) · [Day 29 →](day29-the-data-collector-bot.md)

---

**Dataset:** none · **Time:** ~2 h

#### Visual

```text
 local                      GitHub                         Actions runner (cron)
 git add/commit ──push──▶   repo  ──schedule: "0 * * * *"──▶  checkout → pip install
                                                              → python collect.py
                             ◀────────── git commit data/ + push ───────┘
```

#### Notes

- Daily git loop: `git status` → `git add -A` → `git commit -m "day 28: actions"` → `git push`.
- A workflow lives in `.github/workflows/name.yml`. `on: schedule: - cron: "0 * * * *"` plus `workflow_dispatch:` (manual button).
- Secrets: repo Settings → Secrets → use as `${{ secrets.API_KEY }}`. Never in code.
- Cron in Actions is UTC and can be delayed a few minutes. Fine for data collection.
- Generating the YAML from Python avoids indentation mistakes — that's today's exercise.

#### Your task — `day28.py`

- `valid_cron(expr)` → `True` for 5 space-separated fields each made of digits, `*`, `/`, `,`, `-`.
- `make_workflow(name, cron, script, requirements="requirements.txt")` → YAML string: runs on schedule + manual, sets up Python 3.13, installs requirements, runs the script, commits `data/` if changed. Raise `ValueError` on invalid cron.

#### Tests

```python
# file: test_day28.py
import day28 as ex


def test_valid_cron():
    assert ex.valid_cron("0 * * * *") and ex.valid_cron("*/15 6-18 * * 1-5")
    assert not ex.valid_cron("0 * * *") and not ex.valid_cron("0 * * * mon")


def test_make_workflow():
    y = ex.make_workflow("collect", "0 * * * *", "day29.py")
    for needle in ['name: collect', 'cron: "0 * * * *"', "workflow_dispatch:", "actions/checkout@v4",
                   "python-version: \"3.13\"", "pip install -r requirements.txt", "python day29.py",
                   "git add data"]:
        assert needle in y, needle
    try:
        ex.make_workflow("x", "bad", "a.py")
    except ValueError:
        return
    raise AssertionError("bad cron should raise ValueError")
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day28.py
import re

TEMPLATE = """name: {name}
on:
  schedule:
    - cron: "{cron}"
  workflow_dispatch:
permissions:
  contents: write
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: pip install -r {requirements}
      - run: python {script}
      - name: commit data
        run: |
          git config user.name "bot"
          git config user.email "bot@users.noreply.github.com"
          git add data
          git diff --cached --quiet || (git commit -m "data: automated update" && git push)
"""


def valid_cron(expr):
    parts = expr.split()
    return len(parts) == 5 and all(re.fullmatch(r"[\d*/,\-]+", p) for p in parts)


def make_workflow(name, cron, script, requirements="requirements.txt"):
    if not valid_cron(cron):
        raise ValueError(f"invalid cron: {cron!r}")
    return TEMPLATE.format(name=name, cron=cron, script=script, requirements=requirements)
```

</details>

**Done when:** green + write the YAML to `.github/workflows/collect.yml` in your repo and trigger it once with the manual button.

---

[← Day 27](day27-a-reusable-data-cleaning-pipeline.md) · [All 90 days](README.md) · [Day 29 →](day29-the-data-collector-bot.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
