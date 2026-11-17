# Day 21 — Scheduling and idempotent jobs

> **AI-90** · Block 1 · Python + automation + real data · Day 21 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 21`)

[← Day 20](day20-web-scraping.md) · [All 90 days](README.md) · [Day 22 →](day22-real-dataset-1-titanic-by-hand.md)

---

**Dataset:** your Day 19 weather data, appended hourly · **Time:** ~2 h

#### Visual

```text
 cron:  ┌─ minute (0-59)
        │ ┌─ hour (0-23)
        │ │ ┌─ day of month
        │ │ │ ┌─ month
        │ │ │ │ ┌─ day of week (0=Sun)
        0 * * * *   python day19.py     → every hour on the hour
        30 6 * * 1-5                    → 06:30 on weekdays
 idempotent: run it twice → same result as once (no duplicate rows)
```

#### Notes

- Schedulers: Linux/macOS `crontab -e`; Windows Task Scheduler; in-Python `schedule` library; in the cloud GitHub Actions (Day 28).
- Jobs crash, re-run, and overlap. Make them **idempotent**: dedupe on a key (e.g. timestamp) before appending.
- Keep a `last_run` timestamp so a job knows if it's due.
- Log every run to a file — when it fails at 3am, the log is all you have.

#### Your task — `day21.py`

- `is_due(last_run_iso, now_iso, every_minutes)` → `True` if never run (`None`) or enough minutes passed.
- `append_unique(csv_path, rows, key)` → appends dict rows whose `key` value isn't in the file yet (creates file + header if missing); returns number added.

#### Tests

```python
# file: test_day21.py
import csv
import tempfile
from pathlib import Path

import day21 as ex


def test_is_due():
    assert ex.is_due(None, "2026-11-17T10:00", 60) is True
    assert ex.is_due("2026-11-17T09:30", "2026-11-17T10:00", 60) is False
    assert ex.is_due("2026-11-17T09:00", "2026-11-17T10:00", 60) is True


def test_append_unique_is_idempotent():
    p = Path(tempfile.mkdtemp()) / "weather.csv"
    rows = [{"time": "T00", "temp": "6.1"}, {"time": "T01", "temp": "5.8"}]
    assert ex.append_unique(p, rows, "time") == 2
    assert ex.append_unique(p, rows, "time") == 0
    assert ex.append_unique(p, rows + [{"time": "T02", "temp": "5.5"}], "time") == 1
    with open(p, newline="") as f:
        got = list(csv.DictReader(f))
    assert [r["time"] for r in got] == ["T00", "T01", "T02"]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day21.py
import csv
from datetime import datetime
from pathlib import Path


def is_due(last_run_iso, now_iso, every_minutes):
    if last_run_iso is None:
        return True
    gap = datetime.fromisoformat(now_iso) - datetime.fromisoformat(last_run_iso)
    return gap.total_seconds() >= every_minutes * 60


def append_unique(csv_path, rows, key):
    p = Path(csv_path)
    seen = set()
    if p.exists():
        with open(p, newline="", encoding="utf-8") as f:
            seen = {r[key] for r in csv.DictReader(f)}
    new = []
    for r in rows:
        if r[key] not in seen:
            seen.add(r[key])
            new.append(r)
    if new:
        write_header = not p.exists()
        with open(p, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(new[0]))
            if write_header:
                w.writeheader()
            w.writerows(new)
    return len(new)
```

</details>

**Done when:** green + a cron/Task Scheduler entry runs your weather fetch every hour and the CSV grows without duplicates.

---

[← Day 20](day20-web-scraping.md) · [All 90 days](README.md) · [Day 22 →](day22-real-dataset-1-titanic-by-hand.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
