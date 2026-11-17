"""Per-day notes links on AI-90 day pages (demo mode, no CDN needed).

    python -m http.server 8765 &        (from the repo root)
    python tests/test_notes_links.py [shots-dir]
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

URL = "http://localhost:8765/index.html"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def demo_index(route):
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    html = re.sub(r'const SUPABASE_URL = "[^"]*";', 'const SUPABASE_URL = "";', html)
    await route.fulfill(status=200, body=html, headers={"content-type": "text/html; charset=utf-8"})


async def login(ctx):
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(URL)
    await pg.wait_for_selector("#em")
    await pg.fill("#em", "learner@pyml.dev"); await pg.fill("#pw", "demo1234")
    await pg.click(".authcard form button[type=submit]")
    await pg.wait_for_selector(".bento")
    return pg, errs


async def main():
    links = {d["day"]: d for d in json.load(open(os.path.join(ROOT, "notes", "links.json")))["days"]}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1360, "height": 900})
        await ctx.route("https://**", lambda r: r.abort())
        await ctx.route("http://localhost:8765/index.html*", demo_index)
        pg, errs = await login(ctx)
        for day in (1, 5, 44, 80, 90):
            await pg.evaluate(f"location.hash = 'd{day:02}'")
            await pg.wait_for_selector(".daynotes", timeout=15000)
            row = pg.locator(".daynotes")
            hrefs = await row.locator("a").evaluate_all("as => as.map(a => [a.getAttribute('href'), a.getAttribute('download'), a.target, a.getAttribute('aria-label')])")
            L = links[day]
            check(hrefs[0][0] == L["github"] and hrefs[0][2] == "_blank" and "new tab" in hrefs[0][3], f"day {day}: Read on GitHub → {L['file']}")
            check(hrefs[1][0] == L["path"] and hrefs[1][1] == L["file"], f"day {day}: Download .md has download={L['file']}")
            check(hrefs[2][0].endswith("/tree/main/notes"), f"day {day}: All 90 notes link")
            status = await pg.evaluate("p => fetch(p).then(r => r.status)", L["path"])
            body = await pg.evaluate("p => fetch(p).then(r => r.text())", L["path"])
            check(status == 200 and body.startswith(f"# Day {day} — "), f"day {day}: notes file is served ({status})")
            check(await row.locator("svg[aria-hidden=true]").count() == 2, f"day {day}: icons are decorative")
        if SHOTS:
            await pg.evaluate("location.hash = 'd80'"); await pg.wait_for_selector(".daynotes")
            await pg.wait_for_timeout(900)
            await pg.locator(".daynotes").scroll_into_view_if_needed()
            await pg.screenshot(path=f"{SHOTS}/notes-desktop.png")
        # keyboard focus is visible
        await pg.locator(".daynotes .lab").click()  # put the caret just before the links
        for _ in range(10):
            await pg.keyboard.press("Tab")
            if await pg.evaluate("!!document.activeElement.closest('.daynotes')"):
                break
        ol = await pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
        inrow = await pg.evaluate("!!document.activeElement.closest('.daynotes')")
        check(inrow and ol != "none", "Tab reaches the notes links and shows a focus ring")
        check(not errs, "no page errors: " + "; ".join(errs[:3]))

        # phone: 44px touch targets, no horizontal scroll
        m = await b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
        await m.route("https://**", lambda r: r.abort())
        await m.route("http://localhost:8765/index.html*", demo_index)
        mp, merrs = await login(m)
        await mp.evaluate("location.hash = 'd05'"); await mp.wait_for_selector(".daynotes")
        await mp.wait_for_timeout(900)
        hs = await mp.locator(".daynotes a").evaluate_all("as => as.map(a => a.getBoundingClientRect().height)")
        check(all(h >= 44 for h in hs), f"phone: notes links ≥ 44px tall {hs}")
        sw = await mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
        check(sw, "phone: no horizontal scroll")
        if SHOTS:
            await mp.locator(".daynotes").scroll_into_view_if_needed()
            await mp.screenshot(path=f"{SHOTS}/notes-phone.png")
        await b.close()
    print(f"\n{len(fails)} failing" if fails else "\nall passed")
    sys.exit(1 if fails else 0)


asyncio.run(main())
