"""v3 end-to-end (demo mode): group-chat doubts, pinned unsolved, solutions,
points/levels, progress page + calendar, learning-time tracker. Two users at once."""
import asyncio, json, re, sys
from datetime import date, timedelta
from playwright.async_api import async_playwright

URL = "http://localhost:8765/index.html"
KEY = "pyml.demo.v1"
fails = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


async def login(pg, email):
    await pg.goto(URL)
    await pg.wait_for_selector("#em")
    await pg.fill("#em", email); await pg.fill("#pw", "demo1234")
    await pg.click(".authcard form button[type=submit]")
    await pg.wait_for_selector(".bar")


async def store(pg):
    return await pg.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")


async def patch_user(pg, email, js):
    await pg.evaluate("""([k, e, js]) => { const s = JSON.parse(localStorage.getItem(k));
      const u = s.users[e]; (new Function('u', js))(u); localStorage.setItem(k, JSON.stringify(s)); }""", [KEY, email, js])


async def go(pg, h):
    await pg.evaluate(f"location.hash = '{h}'")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1280, "height": 900})
        await ctx.route("https://cdn.jsdelivr.net/**", lambda r: r.abort())
        errs = []
        A = await ctx.new_page(); A.on("pageerror", lambda e: errs.append("A " + str(e)))
        await login(A, "learner@pyml.dev")
        B = await ctx.new_page(); B.on("pageerror", lambda e: errs.append("B " + str(e)))
        await login(B, "admin@pyml.dev")

        # --- roles and code names (carried over from v2)
        await go(A, "admin"); await A.wait_for_timeout(300)
        check("admins only" in await A.inner_text("body"), "learner cannot open admin page")
        await go(A, "doubts"); await A.wait_for_selector("#handle")
        await A.fill("#handle", "ab"); await A.click("#handle >> xpath=ancestor::form//button[@type='submit']")
        check("3 to 16" in await A.inner_text("#handle-err"), "too-short code name rejected")
        await A.fill("#handle", "Learner1"); await A.click("#handle >> xpath=ancestor::form//button[@type='submit']")
        await A.wait_for_selector(".composer textarea")
        await go(B, "doubts"); await B.wait_for_selector("#handle")
        await B.fill("#handle", "LEARNER1"); await B.click("#handle >> xpath=ancestor::form//button[@type='submit']")
        await B.wait_for_timeout(300)
        check("taken" in await B.inner_text("#handle-err"), "duplicate code name rejected (any case)")
        await B.fill("#handle", "Asish"); await B.click("#handle >> xpath=ancestor::form//button[@type='submit']")
        await B.wait_for_selector(".composer textarea")

        # --- presence
        await A.wait_for_timeout(2600)
        check("2 online" in await A.inner_text(".livepill"), "live pill shows 2 online")
        check(await A.locator(".dside .odot.on").count() >= 2, "online panel shows both")

        # --- group chat: ask with Enter, first line = title
        ta = A.locator(".composer textarea")
        await ta.fill("Why is my list reversed as None?")
        await ta.press("Shift+Enter"); await ta.type("x = [1,2,3].reverse()")
        val = await ta.input_value()
        check("\n" in val, "Shift+Enter adds a new line")
        await ta.press("Enter")
        await A.wait_for_selector(".msg.me .btitle")
        check("reversed as None" in await A.inner_text(".msg.me .btitle"), "Enter sends; own message on the right")
        check(await ta.input_value() == "", "composer clears after sending")
        check("reversed as None" in await A.inner_text(".pins"), "unsolved doubt pinned on top")
        await ta.fill("hey"); await ta.press("Enter"); await A.wait_for_timeout(200)
        check("at least 5" in await A.inner_text(".composer-err"), "too-short title rejected")
        await ta.fill("")

        await B.wait_for_timeout(700)
        check(await B.locator(".msg:not(.me) .btitle", has_text="reversed as None").count() == 1,
              "other user sees it live, on the left")
        check(await B.locator(".pin", has_text="reversed as None").count() == 1, "pinned for everyone")

        # --- thread chat + solution + points
        await patch_user(B, "admin@pyml.dev", "u.points = 90")      # 90 -> 110 crosses Bronze
        await B.locator(".pin", has_text="reversed as None").click()
        await B.wait_for_selector(".threadhead h1")
        rta = B.locator(".composer textarea")
        await rta.fill(".reverse() changes the list in place and returns None. Use x[::-1] or reversed(x).")
        await rta.press("Enter"); await B.wait_for_timeout(400)
        check(await B.locator(".msg.me .bbody", has_text="in place").count() == 1, "reply appears as own bubble")
        check(await B.locator("text=Mark as solution").count() == 0, "answerer cannot mark own reply")

        await A.wait_for_timeout(600)
        await A.locator(".pin", has_text="reversed as None").click(); await A.wait_for_selector(".threadhead h1")
        await A.locator(".composer textarea").fill("thanks, trying it"); await A.locator(".composer textarea").press("Enter")
        await A.wait_for_timeout(300)
        check(await A.locator(".markbtn").count() == 1, "asker sees Mark as solution only on others' replies")
        await A.click(".markbtn"); await A.wait_for_selector(".bubble.solution")
        check("+20 pts to AIM-Asish" in await A.inner_text(".bubble.solution"), "solution tagged with +20 to solver")
        s = await store(A)
        check(s["users"]["admin@pyml.dev"]["points"] == 110 and s["users"]["admin@pyml.dev"]["solved_count"] == 1,
              "solver got 20 points (90 -> 110)")
        check(s["users"]["learner@pyml.dev"].get("points", 0) == 0, "asker gets no points")
        check("solved" in (await A.inner_text(".threadhead")).lower(), "thread shows Solved")
        await go(A, "doubts"); await A.wait_for_selector(".stream .msg")
        check(await A.locator(".pin", has_text="reversed as None").count() == 0, "solved doubt unpinned")
        await A.locator(".fchip").filter(has_text=re.compile(r"^Solved")).click(); await A.wait_for_timeout(200)
        check(await A.locator(".stream .btitle", has_text="reversed as None").count() == 1, "Solved filter lists it")

        # --- levels
        await B.reload(); await B.wait_for_selector(".bar")
        await go(B, "doubts"); await B.wait_for_selector(".levelcard")
        check("Bronze" in await B.inner_text(".levelcard"), "110 points = Bronze")
        check(await B.locator(".solver", has_text="AIM-Asish").count() == 1, "leaderboard lists the solver")
        check(await B.locator(".whobtn .tierbadge[title=Bronze]").count() == 1, "Bronze badge in the top bar")

        # --- 12h escalation still works, admin badge
        await A.evaluate(f"""() => {{ const s = JSON.parse(localStorage.getItem('{KEY}'));
          s.seq++; s.doubts.push({{id: s.seq, user_id: 'learner@pyml.dev', title: 'Old question nobody answered',
            body: '', lesson_id: null, resolved: false, created_at: new Date(Date.now() - 13*3600e3).toISOString()}});
          localStorage.setItem('{KEY}', JSON.stringify(s)); }}""")
        await B.reload(); await B.wait_for_selector(".bar"); await go(B, "doubts"); await B.wait_for_selector(".pin")
        check(await B.locator(".doubtsbtn .badge").inner_text() == "1", "admin badge: 1 waiting")
        first_pin = await B.locator(".pin").first.inner_text()
        check("Old question" in first_pin and "with admin" in first_pin.lower(), "doubt waiting on admin pinned first")

        # --- deleting a solved doubt takes the points back
        await B.locator(".fchip").filter(has_text=re.compile(r"^Solved")).click(); await B.wait_for_timeout(200)
        await B.locator(".stream .bubble", has_text="reversed as None").click(); await B.wait_for_selector(".threadhead")
        await B.click(".threadhead >> text=Delete"); await B.click(".threadhead >> text=Click again to delete")
        await B.wait_for_selector(".chathead")
        s = await store(B)
        check(s["users"]["admin@pyml.dev"]["points"] == 90, "points revoked when the solved doubt is deleted")

        # --- learning-time tracker (fake clock)
        T = await ctx.new_page(); T.on("pageerror", lambda e: errs.append("T " + str(e)))
        await T.clock.install()
        await login(T, "learner@pyml.dev")
        before = (await store(T))["users"]["learner@pyml.dev"].get("activity", {})
        await go(T, "py-02"); await T.wait_for_selector(".snipask")
        for _ in range(5):
            await T.keyboard.press("Shift")
            await T.clock.run_for(15000)
        after = (await store(T))["users"]["learner@pyml.dev"].get("activity", {})
        today = max(after.keys())
        gained = after.get(today, 0) - before.get(today, 0)
        check(gained >= 60, f"learning time saved while active on a lesson (+{gained}s)")
        await go(T, "doubts"); await T.clock.run_for(5 * 60000)
        after2 = (await store(T))["users"]["learner@pyml.dev"].get("activity", {})
        check(after2.get(today, 0) - after.get(today, 0) <= 15, "no time counted off lesson pages")
        await T.close()

        # --- progress page + calendar
        days = {}
        for i, secs in [(0, 1800), (1, 600), (2, 3600), (5, 30), (40, 5400), (200, 120)]:
            days[(date.today() - timedelta(days=i)).isoformat()] = secs
        await patch_user(A, "learner@pyml.dev", "u.activity = Object.assign(u.activity || {}, " + json.dumps(days) + "); u.best_streak = 3;")
        await A.reload(); await A.wait_for_selector(".bar"); await go(A, "me"); await A.wait_for_selector(".cal")
        txt = await A.inner_text(".wrap")
        check("active days in the past year" in txt and "Best streak 3" in txt, "calendar summary shows active days + best streak")
        cells = await A.locator(".cal .c:not(.out)").count()
        check(360 <= cells <= 371, f"calendar shows about a year of days ({cells})")
        check(await A.locator(".cal .c.l4").count() >= 2 and await A.locator(".cal .c.l1").count() >= 1,
              "busier days are darker; visit-only days lightest")
        check("Newbie" in await A.inner_text(".levelcard"), "learner level shown (Newbie)")
        check(await A.locator(".rung").count() == 9 and "God tier" in await A.inner_text(".ladder"), "ladder: 9 levels up to God tier")
        tip = await A.locator(".cal .c.l4").first.get_attribute("title")
        check(bool(tip) and "learning" in tip, "day cells have a readable tooltip: " + str(tip))
        await A.screenshot(path="/tmp/v3-progress-desk.png", full_page=True)

        # --- admin table
        await go(B, "admin"); await B.wait_for_selector("table")
        t = (await B.inner_text("table")).lower()
        check("level" in t and "time" in t and "aim-learner1" in t, "admin table shows level and time")

        # --- screenshots
        await go(A, "doubts"); await A.wait_for_selector(".stream .msg"); await A.wait_for_timeout(300)
        await A.screenshot(path="/tmp/v3-chat-desk.png")
        M = await ctx.new_page(); await M.set_viewport_size({"width": 390, "height": 844})
        M.on("pageerror", lambda e: errs.append("M " + str(e)))
        await login(M, "learner@pyml.dev"); await go(M, "doubts"); await M.wait_for_selector(".stream .msg")
        await M.wait_for_timeout(400); await M.screenshot(path="/tmp/v3-chat-mob.png")
        await go(M, "me"); await M.wait_for_selector(".cal"); await M.wait_for_timeout(400)
        await M.screenshot(path="/tmp/v3-progress-mob.png", full_page=True)

        check(not errs, "no page errors " + json.dumps(errs))
        await b.close()
    print("\n%d failure(s)" % len(fails))
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    asyncio.run(main())
