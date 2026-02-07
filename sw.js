const CACHE_NAME = 'sari-app-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://i.imgur.com/kP5l1xN.png',
    'https://z-cdn-media.chatglm.cn/files/ae100c82-f676-4e6d-a92c-2f6278266f42_Gemini_Generated_Image_owphmtowphmtowph.png?auth_key=1788950472-8e1b976324a34bf5a3ec02662e80341f-0-5fe38c1ef32e2ec4b7dd847623e5674e'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// التعامل مع الطلبات
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // إذا كان في الكاش، استخدمه
                if (response) {
                    return response;
                }
                
                // إذا لم يكن في الكاش، اجلب من الشبكة
                return fetch(event.request).then(function(response) {
                    // تحقق إذا كان الرد صالحاً
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // أضف الرد إلى الكاش
                    var responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

// مزامنة البيانات عند العودة للإنترنت
self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

function syncData() {
    // هنا يمكنك إضافة كود لمزامنة البيانات
    console.log('Syncing data...');
    return Promise.resolve();
}