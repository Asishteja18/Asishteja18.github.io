# Day 18 — Regular expressions: log parser

> **AI-90** · Block 1 · Python + automation + real data · Day 18 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 18`)

[← Day 17](day17-file-automation-the-folder-organiser.md) · [All 90 days](README.md) · [Day 19 →](day19-http-apis-and-json-live-weather.md)

---

**Dataset:** web-server access logs (Common Log Format). Real one to try after: the NASA-HTTP July 1995 log (search "NASA HTTP access log 1995"). · **Time:** ~2 h

#### Visual

```text
 83.149.9.216 - - [17/Nov/2026:10:05:03 +0000] "GET /index.html HTTP/1.1" 200 3041
 └────┬─────┘      └──────────┬─────────┘        └┬┘ └────┬────┘            └┬┘ └─┬┘
     ip                     time              method   path              status bytes
 regex groups:  (?P<ip>\S+) ... \[(?P<time>[^\]]+)\] "(?P<method>\w+) (?P<path>\S+) ..." (?P<status>\d{3})
```

#### Notes

- `re.compile(pattern)` once, reuse many times. `m = PAT.match(line)`; `m.group("ip")` or `m.groupdict()`.
- Core syntax: `\d` digit, `\w` word char, `\S` non-space, `+` one or more, `*` zero or more, `?` optional, `[^\]]` anything but `]`, `(?P<name>...)` named group, `^`/`$` anchors.
- Always use raw strings `r"..."` so backslashes survive.
- `datetime.strptime("17/Nov/2026:10:05:03", "%d/%b/%Y:%H:%M:%S")` parses the time.
- Test patterns at regex101.com (pick Python flavour).

#### Your task — `day18.py`

- `parse_line(line)` → dict `ip, time, method, path, status (int), bytes (int, '-' → 0)`, or `None` if it doesn't match.
- `errors_per_hour(lines)` → `{"2026-11-17 10": n}` counting status ≥ 400, ignoring bad lines.
- `top_paths(lines, n)` → most requested paths `[(path, count)]`, ties alphabetical.

#### Tests

```python
# file: test_day18.py
import day18 as ex

LOG = [
    '83.149.9.216 - - [17/Nov/2026:10:05:03 +0000] "GET /index.html HTTP/1.1" 200 3041',
    '10.0.0.5 - - [17/Nov/2026:10:17:44 +0000] "GET /missing HTTP/1.1" 404 -',
    '10.0.0.5 - - [17/Nov/2026:10:59:59 +0000] "POST /api/login HTTP/1.1" 500 12',
    'garbage line',
    '10.0.0.9 - - [17/Nov/2026:11:00:00 +0000] "GET /index.html HTTP/1.1" 503 0',
]


def test_parse_line():
    assert ex.parse_line(LOG[0]) == {"ip": "83.149.9.216", "time": "17/Nov/2026:10:05:03 +0000",
                                     "method": "GET", "path": "/index.html", "status": 200, "bytes": 3041}
    assert ex.parse_line(LOG[1])["bytes"] == 0
    assert ex.parse_line("garbage line") is None


def test_errors_per_hour():
    assert ex.errors_per_hour(LOG) == {"2026-11-17 10": 2, "2026-11-17 11": 1}


def test_top_paths():
    assert ex.top_paths(LOG, 2) == [("/index.html", 2), ("/api/login", 1)]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day18.py
import re
from collections import Counter
from datetime import datetime

PAT = re.compile(r'(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\w+) (?P<path>\S+) [^"]*" '
                 r'(?P<status>\d{3}) (?P<bytes>\d+|-)')


def parse_line(line):
    m = PAT.match(line)
    if not m:
        return None
    d = m.groupdict()
    d["status"] = int(d["status"])
    d["bytes"] = 0 if d["bytes"] == "-" else int(d["bytes"])
    return d


def errors_per_hour(lines):
    out = {}
    for line in lines:
        d = parse_line(line)
        if d and d["status"] >= 400:
            t = datetime.strptime(d["time"].split()[0], "%d/%b/%Y:%H:%M:%S")
            key = t.strftime("%Y-%m-%d %H")
            out[key] = out.get(key, 0) + 1
    return out


def top_paths(lines, n):
    c = Counter(d["path"] for d in map(parse_line, lines) if d)
    return sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[:n]
```

</details>

**Done when:** green, plus you've written one regex of your own (e.g. pull UK postcodes or emails out of a text file).

---

[← Day 17](day17-file-automation-the-folder-organiser.md) · [All 90 days](README.md) · [Day 19 →](day19-http-apis-and-json-live-weather.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
