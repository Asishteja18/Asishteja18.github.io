"""Add generated hints to the 24 warm-up lessons inlined in index.html.

    python3 tools/add_warmup_hints.py      (safe to re-run)
"""
import json
import re
import sys
from pathlib import Path

import markdown

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hints import make_hints  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
page = (ROOT / "index.html").read_text(encoding="utf-8")
m = re.search(r"^const __LESSONS__ = (\[.*\]);$", page, re.M)
lessons = json.loads(m.group(1))
for l in lessons:
    l["exercise"]["hints"] = [markdown.markdown(h, extensions=["fenced_code"]) for h in make_hints(l["exercise"]["solution"])]
new = "const __LESSONS__ = " + json.dumps(lessons, ensure_ascii=False).replace("</", "<\\/") + ";"
page = page[:m.start()] + new + page[m.end():]
(ROOT / "index.html").write_text(page, encoding="utf-8")
print(sum(1 for l in lessons if l["exercise"]["hints"]), "of", len(lessons), "warm-up lessons have hints")
