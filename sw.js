// Verix service worker: офлайн-режим и быстрая загрузка
const VERSION = 'verix-v3';
const SHELL = [
  './', 'index.html', 'css/styles.css', 'js/app.js', 'js/fx.js', 'js/edupath.js', 'js/game.js', 'js/enhance.js',
  'data/opportunities.json',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match('index.html'));
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/api/')) return; // AI-запросы не кэшируем
  // Код и данные — сначала из сети (чтобы HTML и JS всегда были одной версии), кэш — только офлайн
  if (req.mode === 'navigate' || (url.origin === location.origin && /\.(js|css|json|webmanifest)$/.test(url.pathname))) {
    return event.respondWith(networkFirst(req));
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
  }
});
