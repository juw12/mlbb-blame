"""Offline check (needs the internet once): the app shell and the screenshot reader work with the network cut.

python hone/offline.py
  1. Serves the app on http://localhost (a service worker does not run from file://).
  2. Online: loads the page, reads the test screenshot once so sw.js saves the reader files.
  3. Restarts the browser with a dead proxy (nothing outside localhost is reachable) AND offline mode,
     reloads the page and reads the screenshot again. Exits non-zero on any failure.
"""
import functools
import http.server
import os
import shutil
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

APP = Path(__file__).resolve().parent.parent
SHOT = APP / "hone" / "shots" / "e2e_scoreboard.png"
failures = []
# The CDN that hosts the screenshot reader is only reachable through the office proxy on this PC.
# Set HONE_PROXY="" on a network with direct internet. file:// and localhost never use the proxy.
PROXY = os.environ.get("HONE_PROXY", "http://proxy8.intra:80")
NETWORK_ARGS = [f"--proxy-server={PROXY}"] if PROXY else ["--no-proxy-server"]


def step(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}", flush=True)
    if not ok:
        failures.append(name)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def read_screenshot(page):
    page.click("#importBox summary")
    page.set_input_files("#importImage", str(SHOT))
    try:
        page.wait_for_function(
            "() => /Filled|Couldn't|offline/.test(document.getElementById('importStatus').textContent)",
            timeout=110000,
        )
    except Exception:
        pass
    status = page.inner_text("#importStatus")
    names = page.eval_on_selector_all("[data-f=name]", "els => els.map(e => e.value)")
    return status, names


SAVED_FILES = """async () => {
  const cache = await caches.open("whothrew-ocr-v1");
  const rows = [];
  for (const request of await cache.keys()) {
    const body = await (await cache.match(request)).blob();
    rows.push([request.url, body.size]);
  }
  return rows;
}"""

server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(APP)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://localhost:{server.server_address[1]}/index.html"
profile = tempfile.mkdtemp(prefix="whothrew-offline-")

with sync_playwright() as p:
    # --- online: first visit and first read -------------------------------------------------
    context = p.chromium.launch_persistent_context(profile, args=NETWORK_ARGS, viewport={"width": 390, "height": 800})
    page = context.new_page()
    page.goto(url)
    page.wait_for_function("() => navigator.serviceWorker && navigator.serviceWorker.controller", timeout=15000)
    step("service worker controls the page", True)
    status, names = read_screenshot(page)
    step("online: screenshot read fills players", status.startswith("Filled") and names[3] == "Darren", status[:60])
    page.wait_for_timeout(1500)
    saved = page.evaluate(SAVED_FILES)
    total = sum(size for _, size in saved)
    for saved_url, size in saved:
        print(f"      saved {size / 1e6:6.2f} MB  {saved_url}", flush=True)
    note = page.inner_text("#ocrOffline")
    step("reader files are saved on the device", len(saved) >= 4 and "works without internet" in note,
         f"{len(saved)} files, {total / 1e6:.1f} MB | {note}")
    context.close()

    # --- offline: dead proxy + offline mode, same browser profile ----------------------------
    context = p.chromium.launch_persistent_context(
        profile,
        args=["--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"],
        viewport={"width": 390, "height": 800},
    )
    context.set_offline(True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    try:
        page.goto(url, timeout=20000)
        loaded = page.locator("#analyze").count() == 1
    except Exception as exc:
        loaded = False
        errors.append(str(exc)[:120])
    step("offline: the app opens from the saved copy", loaded, "; ".join(errors[:2]))
    if loaded:
        page.click("#demo")
        page.click("#analyze")
        page.wait_for_timeout(400)
        step("offline: analysis works", "most to blame: Darren" in page.inner_text(".banner"))
        page.click("#clear")
        status, names = read_screenshot(page)
        step("offline: screenshot read fills players", status.startswith("Filled") and names[3] == "Darren",
             f"{status[:70]} | {names}")
        step("offline: no page errors", not errors, "; ".join(errors[:2]))
    context.close()

server.shutdown()
shutil.rmtree(profile, ignore_errors=True)
print("OFFLINE", "OK" if not failures else f"FAILED: {failures}", flush=True)
os._exit(1 if failures else 0)
