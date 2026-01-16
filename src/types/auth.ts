/**
 * Типы для аутентификации
 */

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
}
