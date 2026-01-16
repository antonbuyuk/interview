/**
 * Rate limiting middleware для защиты от DDoS и злоупотреблений
 */

import rateLimit from 'express-rate-limit';

/**
 * Общий rate limiter для всех API запросов
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов с одного IP за 15 минут
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Возвращает информацию о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
});

/**
 * Строгий rate limiter для авторизации
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // Максимум 5 попыток входа с одного IP за 15 минут
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные запросы
});

/**
 * Rate limiter для Groq API запросов (генерирование предложений терминов)
 */
export const groqLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // Максимум 10 запросов к Groq API с одного IP за минуту
  message: {
    error: 'Too many requests to AI service, please try again later.',
    code: 'GROQ_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter для создания/обновления контента (админские операции)
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // Максимум 50 операций записи с одного IP за 15 минут
  message: {
    error: 'Too many write operations, please try again later.',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Мягкий rate limiter для чтения данных
 */
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 200, // Максимум 200 запросов чтения с одного IP за минуту
  message: {
    error: 'Too many read requests, please try again later.',
    code: 'READ_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
