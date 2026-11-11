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

    step("no console errors", not errors, "; ".join(errors[:3]))

print("E2E", "OK" if not failures else f"FAILED: {failures}", flush=True)
os._exit(1 if failures else 0)
