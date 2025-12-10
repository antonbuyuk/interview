## Nuxt.js

### 1. Что такое Nuxt.js и его основные возможности?
**Ответ:** Nuxt.js — фреймворк на основе Vue.js для создания универсальных веб-приложений с SSR, SSG и SPA режимами.

**Answer EN:** Nuxt.js is a framework built on top of Vue.js for creating universal web applications with SSR, SSG, and SPA modes.

**Ответ Senior:**

**Основные возможности:**
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ Single Page Application (SPA)
- ✅ Автоматический code splitting
- ✅ Auto-imports компонентов и composables
- ✅ File-based routing
- ✅ Server routes (API routes)
- ✅ Middleware для аутентификации и логики
- ✅ Плагины для расширения функциональности
- ✅ SEO оптимизация из коробки

**Режимы работы:**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,  // SSR режим (по умолчанию)
  // ssr: false, // SPA режим
  // nitro: { prerender: { routes: ['/'] } } // SSG режим
});
```

### 2. Что такое SSR и SSG? Разница и когда использовать?
**Ответ:** SSR и SSG — разные стратегии рендеринга приложений.

**Answer EN:** SSR and SSG are different rendering strategies for applications.

**Ответ Senior:**

**SSR (Server-Side Rendering):**
- Рендеринг HTML на сервере при каждом запросе
- Контент всегда актуальный
- Требует Node.js сервер
- Медленнее для статического контента

**SSG (Static Site Generation):**
- Предварительный рендеринг на этапе сборки
- Генерирует статические HTML файлы
- Быстрая загрузка (CDN)
- Контент фиксирован на момент сборки

**ISR (Incremental Static Regeneration) — гибридный подход:**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true, // Автоматически находит все ссылки
      interval: 3600 // Регенерация каждые 3600 секунд
    }
  }
});
```

**Когда использовать SSR:**
- Контент часто меняется
- Нужна персонализация для каждого пользователя
- Динамические данные из БД
- SEO важно, но контент персональный

**Когда использовать SSG:**
- Статический контент (блог, документация)
- Максимальная производительность
- Хостинг на CDN
- Контент редко меняется

**Примеры:**
```vue
<!-- SSR: данные загружаются на сервере при каждом запросе -->
<script setup>
const { data } = await useFetch('/api/posts');
</script>

<!-- SSG: данные загружаются на этапе сборки -->
<script setup>
const { data } = await useFetch('/api/posts', {
  server: false // Только на клиенте
});
</script>
```

### 3. Разница между `useFetch` и `useAsyncData`?
**Ответ:** `useFetch` — упрощенный composable специально для API запросов, который автоматически парсит JSON и обрабатывает ошибки. `useAsyncData` — более универсальный инструмент для любых асинхронных операций, требующий указания ключа для кэширования и функции-обертки. Выбирайте `useFetch` для простых HTTP запросов, а `useAsyncData` — когда нужна гибкость или работа с не-HTTP операциями.

```javascript
// useFetch - для API запросов
const { data } = await useFetch('/api/users')

// useAsyncData - для любых асинхронных операций
const { data } = await useAsyncData('users', () => fetchUsers())
```

**Answer EN:** `useFetch` is a simplified composable specifically for API requests that automatically parses JSON and handles errors. `useAsyncData` is a more universal tool for any asynchronous operations, requiring a key for caching and a wrapper function. Choose `useFetch` for simple HTTP requests, and `useAsyncData` when you need flexibility or work with non-HTTP operations.

```javascript
// useFetch - for API requests
const { data } = await useFetch('/api/users')

// useAsyncData - for any async operations
const { data } = await useAsyncData('users', () => fetchUsers())
```

**Ответ Senior:**

**useFetch — для API запросов:**
```vue
<script setup>
// Автоматически парсит JSON, обрабатывает ошибки
const { data, pending, error, refresh } = await useFetch('/api/users');

// С опциями
const { data: posts } = await useFetch('/api/posts', {
  method: 'POST',
  body: { userId: 1 },
  headers: { 'Authorization': 'Bearer token' },
  query: { page: 1 },
  lazy: true, // Не блокирует рендеринг
  server: true, // Выполняется на сервере
  default: () => [], // Значение по умолчанию
  transform: (data) => data.items, // Трансформация данных
  watch: [userId], // Перезагрузка при изменении
  immediate: true // Загрузить сразу
});
</script>
```

**useAsyncData — для любых асинхронных операций:**
```vue
<script setup>
// Более гибкий, для любых async операций
const { data, pending, error, refresh } = await useAsyncData(
  'users', // Уникальный ключ для кэширования
  () => $fetch('/api/users'),
  {
    server: true,
    default: () => [],
    transform: (data) => data.items
  }
);

// Можно использовать с любыми Promise
const { data: result } = await useAsyncData(
  'computation',
  async () => {
    // Любая асинхронная операция
    const data = await fetchData();
    const processed = await processData(data);
    return processed;
  }
);

// С внешними библиотеками
const { data: fileContent } = await useAsyncData(
  'file',
  () => fs.promises.readFile('file.txt', 'utf-8')
);
</script>
```

**Ключевые различия:**

| Характеристика | `useFetch` | `useAsyncData` |
|----------------|------------|----------------|
| Назначение | API запросы | Любые async операции |
| URL | Прямо в первом параметре | В функции |
| Ключ кэша | Автоматический (URL) | Указывается вручную |
| Парсинг JSON | Автоматический | Вручную |
| Гибкость | Меньше | Больше |

**Практические примеры:**

**useFetch для простых API запросов:**
```vue
<script setup>
// Простой GET запрос
const { data: users } = await useFetch('/api/users');

// POST запрос
const { data: newUser } = await useFetch('/api/users', {
  method: 'POST',
  body: { name: 'John', email: 'john@example.com' }
});

// С query параметрами
const { data: posts } = await useFetch('/api/posts', {
  query: { page: 1, limit: 10 }
});
</script>
```

**useAsyncData для сложной логики:**
```vue
<script setup>
// Комплексная логика загрузки данных
const { data: dashboard } = await useAsyncData(
  'dashboard',
  async () => {
    const [users, posts, stats] = await Promise.all([
      $fetch('/api/users'),
      $fetch('/api/posts'),
      $fetch('/api/stats')
    ]);

    return {
      users,
      posts,
      stats,
      total: users.length + posts.length
    };
  }
);
</script>
```

### 4. Что такое middleware в Nuxt?
**Ответ:** Middleware — функции, выполняемые перед рендерингом страницы или компонента.

```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  if (!isAuthenticated()) {
    return navigateTo('/login')
  }
})
```

**Answer EN:** Middleware are functions executed before rendering a page or component.

```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  if (!isAuthenticated()) {
    return navigateTo('/login')
  }
})
```

**Ответ Senior:**

**Типы middleware:**

**1. Route Middleware (для страниц):**
```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser();

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});

// Использование в странице
// pages/dashboard.vue
<script setup>
definePageMeta({
  middleware: 'auth'
});
</script>
```

**2. Global Middleware:**
```javascript
// middleware/global.js (добавляется .global в имя файла)
export default defineNuxtRouteMiddleware((to, from) => {
  // Выполняется на каждой странице
  console.log('Global middleware');
});
```

**3. Inline Middleware:**
```vue
<!-- pages/profile.vue -->
<script setup>
definePageMeta({
  middleware: (to, from) => {
    // Inline middleware
    if (!isAuthenticated()) {
      return navigateTo('/login');
    }
  }
});
</script>
```

**Практические примеры:**

**Аутентификация:**
```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  const { $auth } = useNuxtApp();

  if (!$auth.loggedIn) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }
});
```

**Проверка ролей:**
```javascript
// middleware/admin.js
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser();

  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    });
  }
});
```

**Логирование:**
```javascript
// middleware/analytics.global.js
export default defineNuxtRouteMiddleware((to, from) => {
  // Отправка аналитики
  if (process.client) {
    $fetch('/api/analytics', {
      method: 'POST',
      body: {
        path: to.path,
        timestamp: Date.now()
      }
    });
  }
});
```

**Порядок выполнения:**
1. Global middleware
2. Layout middleware
3. Page middleware

### 5. Auto-imports в Nuxt?
**Ответ:** Nuxt автоматически импортирует компоненты, composables и утилиты без явного `import`.

```javascript
// Не нужно: import { ref } from 'vue'
const count = ref(0)

// Не нужно: import MyComponent from '@/components/MyComponent.vue'
<MyComponent />
```

**Answer EN:** Nuxt automatically imports components, composables and utilities without explicit `import`.

```javascript
// No need: import { ref } from 'vue'
const count = ref(0)

// No need: import MyComponent from '@/components/MyComponent.vue'
<MyComponent />
```

**Ответ Senior:**

**Что импортируется автоматически:**

**1. Компоненты:**
```vue
<!-- Компоненты из components/ автоматически доступны -->
<template>
  <!-- Не нужно импортировать -->
  <UserCard :user="user" />
  <Button @click="handleClick">Click</button>
</template>

<!-- Nuxt ищет компоненты в:
- components/
- node_modules/@nuxt/ui/src/runtime/components/
-->
```

**2. Composables:**
```vue
<script setup>
// Все composables из composables/ доступны автоматически
const user = useUser();
const { data } = useFetch('/api/data');

// Nuxt composables тоже доступны
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
</script>
```

**3. Утилиты:**
```javascript
// Утилиты из utils/ доступны автоматически
const formattedDate = formatDate(new Date());
const debouncedFn = debounce(() => {}, 300);
```

**Настройка auto-imports:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: [
    {
      path: '~/components',
      pathPrefix: false, // Не требовать префиксы
    }
  ],

  imports: {
    dirs: [
      'composables',
      'composables/**',
      'utils'
    ]
  }
});
```

**Именование компонентов:**
```bash
components/
  UserCard.vue          # <UserCard />
  user/
    Profile.vue        # <UserProfile />
    Settings.vue       # <UserSettings />
  admin/
    Dashboard.vue      # <AdminDashboard />
```

**Отключение auto-import:**
```vue
<script setup>
// Если нужно явно импортировать
import { UserCard } from '@/components/UserCard.vue';
</script>
```

### 6. Что такое plugins в Nuxt?
**Ответ:** Plugins — функции, выполняемые при инициализации приложения для расширения функциональности.

```javascript
// plugins/my-plugin.client.js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('myPlugin', () => {
    // plugin logic
  })
})
```

**Answer EN:** Plugins are functions executed during app initialization to extend functionality.

```javascript
// plugins/my-plugin.client.js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('myPlugin', () => {
    // plugin logic
  })
})
```

**Ответ Senior:**

**Типы plugins:**

**1. Client-side plugins:**
```javascript
// plugins/analytics.client.js
export default defineNuxtPlugin((nuxtApp) => {
  // Выполняется только на клиенте
  nuxtApp.provide('analytics', {
    track(event, data) {
      console.log('Track:', event, data);
    }
  });
});

// Использование
const { $analytics } = useNuxtApp();
$analytics.track('page_view');
```

**2. Server-side plugins:**
```javascript
// plugins/database.server.ts
import { createConnection } from './db';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Выполняется только на сервере
  const db = await createConnection();

  nuxtApp.provide('db', db);
});
```

**3. Universal plugins:**
```javascript
// plugins/i18n.js (без .client или .server)
export default defineNuxtPlugin((nuxtApp) => {
  // Выполняется и на сервере, и на клиенте
  const i18n = createI18n();

  nuxtApp.vueApp.use(i18n);
});
```

**Порядок выполнения:**
```javascript
// plugins/1.first.js - выполнится первым
// plugins/2.second.js - выполнится вторым
// plugins/third.js - выполнится последним
```

**Практические примеры:**

**Инициализация библиотек:**
```javascript
// plugins/vue-toastification.client.js
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'top-right',
    timeout: 3000
  });
});
```

**Глобальные свойства:**
```javascript
// plugins/currency.js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('formatCurrency', (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  });
});

// Использование
const { $formatCurrency } = useNuxtApp();
const price = $formatCurrency(1000); // 1 000 ₽
```

### 7. Что такое layouts в Nuxt?
**Ответ:** Layouts — обертки для страниц, позволяющие переиспользовать общую структуру.

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <slot />
    <Footer />
  </div>
</template>
```

**Answer EN:** Layouts are wrappers for pages that allow reusing common structure.

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <slot />
    <Footer />
  </div>
</template>
```

**Ответ Senior:**

**Использование layouts:**
```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <main>
      <slot /> <!-- Контент страницы -->
    </main>
    <Footer />
  </div>
</template>

<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-content">
      <slot />
    </div>
  </div>
</template>
```

**Применение layout на странице:**
```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  layout: 'admin'
});
</script>

<template>
  <div>Dashboard content</div>
</template>
```

**Динамический layout:**
```vue
<script setup>
const route = useRoute();
const layout = computed(() => route.meta.layout || 'default');
</script>

<template>
  <NuxtLayout :name="layout">
    <NuxtPage />
  </NuxtLayout>
</template>
```

### 8. Что такое server routes (API routes) в Nuxt?
**Ответ:** Server routes — API endpoints, выполняющиеся на сервере Nuxt.

```javascript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  return await fetchUsers()
})
```

**Answer EN:** Server routes are API endpoints that run on the Nuxt server.

```javascript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  return await fetchUsers()
})
```

**Ответ Senior:**

**Создание API routes:**
```typescript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  const users = await getUsersFromDB();
  return users;
});

// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await getUserFromDB(id);
  return user;
});

// server/api/users/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const newUser = await createUser(body);
  return newUser;
});
```

**Использование в компонентах:**
```vue
<script setup>
// Автоматически доступен на /api/users
const { data: users } = await useFetch('/api/users');
</script>
```

**Обработка ошибок:**
```typescript
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required'
    });
  }

  const user = await getUserFromDB(id);

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    });
  }

  return user;
});
```

### 9. Что такое composables в Nuxt?
**Ответ:** Composables — переиспользуемые функции с состоянием, автоматически импортируемые.

```javascript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('user', () => null)
  return { user }
}
```

**Answer EN:** Composables are reusable functions with state, automatically imported.

```javascript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('user', () => null)
  return { user }
}
```

**Ответ Senior:**

**Создание composable:**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('user', () => null);
  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    user.value = response.user;
  };

  const logout = () => {
    user.value = null;
    navigateTo('/login');
  };

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout
  };
};
```

**Использование:**
```vue
<script setup>
// Автоматически импортируется
const { user, isAuthenticated, login, logout } = useAuth();
</script>
```

### 10. Что такое useState и useCookie?
**Ответ:** Reactivity утилиты для управления состоянием в Nuxt. `useState` — для реактивного состояния, `useCookie` — для работы с cookies.

```javascript
const count = useState('count', () => 0)
const token = useCookie('token')
```

**Answer EN:** Reactivity utilities for state management in Nuxt. `useState` — for reactive state, `useCookie` — for working with cookies.

```javascript
const count = useState('count', () => 0)
const token = useCookie('token')
```

**Ответ Senior:**

**useState — реактивное состояние:**
```vue
<script setup>
// Состояние, сохраняемое между сервером и клиентом
const count = useState('counter', () => 0);

// С начальным значением
const user = useState('user', () => ({ name: 'Guest' }));

// Использование
count.value++;
</script>
```

**useCookie — работа с cookies:**
```vue
<script setup>
const token = useCookie('auth-token', {
  maxAge: 60 * 60 * 24 * 7, // 7 дней
  secure: true,
  sameSite: 'strict'
});

// Установка
token.value = 'abc123';

// Чтение
console.log(token.value);
</script>
```

### 11. Что такое error handling в Nuxt?
**Ответ:** Обработка ошибок в Nuxt осуществляется через специальные страницы ошибок (error.vue) и встроенные composables. `createError` позволяет создавать структурированные ошибки, `clearError` — очищать ошибки.

```javascript
throw createError({ statusCode: 404, message: 'Not found' })
```

**Answer EN:** Error handling in Nuxt is done through special error pages (error.vue) and built-in composables. `createError` allows creating structured errors, `clearError` clears errors.

```javascript
throw createError({ statusCode: 404, message: 'Not found' })
```

**Ответ Senior:**

**Error pages:**
```vue
<!-- error.vue -->
<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">Go Home</button>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
});

const handleError = () => clearError({ redirect: '/' });
</script>
```

**Обработка ошибок в composables:**
```vue
<script setup>
try {
  const { data } = await useFetch('/api/data');
} catch (error) {
  throw createError({
    statusCode: 500,
    message: 'Failed to load data'
  });
}
</script>
```

### 12. Что такое hydration в Nuxt?
**Ответ:** Hydration — процесс "оживления" статического HTML на клиенте, когда Vue берет на себя управление статически отрендеренным HTML.

```javascript
// SSR рендерит HTML на сервере
// Hydration "оживляет" его на клиенте
```

**Answer EN:** Hydration is the process of "bringing to life" static HTML on the client, when Vue takes over statically rendered HTML.

```javascript
// SSR renders HTML on server
// Hydration "brings it to life" on client
```

**Ответ Senior:**

**Как работает:**
1. Сервер рендерит HTML
2. HTML отправляется клиенту
3. Vue "оживляет" статический HTML
4. Добавляется реактивность и интерактивность

**Проблемы hydration:**
```vue
<!-- ❌ Плохо: разный контент на сервере и клиенте -->
<template>
  <div>{{ new Date().toString() }}</div>
</template>

<!-- ✅ Хорошо: используйте ClientOnly -->
<template>
  <ClientOnly>
    <div>{{ new Date().toString() }}</div>
  </ClientOnly>
</template>
```

### 13. Оптимизация производительности в Nuxt?
**Ответ:** Оптимизация производительности в Nuxt включает: автоматический code splitting, lazy loading компонентов, использование `NuxtImg` и `NuxtLink`, настройку routeRules для кэширования.

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 }
  }
})
```

**Answer EN:** Performance optimization in Nuxt includes: automatic code splitting, lazy loading components, using `NuxtImg` and `NuxtLink`, configuring routeRules for caching.

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 }
  }
})
```

**Ответ Senior:**

**1. Code Splitting:**
```javascript
// Автоматический code splitting по маршрутам
// Каждая страница — отдельный chunk
```

**2. Lazy Loading компонентов:**
```vue
<script setup>
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
</script>
```

**3. Prefetching:**
```vue
<template>
  <NuxtLink to="/about" prefetch>About</NuxtLink>
</template>
```

**4. Image optimization:**
```vue
<template>
  <NuxtImg src="/image.jpg" loading="lazy" />
</template>
```

**5. Кэширование:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 }
  }
});
```

---

