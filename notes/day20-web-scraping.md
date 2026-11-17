# Day 20 — Web scraping

> **AI-90** · Block 1 · Python + automation + real data · Day 20 of 90  
> Practise it with live tests on [telugucoders.com](https://telugucoders.com/) · run it locally with the [master file](../syllabus/AI90_MASTER.md) (`python ai90.py check 20`)

[← Day 19](day19-http-apis-and-json-live-weather.md) · [All 90 days](README.md) · [Day 21 →](day21-scheduling-and-idempotent-jobs.md)

---

**Dataset:** books.toscrape.com (a site built for scraping practice) · **Time:** ~2 h

#### Visual

```text
 <table>                                   [{"Title": "A Light in the Attic",
   <tr><th>Title</th><th>Price</th></tr>     "Price": "£51.77"},
   <tr><td>A Light…</td><td>£51.77</td></tr>  ...]
 </table>
 HTML tree:  html → body → table → tr → td      soup.select("table tr")
 relative link "catalogue/page-2.html"  + base  →  absolute URL (urljoin)
```

#### Notes

- Check `robots.txt` and terms first. Add a delay (`time.sleep(1)`) between pages. Identify yourself with a `User-Agent`.
- `BeautifulSoup(html, "html.parser")` → `soup.select("css selector")`, `tag.get_text(strip=True)`, `tag["href"]`.
- `urllib.parse.urljoin(base, href)` turns relative links into full URLs.
- Parse functions take **HTML strings** — easy to test, then plug in `requests.get(url).text`.

#### Your task — `day20.py`

- `extract_table(html)` → list of dicts from the first `<table>`, header cells from `<th>`.
- `extract_links(html, base)` → absolute URLs of all `<a href>`, deduped, in page order.
- `parse_books(html)` → list of `(title, price_float)` from books.toscrape.com product cards (`article.product_pod`, title in `h3 a[title]`, price in `p.price_color`).

#### Tests

```python
# file: test_day20.py
import day20 as ex

TABLE = """<html><body><table>
<tr><th>Title</th><th>Price</th></tr>
<tr><td> A Light in the Attic </td><td>£51.77</td></tr>
<tr><td>Tipping the Velvet</td><td>£53.74</td></tr>
</table></body></html>"""

CARDS = """<ol><li><article class="product_pod"><h3><a href="a/index.html" title="A Light in the Attic">A Light…</a></h3>
<p class="price_color">£51.77</p></article></li>
<li><article class="product_pod"><h3><a href="b/index.html" title="Soumission">Soum…</a></h3>
<p class="price_color">Â£50.10</p></article></li></ol><a href="a/index.html">dup</a>"""


def test_extract_table():
    assert ex.extract_table(TABLE) == [{"Title": "A Light in the Attic", "Price": "£51.77"},
                                       {"Title": "Tipping the Velvet", "Price": "£53.74"}]


def test_extract_links():
    assert ex.extract_links(CARDS, "https://books.toscrape.com/catalogue/") == [
        "https://books.toscrape.com/catalogue/a/index.html", "https://books.toscrape.com/catalogue/b/index.html"]


def test_parse_books():
    assert ex.parse_books(CARDS) == [("A Light in the Attic", 51.77), ("Soumission", 50.10)]
```

<details><summary>Reference solution (try first!)</summary>

```python
# file: day20.py
import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup


def extract_table(html):
    table = BeautifulSoup(html, "html.parser").find("table")
    rows = table.find_all("tr")
    headers = [th.get_text(strip=True) for th in rows[0].find_all("th")]
    return [dict(zip(headers, (td.get_text(strip=True) for td in r.find_all("td")))) for r in rows[1:]]


def extract_links(html, base):
    seen, out = set(), []
    for a in BeautifulSoup(html, "html.parser").find_all("a", href=True):
        url = urljoin(base, a["href"])
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def parse_books(html):
    out = []
    for card in BeautifulSoup(html, "html.parser").select("article.product_pod"):
        title = card.select_one("h3 a")["title"]
        price = float(re.sub(r"[^\d.]", "", card.select_one("p.price_color").get_text()))
        out.append((title, price))
    return out


if __name__ == "__main__":
    import time
    import requests
    url = "https://books.toscrape.com/catalogue/page-1.html"
    books = []
    for page in range(1, 4):
        html = requests.get(url.replace("page-1", f"page-{page}"), timeout=10).text
        books += parse_books(html)
        time.sleep(1)
    print(len(books), "books; cheapest:", min(books, key=lambda b: b[1]))
```

</details>

**Done when:** green + `python day20.py` scrapes 3 real pages (60 books) into a list.

---

[← Day 19](day19-http-apis-and-json-live-weather.md) · [All 90 days](README.md) · [Day 21 →](day21-scheduling-and-idempotent-jobs.md)

<sub>Generated from `syllabus/AI90_MASTER.md` by `tools/build_notes.py`. AI-90 — 90 days to build your own AI, by Asish Teja Vinnakota.</sub>
