/**
 * Типы для аутентификации
 */

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
  accessToken?: string;
  message?: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  error?: string;
}
