/**
 * Middleware для измерения производительности запросов
 */

import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import logger from '../utils/logger.js';

const SLOW_REQUEST_THRESHOLD = 500; // Порог для медленных запросов в миллисекундах

export const performanceMiddleware = (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Перехватываем событие завершения ответа
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, path, query, params } = req;

    // Логируем все запросы
    logger.info(
      {
        method,
        path,
        query,
        params,
        statusCode: res.statusCode,
        duration,
      },
      'HTTP request'
    );

    // Логируем медленные запросы отдельно
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn(
        {
          method,
          path,
          query,
          params,
          statusCode: res.statusCode,
          duration,
        },
        'Slow request detected'
      );
    }
  });

  next();
};
