// Service-Worker für das ETF-Cockpit.
// Bei einer neuen Version von index.html: VERSION hochzählen (z. B. 'v2').
const VERSION = 'v12';
const CACHE = 'etf-cockpit-' + VERSION;
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('etf-cockpit-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Eigene Dateien: erst Netz (damit Updates ankommen), ohne Netz aus dem Zwischenspeicher.
// Fremde Anfragen (Yahoo, Proxy) laufen unverändert am Service-Worker vorbei.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
