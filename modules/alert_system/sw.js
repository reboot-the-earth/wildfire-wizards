const CACHE_NAME = 'wildfirewizards-v1';
const PLAN_ASSETS = ['/','/plan.css','/plan.js','/offline.html'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PLAN_ASSETS))); });
self.addEventListener('fetch', event => { event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match('/offline.html')))); });
