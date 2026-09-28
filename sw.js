/* Weather Dashboard service worker (generated at build time from pwa/service-worker.template.js).
 *
 * What it caches — and what it deliberately does not:
 *   • App shell (the page, hashed JS/CSS, fonts, icons, manifest): precached.
 *       – Page navigations: network-first, so an online user always gets the
 *         latest deployment; the cached shell is used only when offline.
 *       – Hashed static assets: cache-first (their names change on every build).
 *   • Weather, air-quality and place-search APIs, and map tiles: NOT handled
 *     here at all (network-only). The service worker never stores weather, so
 *     it can never make forecasts stale; when offline, the app shows its own
 *     last-received snapshot, clearly labelled "Last available".
 */
const VERSION = 'f87901fea4a3';
const PRECACHE = [
  "./",
  "assets/poppins-latin-400-normal-cpxAROuN.woff2",
  "assets/poppins-latin-500-normal-C8OXljZJ.woff2",
  "assets/poppins-latin-600-normal-zEkxB9Mr.woff2",
  "assets/poppins-latin-700-normal-Qrb0O0WB.woff2",
  "assets/index-WR2MdSph.css",
  "assets/index-DHYyhGzV.js",
  "favicon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon.svg",
  "manifest.webmanifest"
];
const CACHE = `weather-shell-${VERSION}`;
const SCOPE = self.registration.scope; // e.g. https://user.github.io/weather-dashboard/
const toUrl = (path) => new URL(path, SCOPE).href;
const SHELL_URL = toUrl('./');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map(toUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('weather-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Anything outside this app (APIs, map tiles) goes straight to the network.
  if (url.origin !== self.location.origin || !request.url.startsWith(SCOPE)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(SHELL_URL, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(SHELL_URL)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
