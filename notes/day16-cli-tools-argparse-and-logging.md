# Day 16 — CLI tools: argparse and logging

> **AI-90** · Block 1 · Python + automation + real data · Day 16 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 16`)

[← Day 15](day15-capstone-matrix-library.md) · [All 90 days](README.md) · [Day 17 →](day17-file-automation-the-folder-organiser.md)

---

**Dataset:** none · **Time:** ~2 h

#### Visual

```text
$ python day16.py add 12.50 food --note lunch
$ python day16.py total
          │      │    │      │
       script  sub-  positional  optional flag
              command   args
logging levels:  DEBUG < INFO < WARNING < ERROR < CRITICAL
                 (set level=INFO → DEBUG lines hidden)
```

#### Notes

- `argparse` turns `sys.argv` into a typed object. Subcommands (`add`, `list`, `total`) = `add_subparsers(dest="cmd")`.
- Positional args are required (`amount`), options start with `--` and can have defaults.
- `type=float` converts for you and errors nicely on junk.
- Design trick: put logic in `run(argv)` that **returns** a string; `main()` just prints it. Now the CLI is testable.
- `logging` beats `print` for tools: timestamps, levels, can go to a file. `logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")`.

#### Worked example

```python
import argparse
p = argparse.ArgumentParser(prog="greet")
p.add_argument("name")
p.add_argument("--shout", action="store_true")
args = p.parse_args(["asish", "--shout"])
print(args.name.upper() if args.shout else args.name)   # ASISH
```

#### Your task — `day16.py`

- `build_parser()` → parser with subcommands `add AMOUNT CATEGORY [--note NOTE]`, `list`, `total`.
- `run(argv, store)` → executes against `store` (a list of dicts) and returns the output text. `add` reuses Day 7's `add_expense`; `total` returns `"TOTAL £x.xx"`; `list` returns one line per expense `"£12.50 food lunch"` (no trailing space when note is empty).

#### Tests

```python
# file: test_day16.py
import day16 as ex


def test_parser():
    args = ex.build_parser().parse_args(["add", "12.5", "Food", "--note", "lunch"])
    assert (args.cmd, args.amount, args.category, args.note) == ("add", 12.5, "Food", "lunch")


def test_run_add_list_total():
    store = []
    assert ex.run(["add", "12.5", "Food", "--note", "lunch"], store) == "added £12.50 food"
    ex.run(["add", "7.5", "transport"], store)
    assert ex.run(["list"], store) == "£12.50 food lunch\n£7.50 transport"
    assert ex.run(["total"], store) == "TOTAL £20.00"


def test_bad_amount_exits():
    try:
        ex.build_parser().parse_args(["add", "abc", "food"])
    except SystemExit:
        return
    raise AssertionError("argparse should reject a non-number amount")
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day16.py
import argparse
import logging
import sys

from day07 import add_expense, total

log = logging.getLogger("expenses")


def build_parser():
    p = argparse.ArgumentParser(prog="expenses", description="Track spending")
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="add an expense")
    a.add_argument("amount", type=float)
    a.add_argument("category")
    a.add_argument("--note", default="")
    sub.add_parser("list", help="list expenses")
    sub.add_parser("total", help="total spent")
    return p


def run(argv, store):
    args = build_parser().parse_args(argv)
    if args.cmd == "add":
        item = add_expense(store, args.amount, args.category, args.note)
        log.info("added %s", item)
        return f"added £{item['amount']:.2f} {item['category']}"
    if args.cmd == "list":
        return "\n".join(f"£{e['amount']:.2f} {e['category']} {e['note']}".rstrip() for e in store)
    return f"TOTAL £{total(store):.2f}"


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(run(sys.argv[1:], []))


if __name__ == "__main__":
    main()
```

</details>

**Done when:** `python ai90.py check 16` green and `python day16.py --help` prints usage.

---

[← Day 15](day15-capstone-matrix-library.md) · [All 90 days](README.md) · [Day 17 →](day17-file-automation-the-folder-organiser.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
