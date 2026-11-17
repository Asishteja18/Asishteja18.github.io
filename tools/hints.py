"""Three-step hints generated from a reference solution.

    1. What to reach for  — the operators, built-ins and methods each function uses
    2. The shape          — the function's skeleton: loops, branches, names, returns
    3. The first line     — the first real line of each function

Each step gives away a little more, so learners can unstick without jumping to
the full solution.
"""
import ast

OPS = {ast.FloorDiv: "//", ast.Mod: "%", ast.Pow: "**", ast.MatMult: "@ (matrix multiply)",
       ast.BitAnd: "&", ast.BitOr: "|"}
SKIP_CALLS = {"print", "super", "isinstance", "len", "range"}


def _is_doc(stmt):
    return isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Constant) and isinstance(stmt.value.value, str)


def _body(fn):
    b = fn.body
    return b[1:] if b and _is_doc(b[0]) else b


def _functions(tree):
    out = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
            out.append((node.name, node))
        elif isinstance(node, ast.ClassDef):
            for m in node.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not m.name.startswith("_") or m.name in ("__init__", "__call__", "__add__", "__matmul__", "__mul__", "__repr__", "__eq__", "__getitem__", "__len__")):
                    out.append((f"{node.name}.{m.name}", m))
    return [(n, f) for n, f in out if _body(f) and not (len(_body(f)) == 1 and isinstance(_body(f)[0], ast.Raise))]


def _tools(fn):
    calls, ops, kinds = [], [], []
    for n in ast.walk(fn):
        if isinstance(n, ast.Call):
            try:
                name = ast.unparse(n.func)
            except Exception:
                continue
            if isinstance(n.func, ast.Attribute):
                base = name.split(".")[0]
                name = name if base in ("np", "math", "pd", "re", "json", "random", "statistics", "os", "Path", "datetime", "plt", "csv", "collections", "itertools") else "." + n.func.attr + "()"
            if name not in SKIP_CALLS and len(name) < 40 and name not in calls:
                calls.append(name if name.startswith(".") or name.endswith("()") else name + "()")
        elif isinstance(n, ast.BinOp) and type(n.op) in OPS and OPS[type(n.op)] not in ops:
            ops.append(OPS[type(n.op)])
        elif isinstance(n, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)) and "a comprehension" not in kinds:
            kinds.append("a comprehension")
        elif isinstance(n, ast.JoinedStr) and "an f-string" not in kinds:
            kinds.append("an f-string")
        elif isinstance(n, ast.Try) and "try / except" not in kinds:
            kinds.append("try / except")
        elif isinstance(n, ast.While) and "a while loop" not in kinds:
            kinds.append("a while loop")
        elif isinstance(n, ast.For) and "a for loop" not in kinds:
            kinds.append("a for loop")
        elif isinstance(n, ast.Lambda) and "a lambda" not in kinds:
            kinds.append("a lambda")
        elif isinstance(n, (ast.Yield, ast.YieldFrom)) and "yield" not in kinds:
            kinds.append("yield")
    parts = []
    if calls:
        parts.append(", ".join(f"`{c}`" for c in calls[:7]))
    if ops:
        parts.append(" ".join(f"`{o}`" for o in ops))
    if kinds:
        parts.append(", ".join(kinds))
    return "; ".join(parts) or "plain arithmetic and a return"


def _skeleton(stmts, depth=0, lines=None):
    lines = [] if lines is None else lines
    pad = "    " * (depth + 1)
    for s in stmts:
        if len(lines) >= 14:
            lines.append(pad + "...")
            return lines
        if isinstance(s, ast.For):
            lines.append(f"{pad}for {ast.unparse(s.target)} in ...:")
            _skeleton(s.body, depth + 1, lines)
        elif isinstance(s, ast.While):
            lines.append(f"{pad}while ...:")
            _skeleton(s.body, depth + 1, lines)
        elif isinstance(s, ast.If):
            lines.append(f"{pad}if ...:")
            _skeleton(s.body, depth + 1, lines)
            if s.orelse:
                lines.append(f"{pad}else:")
                _skeleton(s.orelse, depth + 1, lines)
        elif isinstance(s, ast.With):
            lines.append(f"{pad}with ... as {ast.unparse(s.items[0].optional_vars) if s.items[0].optional_vars else '_'}:")
            _skeleton(s.body, depth + 1, lines)
        elif isinstance(s, ast.Try):
            lines.append(f"{pad}try:")
            _skeleton(s.body, depth + 1, lines)
            for h in s.handlers:
                lines.append(f"{pad}except {ast.unparse(h.type) if h.type else ''}:".replace(" :", ":"))
                _skeleton(h.body, depth + 1, lines)
        elif isinstance(s, ast.Assign):
            lines.append(f"{pad}{' = '.join(ast.unparse(t) for t in s.targets)} = ...")
        elif isinstance(s, (ast.AugAssign,)):
            lines.append(f"{pad}{ast.unparse(s.target)} {OPS.get(type(s.op), '+').split(' ')[0] if type(s.op) in OPS else {ast.Add: '+', ast.Sub: '-', ast.Mult: '*', ast.Div: '/'}.get(type(s.op), '+')}= ...")
        elif isinstance(s, ast.AnnAssign):
            lines.append(f"{pad}{ast.unparse(s.target)} = ...")
        elif isinstance(s, ast.Return):
            lines.append(f"{pad}return ..." if s.value is not None else f"{pad}return")
        elif isinstance(s, (ast.FunctionDef,)):
            lines.append(f"{pad}def {s.name}(...): ...")
        elif isinstance(s, ast.Raise):
            lines.append(f"{pad}raise ...")
        elif isinstance(s, ast.Expr):
            lines.append(f"{pad}...  # a call")
        elif isinstance(s, (ast.Continue, ast.Break, ast.Pass)):
            lines.append(pad + ast.unparse(s))
        else:
            lines.append(pad + "...")
    return lines


def _first_line(fn):
    s = _body(fn)[0]
    txt = ast.unparse(s).split("\n")[0]
    return txt if len(txt) < 120 else txt[:117] + "..."


def make_hints(solution, max_functions=6):
    """Return three markdown strings (or [] if the solution has no functions)."""
    try:
        tree = ast.parse(solution)
    except SyntaxError:
        return []
    fns = _functions(tree)[:max_functions]
    if not fns:
        return []
    h1 = "\n".join(f"- `{name}`: {_tools(fn)}" for name, fn in fns)
    h2 = "\n\n".join(
        "```python\ndef " + name.split(".")[-1] + "(" + ast.unparse(fn.args) + "):\n" + "\n".join(_skeleton(_body(fn))) + "\n```"
        for name, fn in fns)
    h3 = "\n".join(f"- `{name}` starts with: `{_first_line(fn)}`" for name, fn in fns)
    return [
        "**What to reach for.**\n\n" + h1,
        "**The shape.** Fill in each `...`:\n\n" + h2,
        "**The first line** of each function:\n\n" + h3,
    ]


if __name__ == "__main__":
    import sys
    for h in make_hints(open(sys.argv[1]).read()):
        print(h, "\n---")
