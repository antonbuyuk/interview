## Безопасность

### 1. XSS (Cross-Site Scripting) и защита?
**Ответ:** XSS — внедрение вредоносного JavaScript кода в приложение.

**Ответ Senior:**

**Типы XSS:**
1. **Reflected XSS** — скрипт в URL параметрах
2. **Stored XSS** — скрипт сохраняется на сервере
3. **DOM-based XSS** — манипуляция DOM на клиенте

**Защита:**
```vue
<!-- Vue автоматически экранирует -->
<template>
  <div>{{ userInput }}</div> <!-- Безопасно -->
  <div v-html="userInput"></div> <!-- ОПАСНО! -->
</template>

<!-- Санитизация для v-html -->
<script setup>
import DOMPurify from 'dompurify';

const sanitized = computed(() =>
  DOMPurify.sanitize(userInput.value)
);
</script>
```

**Content Security Policy (CSP):**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

**Дополнительная защита:**
- HttpOnly cookies для токенов
- Content Security Policy (CSP)
- Input validation и sanitization
- Использование фреймворков с защитой (Vue автоматически экранирует)

### 2. CSRF (Cross-Site Request Forgery) защита?
**Ответ:** CSRF — атака, заставляющая пользователя выполнить действия без его ведома.

**Защита:**
```javascript
// CSRF токены
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**SameSite cookies:**
```javascript
// Установка cookie с SameSite
document.cookie = "session=abc123; SameSite=Strict; Secure";
```

**Ответ Senior:**

**Дополнительные меры:**
- CSRF токены для критичных операций
- Referer проверка (дополнительно)
- Double Submit Cookie паттерн
- Origin header validation

**Best practices:**
- SameSite=Strict для сессий
- HTTPS обязательно
- Короткое время жизни токенов

### 3. CORS детально: preflight запросы?
**Ответ:** CORS — механизм для запросов между разными доменами.

**Preflight запросы:**
- Отправляются для "сложных" запросов (PUT, DELETE, custom headers)
- Браузер автоматически отправляет OPTIONS запрос перед основным

```javascript
// Простой запрос (без preflight)
fetch('https://api.example.com/data');

// Сложный запрос (с preflight)
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify({ data: 'value' })
});
```

**Серверная конфигурация:**
```javascript
// Express пример
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://example.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

**Ответ Senior:**

**Безопасная конфигурация:**
- Whitelist для разрешенных origins
- Ограничение методов и заголовков
- Credentials только при необходимости
- Кэширование preflight ответов

**Альтернативы:**
- Proxy через backend
- JSONP (устаревший, небезопасный)
- Server-Sent Events для односторонней связи

---

