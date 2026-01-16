/**
 * Middleware для проверки авторизации администратора
 * Поддерживает JWT токены и обратную совместимость со старым методом
 */

import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt.js';

const authAdmin = (req: ExtendedRequest, res: Response, next: NextFunction): void => {
  // Приоритет 1: Проверяем JWT токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload && payload.admin) {
      // Сохраняем информацию о пользователе в request для дальнейшего использования
      req.user = { admin: true };
      next();
      return;
    }
  }

  // Приоритет 2: Проверяем заголовок X-Admin-Auth (для обратной совместимости)
  const headerAuth = req.headers['x-admin-auth'] === 'true';

  // Приоритет 3: Проверяем cookie для обратной совместимости
  const cookieAuth = req.cookies?.is_auth_admin === 'true';

  const isAuthAdmin = headerAuth || cookieAuth;

  if (!isAuthAdmin) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  // Сохраняем информацию о пользователе в request
  req.user = { admin: true };
  next();
};

export default authAdmin;
