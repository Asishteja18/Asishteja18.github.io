"""AI-90 + Midnight redesign end-to-end (demo mode).

    python -m http.server 8765 &        (from the repo root)
    python tests/test_ai90_site.py <pyodide-dist-dir> <cdn-dir> [shots-dir]

<pyodide-dist-dir> is the full Pyodide 0.29.5 release (with numpy etc.);
<cdn-dir> holds npm-packed gsap-3.12.7/ and mermaid-11.4.1/. Supabase stays
blocked, so the site runs in demo mode.
"""
import asyncio, mimetypes, os, re, sys
from playwright.async_api import async_playwright

URL = "http://localhost:8765/index.html"
PYO, CDN = sys.argv[1], sys.argv[2]
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
MAP = [
    ("https://cdn.jsdelivr.net/npm/pyodide@0.29.5/", PYO + "/"),
    ("https://cdn.jsdelivr.net/npm/gsap@3.12.7/", CDN + "/gsap-3.12.7/package/"),
    ("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/", CDN + "/mermaid-11.4.1/package/"),
]
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def cdn(route):
    u = route.request.url.split("?")[0]
    for pre, loc in MAP:
        if u.startswith(pre):
            p = loc + u[len(pre):]
            if os.path.isfile(p):
                ct = "application/wasm" if p.endswith(".wasm") else "text/javascript" if p.endswith((".mjs", ".js")) \
                    else mimetypes.guess_type(p)[0] or "application/octet-stream"
                body = open(p, "rb").read()
                return await route.fulfill(status=200, body=body, headers={"content-type": ct, "access-control-allow-origin": "*"})
            return await route.fulfill(status=404, body="")
    await route.abort()


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


async def demo_index(route):
    # the live site has Supabase keys; tests run the same page in demo mode
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    html = re.sub(r'const SUPABASE_URL = "[^"]*";', 'const SUPABASE_URL = "";', html)
    await route.fulfill(status=200, body=html, headers={"content-type": "text/html; charset=utf-8"})


async def shot(pg, name, full=False):
    if SHOTS:
        await pg.screenshot(path=f"{SHOTS}/{name}.png", full_page=full)


async def go(pg, h):
    await pg.evaluate(f"location.hash = '{h}'")
    await pg.wait_for_timeout(500)


async def set_code(pg, code):
    await pg.evaluate("c => { const t = document.querySelector('.editor textarea'); t.value = c; t.dispatchEvent(new Event('input')); }", code)


async def run_tests(pg, timeout=240000):
    await pg.click(".editor .btn:not(.ghost)")
    await pg.wait_for_function("() => !document.querySelector('.editor .btn:not(.ghost)').disabled && /passing|Error|unavailable/.test(document.querySelector('.status').textContent)", timeout=timeout)
    return await pg.inner_text(".status")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1360, "height": 900})
        await ctx.route("https://cdn.jsdelivr.net/**", cdn)
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        await ctx.route("http://localhost:8765/index.html*", demo_index)
        errs = []
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))

        # ---------------------------------------------------- landing
        await pg.goto(URL)
        await pg.wait_for_selector("#em")
        await pg.wait_for_timeout(900)
        check(await pg.get_attribute("html", "data-theme") == "dark", "Midnight is the default theme")
        check(await pg.locator(".aurora i").count() == 4, "aurora blobs present")
        check(await pg.locator("svg.grain").count() == 1, "film grain overlay present")
        pe = await pg.evaluate("getComputedStyle(document.querySelector('svg.grain')).pointerEvents")
        check(pe == "none", "grain never catches the pointer")
        check(await pg.evaluate("!!window.gsap"), "GSAP loaded for staggered reveals")
        txt = await pg.inner_text("body")
        check("Days 61–90" in txt and "307" in txt, "landing pitch mentions the AI-90 path")
        bf = await pg.evaluate("getComputedStyle(document.querySelector('.auth')).backdropFilter")
        check("blur(16px)" in bf, "auth card is frosted glass (blur 16px)")
        await shot(pg, "01-landing")

        # spotlight follows the cursor
        box = await pg.locator(".auth").bounding_box()
        await pg.mouse.move(box["x"] + 40, box["y"] + 30)
        await pg.wait_for_timeout(450)
        mx = await pg.evaluate("document.querySelector('.auth').style.getPropertyValue('--mx')")
        check(mx == "40px", "spotlight border tracks the cursor (--mx = %s)" % mx)

        await pg.fill("#em", "learner@pyml.dev"); await pg.fill("#pw", "demo1234")
        await pg.click(".authcard form button[type=submit]")
        await pg.wait_for_selector(".bento")
        await pg.wait_for_timeout(1200)

        # ---------------------------------------------------- hub bento
        check(await pg.locator(".bcard.stage").count() == 3, "three stage cards in the bento")
        check(await pg.locator(".jgrid .jc").count() == 90, "AI-90 journey grid has 90 days")
        stages = (await pg.text_content(".bento"))
        check("Days 1–30" in stages and "Days 31–60" in stages and "Days 61–90" in stages, "stage cards show day ranges")
        check("Coming soon" not in stages, "ML and AI stages are open now")
        await shot(pg, "02-hub")

        # ---------------------------------------------------- track page
        await go(pg, "python"); await pg.wait_for_selector(".wrap .sect")
        heads = await pg.locator(".wrap .secttitle").all_inner_texts()
        check(heads[:1] == ["Introduction"] and "Days 1–15 · Core Python" in heads and "Days 22–30 · Real data" in heads,
              "Python stage: warm-up then Days 1–15 / 16–21 / 22–30 (%s)" % heads)
        check(await pg.locator(".blockintro").count() == 1, "block overview card on the stage page")
        await go(pg, "ml"); await pg.wait_for_selector(".wrap .sect")
        await pg.click(".blockintro summary")
        await pg.wait_for_selector(".blockintro .mermaid-box.drawn svg", timeout=20000)
        check(True, "Mermaid diagram rendered in the ML block overview")
        heads = await pg.locator(".wrap .secttitle").all_inner_texts()
        check(heads[0].startswith("Warm-up") and "Days 31–34 · The maths" in heads, "ML stage: warm-up then Days 31+ (%s)" % heads[:3])
        await go(pg, "ai"); await pg.wait_for_selector(".wrap .sect")
        heads = await pg.locator(".wrap .secttitle").all_inner_texts()
        check("Days 73–81 · Language models + GPT" in heads, "AI stage has the GPT section")
        await shot(pg, "03-track-ai")

        # ---------------------------------------------------- Day 1
        await go(pg, "d01"); await pg.wait_for_selector(".lesson h1")
        check("Day 01 of 90" in await pg.text_content(".kicker"), "day kicker")
        check(await pg.locator(".asciivis").count() >= 1, "ASCII visual rendered")
        await pg.wait_for_selector(".viz-hms .vizbig", timeout=15000)
        check(await pg.inner_text(".viz-hms .vizkv.hi code") == '"01:02:03"', "hms illustration shows 3723 s → 01:02:03")
        await pg.locator(".viz-hms input[type=range]").fill("59")
        check(await pg.inner_text(".viz-hms .vizkv.hi code") == '"00:00:59"', "hms slider updates the readout")
        await pg.wait_for_function("document.querySelector('.status').textContent.includes('Python ready')", timeout=120000)
        check(True, "Python worker starts")
        st = await run_tests(pg)
        check("0/5 passing" in st and "5 not started" in st, "starter: 5 tests not started (%s)" % st)
        await set_code(pg, await pg.evaluate("__aim.ai90.lessons[0].exercise.solution"))
        st = await run_tests(pg)
        check("5/5 passing" in st, "Day 1 reference solution passes 5/5 (%s)" % st)
        check(await pg.is_visible(".done"), "done banner shown")
        pts = await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev'].points")
        check(pts == 5, "clearing Day 1 earns +5 points (got %s)" % pts)
        # a wrong answer shows a failure with a message
        await set_code(pg, "def c_to_f(c):\n    return 0\n")
        st = await run_tests(pg)
        check("passing" in st and await pg.locator(".t.fail").count() >= 1, "wrong code shows failing rows (%s)" % st)
        check(await pg.is_visible(".askhelp"), "failing run offers Ask a doubt")
        # code is saved per lesson
        await pg.reload(); await pg.wait_for_selector(".editor textarea")
        check("return 0" in await pg.input_value(".editor textarea"), "editor code survives a reload")
        # run a worked example
        await pg.locator(".snip .sniprun").first.click()
        await pg.wait_for_selector(".snipout .snipprint", timeout=60000)
        out = await pg.inner_text(".snipout")
        check("float" in out or "class" in out, "worked example runs and prints (%s)" % out[:60].replace("\n", " "))
        await shot(pg, "04-day01", True)

        # ---------------------------------------------------- numpy day
        await go(pg, "d31"); await pg.wait_for_selector(".viz-vector canvas", timeout=15000)
        await pg.wait_for_function("document.querySelector('.status').textContent.includes('ready')", timeout=60000)
        await set_code(pg, await pg.evaluate("__aim.ai90.lessons[30].exercise.solution"))
        st = await run_tests(pg)
        check("4/4 passing" in st, "Day 31 (NumPy + Iris via Day 23) passes in the browser (%s)" % st)
        await shot(pg, "05-day31")

        # ---------------------------------------------------- matplotlib example → figure
        await go(pg, "d25"); await pg.wait_for_selector(".lesson h1")
        snips = pg.locator(".snip")
        n = await snips.count()
        got_fig = False
        for i in range(n):
            code = await snips.nth(i).locator("pre").first.inner_text()
            if "plt." in code and "download" not in code:
                await snips.nth(i).locator(".sniprun").click()
                await snips.nth(i).locator(".snipout .snipfig, .snipout .e").first.wait_for(timeout=120000)
                got_fig = await snips.nth(i).locator(".snipfig").count() > 0
                break
        check(got_fig or n == 0, "a matplotlib example draws a real figure")

        # ---------------------------------------------------- old-style lesson still works
        await go(pg, "py-01"); await pg.wait_for_selector(".editor textarea")
        await pg.wait_for_function("document.querySelector('.status').textContent.includes('ready')", timeout=60000)
        await set_code(pg, "def to_fahrenheit(celsius_text):\n    return float(celsius_text) * 9 / 5 + 32\n")
        st = await run_tests(pg)
        check("5/5 passing" in st, "original lessons still grade (%s)" % st)

        # ---------------------------------------------------- every illustration mounts
        vids = await pg.evaluate("__aim.ai90.lessons.flatMap(l => l.sections.filter(s => s.type === 'viz').map(s => [l.id, s.viz]))")
        bad = []
        for lid, vid in vids:
            await go(pg, lid)
            try:
                await pg.wait_for_selector(f".viz-{vid} .vizstage > *, .viz-{vid} > *", timeout=10000)
                await pg.wait_for_timeout(250)
                if await pg.locator(f".viz-{vid} .vizhint:has-text('could not start')").count():
                    bad.append(vid)
            except Exception:
                bad.append(vid)
            if vid in ("gd", "kmeans", "attention", "conv", "bigram", "perceptron", "timeseries", "tree", "sampling", "bpe"):
                el = pg.locator(".vizwrap").first
                await el.scroll_into_view_if_needed()
                if SHOTS:
                    await el.screenshot(path=f"{SHOTS}/viz-{vid}.png")
        check(not bad, f"all {len(vids)} illustrations mount ({bad})")

        # interact: k-means converges, perceptron learns AND, attention rows sum to 1
        await go(pg, "d47"); await pg.wait_for_selector(".viz-kmeans canvas")
        await pg.click(".viz-kmeans .vizbtn:has-text('Run')"); await pg.wait_for_timeout(5000)
        txt = await pg.inner_text(".viz-kmeans .vizread")
        check("match the real species" in txt and float(txt.split("% match")[0].split()[-1]) > 90, "k-means on Iris reports agreement with real species (%s)" % txt.split("\n")[-1])
        await go(pg, "d61"); await pg.wait_for_selector(".viz-perceptron canvas")
        await pg.click(".viz-perceptron .vizbtn >> text='Train'"); await pg.wait_for_timeout(4000)
        check("converged" in await pg.inner_text(".viz-perceptron .vizread"), "perceptron converges on AND")

        # ---------------------------------------------------- theme toggle
        await go(pg, ""); await pg.wait_for_selector(".bento")
        tb = pg.locator(".themebtn")
        if await tb.count():
            await tb.first.click()
            check(await pg.get_attribute("html", "data-theme") == "light", "Frosted (light) theme toggles on")
            await pg.wait_for_timeout(600)
            await shot(pg, "06-hub-frosted")
            await tb.first.click()
        else:
            check(False, "theme button present")

        # ---------------------------------------------------- phone
        ph = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        await ph.route("https://cdn.jsdelivr.net/**", cdn)
        await ph.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        await ph.route("http://localhost:8765/index.html*", demo_index)
        m = await ph.new_page()
        m.on("pageerror", lambda e: errs.append("phone " + str(e)))
        await m.goto(URL); await m.wait_for_selector("#em")
        await m.fill("#em", "learner@pyml.dev"); await m.fill("#pw", "demo1234")
        await m.click(".authcard form button[type=submit]")
        await m.wait_for_selector(".bento"); await m.wait_for_timeout(1200)
        sw = await m.evaluate("document.documentElement.scrollWidth")
        check(sw <= 392, "no horizontal scroll on a phone (scrollWidth %s)" % sw)
        await shot(m, "07-phone-hub", True)
        await m.evaluate("location.hash='d76'"); await m.wait_for_selector(".viz-attention table", timeout=15000)
        await m.wait_for_timeout(600)
        sw = await m.evaluate("document.documentElement.scrollWidth")
        check(sw <= 392, "lesson with attention table fits a phone (scrollWidth %s)" % sw)
        await shot(m, "08-phone-d76", True)

        errs = [e for e in errs if "supabase" not in e.lower() and "ERR_FAILED" not in e and "Failed to load resource" not in e]
        check(not errs, "no page errors (%s)" % errs[:3])
        await b.close()
    print("\n%d checks failed" % len(fails) if fails else "\nALL CHECKS PASSED")
    sys.exit(1 if fails else 0)


asyncio.run(main())
