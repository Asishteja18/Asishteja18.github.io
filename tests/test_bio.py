"""Biological path (Medical Coding) end-to-end, demo mode.

    python -m http.server 8765 &        (from the repo root)
    python tests/test_bio.py <pyodide-dist-dir> <cdn-dir> <axe.min.js> [shots-dir]
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
URL = "http://localhost:8765/index.html"
PYO, CDN, AXE = sys.argv[1], sys.argv[2], sys.argv[3]
SHOTS = sys.argv[4] if len(sys.argv) > 4 else None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = [("https://cdn.jsdelivr.net/npm/pyodide@0.29.5/", PYO + "/"),
       ("https://cdn.jsdelivr.net/npm/gsap@3.12.7/", CDN + "/gsap-3.12.7/package/"),
       ("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/", CDN + "/mermaid-11.4.1/package/"),
       ("https://cdn.jsdelivr.net/npm/three@0.170.0/", CDN + "/three-0.170.0/package/")]
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def cdn(route):
    import mimetypes
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


async def go(pg, h, wait=500):
    await pg.evaluate(f"location.hash = '{h}'")
    await pg.wait_for_timeout(wait)


async def shot(pg, name, full=False):
    if SHOTS:
        await pg.screenshot(path=f"{SHOTS}/{name}.png", full_page=full)


async def axe(pg, name):
    await pg.wait_for_timeout(1600)
    await pg.add_script_tag(path=AXE)
    res = await pg.evaluate("""async () => {
      const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'], resultTypes: ['violations'] });
      return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => [v.id, v.nodes.slice(0, 3).map(n => n.target.join(' '))]); }""")
    check(not res, f"axe: no serious/critical issues on {name}" + ("" if not res else " -> " + json.dumps(res)[:700]))


async def answer(pg, lid, items, right=True):
    for i, it in enumerate(items):
        if it["type"] == "mcq":
            k = it["answer"] if right else (it["answer"] + 1) % len(it["options"])
            await pg.check(f"input[name='q-{lid}-{i}'][value='{k}']")
        else:
            v = ", ".join(it["answer"]) if it["type"] == "codes" else it["answer"][0]
            if not right:
                v = "Z99.99" if it["type"] == "codes" else "wrong"
            await pg.fill(f"#q-{lid}-{i}", v)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader"])
        ctx = await b.new_context(viewport={"width": 1360, "height": 900})
        await ctx.route("https://cdn.jsdelivr.net/**", cdn)
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        await ctx.route("http://localhost:8765/index.html*", demo_index)
        await ctx.add_init_script("try { localStorage.setItem('aim.toured.v1', '1') } catch (e) {}")
        errs = []
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append("console: " + m.text))

        # ---------------------------------------------------- landing picker
        await pg.goto(URL); await pg.wait_for_selector("#em"); await pg.wait_for_timeout(900)
        check(await pg.locator(".path .pathbtn").count() == 2, "landing shows the Digital | Biological picker")
        txt = await pg.inner_text(".path")
        check("Days 1–30" in txt and "Healthcare foundations" not in txt, "Digital is the default path on the landing page")
        await pg.click(".path .pathbtn:has-text('Biological')")
        txt = await pg.inner_text(".path")
        check("Healthcare foundations" in txt and "Diagnosis coding: ICD-10-CM" in txt and "Days 1–30" not in txt, "Biological shows the 4 coding stages")
        check(await pg.get_attribute(".path .pathbtn:has-text('Biological')", "aria-pressed") == "true", "picker state is exposed (aria-pressed)")
        check("131" in await pg.inner_text(".herostats"), "hero counts both paths (131 lessons)")
        await axe(pg, "landing (Biological selected)")
        await shot(pg, "bio-01-landing", True)

        # ---------------------------------------------------- guest try
        await go(pg, "try-mc11", 1500)
        await pg.wait_for_selector(".quiz .qitem")
        check(await pg.locator(".quiz .qitem").count() == 8, "guest can try Medical Coding 11 (8 questions)")
        check("Medical Coding 11 of 28" in await pg.text_content(".kicker"), "medical coding kicker")
        await go(pg, "", 900)

        # ---------------------------------------------------- sign in → hub follows the choice
        await pg.fill("#em", "learner@pyml.dev"); await pg.fill("#pw", "demo1234")
        await pg.click(".authcard form button[type=submit]")
        await pg.wait_for_selector(".bento"); await pg.wait_for_timeout(1300)
        titles = await pg.locator(".bcard.stage .cubetitle").all_inner_texts()
        check(titles == ["Foundations", "ICD-10-CM", "CPT + HCPCS", "Claims + CPC prep"], "hub shows the Biological stages (%s)" % titles)
        check(await pg.locator(".jgrid .jc").count() == 28, "coding journey has 28 cells")
        check(await pg.locator(".bcard.challenge").count() == 0, "no Python weekly challenge on the Biological hub")
        check("Get CPC ready" in await pg.inner_text(".hubhead"), "Biological hub headline")
        await shot(pg, "bio-02-hub", True)
        await axe(pg, "Biological hub")

        # switch back and forth
        await pg.click(".hubhead .pathbtn:has-text('Digital')"); await pg.wait_for_timeout(700)
        check(await pg.locator(".bcard.stage .cubetitle").first.inner_text() == "Python", "switching to Digital shows the AI path")
        check(await pg.evaluate("localStorage.getItem('aim.path')") == "digital", "path saved in the browser")
        await pg.click(".hubhead .pathbtn:has-text('Biological')"); await pg.wait_for_timeout(700)
        check(await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev'].path") == "bio", "path saved on the profile")

        # ---------------------------------------------------- stage page
        await go(pg, "mcd", 800); await pg.wait_for_selector(".wrap .sect")
        check("biological · stage 2" in (await pg.inner_text(".wrap .head")).lower(), "stage page labelled Biological · Stage 2")
        check(await pg.locator(".blockintro").count() == 1, "stage overview present")

        # ---------------------------------------------------- a lesson: wrong, then right
        data = await pg.evaluate("__aim.medcode")
        les = {l["id"]: l for l in data["lessons"]}
        l = les["mc11"]
        await go(pg, "mc11", 900); await pg.wait_for_selector(".quiz .qitem")
        p0 = await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev'].points || 0")
        await answer(pg, "mc11", l["exercise"]["items"], right=False)
        await pg.click(".quizbar button[type=submit]"); await pg.wait_for_timeout(400)
        st = await pg.inner_text(".status")
        check(st.startswith("0/8"), "wrong answers grade 0/8 (%s)" % st)
        check(await pg.locator(".qitem.bad").count() == 8 and await pg.locator(".done").is_hidden(), "wrong answers marked, no completion")
        check(await pg.locator(".askhelp h3:has-text(\"aren't right\")").count() == 1, "missed questions offer Ask a doubt")
        # right codes, wrong order on item 2 (E11.22, N18.4)
        await pg.fill("#q-mc11-1", "N18.4, E11.22"); await pg.click(".quizbar button[type=submit]"); await pg.wait_for_timeout(300)
        check("wrong order" in await pg.inner_text(".qitem:nth-of-type(2) .qfb"), "order matters: 'Right codes, wrong order'")
        await pg.fill("#q-mc11-1", "e1122 n184"); await pg.click(".quizbar button[type=submit]"); await pg.wait_for_timeout(300)
        check(await pg.locator(".qitem:nth-of-type(2).ok").count() == 1, "codes typed without dots or capitals are accepted")
        await answer(pg, "mc11", l["exercise"]["items"])
        await pg.click(".quizbar button[type=submit]"); await pg.wait_for_timeout(900)
        check((await pg.inner_text(".status")).startswith("8/8"), "all right → 8/8")
        check(await pg.locator(".done").is_visible(), "lesson cleared banner")
        p1 = await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev'].points || 0")
        check(p1 - p0 == 5, "clearing a coding lesson earns +5 (got %d)" % (p1 - p0))
        await pg.reload(); await pg.wait_for_selector(".quiz .qitem")
        check(await pg.input_value("#q-mc11-1") == ", ".join(l["exercise"]["items"][1]["answer"]), "answers survive a reload")
        await shot(pg, "bio-03-lesson", True)
        await axe(pg, "Medical Coding lesson")

        # ---------------------------------------------------- every lesson's answer key grades as correct
        bad = []
        for lid, L in les.items():
            await go(pg, lid, 350)
            await pg.wait_for_selector(".quiz .qitem")
            await answer(pg, lid, L["exercise"]["items"])
            await pg.click(".quizbar button[type=submit]"); await pg.wait_for_timeout(150)
            n = len(L["exercise"]["items"])
            if not (await pg.inner_text(".status")).startswith(f"{n}/{n}"):
                bad.append(lid)
        check(not bad, "all 28 lessons: the answer key grades 100%% (%s)" % bad)

        # mock exam: timer + 70%
        await go(pg, "mc28", 700)
        check(await pg.locator(".qtimer").count() == 1, "mock exam shows a timer")
        check("18 of 25" in await pg.inner_text(".brief"), "mock exam needs 18 of 25 (70%)")

        # ---------------------------------------------------- tools
        vids = [(l["id"], s["viz"]) for l in data["lessons"] for s in l["sections"] if s["type"] == "viz"]
        badv = []
        for lid, vid in vids:
            await go(pg, lid, 300)
            try:
                await pg.wait_for_selector(f".viz-{vid} > *", timeout=10000)
                if await pg.locator(f".viz-{vid} .vizhint:has-text('could not start')").count():
                    badv.append(vid)
            except Exception:
                badv.append(vid)
        check(not badv, f"all {len(vids)} coding tools mount ({badv})")
        await go(pg, "mc11", 900)
        await pg.fill(".viz-icdlookup input[type=search]", "diabetes kidney")
        await pg.wait_for_selector(".viz-icdlookup .lkcode:has-text('E11.22')", timeout=20000)
        check(True, "ICD-10-CM lookup finds E11.22 for 'diabetes kidney'")
        await pg.click(".viz-icdlookup input[type=search]")
        await pg.click("#q-mc11-5")
        await pg.fill("#q-mc11-5", "")
        await pg.click(".viz-icdlookup .lkcode:has-text('E11.22')")
        check(await pg.input_value("#q-mc11-5") == "E11.22", "clicking a lookup result fills the last answer box")
        await go(pg, "mc08", 900)
        await pg.fill(".viz-icdparts input", "E11.6"); await pg.wait_for_timeout(1500)
        check("not billable" in await pg.inner_text(".viz-icdparts .vizread"), "dissector flags E11.6 as a header code")
        await pg.fill(".viz-icdparts input", "S52.501A"); await pg.wait_for_timeout(300)
        check("billable ✓" in await pg.inner_text(".viz-icdparts .vizread"), "dissector confirms S52.501A")
        await go(pg, "mc11", 700)
        await pg.select_option(".viz-htnckd select >> nth=0", "I50.22")
        check("I13.0" in await pg.inner_text(".viz-htnckd .biocodes"), "HTN + HF + CKD helper picks I13.0")
        await go(pg, "mc16", 700)
        check("99214" in await pg.inner_text(".viz-emlevel .vizread"), "E/M helper: moderate/low/moderate established → 99214")
        await axe(pg, "E/M lesson with tools")

        # ---------------------------------------------------- 3D scene in every lesson
        s3d = [s["viz"] for l in data["lessons"] for s in l["sections"] if s["type"] == "viz" and s["viz"].startswith("s3d-")]
        check(len(s3d) == 28 and len(set(s3d)) == 28, "every coding lesson has its own 3D scene (%d)" % len(s3d))
        await go(pg, "mc04", 600)
        await pg.locator(".s3d").first.scroll_into_view_if_needed()
        await pg.wait_for_selector(".s3d canvas", timeout=30000)
        await pg.wait_for_timeout(1500)
        check(await pg.locator(".s3d .s3dlab").count() >= 4, "3D heart has HTML labels")
        await pg.click(".s3dstep >> nth=2"); await pg.wait_for_timeout(300)
        check("MI" in await pg.inner_text(".viz-s3d-heart .vizread"), "3D steps explain each part (coronary → MI)")
        await go(pg, "mc05", 800); await pg.wait_for_timeout(500)
        check(await pg.locator(".viz-s3d-heart").count() == 0, "leaving a lesson removes its 3D scene")

        # ---------------------------------------------------- certificate + progress
        await go(pg, "me", 1200); await pg.wait_for_selector(".certcard")
        check(await pg.locator(".certcard").count() == 1 and "Medical Coding" in await pg.inner_text(".certcard"), "Biological path shows the Medical Coding certificate")

        # ---------------------------------------------------- phone
        ph = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        await ph.route("https://cdn.jsdelivr.net/**", cdn); await ph.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        await ph.route("http://localhost:8765/index.html*", demo_index)
        await ph.add_init_script("try { localStorage.setItem('aim.toured.v1', '1'); localStorage.setItem('aim.path', 'bio') } catch (e) {}")
        m = await ph.new_page()
        await m.goto(URL + "#try-mc16"); await m.wait_for_selector(".quiz", state="attached"); await m.wait_for_timeout(1200)
        sw = await m.evaluate("document.documentElement.scrollWidth")
        check(sw <= 390, "coding lesson fits a phone (scrollWidth %d)" % sw)
        await m.goto(URL + "#try-mc11"); await m.wait_for_selector(".s3d", state="attached")
        await m.locator(".s3d").first.scroll_into_view_if_needed(); await m.wait_for_selector(".s3d canvas", timeout=30000)
        cw = await m.evaluate("document.querySelector('.s3d canvas').getBoundingClientRect().width")
        check(cw <= 390 and cw > 280, "3D scene fits the phone width (%d px)" % cw)
        cols = await m.evaluate("getComputedStyle(document.querySelector('.s3dctl')).gridTemplateColumns.split(' ').length")
        check(cols == 2, "3D step buttons sit in two columns on a phone")
        await m.click(".ltab:has-text('Practice')"); await m.wait_for_timeout(400)
        qb = await m.evaluate("(() => { const b = document.querySelector('.quizbar').getBoundingClientRect(); return [b.height, b.right]; })()")
        check(qb[0] < 80 and qb[1] <= 390, "quiz action bar is one compact row on a phone (%s)" % qb)
        await m.goto(URL); await m.wait_for_selector(".path"); await m.wait_for_timeout(900)
        sw = await m.evaluate("document.documentElement.scrollWidth")
        check(sw <= 390, "landing with picker fits a phone (scrollWidth %d)" % sw)
        if SHOTS:
            await m.screenshot(path=f"{SHOTS}/bio-04-phone-landing.png", full_page=True)

        # phone hub: four stage cards in a 2 × 2 grid
        await m.fill("#em", "learner@pyml.dev"); await m.fill("#pw", "demo1234")
        await m.click(".authcard form button[type=submit]"); await m.wait_for_selector(".bento"); await m.wait_for_timeout(1200)
        xs = await m.evaluate("[...document.querySelectorAll('.bcard.stage')].map(c => Math.round(c.getBoundingClientRect().left))")
        check(len(set(xs)) == 2 and len(xs) == 4, "phone hub shows stages 2 × 2 (%s)" % xs)
        sw = await m.evaluate("document.documentElement.scrollWidth")
        wk = await m.evaluate("Math.round(document.querySelector('.bcard.weekly').getBoundingClientRect().width)")
        check(sw <= 390 and wk > 300, "phone hub: no overflow, weekly board full width (%d)" % wk)
        if SHOTS:
            await m.screenshot(path=f"{SHOTS}/bio-05-phone-hub.png", full_page=True)

        check(not errs, "no page errors (%s)" % errs[:3])
        await b.close()
    print("\nALL CHECKS PASSED" if not fails else f"\n{len(fails)} FAILED")
    sys.exit(1 if fails else 0)


asyncio.run(main())
