"""Code checker for the /hone loop (rubric mlbb-v1 gates G1-G5) + screenshots for the judges.

Usage: python hone/check.py <tag>      -> hone/shots/<tag>/*.png and hone/shots/<tag>/gates.json
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

APP = Path(__file__).resolve().parent.parent
TAG = sys.argv[1] if len(sys.argv) > 1 else "latest"
OUT = APP / "hone" / "shots" / TAG
OUT.mkdir(parents=True, exist_ok=True)
URL = (APP / "index.html").as_uri()
WIDTHS = [320, 390, 768, 1024, 1440]
MOJIBAKE = re.compile("Ã.|Â[^A-Za-z]|â€|ðŸ")


def log(message):
    print(message, flush=True)


def gate_tests():
    result = subprocess.run(["node", "test.js"], cwd=APP, capture_output=True, text=True, encoding="utf-8")
    return result.returncode == 0, result.stdout.strip().splitlines()[-1:] + result.stderr.strip().splitlines()[-3:]


def gate_encoding():
    problems = []
    for path in APP.rglob("*"):
        if path.suffix not in {".html", ".js", ".css", ".md", ".json", ".webmanifest", ".svg"}:
            continue
        if "shots" in path.parts or "node_modules" in path.parts:
            continue
        raw = path.read_bytes()
        if raw.startswith(b"\xef\xbb\xbf"):
            problems.append(f"BOM: {path.name}")
        text = raw.decode("utf-8", errors="replace")
        if "\ufffd" in text or MOJIBAKE.search(text):
            problems.append(f"mojibake: {path.name}")
    return not problems, problems


def run_flow(browser, width, shoot):
    height = 900 if width >= 768 else 800
    context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
    page.on("console", lambda msg: errors.append(f"console: {msg.text}") if msg.type == "error" else None)
    page.goto(URL)
    page.wait_for_timeout(400)
    if shoot:
        page.screenshot(path=str(OUT / f"idle_{width}.png"), full_page=False)
    page.click("#demo")
    page.click("#analyze")
    page.wait_for_timeout(700)
    overflow = page.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
    if shoot:
        page.evaluate("() => window.scrollTo(0, 0)")
        page.screenshot(path=str(OUT / f"result_{width}.png"), full_page=True)
    output_text = page.inner_text("#output")
    shares = [int(x) for x in re.findall(r"Share of (?:blame|credit): (\d+)%", output_text)]
    if page.locator("#save").count():
        page.click("#save")
        page.wait_for_timeout(300)
    return {
        "width": width,
        "errors": errors,
        "scrollWidth": overflow[0],
        "innerWidth": overflow[1],
        "overflow": overflow[0] > overflow[1],
        "shares": shares,
        "darren_blamed": bool(re.search(r"blame[^\n]*Darren|Darren[^\n]*Most to blame", output_text)),
    }


def main():
    gates = {}
    ok, detail = gate_tests()
    gates["G1_tests"] = {"pass": ok, "detail": detail}
    log(f"G1 {ok}")
    ok, detail = gate_encoding()
    gates["G4_encoding"] = {"pass": ok, "detail": detail}
    log(f"G4 {ok}")

    flows = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--proxy-bypass-list=*", "--no-proxy-server"])
        for width in WIDTHS:
            flows.append(run_flow(browser, width, shoot=width in (390, 1280, 1440)))
            log(f"flow {width} done")
        flows.append(run_flow(browser, 1280, shoot=True))
        log("flow 1280 done")

    errors = [e for f in flows if f["width"] in (390, 1280) for e in f["errors"]]
    gates["G2_no_errors"] = {"pass": not errors, "detail": errors[:5]}
    overflowing = [f"{f['width']}px: {f['scrollWidth']}" for f in flows if f["overflow"] and f["width"] in WIDTHS]
    gates["G3_no_overflow"] = {"pass": not overflowing, "detail": overflowing}
    main_flow = flows[-1]
    share_sum = sum(main_flow["shares"])
    gates["G5_verdict"] = {
        "pass": main_flow["darren_blamed"] and share_sum == 100 and len(main_flow["shares"]) == 5,
        "detail": {"darren_blamed": main_flow["darren_blamed"], "shares": main_flow["shares"], "sum": share_sum},
    }
    passed = sum(1 for g in gates.values() if g["pass"])
    summary = {"tag": TAG, "passed": passed, "total": len(gates), "gates": gates}
    (OUT / "gates.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(json.dumps(summary, indent=2))
    os._exit(0)


if __name__ == "__main__":
    main()
