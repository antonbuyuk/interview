/**
 * Контроллер для авторизации администратора
 */
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type { LoginBody } from '../types/api';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { loginSchema } from '../utils/validation.js';
import { z } from 'zod';

const login = async (
  req: ExtendedRequest<unknown, unknown, LoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Валидация уже выполнена через middleware
    const { password } = req.body;

    const adminPassword = process.env.IS_ADMIN_PASS;

    if (!adminPassword) {
      const { default: logger } = await import('../utils/logger.js');
      logger.error('IS_ADMIN_PASS is not set in environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    if (password !== adminPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Генерируем JWT токены
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();

    // Устанавливаем refresh token в httpOnly cookie для безопасности
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    // Возвращаем access token в ответе (клиент сохранит его в памяти или localStorage)
    res.json({
      success: true,
      message: 'Admin authenticated successfully',
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обновление access token с помощью refresh token
 */
const refresh = async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not provided' });
      return;
    }

    const { verifyRefreshToken, generateAccessToken } = await import('../utils/jwt.js');
    const payload = verifyRefreshToken(refreshToken);

    if (!payload || !payload.admin) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Генерируем новый access token
    const newAccessToken = generateAccessToken();

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Выход из системы (очистка refresh token)
 */
const logout = async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Очищаем refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export { login, refresh, logout };
