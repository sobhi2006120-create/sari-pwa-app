const CACHE_NAME = 'sari-app-v2.0.0';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://i.imgur.com/kP5l1xN.png',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap'
];

// Install: pre-cache core shell
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                // Use individual addAll-style with fail-tolerant caching
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(function(url) {
                        return cache.add(url).catch(function(err) {
                            console.warn('Failed to cache:', url, err);
                        });
                    })
                );
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch: network-first for the xlsx/Excel data, cache-first for static assets
self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);

    // Never cache Google Sheets xlsx exports (always fetch fresh)
    if (url.hostname.includes('docs.google.com')) {
        return event.respondWith(fetch(event.request));
    }

    // Cache-first for everything else
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return fetch(event.request)
                .then(function(response) {
                    // Cache successful same-origin GET responses
                    if (response && response.status === 200 && (event.request.method === 'GET')) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone).catch(function(){});
                        });
                    }
                    return response;
                })
                .catch(function() {
                    return cached || Response.error();
                });
        })
    );
});
