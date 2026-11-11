// Who Threw? service worker.
// 1. Keeps the app itself (page + scripts) available offline: network first, saved copy when the network fails or stalls.
// 2. Saves the screenshot reader (Tesseract.js from the CDN) the first time it is used, so later reads work offline.

const SHELL_CACHE = "whothrew-shell-v8";
const OCR_CACHE = "whothrew-ocr-v1";
const SHELL = ["./", "index.html", "scoring.js", "importer.js", "manifest.webmanifest", "icon.svg", "icon-192.png"];
const OCR_HOSTS = ["cdn.jsdelivr.net", "tessdata.projectnaptha.com"];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Other apps share this origin on GitHub Pages: only ever delete this app's own old caches.
    for (const name of await caches.keys()) {
      if (name.startsWith("whothrew-") && name !== SHELL_CACHE && name !== OCR_CACHE) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

// Screenshot reader files never change for a pinned version: saved copy first, network once.
async function ocrFile(request) {
  const cache = await caches.open(OCR_CACHE);
  const saved = await cache.match(request.url);
  if (saved) return saved;
  try {
    // A CORS fetch gives a readable response that can be stored and reused for scripts, workers and data alike.
    const response = await fetch(request.url, { mode: "cors", credentials: "omit" });
    if (response.ok) await cache.put(request.url, response.clone());
    return response;
  } catch {
    return fetch(request);
  }
}

async function shellFile(request) {
  const cache = await caches.open(SHELL_CACHE);
  const saved = (await cache.match(request, { ignoreSearch: true }))
    || (request.mode === "navigate" ? await cache.match("./") : undefined);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  if (!saved) return network;
  const stalled = new Promise((resolve) => setTimeout(() => resolve(saved), NETWORK_TIMEOUT_MS));
  return Promise.race([network.catch(() => saved), stalled]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (OCR_HOSTS.includes(url.hostname)) {
    event.respondWith(ocrFile(request));
  } else if (url.origin === self.location.origin && url.href.startsWith(self.registration.scope)) {
    event.respondWith(shellFile(request));
  }
});
