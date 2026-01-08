FROM node:22.12.0-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma Client
RUN npm run prisma:generate

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Railway автоматически установит переменную PORT
EXPOSE 3001

# Запускаем приложение
CMD ["node", "server/index.js"]
