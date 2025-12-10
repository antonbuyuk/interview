## HTTP / API

### 1. Разница между GET и POST?
**Ответ:** GET и POST — это два основных HTTP метода с принципиально разным назначением. GET используется для получения данных, параметры передаются в URL, запросы кэшируются браузером и должны быть идемпотентными. POST предназначен для отправки данных на сервер, информация передается в теле запроса, не кэшируется и может вызывать побочные эффекты (создание, изменение данных).

- **GET**: получение данных, параметры в URL, кэшируется
- **POST**: отправка данных, данные в теле запроса, не кэшируется

**Answer EN:** GET and POST are two fundamental HTTP methods with fundamentally different purposes. GET is used for retrieving data, parameters are passed in the URL, requests are cached by the browser and should be idempotent. POST is designed for sending data to the server, information is passed in the request body, is not cached and can cause side effects (creating, modifying data).

- **GET**: retrieving data, parameters in URL, cached
- **POST**: sending data, data in request body, not cached

**Ответ Senior:**

**HTTP методы и идемпотентность:**
- GET, HEAD — безопасные, идемпотентные
- POST — не идемпотентный, может создавать побочные эффекты
- PUT — идемпотентный (замена ресурса)
- DELETE — идемпотентный
- PATCH — может быть не идемпотентным

**Best practices:**
- GET для чтения, POST для создания
- PUT для полной замены, PATCH для частичных обновлений
- Используйте правильные HTTP статусы (200, 201, 204, 400, 404, 500)

### 2. Что такое CORS?
**Ответ:** CORS (Cross-Origin Resource Sharing) — это механизм браузера, который позволяет веб-страницам делать запросы к ресурсам на другом домене, порту или протоколе. Без CORS такие запросы блокируются политикой Same-Origin Policy. Сервер должен явно разрешить кросс-доменные запросы, отправляя специальные заголовки, такие как `Access-Control-Allow-Origin`. Для сложных запросов браузер сначала отправляет preflight запрос (OPTIONS) для проверки разрешений.

**Answer EN:** CORS (Cross-Origin Resource Sharing) is a browser mechanism that allows web pages to make requests to resources on a different domain, port, or protocol. Without CORS, such requests are blocked by the Same-Origin Policy. The server must explicitly allow cross-origin requests by sending special headers such as `Access-Control-Allow-Origin`. For complex requests, the browser first sends a preflight request (OPTIONS) to check permissions.

**Ответ Senior:**

**CORS детально:**
- Same-Origin Policy блокирует кросс-доменные запросы
- CORS позволяет серверу явно разрешить запросы
- Preflight запросы для сложных операций
- Credentials (cookies) требуют специальной настройки

**Безопасность:**
- Не использовать `Access-Control-Allow-Origin: *` с credentials
- Ограничивать разрешенные методы и заголовки
- Использовать whitelist для origins

### 3. Разница между REST и GraphQL?
**Ответ:** REST и GraphQL — это два разных подхода к проектированию API. REST — это архитектурный стиль с множеством фиксированных endpoints, каждый из которых возвращает предопределенный набор данных. GraphQL — это язык запросов с единой точкой входа, где клиент сам определяет, какие данные и в каком формате ему нужны. GraphQL устраняет проблемы over-fetching и under-fetching, но требует более сложной инфраструктуры и может усложнять кэширование.

- **REST**: архитектурный стиль с фиксированными endpoints
- **GraphQL**: язык запросов, один endpoint, клиент запрашивает нужные поля

**Answer EN:** REST and GraphQL are two different approaches to API design. REST is an architectural style with multiple fixed endpoints, each returning a predefined set of data. GraphQL is a query language with a single entry point where the client determines what data and in what format it needs. GraphQL eliminates over-fetching and under-fetching problems, but requires more complex infrastructure and can complicate caching.

- **REST**: architectural style with fixed endpoints
- **GraphQL**: query language, one endpoint, client requests needed fields

**Ответ Senior:**

**REST преимущества:**
- Простота, зрелость, кэширование
- Стандартные HTTP методы и статусы
- Хорошо для простых CRUD операций

**GraphQL преимущества:**
- Точные запросы, нет over/under fetching
- Типобезопасность через schema
- Единый endpoint, гибкие запросы

**Когда что использовать:**
- REST — для простых API, кэширование важно
- GraphQL — для сложных данных, мобильные приложения

---

