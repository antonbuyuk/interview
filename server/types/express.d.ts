/**
 * Расширение типов Express для проекта
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Расширенный Request с дополнительными полями
 * Generic типы для типизации params, query, body
 */
export interface ExtendedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  // Можно добавить дополнительные поля, если нужно
  // Например: user?: User;
}

/**
 * Тип для Express middleware
 */
export type ExpressMiddleware = (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Тип для Express error handler middleware
 */
export type ExpressErrorHandler = (
  err: Error,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
