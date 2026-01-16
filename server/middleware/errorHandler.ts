import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import logger from '../utils/logger.js';
import Sentry from '../utils/sentry.js';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

const errorHandler = (
  err: CustomError | PrismaClientKnownRequestError,
  req: ExtendedRequest,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      status: 'status' in err ? err.status : undefined,
      code: 'code' in err ? err.code : undefined,
      path: req.path,
      method: req.method,
    },
    'Request error'
  );

  // Отправляем ошибку в Sentry
  Sentry.captureException(err, {
    tags: {
      path: req.path,
      method: req.method,
    },
    extra: {
      status: 'status' in err ? err.status : undefined,
      code: 'code' in err ? err.code : undefined,
    },
  });

  // Проверяем, является ли ошибка Prisma ошибкой
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint violation',
        message: 'A record with this value already exists',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        message: 'The requested record does not exist',
      });
      return;
    }
  }

  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
