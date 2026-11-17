"""Build the AI-90 course for the site from AI90_MASTER.md.

    python tools/build_ai90.py path/to/AI90_MASTER.md

Writes content/ai90.json: 90 lessons in the site's lesson format, plus the
`viz` illustrations attached to days (see VIZ below). Days 1-30 go to the
Python stage, 31-60 to Machine Learning, 61-90 to Build your own AI.

Each lesson's exercise is a "pytest"-kind exercise: the browser writes the
learner's code to dayNN.py, the reference solutions of any earlier days it
imports next to it, and runs every test_* function in test_dayNN.py.
"""
import ast
import json
import re
import sys
from pathlib import Path

import markdown

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_notes import GH_VIEW, filename as note_filename  # noqa: E402

FENCE = "`" * 3
ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- sections
SECTIONS = [
    (1, 15, "python", "Days 1–15 · Core Python"),
    (16, 21, "python", "Days 16–21 · Automation"),
    (22, 30, "python", "Days 22–30 · Real data"),
    (31, 34, "ml", "Days 31–34 · The maths"),
    (35, 38, "ml", "Days 35–38 · Regression"),
    (39, 46, "ml", "Days 39–46 · Classification"),
    (47, 48, "ml", "Days 47–48 · Unsupervised"),
    (49, 60, "ml", "Days 49–60 · Engineering + projects"),
    (61, 72, "ai", "Days 61–72 · Your engine: tinytorch"),
    (73, 81, "ai", "Days 73–81 · Language models + GPT"),
    (82, 90, "ai", "Days 82–90 · Chat, RAG, tools, serving"),
]

# ------------------------------------------------- interactive illustrations
# day -> (widget id, what the picture shows). The widgets live in index.html.
VIZ = {
    1: ("hms", "Drag the seconds. Watch // and % split one number into hours, minutes and seconds."),
    2: ("slice", "Move the start, stop and step. The highlighted letters are exactly what the slice returns."),
    4: ("collatz", "Each bar is one step of the Collatz loop. Change the start number and count the steps."),
    5: ("running", "Noisy values in grey, the running mean in colour. A bigger window smooths more and reacts later."),
    6: ("hash", "Type words. Each one is hashed into a bucket — that is why dict lookups are instant."),
    12: ("minmax", "Min–max scaling squeezes any range into 0…1 without changing the order or the gaps."),
    13: ("vector", "Drag the two arrow tips. The sum, the dot product and the angle update live."),
    15: ("matmul", "Hover a cell of the result. Its value is the row on the left dotted with the column on top."),
    23: ("scatter", "The real Iris dataset: two measurements, three species. Pick which features to plot."),
    31: ("vector", "Cosine similarity only cares about direction. Make the arrows longer — the score stays the same."),
    32: ("derivative", "The slope of the tangent is the derivative. Shrink h and the estimate converges."),
    33: ("gd", "Gradient descent on a bowl. Too small a learning rate crawls; too big bounces out."),
    34: ("normal", "Sample from a normal distribution. The histogram fills in the bell curve as n grows."),
    36: ("linreg", "Click to add points. The least-squares line is solved in closed form every time."),
    37: ("linreg", "Same line, found by gradient descent. Press Train and watch it settle."),
    38: ("poly", "Raise the degree to fit the noise, then add ridge (λ) to pull it back."),
    39: ("sigmoid", "The sigmoid turns any score into a probability. Weight changes steepness, bias shifts it."),
    40: ("threshold", "Slide the threshold. Precision and recall trade off; the confusion matrix updates."),
    41: ("softmax", "Softmax turns scores into probabilities that sum to 1. Temperature sharpens or flattens them."),
    43: ("knn", "Click anywhere. The k nearest neighbours vote on the colour."),
    45: ("tree", "A decision tree splits the plane with axis-aligned cuts. Deeper trees cut finer."),
    47: ("kmeans", "k-means: assign every point to the nearest centre, move centres to the mean, repeat."),
    48: ("pca", "PCA finds the direction of greatest spread. Project onto it and you keep most of the shape."),
    53: ("threshold", "With rare positives, accuracy lies. Move the threshold and read recall instead."),
    54: ("timeseries", "Airline passengers 1949–1960: trend × seasonality. The forecast repeats last year's shape."),
    55: ("tfidf", "Type sentences. Words in every sentence get low IDF; rare words stand out."),
    61: ("perceptron", "One neuron, one line. Pick a gate: AND and OR separate, XOR never does."),
    62: ("mlp", "Two hidden neurons bend the plane. Together they solve XOR."),
    63: ("backprop", "Forward pass left to right, gradients right to left — the chain rule at each node."),
    64: ("backprop", "Your scalar engine does exactly this: every node stores its gradient."),
    69: ("optim", "SGD, momentum and Adam racing down the same valley."),
    70: ("layernorm", "LayerNorm re-centres every row to mean 0 and spread 1 before the next layer."),
    72: ("conv", "A 3×3 kernel slides over the digit. Each output pixel is one dot product."),
    73: ("bigram", "Bigram counts from real names: brighter cells = more common letter pairs."),
    76: ("attention", "Each row is a token looking back. The mask hides the future; softmax makes rows sum to 1."),
    77: ("attention", "Every head learns its own attention pattern. Change the scores and see the weights move."),
    81: ("sampling", "Temperature, top-k and top-p reshape the next-token distribution before sampling."),
    82: ("bpe", "Byte-pair encoding: merge the most frequent pair, again and again, until the vocab is full."),
    86: ("rag", "Your question is embedded, compared to every chunk, and the closest chunks are pasted into the prompt."),
}

# Runs inside Pyodide (a Web Worker on the site). Globals set before it runs:
# TEST (module name) — files are already written to /ai90.
HARNESS = r'''
import sys, os, re, json, importlib, traceback, io
os.environ.setdefault("MPLBACKEND", "agg")
os.makedirs("/ai90/run", exist_ok=True)
os.chdir("/ai90/run")
if "/ai90" not in sys.path:
    sys.path.insert(0, "/ai90")
for _m in [k for k in list(sys.modules) if re.fullmatch(r"(test_)?day\d\d", k)]:
    del sys.modules[_m]
importlib.invalidate_caches()
_out, _buf = [], io.StringIO()
_old = sys.stdout, sys.stderr
sys.stdout = sys.stderr = _buf
try:
    try:
        _mod = importlib.import_module(TEST)
    except Exception as e:
        tb = traceback.extract_tb(e.__traceback__)
        where = next((f"{os.path.basename(f.filename)}:{f.lineno}" for f in reversed(tb)
                      if re.search(r"day\d\d\.py$", f.filename)), "")
        _out = [["import", "error", f"{type(e).__name__}: {e}" + (f" ({where})" if where else "")]]
    else:
        for name in sorted(n for n in dir(_mod) if n.startswith("test_")):
            try:
                getattr(_mod, name)()
                _out.append([name, "pass", ""])
            except NotImplementedError:
                _out.append([name, "todo", "not written yet (raise NotImplementedError)"])
            except Exception as e:
                tb = traceback.extract_tb(e.__traceback__)[-1]
                msg = f"{type(e).__name__}: {e}".strip()
                _out.append([name, "fail", f"{msg[:400]} ({os.path.basename(tb.filename)}:{tb.lineno})"])
finally:
    sys.stdout, sys.stderr = _old
json.dumps({"results": _out, "printed": _buf.getvalue()[-6000:]})
'''

REWRITES = [
    (r"with your code, then run:", "with your code, then press **Run tests**."),
    (r"Green = done\. Yellow = not started\. Red = wrong answer", "Green = done. Violet = not started yet. Red = wrong answer"),
    (r"`python ai90\.py check [\d\-]+`", "**Run tests**"),
    (r"run `python ai90\.py progress`", "open your Progress page"),
    (r"`python ai90\.py progress`", "your Progress page"),
    (r"is all green → tick Day \d+ in the tracker\.", "is all green → the day is marked complete."),
    (r"`ai90/work/(day\d\d\.py)`", r"the editor (`\1`)"),
    (r"Open `(day\d\d\.py)`, replace", r"In the editor (`\1`), replace"),
]


def rewrite(text):
    for a, b in REWRITES:
        text = re.sub(a, b, text)
    return text


def md(text):
    return markdown.markdown(rewrite(text), extensions=["tables", "sane_lists"]).strip()


def split_fences(body):
    """Yield ('md', text) and ('fence', lang, code) pieces."""
    pat = re.compile(r"^" + FENCE + r"(\w*)\n(.*?)^" + FENCE + r"[ \t]*$", re.S | re.M)
    pos = 0
    for m in pat.finditer(body):
        if body[pos:m.start()].strip():
            yield ("md", body[pos:m.start()])
        yield ("fence", m.group(1) or "text", m.group(2).rstrip("\n"))
        pos = m.end()
    if body[pos:].strip():
        yield ("md", body[pos:])


def to_sections(body):
    out = []
    for piece in split_fences(body):
        if piece[0] == "md":
            html = md(piece[1])
            if html:
                out.append({"type": "prose", "html": html})
            continue
        _, lang, code = piece
        if re.fullmatch(r"\s*python ai90\.py[^\n]*", code):
            continue  # runner command — the site has a Run tests button
        if lang == "mermaid":
            out.append({"type": "mermaid", "code": code})
        elif lang == "text":
            out.append({"type": "visual", "text": rewrite(code)})
        else:
            out.append({"type": "code", "lang": lang, "code": rewrite(code)})
    return out


# ------------------------------------------------------------------ starters
def _doc(indent, text):
    text = text.replace("\\", "\\\\").replace('"', "'")
    return indent + '"""' + text + '"""'


def make_starter(src, hints=None):
    """Keep imports/constants/classes; replace every function body with its
    docstring + raise NotImplementedError. Functions without a docstring get
    the matching line from the day's task list as one."""
    hints = hints or {}
    tree = ast.parse(src)
    lines = src.split("\n")
    funcs = []

    def walk(node, top):
        for ch in ast.iter_child_nodes(node):
            if isinstance(ch, (ast.FunctionDef, ast.AsyncFunctionDef)):
                funcs.append(ch)  # nested defs vanish with the parent body
            elif isinstance(ch, ast.ClassDef):
                walk(ch, False)
            elif top and isinstance(ch, ast.If):
                pass  # leave `if __name__ == "__main__":` blocks alone

    walk(tree, True)
    # constants the task asks you to build (e.g. GATES = {...}) become TODOs
    for a in tree.body:
        if (isinstance(a, ast.Assign) and len(a.targets) == 1 and isinstance(a.targets[0], ast.Name)
                and a.targets[0].id in hints and a.targets[0].id.isupper()):
            funcs.append(a)
    for f in sorted(funcs, key=lambda n: n.lineno, reverse=True):
        if isinstance(f, ast.Assign):
            name = f.targets[0].id
            lines[f.lineno - 1:f.end_lineno] = [f"{name} = None  # TODO: {hints[name]}"]
            continue
        body = f.body
        first = body[0]
        has_doc = (isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant)
                   and isinstance(first.value.value, str))
        start = (first.end_lineno if has_doc else first.lineno - 1)  # 0-based index of first replaced line
        if has_doc and len(body) == 1:
            start = first.end_lineno
        indent = " " * first.col_offset
        end = f.end_lineno
        if not has_doc and first.lineno == f.lineno:  # def f(): return x  (one line)
            head = lines[f.lineno - 1]
            cut = head.index(":", head.index(")")) + 1 if ")" in head else head.rindex(":") + 1
            ind = " " * (f.col_offset + 4)
            doc = [_doc(ind, hints[f.name])] if f.name in hints else []
            lines[f.lineno - 1:end] = [head[:cut]] + doc + [ind + "raise NotImplementedError"]
            continue
        repl = [indent + "raise NotImplementedError"]
        if not has_doc and f.name in hints:
            repl.insert(0, _doc(indent, hints[f.name]))
        lines[start:end] = repl
    out = "\n".join(lines)
    ast.parse(out)
    return out


# ------------------------------------------------------------------- parse
def parse(md_text):
    days = {}
    heads = list(re.finditer(r"^### Day (\d+) — (.+)$", md_text, re.M))
    ends = [m.start() for m in re.finditer(r"^## ", md_text, re.M)]
    for k, h in enumerate(heads):
        n = int(h.group(1))
        stop = heads[k + 1].start() if k + 1 < len(heads) else len(md_text)
        stop = min([stop] + [e for e in ends if e > h.start()])
        days[n] = (h.group(2).strip(), md_text[h.end():stop])
    files = dict(re.findall(FENCE + r"python\n# file: (\S+)\n(.*?)" + FENCE, md_text, re.S))
    return days, files


def deps_of(code, files, seen=None):
    seen = set() if seen is None else seen
    for m in re.finditer(r"^\s*(?:from|import) (day\d\d)\b", code, re.M):
        mod = m.group(1)
        if mod not in seen and mod + ".py" in files:
            seen.add(mod)
            deps_of(files[mod + ".py"], files, seen)
    return seen


def minutes_of(t):
    m = re.search(r"~\s*([\d.]+)\s*(?:–\s*([\d.]+)\s*)?h", t or "")
    if not m:
        return 120
    hi = float(m.group(2) or m.group(1))
    return int(round(hi * 60))


def pretty(name):
    return name[5:] if name.startswith("test_") else name


def build_day(n, title, body, files):
    sol = files[f"day{n:02}.py"]
    tests = files[f"test_day{n:02}.py"]

    meta = {}
    m = re.search(r"\*\*Dataset:\*\*\s*(.+?)\s*·\s*\*\*Time:\*\*\s*([^\n]+)", body)
    if m:
        meta["dataset"], meta["time"] = m.group(1).strip(), m.group(2).strip()
    m = re.search(r"\*\*Progress:\*\*\s*`([^`]+)`\s*·\s*\*\*System after today:\*\*\s*([^\n]+)", body)
    if m:
        meta["progress"], meta["system"] = m.group(1), m.group(2).strip()
    meta = {k: rewrite(v) for k, v in meta.items()}

    # pieces: visual | notes | task | tests | solution | done-when
    vis = re.search(r"#### Visual\n(.*?)(?=^#### |\Z)", body, re.S | re.M)
    task = re.search(r"^#### Your task[^\n]*\n(.*?)(?=^#### Tests)", body, re.S | re.M)
    task_head = re.search(r"^#### Your task[^\n]*", body, re.M)
    done = re.search(r"^\*\*Done when:\*\*\s*(.+)$", body, re.M)

    notes_start = vis.end() if vis else 0
    notes_end = task_head.start() if task_head else body.index("#### Tests")
    notes = body[notes_start:notes_end]
    notes = re.sub(r"^#### Notes\s*\n", "", notes, flags=re.M)
    # first non-meta paragraph
    pre = body[:vis.start()] if vis else ""
    goal = re.search(r"^\*\*Goal:\*\*\s*(.+)$", body, re.M)

    sections = []
    if vis:
        vtext = re.sub(r"^\*\*Goal:\*\*.*$", "", vis.group(1), flags=re.M)
        sections += [dict(s, role="visual") for s in to_sections(vtext)]
    if n in VIZ:
        sections.append({"type": "viz", "viz": VIZ[n][0], "caption": VIZ[n][1]})
    notes = re.sub(r"^\*\*Goal:\*\*.*$", "", notes, flags=re.M)
    sections += to_sections(notes)

    blurb = goal.group(1).strip() if goal else ""
    if not blurb:
        bullet = re.search(r"^- (.+)$", notes, re.M)
        blurb = re.sub(r"[*`]", "", bullet.group(1)) if bullet else title
        blurb = re.split(r"(?<=[.!?])\s", blurb)[0]
    blurb = rewrite(re.sub(r"\*\*|`", "", blurb)).strip()
    blurb = blurb[:1].upper() + blurb[1:]

    task_md = task.group(1).strip() if task else ""
    task_md = re.sub(r"^#### Your task[^\n]*", "", task_md).strip()
    head_fns = ""
    if task_head:
        hf = re.search(r"with: (.+)$", task_head.group(0))
        head_fns = hf.group(1) if hf else ""
    brief_md = task_md or (f"Write {head_fns}." if head_fns else "")
    if not brief_md and head_fns:
        brief_md = f"Write {head_fns}."
    if not task_md and head_fns:
        brief_md = f"Write these in `day{n:02}.py`: {head_fns}. Each one has a docstring with an example."

    hints = {}
    for b in re.findall(r"^- (.+)$", task_md, re.M):
        plain = re.sub(r"\*\*", "", b).replace("`", "").strip()
        for name in re.findall(r"`(?:class )?(\w+)[(`.]", b):
            hints.setdefault(name, plain)
        for name in re.findall(r"`([A-Z_][A-Z0-9_]*) = ", b):
            hints.setdefault(name, plain)
        for name in re.findall(r"\.(\w+)\(", b):
            hints.setdefault(name, plain)
    test_names = re.findall(r"^def (test_\w+)\(", tests, re.M)
    deps = sorted(deps_of(tests + "\n" + sol, files) - {f"day{n:02}"})
    lesson = {
        "id": f"d{n:02}",
        "day": n,
        "track": "python" if n <= 30 else "ml" if n <= 60 else "ai",
        "order": n,
        "title": title.replace("`", ""),
        "blurb": blurb,
        "minutes": minutes_of(meta.get("time")),
        "section": next(s[3] for s in SECTIONS if s[0] <= n <= s[1]),
        "meta": meta,
        "objectives": [],
        "notes": {"path": "notes/" + note_filename(n, title), "github": GH_VIEW + note_filename(n, title)},
        "sections": sections,
        "exercise": {
            "kind": "pytest",
            "module": f"day{n:02}",
            "brief_html": md(brief_md),
            "done_html": md(done.group(1)) if done else "",
            "starter": make_starter(sol, hints),
            "solution": sol,
            "tests_code": tests,
            "tests": [{"label": pretty(t), "name": t} for t in sorted(test_names)],
            "deps": deps,
        },
    }
    # "After this you can": task bullets, function names only
    for b in re.findall(r"^- (.+)$", task_md, re.M)[:6]:
        b = re.sub(r"\s*→.*$", "", b)
        lesson["objectives"].append(md(b).removeprefix("<p>").removesuffix("</p>"))
    if not lesson["objectives"] and head_fns:
        lesson["objectives"] = ["<code>" + x.strip(" `") + "</code>" for x in head_fns.split(",")]
    return lesson


def main(src):
    text = Path(src).read_text(encoding="utf-8")
    days, files = parse(text)
    assert len(days) == 90, len(days)
    lessons = [build_day(n, *days[n], files) for n in range(1, 91)]
    blocks = []
    for name, hdr in [("python", "BLOCK 1"), ("ml", "BLOCK 2"), ("ai", "BLOCK 3")]:
        m = re.search(r"^## " + hdr + r"[^\n]*\n(.*?)(?=^### Day)", text, re.S | re.M)
        blocks.append({"track": name, "sections": to_sections(m.group(1).replace("---", ""))})
    out = {"version": "2026-11-17", "harness": HARNESS, "lessons": lessons, "blocks": blocks}
    dest = ROOT / "content" / "ai90.json"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {dest} — {len(lessons)} days, {dest.stat().st_size // 1024} KB, "
          f"{sum(len(l['exercise']['tests']) for l in lessons)} tests")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "syllabus" / "AI90_MASTER.md"))
