"""v5 end-to-end (demo mode): try-before-signup, CodeMirror editor, hints,
weekly challenge + board, onboarding tour, Telugu video slots, reminders,
certificates (claim + public verify), portfolio zip, admin drop-off + spot
check, PWA/share files, and an axe accessibility audit.

    python -m http.server 8765 &        (from the repo root)
    python tests/test_v5.py <pyodide-dist-dir> <cdn-dir> <axe.min.js> [shots-dir]
"""
import asyncio, io, json, mimetypes, os, re, sys, urllib.request, zipfile
from playwright.async_api import async_playwright

BASE = "http://localhost:8765/"
URL = BASE + "index.html"
PYO, CDN, AXE = sys.argv[1], sys.argv[2], sys.argv[3]
SHOTS = sys.argv[4] if len(sys.argv) > 4 else None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = [("https://cdn.jsdelivr.net/npm/pyodide@0.29.5/", PYO + "/"),
       ("https://cdn.jsdelivr.net/npm/gsap@3.12.7/", CDN + "/gsap-3.12.7/package/"),
       ("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/", CDN + "/mermaid-11.4.1/package/")]
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
                return await route.fulfill(status=200, body=open(p, "rb").read(), headers={"content-type": ct, "access-control-allow-origin": "*"})
            return await route.fulfill(status=404, body="")
    await route.abort()


async def demo_index(route):
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    html = re.sub(r'const SUPABASE_URL = "[^"]*";', 'const SUPABASE_URL = "";', html)
    await route.fulfill(status=200, body=html, headers={"content-type": "text/html; charset=utf-8"})


async def new_ctx(b, **kw):
    ctx = await b.new_context(viewport={"width": 1360, "height": 900}, accept_downloads=True, **kw)
    await ctx.route("https://cdn.jsdelivr.net/**", cdn)
    await ctx.route(re.compile(r"https://(fonts\.googleapis|fonts\.gstatic|i\.ytimg|www\.youtube).*"), lambda r: r.abort())
    await ctx.route("http://localhost:8765/index.html*", demo_index)
    return ctx


async def shot(pg, name, full=False):
    if SHOTS:
        await pg.screenshot(path=f"{SHOTS}/v5-{name}.png", full_page=full)


async def go(pg, h, wait=500):
    await pg.evaluate(f"location.hash = '{h}'")
    await pg.wait_for_timeout(wait)


async def login(pg, email):
    await pg.goto(URL)
    await pg.wait_for_selector("#em")
    await pg.fill("#em", email); await pg.fill("#pw", "demo1234")
    await pg.click(".authcard form button[type=submit]")
    await pg.wait_for_selector(".bar")


async def set_code(pg, code):
    await pg.evaluate("c => { const t = document.querySelector('.editor textarea'); t.value = c; t.dispatchEvent(new Event('input')); }", code)


async def run_tests(pg, timeout=180000):
    await pg.click(".editor .erow .btn:not(.ghost)")
    await pg.wait_for_function("() => !document.querySelector('.editor .erow .btn:not(.ghost)').disabled && /passing|Error|unavailable/.test(document.querySelector('.status').textContent)", timeout=timeout)
    return await pg.inner_text(".status")


async def axe(pg, name):
    await pg.wait_for_timeout(1600)   # let entrance animations finish
    await pg.add_script_tag(path=AXE)
    res = await pg.evaluate("""async () => {
      const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'], resultTypes: ['violations'] });
      return r.violations.filter(v => ['serious', 'critical'].includes(v.impact))
        .map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sel: v.nodes.slice(0, 3).map(x => x.target.join(' ')),
                     msg: (v.nodes[0] && v.nodes[0].failureSummary || '').split('\\n').slice(0, 3).join(' ') }));
    }""")
    check(not res, f"axe: no serious/critical WCAG A/AA issues on {name}" + ("" if not res else " -> " + json.dumps(res)[:900]))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []

        # ------------------------------------------------ files for install + sharing
        for path, ctype in [("manifest.webmanifest", None), ("sw.js", None), ("assets/og.png", "image/png"),
                            ("assets/icon-192.png", "image/png"), ("assets/editor.js", None)]:
            try:
                r = urllib.request.urlopen(BASE + path)
                check(r.status == 200, f"{path} is served")
            except Exception as e:
                check(False, f"{path} is served ({e})")
        man = json.load(urllib.request.urlopen(BASE + "manifest.webmanifest"))
        check(man["display"] == "standalone" and any(i.get("purpose") == "maskable" for i in man["icons"]), "manifest: standalone + maskable icon")
        html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
        check('property="og:image" content="https://telugucoders.com/assets/og.png"' in html and 'twitter:card' in html, "share preview tags present")

        # ------------------------------------------------ guest: try before signup
        ctx = await new_ctx(b)
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL)
        await pg.wait_for_selector("#em")
        await pg.wait_for_timeout(700)
        check(await pg.locator(".herocta a[href='#try-d01']").count() == 1, "landing has a 'Try Day 1 now' button")
        await axe(pg, "landing")
        await pg.click(".herocta a[href='#try-d01']")
        await pg.wait_for_selector(".guestbar")
        check(await pg.locator(".trynav a").count() == 3, "guest bar offers 3 lessons to try")
        await pg.wait_for_selector(".editor .cm-editor", timeout=15000)
        check(await pg.locator(".editor .cm-editor .cm-line").count() > 3, "CodeMirror editor shows the starter")
        check(await pg.locator(".lessondoubts").is_hidden(), "guests don't see doubts")
        # hints, step by step
        await pg.click(".hintbtn")
        await pg.click(".hintbtn")
        await pg.click(".hintbtn")
        check(await pg.locator(".hintstep").count() == 3 and await pg.is_disabled(".hintbtn"), "three hints, then the button stops")
        txt = await pg.inner_text(".hintbox")
        check("What to reach for" in txt and "seconds_to_hms" in txt and "hours = ..." in txt, "hints: tools, shape, first line")
        # typing in CodeMirror reaches the textarea (and is saved)
        await pg.click(".editor .cm-content")
        await pg.keyboard.press("Control+End")
        await pg.keyboard.type("\n# typed in the editor\n")
        check("# typed in the editor" in await pg.input_value(".editor textarea"), "typing in CodeMirror updates the code that runs")
        await pg.wait_for_function("document.querySelector('.status').textContent.includes('ready')", timeout=120000)
        await set_code(pg, await pg.evaluate("__aim.ai90.lessons[0].exercise.solution"))
        check("def c_to_f" in await pg.inner_text(".editor .cm-content"), "code set from outside shows in CodeMirror")
        st = await run_tests(pg)
        check("5/5 passing" in st, "guest passes Day 1 in the browser (%s)" % st)
        check("Sign up to save this" in await pg.inner_text(".askhelp"), "guest gets a sign-up nudge after passing")
        await shot(pg, "guest-d01", True)
        await go(pg, "try-d76", 900); await pg.wait_for_selector(".viz-attention table", timeout=15000)
        check(True, "guest can open the attention lesson + illustration")
        await axe(pg, "guest lesson")

        # ------------------------------------------------ sign in: guest pass carries over, tour, weekly
        await go(pg, "")
        await pg.wait_for_selector("#em")
        await pg.fill("#em", "learner@pyml.dev"); await pg.fill("#pw", "demo1234")
        await pg.click(".authcard form button[type=submit]")
        await pg.wait_for_selector(".bento")
        await pg.wait_for_timeout(1800)
        st = await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev']")
        ch = await pg.evaluate("__aim_ch = (() => { const d = new Date(); const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); const k = Math.floor(Math.round((day - Date.UTC(2026, 10, 16)) / 864e5) / 7); return 'd' + String((((k * 37) % 90) + 90) % 90 + 1).padStart(2, '0'); })()")
        want = 15 if ch == "d01" else 5
        check(st.get("points") == want, f"guest's Day 1 carried over after sign-in: {st.get('points')} points (want {want}, challenge {ch})")
        check(await pg.locator(".bcard.challenge").count() == 1, "hub shows this week's challenge")
        board = await pg.inner_text(".bcard.weekly")
        check("(you)" in board and f"{want} pts" in board, "weekly board lists you with this week's points (%s)" % board.replace("\n", " | "))
        check(await pg.locator(".tourtip").count() == 1, "first visit starts the tour")
        await shot(pg, "tour")
        n = 0
        while await pg.locator(".tourtip").count() and n < 8:
            await pg.click(".tourtip .btn:not(.ghost)"); await pg.wait_for_timeout(450); n += 1
        check(await pg.locator(".tourtip").count() == 0 and n >= 4, f"tour has {n} steps and closes")
        check(await pg.evaluate("localStorage.getItem('aim.toured.v1')") == "1", "tour only runs once")
        await axe(pg, "hub")
        await shot(pg, "hub")

        # reminders toggle in the menu
        await pg.click(".menubtn"); await pg.wait_for_selector(".mepanel.open")
        await pg.click(".remtoggle input")
        await pg.wait_for_timeout(200)
        check(await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev'].reminders") is False, "reminders can be switched off")
        await pg.keyboard.press("Escape")

        # ------------------------------------------------ certificates + portfolio
        await pg.evaluate("""() => { const k = 'pyml.progress.learner@pyml.dev'; const p = JSON.parse(localStorage.getItem(k) || '{}');
          for (let i = 1; i <= 30; i++) p['d' + String(i).padStart(2, '0')] = true; localStorage.setItem(k, JSON.stringify(p)); }""")
        await pg.reload(); await pg.wait_for_selector(".bento")
        await go(pg, "me", 900); await pg.wait_for_selector(".certcard")
        check(await pg.locator(".certcard").count() == 3, "three certificate cards")
        check(await pg.locator(".certcard.ready").count() == 1, "Python certificate ready after 30 days")
        await pg.fill(".certclaim input", "Learner <script>One</script>")
        await pg.click(".certclaim button")
        await pg.wait_for_selector(".cert .certname")
        name = await pg.inner_text(".certname")
        check(name.startswith("Learner") and "<" not in name, "certificate issued with a sanitised name (%s)" % name)
        cert_hash = await pg.evaluate("location.hash")
        li = await pg.get_attribute(".certactions a", "href")
        check("linkedin.com/profile/add" in li and "certId=" in li, "Add to LinkedIn link")
        await shot(pg, "certificate")
        await go(pg, "me", 900); await pg.wait_for_selector(".portpanel .btn")
        async with pg.expect_download() as dl:
            await pg.click(".portpanel .btn")
        d = await dl.value
        data = open(await d.path(), "rb").read()
        z = zipfile.ZipFile(io.BytesIO(data))
        names = z.namelist()
        check("README.md" in names and "ai-90/day01.py" in names and "ai-90/tests/test_day01.py" in names, "portfolio zip has README, code and tests")
        check("def c_to_f" in z.read("ai-90/day01.py").decode(), "portfolio keeps the code that passed")
        check("30/30" in z.read("README.md").decode(), "README shows the Python block complete")
        check(z.testzip() is None, "zip is valid")
        await axe(pg, "progress page")

        # public verification works signed out
        await pg.click(".menubtn"); await pg.wait_for_selector(".mepanel.open")
        await pg.click(".mepanel .mefoot >> text=Sign out"); await pg.wait_for_selector("#em")
        await pg.evaluate(f"location.hash = '{cert_hash}'"); await pg.wait_for_selector(".certname")
        check(name == await pg.inner_text(".certname"), "certificate verifies for anyone, signed out")
        await pg.evaluate("location.hash = 'cert-NOPE000000'"); await pg.wait_for_timeout(500)
        check("not found" in (await pg.inner_text("body")).lower(), "unknown certificate code says so")

        # ------------------------------------------------ admin: video, drop-off, spot check
        await go(pg, "")
        await pg.wait_for_selector("#em")
        await pg.fill("#em", "admin@pyml.dev"); await pg.fill("#pw", "demo1234")
        await pg.click(".authcard form button[type=submit]")
        await pg.wait_for_selector(".bar"); await pg.wait_for_timeout(600)
        if await pg.locator(".tourtip").count():
            await pg.click(".tourtip .btn.ghost")
        await go(pg, "d01", 900); await pg.wait_for_selector(".videoadmin input")
        await pg.fill(".videoadmin input", "not a link")
        await pg.click(".videoadmin button"); await pg.wait_for_timeout(200)
        check("YouTube" in await pg.inner_text(".videoadmin .note"), "bad video link refused")
        await pg.fill(".videoadmin input", "https://youtu.be/dQw4w9WgXcQ?si=abc")
        await pg.click(".videoadmin button"); await pg.wait_for_selector(".ytlite")
        check(await pg.get_attribute(".ytlite img", "src") == "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "admin adds a Telugu video; lite embed shows")
        await pg.click(".ytlite"); await pg.wait_for_timeout(300)
        check("youtube-nocookie.com/embed/dQw4w9WgXcQ" in (await pg.get_attribute(".videoslot iframe", "src") or ""), "click loads the privacy-friendly player")
        await go(pg, "admin", 900); await pg.wait_for_selector(".dropoff .droprow", timeout=15000)
        check(await pg.locator(".dropoff .droprow").count() > 100, "drop-off chart covers every lesson")
        row = pg.locator("tr", has_text="learner@pyml.dev")
        await row.locator("button:has-text('Re-run their code')").click()
        await row.locator(".verify").wait_for(timeout=240000)
        vtxt = await row.locator(".verify").inner_text()
        check("1 of 1 re-checked and passing" in vtxt, "spot check re-runs the learner's saved code (%s)" % vtxt)
        await shot(pg, "admin", True)
        await axe(pg, "admin")

        # ------------------------------------------------ doubts page a11y
        await go(pg, "doubts", 900)
        if await pg.locator("#handle").count():
            await pg.fill("#handle", "AdminA11y"); await pg.click("#handle >> xpath=ancestor::form//button[@type='submit']")
            await pg.wait_for_timeout(500)
        await axe(pg, "doubts")

        errs = [e for e in errs if "supabase" not in e.lower() and "ERR_FAILED" not in e]
        check(not errs, "no page errors (%s)" % errs[:3])
        await b.close()
    print("\n%d checks failed" % len(fails) if fails else "\nALL CHECKS PASSED")
    sys.exit(1 if fails else 0)


asyncio.run(main())
