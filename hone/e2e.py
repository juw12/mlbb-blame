"""End-to-end check of every v1 button (not a rubric gate; proves the features work).

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


def step(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}", flush=True)
    if not ok:
        failures.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-proxy-server"])
    context = browser.new_context(viewport={"width": 390, "height": 800}, accept_downloads=True)
    context.grant_permissions(["clipboard-read", "clipboard-write"])
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(URL)

    page.click("#demo")
    page.click("#analyze")
    page.wait_for_timeout(400)
    step("analyze renders 5 cards", page.locator("article.card").count() == 5)

    page.click("#copyText")
    page.wait_for_timeout(300)
    clip = page.evaluate("() => navigator.clipboard.readText()")
    step("copy text has blame line", "most to blame: Darren" in clip, clip.splitlines()[0] if clip else "")
    step("copy text names heroes", "Fanny" in clip and "Tigreal" in clip)

    with page.expect_download() as download_info:
        page.click("#shareImage")
    download = download_info.value
    image_path = APP / "hone" / "shots" / "e2e_share.png"
    download.save_as(str(image_path))
    step("share image downloads PNG", image_path.stat().st_size > 20000, f"{image_path.stat().st_size} bytes")

    page.click("#save")
    page.wait_for_timeout(200)
    step("save adds history row", page.locator(".matches li").count() == 1)

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

    page.fill(".pcard:nth-child(2) [data-f=gold]", "abc")
    page.click("#analyze")
    step("bad number shows error", "not a valid number" in page.inner_text("#error"))

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
    step("THREW stamp on blame card", page.locator("article.card.blame .stamp.threw").count() == 1)
    step("role colour attribute on cards", page.locator('article.card[data-role="Jungle"]').count() == 1)
    step("complete entry shows no data warning", page.locator(".data-warn").count() == 0)
    page.fill(".pcard:nth-child(5) [data-f=turret]", "")
    page.fill(".pcard:nth-child(3) [data-f=name]", "")
    page.click("#analyze")
    page.wait_for_timeout(300)
    warn_text = page.inner_text(".data-warn") if page.locator(".data-warn").count() else ""
    step("blank stat and 4 players are warned", "Only 4 of 5" in warn_text and "Kai: Turret dmg left blank" in warn_text, warn_text[:120])

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
    page.click("#analyze")
    page.wait_for_timeout(300)
    page.click("article.card.blame details.stats summary")
    evidence = page.inner_text("article.card.blame .grid-stats")
    step("stat breakdown shows actual vs expected", "expected" in evidence and "target 3" in evidence, evidence[:90].replace("\n", " | "))

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

print("E2E", "OK" if not failures else f"FAILED: {failures}", flush=True)
os._exit(1 if failures else 0)
