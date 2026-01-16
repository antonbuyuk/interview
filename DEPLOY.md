# Деплой проекта

Проект состоит из трех частей:

1. **Фронтенд** (Vue 3) - деплоится на GitHub Pages
2. **API сервер** (Express + Prisma) - деплоится на Railway или Render
3. **База данных** (PostgreSQL) - используем Supabase или Neon (бесплатные планы)

## Архитектура деплоя

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  GitHub Pages   │ ──────> │  API Server  │ ──────> │  PostgreSQL │
│   (Frontend)    │         │ Railway/     │         │  Supabase/  │
│                 │         │ Render       │         │  Neon       │
└─────────────────┘         └──────────────┘         └─────────────┘
```

## Шаг 1: Настройка базы данных

### Вариант A: Supabase (Рекомендуется, бесплатно до 500MB)

1. Перейдите на https://supabase.com
2. Создайте аккаунт и новый проект
3. В настройках проекта найдите **Settings → Database**
4. В разделе **Connection string** выберите:
   - **Connection Pooling** (рекомендуется для приложений) - используйте порт **6543**
   - Или **Direct connection** (порт 5432) - но нужно включить в настройках
5. Скопируйте строку подключения в формате:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   ⚠️ **Важно:** Используйте Connection Pooling (порт 6543) для продакшена!

**Если нужно включить прямые подключения:**

- В настройках Database найдите **Network Restrictions**
- Добавьте ваш IP адрес или разрешите все подключения (для разработки)

### Вариант B: Neon (Бесплатно до 3GB)

1. Перейдите на https://neon.tech
2. Создайте аккаунт и новый проект
3. Скопируйте Connection String из дашборда
4. Neon автоматически использует connection pooling, отдельная настройка не требуется

## Шаг 2: Деплой API сервера

Выберите один из вариантов: Railway или Render.

### Вариант A: Railway

1. Перейдите на https://railway.app
2. Создайте аккаунт через GitHub
3. Нажмите **"New Project"** → выберите **"GitHub Repository"**
4. Выберите ваш репозиторий `interview`
5. Railway автоматически начнёт деплой
6. После завершения деплоя:
   - Откройте ваш проект в Railway
   - Нажмите на сервис (обычно называется `interview` или `web`)
   - Перейдите на вкладку **"Settings"**
   - Найдите раздел **"Networking"** или **"Domains"**
   - Там будет **"Generate Domain"** - нажмите на него
   - Railway создаст домен вида: `https://your-app-name.up.railway.app`
   - **Это и есть URL вашего API!** Скопируйте его
7. Добавьте переменные окружения (вкладка **"Variables"**):
   - `DATABASE_URL` - строка подключения из Supabase/Neon (используйте Connection Pooling для Railway!)
   - `NODE_ENV=production`
   - `PORT` - Railway устанавливает автоматически, но можно указать явно
   - `ADMIN_PASSWORD` - пароль для админ-панели (рекомендуется)
   - `JWT_SECRET` - секретный ключ для JWT токенов (рекомендуется)
   - `FRONTEND_URL` - URL вашего фронтенда (например: `https://antonbuyuk.github.io`)
   - `SENTRY_DSN` - DSN для Sentry (опционально)

**Важно для Railway:**

- Railway автоматически устанавливает переменную `PORT`, используйте её в коде
- Для Supabase используйте Connection Pooling (порт 6543), а не Direct Connection
- Railway автоматически выполняет `npm install` и запускает приложение согласно `railway.json`

### Вариант B: Render

1. Перейдите на https://render.com
2. Создайте аккаунт через GitHub
3. Нажмите **"New +"** → выберите **"Web Service"**
4. Подключите ваш репозиторий `interview`
5. Настройте сервис:
   - **Name**: `interview-api` (или любое другое)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start` (или `npx tsx server/index.ts`)
6. Добавьте переменные окружения:
   - `DATABASE_URL` - строка подключения из Supabase/Neon
   - `NODE_ENV=production`
   - `PORT` - Render устанавливает автоматически через переменную `PORT`
   - `ADMIN_PASSWORD` - пароль для админ-панели
   - `JWT_SECRET` - секретный ключ для JWT токенов
   - `FRONTEND_URL` - URL вашего фронтенда
   - `SENTRY_DSN` - DSN для Sentry (опционально)
7. Нажмите **"Create Web Service"**
8. После деплоя Render создаст домен вида: `https://interview-api.onrender.com`
9. **Это и есть URL вашего API!** Скопируйте его

**Важно для Render:**

- Render использует конфигурацию из `render.yaml`, но её можно переопределить в UI
- Для Supabase используйте Connection Pooling (порт 6543)
- Render автоматически устанавливает переменную `PORT`

## Шаг 3: Настройка миграций БД

### Применение миграций Prisma

После настройки базы данных необходимо применить миграции Prisma.

**Вариант A: Локально (если доступ включен)**

```bash
# Используйте Direct Connection для миграций (порт 5432)
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
npm run prisma:migrate:deploy
```

**Вариант B: Через Railway CLI (рекомендуется)**

1. Установите Railway CLI:

```bash
npm i -g @railway/cli
```

2. Войдите в Railway:

```bash
railway login
```

3. Подключитесь к проекту:

```bash
railway link
```

4. Примените миграции:

```bash
railway run npm run prisma:migrate:deploy
```

Railway использует переменную `DATABASE_URL` из настроек проекта.

**Вариант C: Через Render Shell**

1. В Render Dashboard откройте ваш сервис
2. Перейдите на вкладку **"Shell"**
3. Выполните команды:

```bash
npm run prisma:migrate:deploy
```

**Вариант D: Выполнить миграции через Supabase SQL Editor**

Если прямое подключение не работает:

1. Откройте Supabase Dashboard → **SQL Editor**
2. Нажмите **New Query**
3. Откройте файл `scripts/supabase-migration.sql` из проекта (если есть)
4. Скопируйте SQL код
5. Вставьте в SQL Editor и нажмите **Run** (F5)

### Заполнение базы данных

После применения миграций заполните базу данных:

**Локально:**

```bash
# Используйте Direct Connection для миграции данных
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
npm run migrate:data
```

**Через Railway CLI:**

```bash
railway run npm run migrate:data
```

**Через Render Shell:**

```bash
npm run migrate:data
```

**Важно о подключениях:**

- **Direct Connection (порт 5432)** - для миграций и локальной разработки
- **Connection Pooling (порт 6543)** - для продакшена (Railway/Render)

## Шаг 4: Настройка админ-панели

Для доступа к админ-панели необходимо настроить переменные окружения:

1. **ADMIN_PASSWORD** - пароль администратора
   - Используется для входа в админ-панель
   - Рекомендуется использовать надежный пароль
   - Добавьте в переменные окружения на Railway/Render

2. **JWT_SECRET** - секретный ключ для JWT токенов
   - Используется для подписи JWT токенов
   - Должен быть уникальным и надежным
   - Рекомендуется сгенерировать случайную строку
   - Добавьте в переменные окружения на Railway/Render

**Генерация JWT_SECRET:**

```bash
# Используйте Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

После настройки:
1. Откройте фронтенд приложение
2. Нажмите кнопку "Войти" в меню
3. Введите пароль администратора
4. После успешного входа вы получите доступ к админ-функциям

**API документация доступна по адресу:** `https://your-api-url.com/api-docs` (Swagger UI)

## Шаг 5: Настройка фронтенда

### GitHub Actions (Автоматический деплой)

1. В GitHub репозитории: **Settings → Secrets and variables → Actions**
2. Добавьте секрет:
   - **Name**: `VITE_API_URL`
   - **Value**: URL вашего API сервера из Railway/Render (например: `https://your-app-name.up.railway.app`)
   - ⚠️ **Важно:** Не добавляйте `/api` в конце! Просто базовый URL

3. Настройте GitHub Pages:
   - Перейдите в **Settings → Pages**
   - В разделе "Source" выберите **"GitHub Actions"**
   - Сохраните изменения

4. Сделайте push в ветку `main` - фронтенд автоматически задеплоится

### Проверка работы API

Откройте в браузере: `https://your-api-url.com/api/health`

Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "rss": 45,
    "heapTotal": 25,
    "heapUsed": 15,
    "external": 5
  }
}
```

## Переменные окружения

### API Server

| Переменная | Описание | Обязательно | Пример |
|------------|----------|-------------|--------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | ✅ Да | `postgresql://...` |
| `NODE_ENV` | Окружение | ❌ Нет | `production` |
| `PORT` / `API_PORT` | Порт API сервера | ❌ Нет | `3001` (Railway/Render устанавливают автоматически) |
| `ADMIN_PASSWORD` | Пароль администратора | ❌ Нет | `your-secure-password` |
| `JWT_SECRET` | Секрет для JWT токенов | ❌ Нет | `your-jwt-secret` |
| `CORS_ORIGINS` | Разрешенные CORS origins (через запятую) | ❌ Нет | `https://example.com,https://another.com` |
| `FRONTEND_URL` | URL фронтенда для CORS | ❌ Нет | `https://antonbuyuk.github.io` |
| `SENTRY_DSN` | DSN для Sentry мониторинга | ❌ Нет | `https://...@sentry.io/...` |
| `DISABLE_SWAGGER` | Отключить Swagger UI | ❌ Нет | `true` |

### Frontend (GitHub Secrets)

| Переменная | Описание | Обязательно | Пример |
|------------|----------|-------------|--------|
| `VITE_API_URL` | URL API сервера | ✅ Да | `https://your-app-name.up.railway.app` |

⚠️ **Важно:** Переменные фронтенда должны начинаться с префикса `VITE_` для доступности в клиентском коде.

## Локальная разработка

Создайте `.env` файл в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# API сервер
API_PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001

# Админ-панель (опционально)
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret

# CORS (опционально)
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Sentry (опционально)
SENTRY_DSN=your-sentry-dsn
```

Запустите:

```bash
# Одновременно фронтенд и API
npm run dev:all

# Или в отдельных терминалах
npm run dev:server  # API сервер
npm run dev:client  # Frontend
```

## Troubleshooting

### CORS ошибки

CORS настроен в `server/index.ts` для:

- `http://localhost:3000` (локальная разработка)
- `https://antonbuyuk.github.io` и все поддомены `*.github.io` (GitHub Pages)
- Домены, указанные в `CORS_ORIGINS` (через запятую)
- Домены, указанные в `FRONTEND_URL`

**Решение:**

- Убедитесь, что `FRONTEND_URL` правильно настроен на сервере
- Добавьте нужные домены в `CORS_ORIGINS` (через запятую)
- В development режиме все origin разрешены автоматически

### Проблемы с подключением к БД

**Ошибка: "Can't reach database server"**

- **Причина:** Supabase блокирует внешние подключения
- **Решение:**
  1. Откройте Supabase Dashboard → **Settings → Database**
  2. Найдите **Network Restrictions**
  3. Включите **"Allow all IP addresses"** или добавьте IP адреса Railway/Render
  4. Сохраните изменения

**Ошибка: "Connection timeout"**

- Убедитесь, что используете правильный тип подключения:
  - **Connection Pooling (порт 6543)** - для продакшена (Railway/Render)
  - **Direct Connection (порт 5432)** - для миграций и локальной разработки
- Проверьте, что `DATABASE_URL` правильно скопирован (включая пароль)

**Ошибка: "Invalid credentials"**

- Проверьте пароль в строке подключения
- Убедитесь, что используете правильный формат строки подключения

### Проблемы с Prisma

**Ошибка: "Prisma Client has not been initialized"**

- Убедитесь, что `prisma:generate` выполнен:
  ```bash
  npm run prisma:generate
  ```
- Railway/Render автоматически выполняют `prisma:generate` в build команде

**Ошибка: "Migration failed"**

- Проверьте, что миграции применяются с правильным `DATABASE_URL`
- Убедитесь, что база данных доступна
- Проверьте логи миграций для деталей ошибки

### API не отвечает

**Проверьте:**

1. **Логи на Railway/Render:**
   - Railway: вкладка **"Deployments"** → выберите последний деплой → **"View Logs"**
   - Render: вкладка **"Logs"**

2. **Переменные окружения:**
   - Убедитесь, что все обязательные переменные установлены
   - Проверьте, что `DATABASE_URL` правильный

3. **Порт:**
   - Railway/Render автоматически устанавливают `PORT`
   - Убедитесь, что код использует `process.env.PORT || 3001`

4. **Health check:**
   ```bash
   curl https://your-api-url.com/api/health
   ```

### Переменная VITE_API_URL не работает

**Проблема:** Frontend не может подключиться к API

**Решение:**

1. Убедитесь, что переменная добавлена в **GitHub Secrets** (не Variables!)
2. Проверьте, что переменная называется именно `VITE_API_URL` (с префиксом `VITE_`)
3. Переменные с префиксом `VITE_` доступны только во время сборки
4. После изменения секрета:
   - Сделайте новый push в `main` или
   - Перезапустите GitHub Actions workflow вручную
5. Проверьте, что URL правильный (без `/api` в конце)

### Проблемы с админ-панелью

**Ошибка: "Invalid password"**

- Убедитесь, что `ADMIN_PASSWORD` установлен на сервере
- Проверьте, что используете правильный пароль при входе
- Переменная окружения чувствительна к регистру и пробелам

**Ошибка: "JWT verification failed"**

- Убедитесь, что `JWT_SECRET` установлен на сервере
- После изменения `JWT_SECRET` нужно перелогиниться (старые токены недействительны)
- Убедитесь, что `JWT_SECRET` одинаковый на всех серверах (если используете несколько)

### Проблемы с миграциями данных

**Ошибка: "Cannot connect to database"**

- Используйте Direct Connection (порт 5432) для миграции данных
- Убедитесь, что доступ из вашего IP разрешен в Supabase
- Или выполните миграцию через Railway/Render CLI

**Данные не загружаются**

- Проверьте, что миграции Prisma применены (`prisma:migrate:deploy`)
- Проверьте логи миграции данных для ошибок
- Убедитесь, что скрипт `scripts/migrate-to-db.js` существует и работает

### Проблемы с деплоем на GitHub Pages

**404 ошибка при переходе на страницы**

- Убедитесь, что `base` правильно настроен в `vite.config.ts`
- GitHub Pages должен копировать `index.html` в `404.html` (выполняется автоматически)
- Проверьте, что используете правильный путь (например: `/interview/` вместо `/`)

**API запросы не работают на GitHub Pages**

- Проверьте, что `VITE_API_URL` правильно установлен
- Откройте DevTools → Network и проверьте запросы
- Убедитесь, что CORS настроен на API сервере для вашего домена GitHub Pages
