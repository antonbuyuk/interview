/**
 * Утилиты для работы с JWT токенами
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.IS_ADMIN_PASS || 'default-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 минут
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 дней

export interface TokenPayload {
  admin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Генерирует access token для администратора
 */
export function generateAccessToken(): string {
  const payload: TokenPayload = {
    admin: true,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Генерирует refresh token для администратора
 */
export function generateRefreshToken(): string {
  const payload: TokenPayload = {
    admin: true,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Верифицирует access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Верифицирует refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Извлекает токен из заголовка Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Поддерживаем формат "Bearer <token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Также поддерживаем просто токен
  return authHeader;
}
