import 'dotenv/config';
// Инициализация Sentry должна быть в самом начале
import { initSentry } from './utils/sentry.js';
initSentry();

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import questionsRoutes from './routes/questions.js';
import answersRoutes from './routes/answers';
import termsRoutes from './routes/terms';
import sectionsRoutes from './routes/sections';
import adminRoutes from './routes/admin';
import errorHandler from './middleware/errorHandler';
import type { ExtendedRequest } from './types/express';
import logger from './utils/logger.js';
import Sentry from './utils/sentry.js';
import { createRequire } from 'module';
import { swaggerSpec } from './utils/swagger.js';

// Создаем require функцию для использования в ES модулях
const require = createRequire(import.meta.url);

const app = express();
const PORT: number = Number(process.env.PORT) || Number(process.env.API_PORT) || 3001;

// Middleware
const allowedOrigins: string[] = [
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : []),
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
          logger.warn({ origin, normalizedOrigin }, 'CORS blocked origin');
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

// Content Security Policy headers для защиты от XSS
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // unsafe-inline и unsafe-eval для Vue
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.groq.com; " + // Для Groq API
      "frame-ancestors 'none'; " +
      "base-uri 'self';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Performance monitoring
import { performanceMiddleware } from './middleware/performance.js';
app.use(performanceMiddleware);

// Rate limiting - применяем общий лимитер ко всем API запросам
import { generalLimiter } from './middleware/rateLimiter.js';
app.use('/api', generalLimiter);

// Routes
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/admin', adminRoutes);

// Swagger UI для API документации
// Доступен всегда, кроме случая когда явно отключен через DISABLE_SWAGGER=true
if (process.env.DISABLE_SWAGGER !== 'true') {
  try {
    // Используем createRequire для загрузки CommonJS модуля в ES модулях
    const swaggerUi = require('swagger-ui-express');

    if (!swaggerUi || !swaggerSpec) {
      logger.error('Swagger modules not loaded correctly');
      throw new Error('Swagger modules not available');
    }

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Interview Questions API',
    }));
    logger.info('Swagger UI available at /api-docs');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ error: errorMessage, stack: errorStack }, 'Swagger UI not available');
    console.error('Swagger UI error:', errorMessage);
    if (errorStack) {
      console.error('Stack:', errorStack);
    }
  }
}

// Тестовый роут для проверки работы сервера
app.get('/api-docs/test', (_req: Request, res: Response) => {
  res.json({ message: 'Swagger route test - server is working', path: '/api-docs' });
});

// Health check с метриками
app.get('/api/health', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((_req: ExtendedRequest, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, '🚀 Server running');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
