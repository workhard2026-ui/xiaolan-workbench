const CACHE_NAME = 'xiaolan-v1';
const BASE = '/xiaolan-workbench';
const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/styles.css`,
  `${BASE}/script.js`,
  `${BASE}/manifest.json`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});