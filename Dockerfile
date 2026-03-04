FROM node:22.12.0-alpine

WORKDIR /app

# Устанавливаем OpenSSL для Prisma
RUN apk add --no-cache openssl openssl-dev

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Dummy DATABASE_URL для prisma generate (postinstall при npm ci)
# Реальный URL передаётся при запуске контейнера
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma Client
RUN npm run prisma:generate

# Копируем остальные файлы
COPY . .

# Railway автоматически установит переменную PORT
EXPOSE 3001

# Запускаем приложение через tsx (TypeScript execution)
CMD ["npx", "tsx", "server/index.ts"]
