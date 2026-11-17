# Day 90 — Demo day: ship it

> **AI-90** · Block 3 · Build an AI from scratch · Day 90 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 90`)

[← Day 89](day89-evaluation-and-the-model-card.md) · [All 90 days](README.md)

---

**Dataset:** everything · **Time:** ~3 h
**Progress:** `[██████████████████████████████] 30/30` · **System after today:** a public repo, a working demo, a write-up — and the skills to build the next one.

#### Visual

```text
 ai-90/
 ├── block1_python/       Days 1-30  automation + real data
 ├── block2_ml/           Days 31-60 minisklearn + benchmarks
 ├── block3_ai/           Days 61-90 tinytorch + GPT + chat + RAG + tools + server
 ├── models/              checkpoints
 ├── reports/ plots/      generated outputs
 ├── MODEL_CARD.md
 └── README.md  ← progress bars, results tables, demo GIF, what you'd do next
```

#### Notes

- **Write-up structure:** what you built, one diagram, key numbers (benchmark table, GPT loss, eval score), what was hardest, what's next.
- **Record a 2-minute demo**: train → generate → chat in the browser → a tool call.
- **Scaling up (optional): port to PyTorch for a GPU.** Your engine maps 1:1:

| tinytorch (yours) | PyTorch |
| --- | --- |
| `Tensor(data)` + `.backward()` | `torch.tensor(data, requires_grad=True)` + `.backward()` |
| `Module`, `Linear`, `LayerNorm` | `torch.nn.Module`, `nn.Linear`, `nn.LayerNorm` |
| `cross_entropy(logits, t, ignore_index=-1)` | `F.cross_entropy(logits, t, ignore_index=-1)` |
| `Adam(params, lr, weight_decay)` | `torch.optim.AdamW(params, lr, weight_decay)` |
| `softmax(att + mask)` | `F.scaled_dot_product_attention(q, k, v, is_causal=True)` |
| `save_params / load_params` | `torch.save(model.state_dict()) / load_state_dict` |

  Then read karpathy/nanoGPT and karpathy/nanochat end to end — you'll recognise every line.

#### Your task — `day90.py`

- `summarize_progress(progress)` → from `{"day": "YYYY-MM-DD"}` (the `ai90/progress.json` format): `{"days_done", "blocks": {"Python + automation": n, "Machine learning": n, "AI from scratch": n}, "first", "last"}`.
- `bar(n, total=30, width=30)` → `"█"*filled + "░"*rest`.
- `demo_readme(title, summary, results)` → Markdown README: `# title`, a progress section with one bar line per block (`Python + automation  ███…  30/30`), a `## Results` table from the `results` dict, and a `## What's next` section.

#### Tests

```python
# file: test_day90.py
import day90 as ex


def test_summary():
    prog = {str(d): f"2026-12-{(d % 28) + 1:02d}" for d in list(range(1, 31)) + list(range(31, 41)) + [61, 62]}
    s = ex.summarize_progress(prog)
    assert s["days_done"] == 42
    assert s["blocks"] == {"Python + automation": 30, "Machine learning": 10, "AI from scratch": 2}
    assert s["first"] == "2026-12-01" and s["last"] == "2026-12-28"


def test_bar():
    assert ex.bar(15) == "█" * 15 + "░" * 15 and ex.bar(30, width=10) == "█" * 10


def test_readme():
    s = ex.summarize_progress({str(d): "2026-12-01" for d in range(1, 91)})
    md = ex.demo_readme("AI-90", s, {"GPT val loss": 1.95, "Titanic CV acc": 0.81})
    assert md.startswith("# AI-90")
    assert "AI from scratch" in md and "30/30" in md
    assert "| GPT val loss | 1.95 |" in md and "## What's next" in md
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day90.py
BLOCKS = [("Python + automation", 1, 30), ("Machine learning", 31, 60), ("AI from scratch", 61, 90)]


def summarize_progress(progress):
    days = {int(k) for k in progress}
    dates = sorted(progress.values())
    return {"days_done": len(days),
            "blocks": {name: len([d for d in days if lo <= d <= hi]) for name, lo, hi in BLOCKS},
            "first": dates[0] if dates else None, "last": dates[-1] if dates else None}


def bar(n, total=30, width=30):
    filled = round(n / total * width)
    return "█" * filled + "░" * (width - filled)


def demo_readme(title, summary, results):
    lines = [f"# {title}", "", "From Python basics to a GPT built on my own autograd engine, in 90 days.", "",
             "## Progress", "", "`" * 3 + "text"]
    for name, n in summary["blocks"].items():
        lines.append(f"{name:20} {bar(n)}  {n}/30")
    lines += ["`" * 3, "", f"{summary['days_done']}/90 days · {summary['first']} → {summary['last']}", "",
              "## Results", "", "| metric | value |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in results.items()]
    lines += ["", "## What's next", "", "- Port tinytorch models to PyTorch and train a bigger GPT on a GPU",
              "- Learned embeddings for RAG", "- Publish the minisklearn benchmark", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    import json
    from pathlib import Path
    prog = json.loads(Path("ai90/progress.json").read_text()) if Path("ai90/progress.json").exists() else {}
    print(demo_readme("AI-90", summarize_progress(prog), {"fill in": "your numbers"}))
```

</details>

**Done when:** green + README published + demo recorded + `python ai90.py progress` shows 90/90. **You built an AI from scratch.** 🎓

---

[← Day 89](day89-evaluation-and-the-model-card.md) · [All 90 days](README.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
