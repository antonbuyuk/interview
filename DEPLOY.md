# Деплой проекта с БД

Проект состоит из двух частей:

1. **Фронтенд** (Vue 3) - деплоится на GitHub Pages
2. **API сервер** (Express + Prisma) - деплоится на Railway/Render
3. **База данных** (PostgreSQL) - используем Supabase или Neon (бесплатные планы)

## Архитектура деплоя

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  GitHub Pages   │ ──────> │  API Server  │ ──────> │  PostgreSQL │
│   (Frontend)    │         │  (Railway)   │         │  (Supabase) │
└─────────────────┘         └──────────────┘         └─────────────┘
```

## Шаг 1: Настройка базы данных (Supabase - Рекомендуется)

### Вариант A: Supabase (Бесплатно, до 500MB)

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
   ⚠️ **Важно:** Используйте Connection Pooling (порт 6543) для приложений!
6. Сохраните её - она понадобится для API сервера

**Если нужно включить прямые подключения:**

- В настройках Database найдите **Network Restrictions**
- Добавьте ваш IP адрес или разрешите все подключения (для разработки)

### Вариант B: Neon (Бесплатно, до 3GB)

1. Перейдите на https://neon.tech
2. Создайте аккаунт и новый проект
3. Скопируйте Connection String из дашборда

## Шаг 2: Деплой API сервера на Railway

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

## Шаг 3: Настройка миграций БД

### ⚠️ Проблема с подключением к Supabase

Если вы получаете ошибку `Can't reach database server`, это значит, что Supabase блокирует внешние подключения.

### Решение 1: Включить доступ в Supabase (рекомендуется)

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings → Database**
4. Найдите раздел **Network Restrictions** или **Connection Pooling**
5. **Включите "Allow all IP addresses"** или добавьте ваш IP адрес
6. Сохраните изменения

После этого попробуйте снова:

```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
npm run prisma:migrate:deploy
npm run migrate:data
```

### Решение 2: Выполнить миграции через Supabase SQL Editor

Если прямое подключение не работает, выполните миграции вручную:

1. Откройте Supabase Dashboard → **SQL Editor**
2. Нажмите **New Query**
3. Откройте файл `scripts/supabase-migration.sql` из проекта
4. Скопируйте весь SQL код
5. Вставьте в SQL Editor
6. Нажмите **Run** (или F5)
7. После успешного выполнения таблицы будут созданы

### Решение 3: Использовать Connection Pooling для Railway

Для деплоя на Railway используйте Connection Pooling вместо Direct Connection:

1. В Supabase Dashboard: **Settings → Database**
2. Найдите **Connection string** → **Connection Pooling** (Session mode)
3. Скопируйте строку (порт 6543)
4. Используйте её в Railway как `DATABASE_URL`

**Важно:**

- Direct Connection (порт 5432) - для миграций и локальной разработки
- Connection Pooling (порт 6543) - для продакшена (Railway)

### После создания таблиц: Заполнение данными

**Вариант A: Локально (если доступ включен)**

```bash
# Используйте Direct Connection для миграции данных
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
npm run migrate:data
```

**Вариант B: Через Railway (рекомендуется, если локально не работает)**

После деплоя API на Railway:

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

4. Выполните миграцию данных:

```bash
railway run npm run migrate:data
```

Railway использует переменную `DATABASE_URL` из настроек проекта, поэтому подключение должно работать.

## Шаг 4: Настройка фронтенда

1. В GitHub репозитории: **Settings → Secrets and variables → Actions**
2. Добавьте секрет:
   - **Name**: `VITE_API_URL`
   - **Value**: URL вашего API сервера из Railway (например: `https://your-app-name.up.railway.app`)
   - ⚠️ **Важно:** Не добавляйте `/api` в конце! Просто базовый URL

3. Сделайте push в `main` - фронтенд автоматически задеплоится

### Как проверить, что API работает:

Откройте в браузере: `https://your-app-name.up.railway.app/api/health`

Должен вернуться JSON: `{"status":"ok","timestamp":"..."}`

## Локальная разработка

Создайте `.env` файл:

```env
DATABASE_URL="postgresql://..."
API_PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001
```

Запустите:

```bash
npm run dev:server  # В одном терминале
npm run dev:client  # В другом терминале
```

## Troubleshooting

### CORS ошибки

CORS уже настроен в `server/index.js` для:

- `http://localhost:3000` (локальная разработка)
- `https://antonbuyuk.github.io` (GitHub Pages)

Если используете другой домен, добавьте его в `allowedOrigins` в `server/index.js`.

### Проблемы с подключением к БД

- Проверьте, что `DATABASE_URL` правильно настроен
- Убедитесь, что БД доступна извне (для Supabase/Neon это по умолчанию)
- Проверьте, что миграции выполнены
- Для Railway используйте Connection Pooling (порт 6543), а не Direct Connection

### API не отвечает

- Проверьте логи на Railway/Render
- Убедитесь, что сервер запущен
- Проверьте переменные окружения
- Проверьте, что порт правильно настроен (Railway использует переменную `PORT`)

### Переменная VITE_API_URL не работает

- Убедитесь, что переменная добавлена в GitHub Secrets
- Переменные с префиксом `VITE_` должны быть доступны во время сборки
- После изменения секрета перезапустите workflow
