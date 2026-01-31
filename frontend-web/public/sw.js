// Service Worker для автоматического обновления кеша
// Версия будет обновляться автоматически при сборке через Vite
const CACHE_VERSION = '__BUILD_ID__'; // Заменяется при сборке
const CACHE_NAME = 'messager-cache-' + CACHE_VERSION;

// При установке нового Service Worker - очистить старый кеш
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  self.skipWaiting(); // Активировать новый SW сразу
});

// При активации - удалить старые кеши
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Забрать контроль над всеми клиентами
      return self.clients.claim();
    })
  );
});

// При fetch - проверять обновления для index.html
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Для index.html и корня - всегда запрашивать с сервера
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).then((response) => {
        // Проверить, изменился ли JS файл
        return response.text().then((html) => {
          const jsMatch = html.match(/src="\/assets\/index-([^"]+)\.js"/);
          const currentJsHash = jsMatch ? jsMatch[1] : null;
          
          // Сохранить хеш в кеше
          if (currentJsHash) {
            caches.open('js-version').then((cache) => {
              cache.put('current-js-hash', new Response(currentJsHash));
            });
          }
          
          return new Response(html, {
            headers: response.headers
          });
        });
      }).catch(() => {
        // Если offline - показать сообщение
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }
  
  // Для JS/CSS файлов с хешем - кешировать навсегда
  if (url.pathname.match(/\/assets\/.*-[a-zA-Z0-9]+\.(js|css)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }
  
  // Для остальных запросов - обычная стратегия network-first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Уведомить клиентов об обновлении
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
