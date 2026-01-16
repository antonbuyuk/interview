import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import questionsRoutes from './routes/questions.js';
import answersRoutes from './routes/answers.js';
import termsRoutes from './routes/terms.js';
import sectionsRoutes from './routes/sections.js';
import adminRoutes from './routes/admin.js';
import errorHandler from './middleware/errorHandler.js';
import type { ExtendedRequest } from './types/express';

const app = express();
const PORT: number = Number(process.env.PORT) || Number(process.env.API_PORT) || 3001;

// Middleware
const allowedOrigins: (string | undefined)[] = [
  'http://localhost:3000',
  'https://antonbuyuk.github.io',
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

// Функция для нормализации origin (убирает trailing slash и путь, оставляет только домен)
const normalizeOrigin = (origin: string): string => {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch {
    // Если не удалось распарсить как URL, просто убираем trailing slash
    return origin.replace(/\/$/, '');
  }
};

app.use(
  cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      // Разрешаем запросы без origin (например, Postman, мобильные приложения, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Нормализуем origin для сравнения (убираем путь, оставляем только домен)
      const normalizedOrigin = normalizeOrigin(origin);

      // Проверяем точное совпадение с нормализованными allowedOrigins
      const exactMatch = allowedOrigins.some(allowed => {
        if (!allowed) return false;
        return normalizeOrigin(allowed) === normalizedOrigin;
      });

      // Проверяем поддомены GitHub Pages (*.github.io) - без учета пути
      const isGitHubPages = /^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(normalizedOrigin);

      if (exactMatch || isGitHubPages) {
        callback(null, true);
      } else {
        // В development разрешаем все
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Auth'],
    exposedHeaders: ['Content-Type'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/admin', adminRoutes);

// Логирование для диагностики роутов
console.log('Routes registered:');
console.log('  - /api/questions');
console.log('  - /api/answers');
console.log('  - /api/terms (with /by-name/:term)');
console.log('  - /api/sections');
console.log('  - /api/admin');

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((_req: ExtendedRequest, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
