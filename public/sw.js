/**
 * Service Worker для offline поддержки
 */

// Обновляем версию кеша для принудительного обновления на localhost
const CACHE_VERSION = 'v3';
const CACHE_NAME = `interview-app-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `interview-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `interview-api-${CACHE_VERSION}`;

// Файлы для кеширования при установке
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vocabulary',
  '/manifest.json',
  '/favicon-16x16.svg',
  '/favicon-32x32.svg',
  '/apple-touch-icon.svg',
  '/android-chrome-192x192.svg',
  '/android-chrome-512x512.svg',
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Удаляем все старые кеши для принудительного обновления
      // Особенно важно для localhost, где может быть закеширована старая версия
      const deletePromises = cacheNames
        .filter(cacheName => {
          // Удаляем все кеши, которые не соответствуют текущей версии
          return !cacheName.includes(CACHE_VERSION);
        })
        .map(cacheName => {
          console.log('Удаление старого кеша:', cacheName);
          return caches.delete(cacheName);
        });
      return Promise.all(deletePromises);
    })
  );
  // Принудительно активируем новый service worker
  return self.clients.claim();
});

// Стратегия: Cache First для статики, Network First для API
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Статические ресурсы - Cache First
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then(response => {
        return (
          response ||
          fetch(request).then(fetchResponse => {
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return fetchResponse;
          })
        );
      })
    );
    return;
  }

  // API запросы - Network First с fallback на кеш
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Кешируем только успешные GET запросы
          if (request.method === 'GET' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, пытаемся получить из кеша
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Если нет в кеше, возвращаем offline ответ
            return new Response(JSON.stringify({ error: 'Offline: No cached data available' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // HTML страницы - Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Для остальных запросов - обычный fetch
  event.respondWith(fetch(request));
});
