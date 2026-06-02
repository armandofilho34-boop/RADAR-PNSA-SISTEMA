// Radar PNSA Service Worker - PWA Support
const CACHE_NAME = 'sgta-v20-fix';
const urlsToCache = [
    'index.html',
    'styles.css',
    'premium-design.css',
    'app_rev.js',
    'manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Delete ALL old caches on activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Ignorar requisições não-GET (como POSTs do Firebase)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Não cachear se a resposta não for válida ou se for cross-origin (opcional, dependendo do caso)
                if(!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request)) // Fallback to cache only if offline
    );
});
