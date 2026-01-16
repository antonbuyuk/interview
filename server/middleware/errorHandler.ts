import type { Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import type { ExtendedRequest } from '../types/express';

interface PrismaClientKnownRequestError extends Error {
  code?: string;
  meta?: unknown;
}

interface CustomError extends Error {
  status?: number;
  code?: string;
}

const errorHandler = (
  err: CustomError | PrismaClientKnownRequestError,
  _req: ExtendedRequest,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Проверяем, является ли ошибка Prisma ошибкой
  if (err.name === 'PrismaClientKnownRequestError' || 'code' in err) {
    const prismaError = err as PrismaClientKnownRequestError;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint violation',
        message: 'A record with this value already exists',
      });
      return;
    }
    if (prismaError.code === 'P2025') {
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
