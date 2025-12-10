## Микрофронтенды

### 1. Что такое микрофронтенды?
**Ответ:** Архитектурный подход, при котором фронтенд-приложение разбивается на независимые, автономные приложения (микрофронтенды), которые могут разрабатываться, тестироваться и развертываться отдельно.

**Ключевые принципы:**
- Независимость команд и технологий
- Автономность развертывания
- Изоляция кода и стилей
- Единый пользовательский интерфейс

```javascript
// Каждый микрофронтенд - отдельное приложение
// Host app объединяет их
```

**Answer EN:** Architectural approach where frontend application is split into independent, autonomous applications (microfrontends) that can be developed, tested and deployed separately.

**Key principles:**
- Team and technology independence
- Autonomous deployment
- Code and style isolation
- Unified user interface

```javascript
// Each microfrontend is a separate application
// Host app combines them
```

**Ответ Senior:**

**Ключевые принципы:**
- Независимость команд и технологий
- Автономность развертывания
- Изоляция кода и стилей
- Единый пользовательский интерфейс

### 2. Преимущества и недостатки микрофронтендов?
**Ответ:** Микрофронтенды имеют преимущества: независимая разработка и развертывание, масштабируемость команд, технологическая гибкость. Недостатки: увеличенная сложность архитектуры, дублирование зависимостей, проблемы с версионированием, сложность отладки.

**Преимущества:**
- Независимая разработка и развертывание
- Масштабируемость команд
- Технологическая гибкость

**Недостатки:**
- Увеличенная сложность
- Дублирование зависимостей
- Сложность отладки

**Answer EN:** Microfrontends have advantages: independent development and deployment, team scalability, technology flexibility. Disadvantages: increased architecture complexity, dependency duplication, versioning issues, debugging complexity.

**Advantages:**
- Independent development and deployment
- Team scalability
- Technology flexibility

**Disadvantages:**
- Increased complexity
- Dependency duplication
- Debugging complexity

**Ответ Senior:**

**Преимущества:**
- Независимая разработка и развертывание
- Масштабируемость команд
- Технологическая гибкость (разные фреймворки)
- Изоляция ошибок (падение одного микрофронтенда не ломает все приложение)
- Переиспользование кода между командами

**Недостатки:**
- Увеличенная сложность архитектуры
- Дублирование зависимостей
- Проблемы с версионированием общих библиотек
- Сложность отладки и мониторинга
- Увеличенный размер бандла
- Проблемы с SEO (для некоторых подходов)

### 3. Основные подходы к реализации микрофронтендов?
**Ответ:** Основные подходы: Module Federation (Webpack 5) для обмена модулями, Single-SPA как мета-фреймворк, qiankun на основе Single-SPA, iframe для простой изоляции, Web Components для нативной изоляции.

**Подходы:**
- Module Federation — обмен модулями
- Single-SPA — мета-фреймворк
- qiankun — решение на основе Single-SPA
- iframe — простая изоляция
- Web Components — нативная изоляция

**Answer EN:** Main approaches: Module Federation (Webpack 5) for module sharing, Single-SPA as meta-framework, qiankun based on Single-SPA, iframe for simple isolation, Web Components for native isolation.

**Approaches:**
- Module Federation — module sharing
- Single-SPA — meta-framework
- qiankun — solution based on Single-SPA
- iframe — simple isolation
- Web Components — native isolation

**Ответ Senior:**

**1. Module Federation (Webpack 5)**
- Обмен модулями между приложениями во время выполнения
- Динамическая загрузка удаленных модулей
- Поддержка разных версий зависимостей

**2. Single-SPA**
- Мета-фреймворк для объединения нескольких SPA
- Роутинг на уровне приложения
- Поддержка разных фреймворков

**3. qiankun (Alibaba)**
- Решение на основе Single-SPA
- Изоляция стилей через Shadow DOM
- Простота интеграции

**4. iframe**
- Простая изоляция через iframe
- Проблемы с производительностью и UX
- Сложности с коммуникацией

**5. Web Components**
- Нативные веб-стандарты
- Полная изоляция стилей и логики
- Хорошая поддержка браузерами

### 4. Что такое Module Federation?
**Ответ:** Module Federation — это функция Webpack 5, которая позволяет одному приложению динамически загружать и использовать модули из другого приложения во время выполнения без сборки. Это решает проблему интеграции микрофронтендов, позволяя им обмениваться компонентами, утилитами и другими модулями. Host приложение определяет, какие модули оно экспортирует, а Remote приложения могут потреблять эти модули, создавая слабо связанную архитектуру.

```javascript
// webpack.config.js
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote: 'remote@http://localhost:3001/remoteEntry.js'
  }
})
```

**Answer EN:** Module Federation is a Webpack 5 feature that allows one application to dynamically load and use modules from another application at runtime without building. This solves microfrontend integration problem, allowing them to share components, utilities and other modules. Host application defines which modules it exports, and Remote applications can consume these modules, creating loosely coupled architecture.

```javascript
// webpack.config.js
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote: 'remote@http://localhost:3001/remoteEntry.js'
  }
})
```

**Ответ Senior:**

**Концепции:**
- **Host** — основное приложение, которое загружает удаленные модули
- **Remote** — приложение, которое предоставляет модули
- **Shared** — общие зависимости между приложениями

```javascript
// webpack.config.js (Host)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remoteApp: 'remote@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};

// Использование в коде
const RemoteComponent = React.lazy(() => import('remoteApp/Component'));
```

### 5. Как организовать коммуникацию между микрофронтендами?
**Ответ:** Коммуникация между микрофронтендами может быть организована через Custom Events, Shared State (глобальное хранилище), Message Bus (централизованный канал), или через URL параметры и query strings.

**Методы:**
- Custom Events — события браузера
- Shared State — общее хранилище
- Message Bus — централизованный канал
- URL параметры — через роутинг

```javascript
// Custom Events
window.dispatchEvent(new CustomEvent('user-updated', { detail: user }))
```

**Answer EN:** Communication between microfrontends can be organized via Custom Events, Shared State (global store), Message Bus (centralized channel), or through URL parameters and query strings.

**Methods:**
- Custom Events — browser events
- Shared State — shared store
- Message Bus — centralized channel
- URL parameters — via routing

```javascript
// Custom Events
window.dispatchEvent(new CustomEvent('user-updated', { detail: user }))
```

**Ответ Senior:**

**1. Custom Events**
```javascript
// Отправка события
window.dispatchEvent(new CustomEvent('user-updated', {
  detail: { userId: 123 }
}));

// Подписка на событие
window.addEventListener('user-updated', (event) => {
  console.log(event.detail);
});
```

**2. Shared State (Redux, Zustand)**
- Общее хранилище состояния
- Паттерн Event Bus

**3. URL/Query Parameters**
- Передача данных через URL
- Простой способ для передачи простых данных

**4. PostMessage API (для iframe)**
```javascript
// Отправка сообщения
window.parent.postMessage({ type: 'UPDATE', data: {} }, '*');

// Получение сообщения
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE') {
    // обработка
  }
});
```

**5. Props через Module Federation**
- Передача данных через пропсы компонентов

### 6. Проблемы с микрофронтендами и их решения?
**Ответ:** Основные проблемы: изоляция стилей (решение — CSS Modules, Shadow DOM), версионирование зависимостей (решение — Module Federation, shared dependencies), производительность (решение — lazy loading, code splitting), отладка (решение — source maps, мониторинг).

**Проблемы и решения:**
- Изоляция стилей → CSS Modules, Shadow DOM
- Версионирование → Module Federation
- Производительность → lazy loading
- Отладка → source maps

**Answer EN:** Main problems: style isolation (solution — CSS Modules, Shadow DOM), dependency versioning (solution — Module Federation, shared dependencies), performance (solution — lazy loading, code splitting), debugging (solution — source maps, monitoring).

**Problems and solutions:**
- Style isolation → CSS Modules, Shadow DOM
- Versioning → Module Federation
- Performance → lazy loading
- Debugging → source maps

**Ответ Senior:**

**1. Изоляция стилей**
- **Проблема:** Конфликты CSS между микрофронтендами
- **Решения:** CSS Modules, Shadow DOM, BEM, префиксы классов

**2. Версионирование зависимостей**
- **Проблема:** Разные версии одной библиотеки
- **Решения:** Shared dependencies в Module Federation, семантическое версионирование

**3. Производительность**
- **Проблема:** Увеличенный размер бандла, дублирование кода
- **Решения:** Code splitting, lazy loading, shared dependencies

**4. Роутинг**
- **Проблема:** Координация маршрутов между приложениями
- **Решения:** Единый роутер, hash-based routing, history API

**5. Тестирование**
- **Проблема:** Сложность интеграционного тестирования
- **Решения:** Contract testing, E2E тесты, изолированное тестирование

**6. Мониторинг и отладка**
- **Проблема:** Отслеживание ошибок в разных приложениях
- **Решения:** Единая система логирования, distributed tracing, error boundaries

---

