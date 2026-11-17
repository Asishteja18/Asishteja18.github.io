"""Ask-a-doubt from inside a lesson (demo mode, real Python via Pyodide).

Pyodide is served from a local npm copy (npm pack pyodide@0.29.5 → /tmp/pyo/package)
because the test machine cannot reach the CDN.
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

URL = "http://localhost:8765/index.html"
PYO = "/tmp/pyo/package"
LESSON = "py-03"
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def serve_pyodide(route):
    name = route.request.url.split("pyodide@0.29.5/")[-1].split("?")[0]
    path = os.path.join(PYO, name)
    if os.path.isfile(path):
        ct = "application/wasm" if name.endswith(".wasm") else (
            "application/javascript" if name.endswith((".js", ".mjs")) else "application/octet-stream")
        await route.fulfill(path=path, content_type=ct)
    else:
        await route.abort()


async def login(pg, email):
    await pg.goto(URL)
    await pg.wait_for_selector("#em")
    await pg.fill("#em", email); await pg.fill("#pw", "demo1234")
    await pg.click(".authcard form button[type=submit]")
    await pg.wait_for_selector(".bar")


async def open_lesson(pg):
    await pg.evaluate(f"location.hash = '{LESSON}'")
    await pg.wait_for_selector(".snipask")
    # wait for Python to finish loading (run button enabled)
    await pg.wait_for_function("() => { const b = [...document.querySelectorAll('button')].find(x => /^Run tests/.test(x.textContent.trim())); return b && !b.disabled; }", timeout=90000)


async def run_code(pg, code):
    await pg.evaluate("(c) => { const t = document.querySelector('.ed textarea, textarea'); t.value = c; }", code)
    await pg.click("button.btn:has-text('Run tests')")
    await pg.wait_for_function("() => !/Running/.test(document.querySelector('.status')?.textContent || '')", timeout=30000)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1280, "height": 900})
        await ctx.route("https://cdn.jsdelivr.net/npm/pyodide@0.29.5/**", serve_pyodide)
        errs = []
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await login(pg, "learner@pyml.dev")
        await open_lesson(pg)
        check(await pg.locator(".askhelp").is_hidden(), "no prompt before running")
        check(await pg.locator(".snipask").count() > 0, "code examples have 'Ask about this'")

        # 1) an error
        await run_code(pg, "x = 5\nprint(totl)\n")
        check(await pg.locator(".askhelp").is_visible(), "prompt appears after an error")
        check("hit an error" in await pg.inner_text(".askhelp"), "prompt says the code hit an error")
        await pg.click(".askhelp >> text=Ask a doubt")
        # first time: pick a code name inline
        await pg.wait_for_selector(".askhelp #handle")
        await pg.fill("#handle", "Tester"); await pg.click(".askhelp form button[type=submit]")
        await pg.wait_for_selector("#ask-title")
        title = await pg.input_value("#ask-title"); body = await pg.input_value("#ask-body")
        check("NameError" in title, "title pre-filled with the error: " + title)
        check("print(totl)" in body and "NameError" in body and body.rstrip().endswith("What I don't get:"),
              "details pre-filled with code + error")
        focused = await pg.evaluate("document.activeElement.id")
        check(focused == "ask-body", "cursor waits in the details box")
        await pg.fill("#ask-body", body + " why is totl not defined?")
        await pg.click(".askhelp >> text=Post doubt")
        await pg.wait_for_selector(".askhelp >> text=Posted")
        store = await pg.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1'))")
        d = store["doubts"][-1]
        check(d["lesson_id"] == LESSON and "NameError" in d["title"] and "why is totl" in d["body"],
              "doubt saved with the lesson attached")

        # 2) failing tests (no exception)
        await run_code(pg, "pass\n")
        txt = await pg.inner_text(".askhelp")
        check("not passing" in txt, "prompt appears when tests fail")
        await pg.click(".askhelp >> text=Ask a doubt"); await pg.wait_for_selector("#ask-body")
        check("Failing tests:" in await pg.input_value("#ask-body"), "failing tests listed in details")
        await pg.click(".askhelp >> text=Cancel")
        check(await pg.locator(".askhelp").is_hidden(), "cancel closes it")

        # 3) a code example
        await pg.locator(".snipask").first.click(); await pg.wait_for_selector("#ask-body")
        check("About this example" in await pg.input_value("#ask-body"), "example code pre-filled")
        await pg.screenshot(path="/tmp/la-desk.png")

        # 4) lesson's doubts link -> filtered doubts page
        await pg.evaluate("location.hash = 'py-02'"); await pg.wait_for_selector(".snipask")
        await pg.evaluate(f"location.hash = '{LESSON}'"); await pg.wait_for_selector(".lessondoubts")
        await pg.wait_for_selector(".lessondoubts >> text=on this lesson")
        await pg.click(".lessondoubts >> text=on this lesson"); await pg.wait_for_selector(".stream .msg")
        pressed = await pg.inner_text(".fchip[aria-pressed=true]")
        cards = await pg.locator(".stream .msg").count()
        check(cards == 1 and "n" in pressed.lower(), "doubts page opens filtered to this lesson (%d card, chip '%s')" % (cards, pressed.strip()))

        # 6) phone: asking from the Lesson tab jumps to Practice
        m = await ctx.new_page(); await m.set_viewport_size({"width": 390, "height": 844})
        m.on("pageerror", lambda e: errs.append("mobile " + str(e)))
        await login(m, "learner@pyml.dev")
        await open_lesson(m)
        await m.locator(".snipask").first.click(); await m.wait_for_selector("#ask-body")
        check(await m.locator(".grid.practice").count() == 1 and await m.locator("#ask-body").is_visible(),
              "phone: switches to Practice and shows the form")
        await m.screenshot(path="/tmp/la-mob.png")

        check(not errs, "no page errors " + json.dumps(errs))
        await b.close()
    print("\n%d failure(s)" % len(fails))
    sys.exit(1 if fails else 0)

if __name__ == "__main__": asyncio.run(main())
