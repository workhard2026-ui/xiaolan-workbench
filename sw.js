const CACHE_NAME = 'xiaolan-v2';
const BASE = '/xiaolan-workbench';

// 离线优先：先缓存，再尝试更新
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 只缓存同源请求
  if (!e.request.url.startsWith(self.location.origin) && !e.request.url.startsWith('https://workhard2026-ui.github.io')) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(e.request).then(response => {
        // 网络成功：缓存并返回
        if (response.ok) {
          cache.put(e.request, response.clone());
        }
        return response;
      }).catch(() =>
        // 网络失败：返回缓存版本（离线可用）
        cache.match(e.request)
      )
    )
  );
});