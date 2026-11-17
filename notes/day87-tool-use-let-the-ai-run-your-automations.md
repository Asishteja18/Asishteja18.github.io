# Day 87 — Tool use: let the AI run your automations

> **AI-90** · Block 3 · Build an AI from scratch · Day 87 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 87`)

[← Day 86](day86-rag-from-scratch-give-your-ai-a-memory.md) · [All 90 days](README.md) · [Day 88 →](day88-serving-your-ai-an-api-and-a-chat-page.md)

---

**Dataset:** tools built from Blocks 1–2 (calculator, Titanic stats, dataset downloader) · **Time:** ~2 h
**Progress:** `[███████████████████████████░░░] 27/30` · **System after today:** an AI that can **act** — it calls functions you wrote on Days 1–60.

#### Visual

```text
 user:  "what's 17.5% of 2340?"
 model: <tool>{"name": "calc", "args": {"expr": "2340 * 0.175"}}</tool>      ← model writes a tool call
 app:   parse → registry["calc"](expr="2340 * 0.175") → 409.5                 ← YOUR code runs it, safely
 app:   <result>409.5</result>  → fed back to the model → "17.5% of 2340 is 409.5."
```

#### Notes

- The model only **writes text**; your program decides whether and how to run a tool. Never `eval` model output — parse it and allow-list.
- Tool calls are JSON inside tags. Bad JSON, unknown tool or wrong arguments → return an error message, never crash.
- A safe calculator walks the expression's AST and only allows numbers and `+ − × ÷ **`.
- Describe tools to the model in the prompt (`registry.describe()`).

#### Your task — `day87.py`

- `safe_calc(expr)` → number; only numeric literals, `+ - * / ** %`, unary minus and brackets; else `ValueError`.
- `parse_tool_call(text)` → `(name, args)` or `None`; malformed JSON → `ValueError`.
- `class ToolRegistry` with `register(name, description)` decorator, `describe()`, `call(name, args)` (errors returned as `"error: …"` strings).
- `handle(text, registry)` → `"<result>{json}</result>"` if text contains a tool call, else the text unchanged.

#### Tests

```python
# file: test_day87.py
import day87 as ex


def test_safe_calc():
    assert ex.safe_calc("2340 * 0.175") == 409.5 and ex.safe_calc("-(2 + 3) ** 2 % 7") == 3
    for bad in ["__import__('os')", "open('x')", "a + 1", "[1, 2]"]:
        try:
            ex.safe_calc(bad)
        except ValueError:
            continue
        raise AssertionError(f"should reject {bad}")


def test_parse():
    assert ex.parse_tool_call('ok <tool>{"name": "calc", "args": {"expr": "1+1"}}</tool>') == ("calc", {"expr": "1+1"})
    assert ex.parse_tool_call("no tools here") is None
    try:
        ex.parse_tool_call("<tool>{not json}</tool>")
    except ValueError:
        return
    raise AssertionError("bad JSON should raise ValueError")


def test_registry_and_handle():
    reg = ex.ToolRegistry()

    @reg.register("calc", "evaluate arithmetic")
    def calc(expr):
        return ex.safe_calc(expr)

    assert "calc: evaluate arithmetic" in reg.describe()
    assert reg.call("calc", {"expr": "6*7"}) == 42
    assert reg.call("nope", {}).startswith("error: unknown tool")
    assert reg.call("calc", {"wrong": 1}).startswith("error:")
    assert ex.handle('<tool>{"name": "calc", "args": {"expr": "2**10"}}</tool>', reg) == "<result>1024</result>"
    assert ex.handle("just chatting", reg) == "just chatting"
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day87.py
import ast
import json
import operator
import re

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv,
       ast.Pow: operator.pow, ast.Mod: operator.mod, ast.USub: operator.neg, ast.UAdd: operator.pos}
TOOL_RE = re.compile(r"<tool>(.*?)</tool>", re.S)


def safe_calc(expr):
    def ev(node):
        if isinstance(node, ast.Expression):
            return ev(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](ev(node.operand))
        raise ValueError(f"not allowed: {ast.dump(node)[:40]}")
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise ValueError(str(e)) from None
    return ev(tree)


def parse_tool_call(text):
    m = TOOL_RE.search(text)
    if not m:
        return None
    try:
        call = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        raise ValueError(f"bad tool JSON: {e}") from None
    return call["name"], call.get("args", {})


class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, description):
        def deco(fn):
            self.tools[name] = (fn, description)
            return fn
        return deco

    def describe(self):
        return "\n".join(f"{n}: {d}" for n, (_, d) in self.tools.items())

    def call(self, name, args):
        if name not in self.tools:
            return f"error: unknown tool {name!r}"
        try:
            return self.tools[name][0](**args)
        except Exception as e:  # noqa: BLE001 — errors go back to the model as text
            return f"error: {type(e).__name__}: {e}"


def handle(text, registry):
    try:
        call = parse_tool_call(text)
    except ValueError as e:
        return f"<result>{json.dumps('error: ' + str(e))}</result>"
    if call is None:
        return text
    return f"<result>{json.dumps(registry.call(*call))}</result>"
```

</details>

**Done when:** green + register two of your own Block 1–2 functions as tools (e.g. Day 22 `survival_rate_by`, Day 54 forecast).

---

[← Day 86](day86-rag-from-scratch-give-your-ai-a-memory.md) · [All 90 days](README.md) · [Day 88 →](day88-serving-your-ai-an-api-and-a-chat-page.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
