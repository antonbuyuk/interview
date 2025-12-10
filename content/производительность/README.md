## Производительность

### 1. Bundle optimization стратегии?
**Ответ:** Оптимизация бандла направлена на уменьшение размера JavaScript файлов и улучшение времени загрузки. Основные техники включают tree shaking для удаления неиспользуемого кода, code splitting для разделения кода на части и загрузку их по требованию, а также правильную настройку chunking для выделения vendor библиотек в отдельные файлы. Это позволяет загружать только необходимый код, улучшая производительность приложения.

**Стратегии:**
- Tree shaking — удаление неиспользуемого кода
- Code splitting — разделение на части
- Chunking — выделение vendor библиотек

```javascript
// Tree shaking
import { debounce } from 'lodash-es' // только нужная функция
```

**Answer EN:** Bundle optimization aims to reduce JavaScript file size and improve load time. Main techniques include tree shaking for removing unused code, code splitting for dividing code into parts and loading on demand, and proper chunking configuration for separating vendor libraries into separate files. This allows loading only necessary code, improving application performance.

**Strategies:**
- Tree shaking — remove unused code
- Code splitting — divide into parts
- Chunking — separate vendor libraries

```javascript
// Tree shaking
import { debounce } from 'lodash-es' // only needed function
```

**Ответ Senior:**

**Tree Shaking:**
```javascript
// Использование named imports вместо default
import { debounce } from 'lodash-es'; // ✅ только нужная функция
import _ from 'lodash'; // ❌ весь пакет

// Side-effect free модули
// package.json
{
  "sideEffects": false // или массив файлов с side effects
}
```

**Code Splitting:**
```javascript
// Динамические импорты
const HeavyComponent = () => import('./HeavyComponent.vue');

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  }
];

// Component-based splitting
const LazyComponent = defineAsyncComponent(() =>
  import('./LazyComponent.vue')
);
```

**Chunking стратегии:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
```

### 2. Resource Hints: preload, prefetch, dns-prefetch?
**Ответ:** Resource hints — это HTML атрибуты и элементы, которые дают браузеру подсказки о том, какие ресурсы нужно загрузить заранее. `preload` используется для критически важных ресурсов, которые нужны сразу, `prefetch` — для ресурсов, которые понадобятся в будущем (например, следующая страница). `dns-prefetch` предварительно выполняет DNS-запрос для внешних доменов, уменьшая задержку при реальном запросе.

```html
<link rel="preload" href="/critical.css" as="style">
<link rel="prefetch" href="/next-page.html">
<link rel="dns-prefetch" href="https://api.example.com">
```

**Answer EN:** Resource hints are HTML attributes and elements that give browser hints about which resources to load in advance. `preload` is used for critical resources needed immediately, `prefetch` — for resources needed in future (e.g., next page). `dns-prefetch` pre-resolves DNS for external domains, reducing delay on actual request.

```html
<link rel="preload" href="/critical.css" as="style">
<link rel="prefetch" href="/next-page.html">
<link rel="dns-prefetch" href="https://api.example.com">
```

**Ответ Senior:**

**preload — критически важные ресурсы:**
```html
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/api/data.json" as="fetch" crossorigin>
```

**prefetch — ресурсы для следующей навигации:**
```html
<link rel="prefetch" href="/next-page.html">
<link rel="prefetch" href="/api/user-data.json">
```

**dns-prefetch — предварительное разрешение DNS:**
```html
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

**preconnect — установка соединения заранее:**
```html
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

### 3. Service Workers и PWA?
**Ответ:** Service Worker — скрипт, работающий в фоне для кэширования и offline функциональности. PWA (Progressive Web App) — веб-приложение, которое работает как нативное мобильное приложение.

**Требования PWA:**
- HTTPS
- Web App Manifest
- Service Worker
- Responsive design
- Иконки

```javascript
// Service Worker registration
navigator.serviceWorker.register('/sw.js')
```

**Answer EN:** Service Worker is a background script for caching and offline functionality. PWA (Progressive Web App) is a web application that works like a native mobile app.

**PWA requirements:**
- HTTPS
- Web App Manifest
- Service Worker
- Responsive design
- Icons

```javascript
// Service Worker registration
navigator.serviceWorker.register('/sw.js')
```

**Ответ Senior:**

**Что такое PWA:**
PWA — это веб-приложение, использующее современные веб-технологии для предоставления опыта, похожего на нативное приложение.

**Основные характеристики PWA:**
- ✅ Работает офлайн (благодаря Service Worker)
- ✅ Устанавливается на устройство (добавление на домашний экран)
- ✅ Быстрая загрузка (кэширование ресурсов)
- ✅ Адаптивный дизайн (работает на всех устройствах)
- ✅ Push-уведомления (на поддерживаемых платформах)

**Основные компоненты PWA:**

**1. Service Worker:**
```javascript
// service-worker.js
const CACHE_NAME = 'app-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Регистрация
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

**2. Web App Manifest:**
```json
// manifest.json
{
  "name": "My PWA App",
  "short_name": "PWA App",
  "description": "Описание приложения",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

**3. Подключение в HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#000000">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <link rel="apple-touch-icon" href="/icon-192.png">
</head>
<body>
  <!-- Контент приложения -->

  <script>
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => {
            console.log('SW registered:', reg);
          })
          .catch(err => {
            console.log('SW registration failed:', err);
          });
      });
    }

    // Обработка установки PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Показать кнопку "Установить"
    });

    // Установка PWA
    async function installPWA() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
      }
    }
  </script>
</body>
</html>
```

**Стратегии кэширования Service Worker:**

**1. Cache First (для статических ресурсов):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          const cache = caches.open(CACHE_NAME);
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      })
  );
});
```

**2. Network First (для API запросов):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cache = caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

**3. Stale While Revalidate (для часто обновляемого контента):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
```

**Преимущества PWA:**

1. **Не нужно публиковать в App Store/Google Play** — развертывание через веб
2. **Автоматические обновления** — без установки новой версии
3. **Меньше места на устройстве** — по сравнению с нативными приложениями
4. **Работает офлайн** — благодаря Service Worker
5. **Быстрая загрузка** — кэширование ресурсов
6. **Push-уведомления** — на поддерживаемых платформах
7. **Кроссплатформенность** — один код для всех платформ

**Когда использовать PWA:**

✅ **Используйте PWA когда:**
- Нужен опыт, похожий на нативное приложение
- Важна работа офлайн
- Нужно быстрое развертывание без магазинов приложений
- Для внутренних корпоративных приложений
- Для приложений с частым обновлением контента
- Когда нужна кроссплатформенность

❌ **Не используйте PWA когда:**
- Нужен полный доступ к системным API (камера, GPS с высокой точностью)
- Требуется сложная обработка файлов
- Нужны специфичные функции платформы (NFC, Bluetooth)
- Приложение требует публикации в магазинах для доверия пользователей

**Ограничения PWA:**

1. **Ограниченный доступ к системным API** — по сравнению с нативными приложениями
2. **Не все функции доступны на iOS** — Safari имеет ограничения
3. **Push-уведомления** — работают не везде одинаково
4. **Ограничения по размеру кэша** — браузеры ограничивают размер кэша
5. **Требуется HTTPS** — обязательно для работы Service Worker

**Практические примеры:**

**Пример 1: Простое PWA с офлайн режимом:**
```javascript
// service-worker.js
const CACHE_NAME = 'my-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша или загружаем из сети
        return response || fetch(event.request);
      })
  );
});

// Обновление кэша при новой версии
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Пример 2: PWA с фоновой синхронизацией:**
```javascript
// service-worker.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Синхронизация данных с сервером
  const requests = await getPendingRequests();
  for (const request of requests) {
    try {
      await fetch(request.url, request.options);
      await removePendingRequest(request.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

**Проверка PWA:**
- Chrome DevTools → Application → Manifest
- Chrome DevTools → Application → Service Workers
- Lighthouse — проверка PWA критериев
- Web App Manifest Validator

**Требования для PWA:**
1. ✅ HTTPS (обязательно)
2. ✅ Web App Manifest
3. ✅ Service Worker
4. ✅ Responsive design
5. ✅ Иконки (минимум 192x192 и 512x512)
6. ✅ Быстрая загрузка (< 3 секунды)
7. ✅ Работает офлайн

### 4. Web Workers для тяжелых вычислений?
**Ответ:** Web Workers — это механизм браузера для выполнения JavaScript кода в отдельном потоке, параллельно основному потоку выполнения. Позволяет выполнять тяжелые вычисления без блокировки UI.

```javascript
// main.js
const worker = new Worker('worker.js')
worker.postMessage({ data: largeArray })
worker.onmessage = (e) => console.log(e.data)
```

**Answer EN:** Web Workers is a browser mechanism for executing JavaScript code in a separate thread, parallel to main execution thread. Allows performing heavy calculations without blocking UI.

```javascript
// main.js
const worker = new Worker('worker.js')
worker.postMessage({ data: largeArray })
worker.onmessage = (e) => console.log(e.data)
```

**Ответ Senior:**

**Ответ Senior:**

**Основные концепции:**

**1. Отдельный поток выполнения:**
- Основной поток (UI thread) отвечает за рендеринг и взаимодействие с пользователем
- Web Worker работает в фоновом потоке и не блокирует UI
- Позволяет выполнять тяжелые вычисления без "замораживания" интерфейса

**2. Изоляция:**
- Worker не имеет доступа к DOM, `window`, `document`
- Общение происходит через `postMessage()` и `onmessage`
- Данные передаются копированием (structured cloning) или через Transferable Objects

**3. Типы Web Workers:**
- **Dedicated Worker** — связан с одним скриптом, создается через `new Worker()`
- **Shared Worker** — может использоваться несколькими скриптами/окнами
- **Service Worker** — для фоновых задач и кэширования (PWA)

**Базовое использование:**
```javascript
// worker.js - файл воркера
self.onmessage = function(e) {
  const { data } = e;

  // Тяжелые вычисления, которые не блокируют UI
  const result = heavyComputation(data);

  // Отправляем результат обратно
  self.postMessage(result);
};

// main.js - основной поток
const worker = new Worker('/worker.js');

// Отправляем данные воркеру
worker.postMessage({ numbers: [1, 2, 3, 4, 5] });

// Получаем результат
worker.onmessage = function(e) {
  console.log('Result:', e.data);
  worker.terminate(); // Завершаем воркер
};

worker.onerror = function(error) {
  console.error('Worker error:', error);
};
```

**Продвинутое использование с Transferable Objects:**
```javascript
// Передача больших данных без копирования (для ArrayBuffer, ImageBitmap)
const buffer = new ArrayBuffer(1024 * 1024 * 10); // 10MB

worker.postMessage(buffer, [buffer]); // buffer передается, а не копируется
// После передачи buffer в основном потоке становится пустым

// В worker.js
self.onmessage = function(e) {
  const buffer = e.data; // Получаем ArrayBuffer напрямую
  // Обработка данных
  self.postMessage({ processed: true }, [buffer]); // Возвращаем обратно
};
```

**Inline Workers (без отдельного файла):**
```javascript
// Создание воркера из строки кода
const workerCode = `
  self.onmessage = function(e) {
    const result = e.data.numbers.reduce((sum, num) => sum + num, 0);
    self.postMessage({ sum: result });
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

worker.postMessage({ numbers: [1, 2, 3, 4, 5] });
worker.onmessage = (e) => console.log(e.data.sum); // 15
```

**Использование в Vue/Nuxt:**
```typescript
// composables/useWorker.ts
import { ref, onUnmounted } from 'vue';

export function useWorker<T, R>(workerPath: string) {
  const result = ref<R | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  const worker = new Worker(workerPath);

  worker.onmessage = (e) => {
    result.value = e.data;
    loading.value = false;
  };

  worker.onerror = (e) => {
    error.value = e.error;
    loading.value = false;
  };

  const postMessage = (data: T) => {
    loading.value = true;
    worker.postMessage(data);
  };

  onUnmounted(() => {
    worker.terminate();
  });

  return {
    result,
    error,
    loading,
    postMessage
  };
}

// Использование в компоненте
const { result, loading, postMessage } = useWorker('/workers/calculator.js');
postMessage({ numbers: [1, 2, 3, 4, 5] });
```

**Когда использовать:**
- ✅ Обработка больших массивов данных
- ✅ Изображения/видео обработка (фильтры, ресайз)
- ✅ Криптографические операции
- ✅ Парсинг больших JSON файлов
- ✅ Сложные математические вычисления
- ✅ Анализ данных в реальном времени

**Ограничения:**
- ❌ Нет доступа к DOM (`document`, `window`)
- ❌ Ограниченный доступ к API браузера
- ❌ Не могут использовать некоторые глобальные объекты
- ❌ Данные передаются через сообщения (нельзя напрямую делиться памятью)
- ❌ Не могут использовать `localStorage` напрямую (только через `postMessage`)
- ❌ Ограничения с CORS (воркер должен быть на том же домене или с правильными CORS заголовками)

**Альтернативы для простых случаев:**
```javascript
// Для легких операций можно использовать requestIdleCallback
requestIdleCallback(() => {
  // Код выполнится в свободное время браузера
  processData();
});

// Или разбить на части через setTimeout
function processChunk(data, index, chunkSize) {
  const chunk = data.slice(index, index + chunkSize);
  process(chunk);

  if (index + chunkSize < data.length) {
    setTimeout(() => processChunk(data, index + chunkSize, chunkSize), 0);
  }
}
```

---

