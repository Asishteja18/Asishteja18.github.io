# Day 89 — Evaluation and the model card

> **AI-90** · Block 3 · Build an AI from scratch · Day 89 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 89`)

[← Day 88](day88-serving-your-ai-an-api-and-a-chat-page.md) · [All 90 days](README.md) · [Day 90 →](day90-demo-day-ship-it.md)

---

**Dataset:** an eval set you write (30+ prompts with expected answers) · **Time:** ~2 h
**Progress:** `[█████████████████████████████░] 29/30` · **System after today:** your AI is measured honestly and documented responsibly.

#### Visual

```text
 eval set                                  results
 prompt                     expect   mode   ✔/✘
 "2+2="                     "4"      exact   ✔
 "capital of France?"       "Paris"  contains ✘  ← look at every failure
 "Day 66 builds the"        Tensor   regex   ✔
 score 21/30 = 0.70     (track it after EVERY change — no number, no progress)
 model card:  what it is · data · how it was evaluated · intended use · limitations & risks
```

#### Notes

- "It looks good" is not an evaluation. Fixed prompts + fixed expectations + a score, re-run after every change.
- Modes: exact match, contains, regex. Keep the failures list — that's your to-do list.
- A model card is standard practice: say what the model is for, what data it saw, how it scored, and where it fails. Small models hallucinate — say so.

#### Your task — `day89.py`

- `run_eval(generate_fn, cases)` → `{"score", "passed", "total", "failures"}`; each case `{"prompt", "expect", "mode"}` with mode `exact | contains | regex` (`contains` is case-insensitive).
- `model_card(info)` → Markdown with sections `# <name>`, `## Model`, `## Training data`, `## Evaluation`, `## Intended use`, `## Limitations`; missing keys raise `KeyError`.

#### Tests

```python
# file: test_day89.py
import day89 as ex

ANSWERS = {"2+2=": "4", "capital of France?": "It is Paris.", "Day 66 builds the": "Tensor engine"}


def gen(prompt):
    return ANSWERS.get(prompt, "")


def test_run_eval():
    cases = [{"prompt": "2+2=", "expect": "4", "mode": "exact"},
             {"prompt": "capital of France?", "expect": "paris", "mode": "contains"},
             {"prompt": "Day 66 builds the", "expect": r"^Tensor\b", "mode": "regex"},
             {"prompt": "unknown", "expect": "x", "mode": "exact"}]
    r = ex.run_eval(gen, cases)
    assert r == {"score": 0.75, "passed": 3, "total": 4, "failures": ["unknown"]}


def test_model_card():
    info = {"name": "tinyGPT-shakespeare", "model": "2-layer GPT, 110k params, own NumPy engine",
            "data": "Tiny Shakespeare (1.1M chars)", "evaluation": "val loss 1.95, eval score 0.70",
            "intended_use": "learning and demos", "limitations": "invents facts; English only; tiny context"}
    card = ex.model_card(info)
    for h in ["# tinyGPT-shakespeare", "## Model", "## Training data", "## Evaluation", "## Intended use", "## Limitations"]:
        assert h in card
    del info["limitations"]
    try:
        ex.model_card(info)
    except KeyError:
        return
    raise AssertionError("missing key should raise KeyError")
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day89.py
import re


def _ok(out, expect, mode):
    if mode == "exact":
        return out.strip() == expect
    if mode == "contains":
        return expect.lower() in out.lower()
    if mode == "regex":
        return re.search(expect, out) is not None
    raise ValueError(f"unknown mode {mode}")


def run_eval(generate_fn, cases):
    failures = [c["prompt"] for c in cases if not _ok(generate_fn(c["prompt"]), c["expect"], c["mode"])]
    passed = len(cases) - len(failures)
    return {"score": round(passed / len(cases), 3), "passed": passed, "total": len(cases), "failures": failures}


def model_card(info):
    sections = [("Model", "model"), ("Training data", "data"), ("Evaluation", "evaluation"),
                ("Intended use", "intended_use"), ("Limitations", "limitations")]
    parts = [f"# {info['name']}"]
    for title, key in sections:
        parts += ["", f"## {title}", "", info[key]]
    return "\n".join(parts) + "\n"
```

</details>

**Done when:** green + a real eval run on your chat model + `MODEL_CARD.md` in the repo.

---

[← Day 88](day88-serving-your-ai-an-api-and-a-chat-page.md) · [All 90 days](README.md) · [Day 90 →](day90-demo-day-ship-it.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
