"""End-to-end test of v2 in demo mode: two users in two tabs of one browser."""
import asyncio, json, sys
from playwright.async_api import async_playwright, expect

URL = "http://localhost:8765/index.html"
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def login(pg, email):
    await pg.goto(URL)
    await pg.wait_for_selector("#em")
    await pg.fill("#em", email)
    await pg.fill("#pw", "demo1234")
    await pg.click(".authcard form button[type=submit]")
    await pg.wait_for_selector(".bar")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1280, "height": 900})
        errs = []
        A = await ctx.new_page(); A.on("pageerror", lambda e: errs.append("A " + str(e)))
        await login(A, "learner@pyml.dev")
        B = await ctx.new_page(); B.on("pageerror", lambda e: errs.append("B " + str(e)))
        await login(B, "admin@pyml.dev")

        # --- stats & roles
        check("1 day streak" in await A.inner_text(".whobtn"), "streak shown after login (A)")
        st = await A.evaluate("JSON.parse(localStorage.getItem('pyml.demo.v1')).users['learner@pyml.dev']")
        check(st.get("streak") == 1 and st.get("streak_day"), "streak stored on the user record")
        await A.goto(URL + "#admin"); await A.wait_for_timeout(300)
        check("admins only" in (await A.inner_text("body")), "learner cannot open admin page")
        await A.click(".whobtn"); await A.wait_for_timeout(200)
        check(await A.locator(".mefoot button", has_text="Admin").count() == 0, "learner has no Admin button")
        check(await A.locator(".mefoot button", has_text="Doubts").count() == 1, "profile panel links to Doubts")
        await A.keyboard.press("Escape"); await A.wait_for_timeout(200)
        check(await A.locator(".mepanel.open").count() == 0, "Escape closes the profile panel")

        # --- code names
        await A.goto(URL + "#doubts"); await A.wait_for_selector("#handle")
        await A.fill("#handle", "ab"); await A.click("form button[type=submit]")
        check("3 to 16" in await A.inner_text("#handle-err"), "too-short code name rejected")
        await A.fill("#handle", "Learner1"); await A.click("form button[type=submit]")
        await A.wait_for_selector("#d-title")
        check("AIM-Learner1" in await A.inner_text(".youare"), "code name saved as AIM-Learner1")
        check("AIM-Learner1" in await A.inner_text(".whobtn"), "top bar shows code name")

        await B.goto(URL + "#doubts"); await B.wait_for_selector("#handle")
        await B.fill("#handle", "learner1"); await B.click("form button[type=submit]")
        await B.wait_for_timeout(300)
        check("taken" in await B.inner_text("#handle-err"), "duplicate code name (any case) rejected")
        await B.fill("#handle", "Asish"); await B.click("form button[type=submit]")
        await B.wait_for_selector("#d-title")

        # --- presence
        await A.wait_for_timeout(2600)
        a_online = await A.inner_text(".dside")
        check("AIM-Asish" in a_online and "2 people" in a_online, "A sees admin online: " + a_online.replace("\n", " | "))
        check(await B.locator(".dside .odot.on").count() == 2, "B sees two green dots")

        # --- ask, live refresh, reply
        await A.fill("#d-title", "Why does range(5) stop at 4?")
        await A.fill("#d-body", "for i in range(5):\n    print(i)\n# prints 0..4")
        await A.click(".dmain form button[type=submit]")
        await A.wait_for_selector(".dthread h1")
        check("Why does range(5) stop at 4?" in await A.inner_text(".dthread h1"), "doubt posted and thread opens")
        await B.wait_for_timeout(600)
        check(await B.locator(".dcard", has_text="range(5)").count() == 1, "admin's list refreshed live")
        check(await B.locator(".dcard .odot.on").count() == 1, "author shows online in list")

        await B.click(".dcard >> text=range(5)"); await B.wait_for_selector("#r-body")
        await B.fill("#r-body", "range stops before the end number. Use range(1, 6) for 1..5.")
        await B.click(".dthread form button[type=submit]")
        await B.wait_for_timeout(400)
        await A.wait_for_timeout(600)
        a_thread = (await A.inner_text(".dthread")).lower()
        check("range stops before" in a_thread and "admin" in a_thread, "A sees admin reply live with Admin badge")
        check("admin replied" in a_thread, "thread tagged Admin replied")

        # --- resolve (author)
        await A.click("text=Mark resolved"); await A.wait_for_timeout(300)
        check("resolved" in (await A.inner_text(".dthread .dmeta")).lower(), "author marks resolved")

        # --- 12h escalation: inject an old unanswered doubt by the learner
        await A.evaluate("""() => {
          const s = JSON.parse(localStorage.getItem('pyml.demo.v1'));
          s.seq = (s.seq||0) + 1;
          s.doubts.push({id: s.seq, user_id: 'learner@pyml.dev', title: 'Old question nobody answered',
            body: '', lesson_id: null, resolved: false,
            created_at: new Date(Date.now() - 13*3600e3).toISOString()});
          s.replies.push({id: ++s.seq, doubt_id: s.seq-1, user_id: 'learner@pyml.dev',
            body: 'bump', created_at: new Date().toISOString()});
          localStorage.setItem('pyml.demo.v1', JSON.stringify(s));
        }""")
        await B.goto(URL + "#doubts"); await B.wait_for_selector(".dcard")
        check(await B.locator(".doubtsbtn .badge").inner_text() == "1", "admin badge counts 1 waiting")
        await B.click(".fchip >> text=Waiting on you"); await B.wait_for_timeout(200)
        cards = await B.locator(".dcard").all_inner_texts()
        check(len(cards) == 1 and "Old question" in cards[0] and "sent to admin" in cards[0].lower(),
              "author's own bump does not count as an answer; doubt is with admin")
        await A.goto(URL + "#doubts"); await A.wait_for_selector(".dcard")
        check(await A.locator(".fchip", has_text="Waiting on you").count() == 0, "learner has no admin filter")
        await A.click(".dcard >> text=Old question"); await A.wait_for_selector(".dthread h1")
        check("gone to the admin" in await A.inner_text(".dthread"), "learner told it went to admin")

        # --- admin page stats
        await B.goto(URL + "#admin"); await B.wait_for_selector("table")
        t = (await B.inner_text("table")).lower()
        check("aim-learner1" in t and "streak" in t and "last seen" in t, "admin table shows code name + stats")
        check("waiting on you" in await B.inner_text(".wrap"), "admin page banner for escalated doubts")

        # --- delete (two-step) by admin
        await B.goto(URL + "#doubts"); await B.wait_for_selector(".dcard")
        await B.click(".dcard >> text=Old question"); await B.wait_for_selector("text=Delete")
        await B.click(".dactions >> text=Delete")
        check(await B.locator("text=Click again to delete").count() == 1, "delete needs a second click")
        await B.click(".dactions >> text=Click again to delete"); await B.wait_for_selector(".fchip")
        await B.click(".fchip >> text=All"); await B.wait_for_selector(".dcard")
        check(await B.locator(".dcard", has_text="Old question").count() == 0
              and await B.locator(".dcard", has_text="range(5)").count() == 1, "admin deleted only that doubt")

        # --- offline: close B, A should drop to 1
        await B.close(); await A.wait_for_timeout(7000)
        check("Just you" in await A.inner_text(".dside"), "admin goes offline after closing tab")

        # --- screenshots
        await A.screenshot(path="/tmp/v2-doubts-desk.png", full_page=True)
        M = await ctx.new_page(); await M.set_viewport_size({"width": 390, "height": 844})
        M.on("pageerror", lambda e: errs.append("M " + str(e)))
        await login(M, "learner@pyml.dev")
        await M.evaluate("location.hash = 'doubts'"); await M.wait_for_selector(".dcard")
        await M.screenshot(path="/tmp/v2-doubts-mob.png", full_page=True)
        await M.click(".dcard"); await M.wait_for_selector(".dthread h1")
        await M.screenshot(path="/tmp/v2-thread-mob.png", full_page=True)

        check(not errs, "no page errors " + json.dumps(errs))
        await b.close()
    print("\n%d failure(s)" % len(fails))
    sys.exit(1 if fails else 0)

asyncio.run(main())
