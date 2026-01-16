/**
 * Контроллер для авторизации администратора
 */
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type { LoginBody } from '../types/api';

const login = async (
  req: ExtendedRequest<unknown, unknown, LoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const adminPassword = process.env.IS_ADMIN_PASS;

    if (!adminPassword) {
      console.error('IS_ADMIN_PASS is not set in environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    if (password !== adminPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Возвращаем успешный ответ - фронтенд сохранит токен в localStorage
    res.json({ success: true, message: 'Admin authenticated successfully' });
  } catch (error) {
    next(error);
  }
};

export { login };
