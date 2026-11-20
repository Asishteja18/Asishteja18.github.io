"""AIM AI tutor drawer, demo mode (no model behind it, canned answers).

    python -m http.server 8765 &        (from the repo root)
    python tests/test_ai.py <cdn-dir> <axe.min.js> [shots-dir]
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

URL = "http://localhost:8765/index.html"
CDN, AXE = sys.argv[1], sys.argv[2]
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = [("https://cdn.jsdelivr.net/npm/gsap@3.12.7/", CDN + "/gsap-3.12.7/package/"),
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
                ct = "text/javascript" if p.endswith((".mjs", ".js")) else mimetypes.guess_type(p)[0] or "application/octet-stream"
                return await route.fulfill(status=200, body=open(p, "rb").read(), headers={"content-type": ct})
            return await route.fulfill(status=404, body="")
    await route.abort()


async def demo_index(route):
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    html = re.sub(r'const SUPABASE_URL = "[^"]*";', 'const SUPABASE_URL = "";', html)
    await route.fulfill(status=200, body=html, headers={"content-type": "text/html; charset=utf-8"})


async def axe(pg, name):
    await pg.wait_for_timeout(800)
    await pg.add_script_tag(path=AXE)
    res = await pg.evaluate("""async () => {
      const r = await axe.run(document.querySelector('.aidrawer'), { runOnly: ['wcag2a', 'wcag2aa'], resultTypes: ['violations'] });
      return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => [v.id, v.nodes.slice(0, 3).map(n => n.target.join(' '))]); }""")
    check(not res, f"axe: no serious/critical issues in {name}" + ("" if not res else " -> " + json.dumps(res)[:600]))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader"])
        for label, vp in (("desktop", {"width": 1360, "height": 900}), ("phone", {"width": 390, "height": 844})):
            ctx = await b.new_context(viewport=vp, is_mobile=label == "phone", has_touch=label == "phone")
            await ctx.route("https://cdn.jsdelivr.net/**", cdn)
            await ctx.route("https://fonts.googleapis.com/**", lambda r: r.abort())
            await ctx.route("http://localhost:8765/index.html*", demo_index)
            await ctx.add_init_script("try { localStorage.setItem('aim.toured.v1', '1') } catch (e) {}")
            errs = []
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_selector("#em")
            await pg.fill("#em", "learner@pyml.dev"); await pg.fill("#pw", "demo1234")
            await pg.click(".authcard form button[type=submit]")
            await pg.wait_for_selector(".bento"); await pg.wait_for_timeout(900)

            check(await pg.locator(".bar .aibtn").count() == 1, f"[{label}] Ask AI button in the top bar")
            await pg.click(".bar .aibtn")
            await pg.wait_for_selector(".aidrawer.on .aiempty")
            check(await pg.locator(".aichips .fchip").count() == 3, f"[{label}] empty state offers 3 starter questions")
            box = await pg.locator(".aidrawer").bounding_box()
            if label == "phone":
                check(box["width"] >= 389 and box["height"] >= 800, f"[{label}] drawer fills the screen ({box})")
            else:
                check(400 <= box["width"] <= 441, f"[{label}] drawer is a side panel ({box['width']}px)")
            sw = await pg.evaluate("document.documentElement.scrollWidth <= innerWidth")
            check(sw, f"[{label}] no sideways scroll with the drawer open")
            await axe(pg, f"[{label}] drawer")

            await pg.fill(".aiform textarea", "What is a **list**?")
            await pg.keyboard.press("Enter")
            await pg.wait_for_selector(".aimsg.ai .aibody strong", timeout=5000)
            await pg.wait_for_timeout(500)
            check(await pg.locator(".aimsg.me").count() == 1, f"[{label}] my question shows as a bubble")
            t = await pg.inner_text(".aimsg.ai .aibody")
            check("demo mode" in t, f"[{label}] demo answer arrives")
            check(await pg.locator(".aimsg.me .aibody strong").count() == 0, f"[{label}] my text is not rendered as HTML")
            check("20 questions left today" in await pg.inner_text(".aileft"), f"[{label}] daily allowance shown")
            if SHOTS:
                await pg.screenshot(path=f"{SHOTS}/ai-{label}-chat.png")

            # keeps the chat after closing and reopening
            await pg.keyboard.press("Escape"); await pg.wait_for_timeout(400)
            check(await pg.locator(".aidrawer").count() == 0, f"[{label}] Escape closes the drawer")
            await pg.click(".bar .aibtn"); await pg.wait_for_selector(".aidrawer.on .aimsg.ai")
            check(await pg.locator(".aimsg").count() == 2, f"[{label}] chat is kept between opens")
            # clear needs two taps
            await pg.click(".aihead .btn:has-text('Clear')")
            check(await pg.locator(".aimsg").count() == 2, f"[{label}] one tap on Clear does nothing yet")
            await pg.click(".aihead .btn:has-text('Tap again')"); await pg.wait_for_timeout(300)
            check(await pg.locator(".aimsg").count() == 0 and await pg.locator(".aiempty").count() == 1, f"[{label}] Clear empties the chat")
            await pg.click(".aihead .aix"); await pg.wait_for_timeout(400)

            # from a lesson: context chip + lesson sent along
            await pg.evaluate("location.hash = 'py-01'"); await pg.wait_for_selector(".lessondoubts .aiask", state="attached")
            if label == "phone":
                await pg.click(".ltab:has-text('Practice')")
            await pg.click(".lessondoubts .aiask"); await pg.wait_for_selector(".aidrawer.on")
            ctxt = await pg.inner_text(".aictx")
            check("Running Python and your first values" in ctxt, f"[{label}] lesson context chip ({ctxt[:60]})")
            await pg.fill(".aiform textarea", "help")
            await pg.click(".aisend")
            await pg.wait_for_selector(".aimsg.ai")
            await pg.wait_for_timeout(500)
            check("Lesson: Running Python" in await pg.inner_text(".aimsg.ai"), f"[{label}] lesson is sent with the question")
            await pg.click(".aictx .linkbtn")
            check(await pg.locator(".aictx").is_hidden(), f"[{label}] lesson context can be removed")
            await pg.click(".aihead .aix"); await pg.wait_for_timeout(300)
            check(not errs, f"[{label}] no page errors {errs[:3]}")
            await ctx.close()

        # Markdown renderer is safe and handles code, lists, citations
        ctx = await b.new_context()
        await ctx.route("https://cdn.jsdelivr.net/**", cdn)
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        await ctx.route("http://localhost:8765/index.html*", demo_index)
        pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_selector("#em")
        md = lambda s, src=None: pg.evaluate("([s, src]) => __aim.mdLite(s, src)", [s, src])
        h = await md("<img src=x onerror=alert(1)> **b**")
        check("<img" not in h and "&lt;img" in h and "<strong>b</strong>" in h, "mdLite escapes HTML")
        h = await md("Use:\n\n```python\nx = [1, 2]\nif x < 3: pass\n```\n\n- one\n- two")
        check('<pre class="aicode"><code>x = [1, 2]\nif x &lt; 3: pass</code></pre>' in h and "<ul><li>one</li><li>two</li></ul>" in h, "mdLite: code fences and lists")
        h = await md("Fresh fact [1].", [{"title": "T", "url": "https://ex.com/a?b=1&c=2"}])
        check('class="aicite" href="https://ex.com/a?b=1&amp;c=2"' in h, "mdLite: [1] links to source 1")
        h = await md("[x](javascript:alert(1))")
        check("href" not in h, "mdLite: no javascript: links")
        await b.close()
    print("\n%d failure(s)" % len(fails))
    sys.exit(1 if fails else 0)

asyncio.run(main())
