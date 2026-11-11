"""End-to-end check of every button and flow, v1 to v7 (not a rubric gate; proves the features work).

python hone/e2e.py  -> prints one line per step, exits non-zero on any failure.
"""
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

APP = Path(__file__).resolve().parent.parent
URL = (APP / "index.html").as_uri()
failures = []
# The CDN that hosts the screenshot reader is only reachable through the office proxy on this PC.
# Set HONE_PROXY="" on a network with direct internet. file:// and localhost never use the proxy.
PROXY = os.environ.get("HONE_PROXY", "http://proxy8.intra:80")
NETWORK_ARGS = [f"--proxy-server={PROXY}"] if PROXY else ["--no-proxy-server"]


def step(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}", flush=True)
    if not ok:
        failures.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch(args=NETWORK_ARGS)
    context = browser.new_context(viewport={"width": 390, "height": 800}, accept_downloads=True)
    context.grant_permissions(["clipboard-read", "clipboard-write"])
    # Desktop path: no Web Share, so "Share result image" opens the preview dialog (the phone path is tested further down).
    context.add_init_script("delete Navigator.prototype.share; delete Navigator.prototype.canShare;")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(URL)

    page.click("#demo")
    page.click("#analyze")
    page.wait_for_timeout(400)
    step("analyze renders 5 cards", page.locator("article.card").count() == 5)

    # v5: why this player and not the runner-up, and whether the call survives a slightly different game
    versus = page.inner_text(".banner .versus") if page.locator(".banner .versus").count() else ""
    step("banner explains why not the runner-up", "Why Darren and not" in versus and "deaths" in versus and "pts" in versus,
         versus[:110].replace("\n", " | "))
    sensitivity = page.inner_text("#sensitivity") if page.locator("#sensitivity").count() else ""
    step("banner says if the call holds up", "fewer death" in sensitivity and "Darren" in sensitivity, sensitivity)
    # v6: the points are labelled with their owner, the what-if covers 10% swings, and every card shows a stat strip
    # v7 wording: "leaves Darren 0.7 pts behind" replaces "0.7 pts for Darren"
    step("decider points say whose they are", "Darren vs" in versus and "leaves Darren" in versus and "pts behind" in versus,
         versus[:140].replace("\n", " | "))
    step("what-if also covers 10% stat swings", "10% more gold" in sensitivity and "turret damage" in sensitivity, sensitivity)
    strip_columns = page.locator("article.card.blame .mini > span").count()
    strip_seen = page.locator("article.card.blame .mini").is_visible()
    strip_label = page.get_attribute("article.card.blame .mini", "aria-label") or ""
    # v7: the strip sits inside the breakdown, which starts open on the called player's card only
    other_strips = page.eval_on_selector_all("article.card:not(.blame) .mini", "els => els.filter(e => e.checkVisibility()).length")
    step("called player's card shows the 7-stat strip without opening anything; other cards stay short",
         strip_columns == 7 and strip_seen and "Deaths" in strip_label and other_strips == 0,
         f"columns={strip_columns} visible={strip_seen} others visible={other_strips} | {strip_label[:80]}")
    share_label = page.inner_text("#shareImage")
    step("share button is ready and labelled", page.locator("#shareImage").is_enabled() and share_label == "Share result image", share_label)
    best_effort = page.inner_text("article.card.mvp .stamp") if page.locator("article.card.mvp .stamp").count() else ""
    step("best player on a losing team is stamped Best effort", best_effort.strip().lower() == "best effort", best_effort)
    step("method is open on the first analysis", page.evaluate("() => document.getElementById('how').open")
         and "6 + 4" in page.inner_text("#how"))
    step("example squad is not remembered", page.locator("#lastSquad").is_hidden() and page.locator("#forgetPlayers").is_hidden())
    open_states = page.eval_on_selector_all(
        "#output details.stats", "els => els.map(e => [e.closest('article').classList.contains('blame'), e.open])")
    step("only the called player's breakdown starts open", len(open_states) == 5 and all(is_blame == is_open for is_blame, is_open in open_states),
         str(open_states))
    formula = page.inner_text("article.card.blame .formula")
    points = page.locator("article.card.blame .grid-stats .pts").count()
    raw_gold = "7,600 gold" in page.inner_text("article.card.blame")
    step("card shows the score maths and raw numbers", formula.startswith("6.0 for an average game") and "= 4." in formula
         and points == 7 and raw_gold, f"{formula[:70]} | pts={points} raw={raw_gold}")

    page.click("#copyText")
    page.wait_for_timeout(300)
    clip = page.evaluate("() => navigator.clipboard.readText()")
    step("copy text has blame line", "most to blame: Darren" in clip, clip.splitlines()[0] if clip else "")
    step("copy text names heroes", "Fanny" in clip and "Tigreal" in clip)
    step("copy text carries the what-if line, no caveat for full data", "Holds up" in clip and "Data note" not in clip)

    page.click("#shareImage")
    page.wait_for_selector("#sharePreview[open]", timeout=5000)
    preview_ok = page.evaluate("() => document.getElementById('sharePreviewImg').naturalWidth === 1080")
    step("share opens image preview", preview_ok)
    with page.expect_download() as download_info:
        page.click("#sharePreviewDownload")
    download = download_info.value
    page.click("#sharePreviewClose")
    image_path = APP / "hone" / "shots" / "e2e_share.png"
    download.save_as(str(image_path))
    step("share image downloads PNG", image_path.stat().st_size > 20000, f"{image_path.stat().st_size} bytes")

    page.click("#save")
    page.wait_for_timeout(200)
    step("save adds history row", page.locator(".matches li").count() == 1)
    form_bars = page.locator("table.history .form i").count()
    match_scores = page.inner_text(".matches li small")
    step("history shows form bars and every score", form_bars == 5 and "Darren" in match_scores and "Juwen" in match_scores,
         f"bars={form_bars} | {match_scores}")
    # v6: at phone width the leaderboard is one labelled block per player, not a sideways-scrolling table
    head_hidden = page.locator("table.history thead").is_hidden()
    labelled = page.locator("table.history tbody tr:first-child td[data-label]").count()
    table_fits = page.evaluate("() => { const t = document.querySelector('.table-wrap'); return t.scrollWidth <= t.clientWidth; }")
    step("phone leaderboard stacks with labels", head_hidden and labelled == 7 and table_fits,
         f"thead hidden={head_hidden} labelled={labelled} fits={table_fits}")

    page.click("[data-delete]")
    page.wait_for_timeout(200)
    step("delete removes row", page.locator(".matches li").count() == 0)
    page.click("#toast button")
    page.wait_for_timeout(200)
    step("undo restores row", page.locator(".matches li").count() == 1)

    with page.expect_download() as download_info:
        page.click("#exportHistory")
    exported = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
    step("export backup is valid JSON", isinstance(exported, list) and len(exported) == 1)

    page.click("#clearHistory")
    page.wait_for_timeout(200)
    backup_file = APP / "hone" / "shots" / "e2e_backup.json"
    backup_file.write_text(json.dumps(exported), encoding="utf-8")
    page.set_input_files("#importHistory", str(backup_file))
    page.wait_for_timeout(400)
    step("import restores history", page.locator(".matches li").count() == 1)

    page.click("#newMatch")
    page.wait_for_timeout(200)
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    kills = page.eval_on_selector_all("[data-f=kills]", "els => els.map(e => e.value)")
    step("next match keeps squad, clears stats", names[3] == "Darren" and all(k == "" for k in kills))

    page.fill(".pcard:nth-child(1) [data-f=kills]", "9")
    page.reload()
    page.wait_for_timeout(400)
    restored = page.input_value(".pcard:nth-child(1) [data-f=kills]")
    step("draft survives reload", restored == "9")

    page.click("#result button[data-result=win]")
    page.click("#demo")
    page.click("#result button[data-result=win]")
    page.click("#analyze")
    page.wait_for_timeout(300)
    step("win shows MVP banner", "MVP:" in page.inner_text(".banner"))
    step("method stays closed after the first time", not page.evaluate("() => document.getElementById('how').open"))

    page.fill(".pcard:nth-child(2) [data-f=gold]", "abc")
    page.click("#analyze")
    step("bad number shows error", "not a valid number" in page.inner_text("#error"))

    # v6: Clear all can be undone
    page.click("#clear")
    cleared = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    page.click("#toast button")
    page.wait_for_timeout(200)
    restored_names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    step("clear all, with undo", all(n == "" for n in cleared) and restored_names[3] == "Darren", f"{cleared} -> {restored_names}")

    # v2: import from pasted text
    page.click("#clear")
    page.click("#importBox summary")
    pasted = "\n".join([
        "DEFEAT",
        "Juwen  Claude  Gold Lane  6/3/5  11800  78.4k  31,200  6100",
        "Ah Beng  Yu Zhong  EXP  3/5/7  9100  52300  88400  2900",
        "Mei  Pharsa  Mid  4/4/8  9400  81200  30100  1500",
        "Darren  Fanny  Jungle  2/11/3  7600  38700  47800  800",
        "Kai  Tigreal  Roam  0/6/13  5900  18100  79600  600",
    ])
    page.fill("#importText", pasted)
    page.click("#importFill")
    page.wait_for_timeout(200)
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    damage = page.input_value(".pcard:nth-child(1) [data-f=damage]")
    filled = page.locator(".pcard.filled").count()
    step("paste fills 5 players", names == ["Juwen", "Ah Beng", "Mei", "Darren", "Kai"] and damage == "78400" and filled == 5,
         f"{names} dmg={damage} filled={filled}")
    step("paste sets Defeat from text", "on" in (page.get_attribute("#result button[data-result=lose]", "class") or ""))
    page.click("#analyze")
    page.wait_for_timeout(300)
    step("pasted match analyzes", "most to blame: Darren" in page.inner_text(".banner"))

    # v5: an analyzed squad is remembered - names recall hero and role, Enter walks the boxes, Last squad refills
    step("own squad is remembered", page.locator("#lastSquad").is_visible() and page.locator("#forgetPlayers").is_visible())
    kept_draft = page.evaluate("() => localStorage.getItem('mlbb-analyzer-draft')")
    page.click("#clear")
    page.fill(".pcard:nth-child(1) [data-f=name]", "darren")
    page.press(".pcard:nth-child(1) [data-f=name]", "Tab")
    recalled = [page.input_value(f".pcard:nth-child(1) [data-f={f}]") for f in ("hero", "role")]
    step("known name fills hero and role", recalled == ["Fanny", "Jungle"], str(recalled))
    page.fill(".pcard:nth-child(2) [data-f=name]", "Kai")
    page.press(".pcard:nth-child(2) [data-f=name]", "Enter")
    after_name = page.evaluate("() => [document.activeElement.dataset.f, document.activeElement.closest('.pcard').dataset.index]")
    page.keyboard.type("4")
    page.keyboard.press("Enter")
    after_kills = page.evaluate("() => document.activeElement.dataset.f")
    step("Enter moves to the next box", after_name == ["kills", "1"] and after_kills == "deaths"
         and page.input_value(".pcard:nth-child(2) [data-f=hero]") == "Tigreal", f"{after_name} then {after_kills}")
    page.click("#lastSquad")
    page.wait_for_timeout(200)
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    kills = page.eval_on_selector_all("[data-f=kills]", "els => els.map(e => e.value)")
    focused = page.evaluate("() => [document.activeElement.dataset.f, document.activeElement.closest('.pcard').dataset.index]")
    step("last squad refills names and waits at the first number",
         names == ["Juwen", "Ah Beng", "Mei", "Darren", "Kai"] and all(k == "" for k in kills) and focused == ["kills", "0"],
         f"{names} focus={focused}")
    page.click("#forgetPlayers")
    page.wait_for_timeout(200)
    forgotten = page.locator("#lastSquad").is_hidden()
    page.click("#toast button")
    page.wait_for_timeout(200)
    step("forget saved players, with undo", forgotten and page.locator("#lastSquad").is_visible())
    page.evaluate("draft => localStorage.setItem('mlbb-analyzer-draft', draft)", kept_draft)
    page.reload()
    page.wait_for_timeout(400)
    page.click("#importBox summary")
    page.click("#analyze")
    page.wait_for_timeout(300)
    step("THREW stamp on blame card", page.locator("article.card.blame .stamp.threw").count() == 1)
    step("role colour attribute on cards", page.locator('article.card[data-role="Jungle"]').count() == 1)
    step("complete entry shows no data warning", page.locator(".data-warn").count() == 0)
    page.fill(".pcard:nth-child(5) [data-f=turret]", "")
    page.fill(".pcard:nth-child(3) [data-f=name]", "")
    page.click("#analyze")
    page.wait_for_timeout(300)
    warn_text = page.inner_text(".data-warn") if page.locator(".data-warn").count() else ""
    step("blank stat and 4 players are warned", "Only 4 of 5" in warn_text and "Kai: Turret dmg left blank" in warn_text, warn_text[:120])
    chip_text = page.inner_text(".banner .chip")
    step("chip folds in missing data", "but only 4 of 5 players entered" in chip_text, chip_text)
    # v6: the caveat travels with the result
    page.click("#copyText")
    page.wait_for_timeout(300)
    caveat_clip = page.evaluate("() => navigator.clipboard.readText()")
    step("copied text carries the data caveat", "Data note: only 4 of 5 players entered" in caveat_clip, caveat_clip.splitlines()[-2] if caveat_clip else "")
    taller = page.evaluate("() => [drawResultImage({ ...lastAnalysis, caveat: '' }).height, drawResultImage(lastAnalysis).height]")
    step("share image makes room for the caveat", taller[1] == taller[0] + 50, str(taller))

    # v4: "How is this decided?" opens the explanation with thresholds
    page.click("#howLink")
    page.wait_for_timeout(300)
    how_open = page.evaluate("() => document.getElementById('how').open")
    how_text = page.inner_text("#how")
    step("how link opens thresholds", how_open and "Clear call" in how_text and "0.4" in how_text, how_text[-120:].replace("\n", " "))

    # v4: typing 2/11/3 in K fills K, D and A
    page.fill(".pcard:nth-child(1) [data-f=kills]", "")
    page.type(".pcard:nth-child(1) [data-f=kills]", "2/11/3")
    kda = [page.input_value(f".pcard:nth-child(1) [data-f={f}]") for f in ("kills", "deaths", "assists")]
    focused = page.evaluate("() => document.activeElement.dataset.f")
    step("K field splits 2/11/3", kda == ["2", "11", "3"] and focused == "gold", f"{kda} focus={focused}")

    # v4: a near-tie names the runner-up and tags the within-margin card
    near_tie = [
        ("A", "Gold Lane", "7", "2", "6", "12000", "80000", "30000", "1000"),
        ("B", "EXP Lane", "3", "4", "6", "9000", "60000", "80000", "1000"),
        ("C", "Mid Lane", "3", "4", "6", "9000", "60000", "30000", "1000"),
        ("D", "Jungle", "3", "9", "6", "9000", "60000", "30000", "1000"),
        ("E", "Jungle", "3", "9", "5", "9000", "60000", "30000", "1000"),
    ]
    fields = ("name", "role", "kills", "deaths", "assists", "gold", "damage", "taken", "turret")
    for index, row in enumerate(near_tie, start=1):
        for field, value in zip(fields, row):
            selector = f".pcard:nth-child({index}) [data-f={field}]"
            if field == "role":
                page.select_option(selector, value)
            else:
                page.fill(selector, value)
    page.click("#result button[data-result=lose]")
    page.click("#analyze")
    page.wait_for_timeout(300)
    runner_text = page.inner_text(".banner .runner") if page.locator(".banner .runner").count() else ""
    near_tags = page.locator("article.card .tag.near").count()
    step("close call names runner-up", "Too close" in runner_text and near_tags >= 1, f"{runner_text[:80]} | tags={near_tags}")

    page.fill("#importText", "gg ez report jungler")
    page.click("#importFill")
    step("junk paste explains format", "K/D/A" in page.inner_text("#importStatus"))

    # v3: one-tap paste from the clipboard + visible stat evidence
    page.click("#clear")
    page.evaluate("text => navigator.clipboard.writeText(text)", pasted)
    page.click("#importClipboard")
    page.wait_for_timeout(300)
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    step("clipboard button fills players", names[3] == "Darren", str(names))
    # v6: the same import as a big button above the form
    page.click("#clear")
    page.click("#quickPaste")
    page.wait_for_timeout(300)
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    box_open = page.evaluate("() => document.getElementById('importBox').open")
    step("quick paste button fills players", names[3] == "Darren" and box_open and page.locator("#quickShot").is_visible(), str(names))
    page.click("#analyze")
    page.wait_for_timeout(300)
    evidence = page.inner_text("article.card.blame .grid-stats")
    step("stat breakdown shows actual vs expected", "expected" in evidence and "target 3" in evidence, evidence[:90].replace("\n", " | "))

    # ---- v7 ----
    # The share is explained where it is shown, and the per-card label is unchanged (5 cards, 5 shares).
    share_note = page.inner_text("#shareNote")
    share_labels = page.evaluate("() => (document.getElementById('output').innerText.match(/Share of blame: \\d+%/g) || []).length")
    step("share note says the shares split one match and total 100%", "adds up to 100%" in share_note and "not a grade" in share_note
         and share_labels == 5, f"labels={share_labels} | {share_note[:90]}")

    # The method opens with the called player's own numbers worked through, step by step.
    page.evaluate("() => { document.getElementById('how').open = true; }")
    worked = page.inner_text("#worked") if page.locator("#worked").count() else ""
    worked_steps = page.locator("#worked ol > li").count()
    step("worked example walks the called player's numbers", worked_steps == 5 and "Darren (Jungle)" in worked and "Deaths" in worked
         and "limited to −1.00" in worked and "−0.60" in worked and "shown as 4.0" in worked and "shown as 43%" in worked,
         f"steps={worked_steps} | {worked[:120]}".replace("\n", " | "))

    # The what-if now moves the runner-up too.
    sensitivity = page.inner_text("#sensitivity")
    step("what-if covers the runner-up as well", "Holds up both ways" in sensitivity and "Kai had 3 more deaths" in sensitivity, sensitivity)

    page.click("#copyText")
    page.wait_for_timeout(300)
    clip = page.evaluate("() => navigator.clipboard.readText()")
    step("copied text says whose favour and that shares total 100%", "pts behind" in clip and "add up to 100% across the 5 players" in clip,
         " | ".join(clip.splitlines()[:3])[:200])

    image_height = page.evaluate("() => drawResultImage(lastAnalysis).height")
    step("share image has room for a stat strip per player", image_height == 420 + 20 + 5 * 200 + 120, f"height={image_height}")

    # One button opens every breakdown and closes them again.
    toggle_before = page.inner_text("#toggleBreakdowns")
    page.click("#toggleBreakdowns")
    opened = page.eval_on_selector_all("#output details.stats", "els => els.map(e => e.open)")
    toggle_open = [page.inner_text("#toggleBreakdowns"), page.get_attribute("#toggleBreakdowns", "aria-expanded")]
    page.click("#toggleBreakdowns")
    closed = page.eval_on_selector_all("#output details.stats", "els => els.map(e => e.open)")
    toggle_closed = [page.inner_text("#toggleBreakdowns"), page.get_attribute("#toggleBreakdowns", "aria-expanded")]
    step("one button shows or hides every breakdown", toggle_before == "Show every player's breakdown" and all(opened) and len(opened) == 5
         and toggle_open == ["Hide all breakdowns", "true"] and not any(closed) and toggle_closed == ["Show every player's breakdown", "false"],
         f"{toggle_before} -> {toggle_open} -> {toggle_closed}")

    # Import review: a dropped digit and a missing number are marked, the cursor goes to the first one, fixing clears the mark.
    page.click("#clear")
    doubtful = pasted.replace("2/11/3  7600", "2/11/3  760").replace("5900  18100  79600  600", "5900  18100  79600")
    page.fill("#importText", doubtful)
    page.click("#importFill")
    page.wait_for_timeout(200)
    marked = page.eval_on_selector_all("input.suspect", "els => els.map(e => [e.closest('.pcard').dataset.index, e.dataset.f, e.title])")
    notes = page.eval_on_selector_all(".pcard .check-note", "els => els.map(e => e.textContent)")
    status = page.inner_text("#importStatus")
    focused = page.evaluate("() => [document.activeElement.closest('.pcard')?.dataset.index, document.activeElement.dataset.f]")
    step("import marks the boxes that look wrong", [m[:2] for m in marked] == [["3", "gold"], ["4", "turret"]]
         and "dropped digit" in marked[0][2] and "missing" in marked[1][2] and len(notes) == 2
         and "2 boxes look off or are missing (marked in orange)" in status and status.startswith("Filled 5 players"),
         f"{marked} | {status[-70:]}")
    step("cursor lands on the first box to check", focused == ["3", "gold"], str(focused))
    page.fill(".pcard:nth-child(4) [data-f=gold]", "7600")
    after_first_fix = page.eval_on_selector_all("input.suspect", "els => els.map(e => e.dataset.f)")
    page.fill(".pcard:nth-child(5) [data-f=turret]", "600")
    after_second_fix = [page.locator("input.suspect").count(), page.locator(".pcard .check-note").count()]
    page.click("#analyze")
    page.wait_for_timeout(300)
    step("fixing a marked box clears its mark, and the match analyzes", after_first_fix == ["turret"] and after_second_fix == [0, 0]
         and "most to blame: Darren" in page.inner_text(".banner"), f"{after_first_fix} -> {after_second_fix}")

    # Victory / Defeat is remembered: the example does not change it, Clear all and a fresh form go back to it.
    page.click("#result button[data-result=win]")
    page.click("#demo")
    example_result = page.get_attribute("#result button[data-result=lose]", "aria-pressed")
    page.click("#clear")
    after_clear = page.get_attribute("#result button[data-result=win]", "aria-pressed")
    page.evaluate("() => localStorage.removeItem('mlbb-analyzer-draft')")
    page.evaluate("text => navigator.clipboard.writeText(text)", pasted)
    page.reload()
    page.bring_to_front()
    page.wait_for_timeout(600)
    after_reload = page.get_attribute("#result button[data-result=win]", "aria-pressed")
    step("last chosen result is remembered", example_result == "true" and after_clear == "true" and after_reload == "true",
         f"example lose={example_result} clear win={after_clear} reload win={after_reload}")
    # The clipboard still holds text that was already imported: it is not offered again.
    step("text already filled in is not offered again", page.locator("#clipOffer").is_hidden())
    page.click("#result button[data-result=lose]")
    # The reload closed the import box; the steps below use the controls inside it, as a user would.
    page.click("#importBox summary")

    # v2: read a screenshot (synthetic dark scoreboard; needs the OCR library from the CDN)
    shot = APP / "hone" / "shots" / "e2e_scoreboard.png"
    if shot.exists():
        page.click("#clear")
        page.set_input_files("#importImage", str(shot))
        try:
            page.wait_for_function(
                "() => /Filled|Couldn't/.test(document.getElementById('importStatus').textContent)",
                timeout=110000,
            )
        except Exception:
            pass
        status = page.inner_text("#importStatus")
        names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
        heroes = page.eval_on_selector_all("[data-f=hero]", "els => els.map(e => e.value)")
        deaths = page.input_value(".pcard:nth-child(4) [data-f=deaths]")
        gold = page.input_value(".pcard:nth-child(4) [data-f=gold]")
        step("screenshot OCR fills players", status.startswith("Filled") and names[3] == "Darren"
             and heroes[3] == "Fanny" and deaths == "11" and gold == "7600",
             f"{status[:60]} | {names} | {heroes} | deaths={deaths} gold={gold}")

    step("no console errors", not errors, "; ".join(errors[:3]))

    # v5: on a phone (Web Share with files) the Share button opens the share sheet in one tap, no dialog first
    phone = browser.new_context(viewport={"width": 390, "height": 800})
    phone.add_init_script("""
        window.__shares = [];
        Object.defineProperty(Navigator.prototype, "canShare", { configurable: true, value: (data) => Boolean(data) });
        Object.defineProperty(Navigator.prototype, "share", {
          configurable: true,
          value: async (data) => {
            window.__shares.push({
              text: data.text || "",
              files: (data.files || []).map((file) => ({ name: file.name, type: file.type, size: file.size })),
            });
          },
        });
    """)
    phone_page = phone.new_page()
    phone_errors = []
    phone_page.on("pageerror", lambda exc: phone_errors.append(str(exc)))
    phone_page.goto(URL)
    phone_page.click("#demo")
    phone_page.click("#analyze")
    phone_page.wait_for_selector("#previewImage:not([hidden])", timeout=5000)
    phone_page.click("#shareImage")
    phone_page.wait_for_timeout(300)
    shares = phone_page.evaluate("() => window.__shares")
    dialog_open = phone_page.evaluate("() => document.getElementById('sharePreview').open")
    one_tap = (len(shares) == 1 and shares[0]["files"] and shares[0]["files"][0]["type"] == "image/png"
               and shares[0]["files"][0]["size"] > 20000 and "most to blame: Darren" in shares[0]["text"]
               and "Why not" in shares[0]["text"] and not dialog_open)
    step("phone: one tap shares the PNG and the text", bool(one_tap), json.dumps(shares)[:150])
    phone_page.click("#previewImage")
    phone_page.wait_for_selector("#sharePreview[open]", timeout=5000)
    step("phone: preview is still one tap away", phone_page.locator("#sharePreviewShare").is_visible() and not phone_errors,
         "; ".join(phone_errors[:2]))

    # v6: a browser that can share words but not files still gets a share button, for the text
    phone_page.click("#sharePreviewClose")
    phone_page.evaluate("() => Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: () => false })")
    phone_page.click("#analyze")
    phone_page.wait_for_selector("#shareImage:not([disabled])", timeout=5000)
    phone_page.click("#shareImage")
    phone_page.wait_for_selector("#sharePreview[open]", timeout=5000)
    text_label = phone_page.inner_text("#sharePreviewShare")
    phone_page.click("#sharePreviewShare")
    phone_page.wait_for_timeout(300)
    last_share = phone_page.evaluate("() => window.__shares[window.__shares.length - 1]")
    step("phone without file sharing: shares the text", text_label == "Share text only" and not last_share["files"]
         and "most to blame: Darren" in last_share["text"] and not phone_errors, f"{text_label} | {json.dumps(last_share)[:90]}")

    # ---- v7: arriving on the page ----
    # With a mouse the cursor starts where typing begins; on a touch screen nothing is focused (no keyboard pops up).
    desk = browser.new_context(viewport={"width": 1280, "height": 800})
    desk_page = desk.new_page()
    desk_page.goto(URL)
    desk_page.wait_for_timeout(300)
    fine = desk_page.evaluate("() => matchMedia('(pointer: fine)').matches")
    first_focus = desk_page.evaluate("() => [document.activeElement.dataset.f, document.activeElement.closest('.pcard')?.dataset.index]")
    desk_page.keyboard.type("Juwen")
    desk_page.reload()
    desk_page.wait_for_timeout(300)
    draft_focus = desk_page.evaluate("() => [document.activeElement.dataset.f, document.activeElement.closest('.pcard')?.dataset.index]")
    step("desktop: cursor starts in the first name box, or the first empty number when a draft is loaded",
         fine and first_focus == ["name", "0"] and draft_focus == ["kills", "0"]
         and desk_page.input_value(".pcard:nth-child(1) [data-f=name]") == "Juwen", f"fine={fine} {first_focus} then {draft_focus}")
    desk.close()

    touch = browser.new_context(viewport={"width": 390, "height": 800}, is_mobile=True, has_touch=True)
    touch_page = touch.new_page()
    touch_page.goto(URL)
    touch_page.wait_for_timeout(300)
    coarse = touch_page.evaluate("() => matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches")
    touch_focus = touch_page.evaluate("() => document.activeElement.tagName")
    step("touch screen: nothing is focused on arrival", coarse and touch_focus == "BODY", f"coarse={coarse} active={touch_focus}")
    # After an import on touch, the box to check is scrolled into view but not focused.
    touch_page.click("#importBox summary")
    touch_page.fill("#importText", doubtful)
    touch_page.tap("#importFill")
    touch_page.wait_for_timeout(400)
    touch_state = touch_page.evaluate("""() => {
        const box = document.querySelector("input.suspect");
        const rect = box ? box.getBoundingClientRect() : null;
        return {
          marked: document.querySelectorAll("input.suspect").length,
          inView: Boolean(rect && rect.top >= 0 && rect.bottom <= innerHeight),
          focusedSuspect: document.activeElement.classList.contains("suspect"),
        };
    }""")
    step("touch screen: the box to check is brought into view, not focused",
         touch_state == {"marked": 2, "inView": True, "focusedSuspect": False}, json.dumps(touch_state))
    touch.close()

    # Clipboard offer: only when reading is already allowed, never filled without a tap, each text offered once.
    clip_context = browser.new_context(viewport={"width": 390, "height": 800})
    clip_context.grant_permissions(["clipboard-read", "clipboard-write"])
    clip_page = clip_context.new_page()
    clip_errors = []
    clip_page.on("pageerror", lambda exc: clip_errors.append(str(exc)))
    clip_page.goto(URL)
    first_copy = pasted.replace("6/3/5", "7/3/5")
    clip_page.evaluate("text => navigator.clipboard.writeText(text)", first_copy)
    clip_page.reload()
    clip_page.bring_to_front()
    try:
        clip_page.wait_for_selector("#clipOffer:not([hidden])", timeout=5000)
    except Exception:
        pass
    offer_text = clip_page.inner_text("#clipOffer span")
    names_before = clip_page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    focus_in_offer = clip_page.evaluate("() => Boolean(document.activeElement.closest('#clipOffer'))")
    step("clipboard stats are offered, not filled in", clip_page.locator("#clipOffer").is_visible() and "Stats for 5 players" in offer_text
         and all(n == "" for n in names_before) and not focus_in_offer, f"{offer_text} | names={names_before}")
    clip_page.click("#clipFill")
    clip_page.wait_for_timeout(300)
    names_after = clip_page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    kills_after = clip_page.input_value(".pcard:nth-child(1) [data-f=kills]")
    hidden_after_fill = clip_page.locator("#clipOffer").is_hidden()
    clip_page.reload()
    clip_page.bring_to_front()
    clip_page.wait_for_timeout(700)
    step("one tap fills them in, and the same text is not offered twice", names_after[3] == "Darren" and kills_after == "7"
         and hidden_after_fill and clip_page.locator("#clipOffer").is_hidden(), f"{names_after} kills={kills_after}")
    clip_page.evaluate("text => navigator.clipboard.writeText(text)", pasted.replace("6/3/5", "8/3/5"))
    clip_page.reload()
    clip_page.bring_to_front()
    try:
        clip_page.wait_for_selector("#clipOffer:not([hidden])", timeout=5000)
    except Exception:
        pass
    offered_again = clip_page.locator("#clipOffer").is_visible()
    clip_page.click("#clipDismiss")
    kills_kept = clip_page.input_value(".pcard:nth-child(1) [data-f=kills]")
    clip_page.reload()
    clip_page.bring_to_front()
    clip_page.wait_for_timeout(700)
    step("a new copy is offered; Dismiss leaves the form alone and stays dismissed", offered_again and kills_kept == "7"
         and clip_page.locator("#clipOffer").is_hidden() and not clip_errors, f"offered={offered_again} kills={kills_kept} {clip_errors[:2]}")
    clip_page.evaluate("text => navigator.clipboard.writeText(text)", "gg wp see you tomorrow")
    clip_page.reload()
    clip_page.bring_to_front()
    clip_page.wait_for_timeout(700)
    step("ordinary clipboard text is ignored", clip_page.locator("#clipOffer").is_hidden())
    clip_context.close()

    # Without the permission the clipboard is never read and nothing is asked.
    quiet = browser.new_context(viewport={"width": 390, "height": 800})
    quiet.add_init_script("""
        window.__clipReads = 0;
        if (navigator.clipboard && navigator.clipboard.readText) {
          const original = navigator.clipboard.readText.bind(navigator.clipboard);
          navigator.clipboard.readText = (...args) => {
            window.__clipReads += 1;
            return original(...args);
          };
        }
    """)
    quiet_page = quiet.new_page()
    quiet_page.goto(URL)
    quiet_page.bring_to_front()
    quiet_page.evaluate("() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); }")
    quiet_page.wait_for_timeout(600)
    permission = quiet_page.evaluate("() => navigator.permissions.query({ name: 'clipboard-read' }).then((p) => p.state, () => 'unsupported')")
    reads = quiet_page.evaluate("() => window.__clipReads")
    step("no permission: the clipboard is never read on arrival", permission != "granted" and reads == 0
         and quiet_page.locator("#clipOffer").is_hidden(), f"permission={permission} reads={reads}")
    quiet.close()

print("E2E", "OK" if not failures else f"FAILED: {failures}", flush=True)
os._exit(1 if failures else 0)
