## Безопасность

### 1. XSS (Cross-Site Scripting) и защита?
**Ответ:** XSS — внедрение вредоносного JavaScript кода в приложение.

**Типы XSS:**
- **Reflected XSS** — скрипт в URL параметрах
- **Stored XSS** — скрипт сохраняется на сервере
- **DOM-based XSS** — манипуляция DOM на клиенте

**Защита:**
- Экранирование пользовательского ввода
- Санитизация HTML (DOMPurify)
- Content Security Policy (CSP)
- HttpOnly cookies

```vue
<!-- Vue автоматически экранирует -->
<div>{{ userInput }}</div> <!-- Безопасно -->
```

**Answer EN:** XSS is injection of malicious JavaScript code into application.

**XSS types:**
- **Reflected XSS** — script in URL parameters
- **Stored XSS** — script stored on server
- **DOM-based XSS** — DOM manipulation on client

**Protection:**
- Escaping user input
- HTML sanitization (DOMPurify)
- Content Security Policy (CSP)
- HttpOnly cookies

```vue
<!-- Vue automatically escapes -->
<div>{{ userInput }}</div> <!-- Safe -->
```

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
- CSRF токены
- SameSite cookies
- Проверка Referer/Origin

```javascript
// CSRF токены
const csrfToken = document.querySelector('meta[name="csrf-token"]').content
fetch('/api/data', {
  headers: { 'X-CSRF-Token': csrfToken }
})
```

**Answer EN:** CSRF is an attack that forces a user to perform actions without their knowledge.

**Protection:**
- CSRF tokens
- SameSite cookies
- Referer/Origin validation

```javascript
// CSRF tokens
const csrfToken = document.querySelector('meta[name="csrf-token"]').content
fetch('/api/data', {
  headers: { 'X-CSRF-Token': csrfToken }
})
```

**Ответ Senior:**
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
**Ответ:** CORS preflight запросы — это автоматические OPTIONS запросы, которые браузер отправляет перед сложными запросами для проверки разрешений. Preflight срабатывает для запросов с кастомными заголовками, методами кроме GET/POST/HEAD, или с Content-Type кроме application/x-www-form-urlencoded, multipart/form-data, text/plain.

**Когда срабатывает preflight:**
- Кастомные заголовки (например, Authorization)
- Методы кроме GET/POST/HEAD
- Content-Type: application/json

```javascript
// Простой запрос (без preflight)
fetch('https://api.example.com/data')

// Сложный запрос (с preflight)
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer token' }
})
```

**Answer EN:** CORS preflight requests are automatic OPTIONS requests that browser sends before complex requests to check permissions. Preflight triggers for requests with custom headers, methods other than GET/POST/HEAD, or Content-Type other than application/x-www-form-urlencoded, multipart/form-data, text/plain.

**When preflight triggers:**
- Custom headers (e.g., Authorization)
- Methods other than GET/POST/HEAD
- Content-Type: application/json

```javascript
// Simple request (no preflight)
fetch('https://api.example.com/data')

// Complex request (with preflight)
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer token' }
})
```

**Ответ Senior:**
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

