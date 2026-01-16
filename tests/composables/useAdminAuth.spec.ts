import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAdminAuth } from '../../src/composables/useAdminAuth';
import { api } from '../../src/api/client';

// Мокаем API клиент
vi.mock('../../src/api/client', () => ({
  api: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  default: {
    post: vi.fn(),
  },
}));

describe('useAdminAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('должен инициализироваться с isAdmin = false', () => {
    const { isAdmin } = useAdminAuth();
    expect(isAdmin.value).toBe(false);
  });

  it('должен проверять токен в localStorage при инициализации', () => {
    // Создаем валидный JWT токен (заголовок + payload + signature)
    // Payload: {"admin":true,"exp":9999999999} (в base64)
    const validToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZSwiZXhwIjo5OTk5OTk5OTk5OX0.test';
    localStorage.setItem('admin_access_token', validToken);
    const { isAdmin, checkAuthStatus } = useAdminAuth();
    const result = checkAuthStatus();
    // Проверяем, что токен найден и статус обновлен
    expect(localStorage.getItem('admin_access_token')).toBe(validToken);
    expect(result).toBe(true);
    expect(isAdmin.value).toBe(true);
  });

  it('должен успешно выполнять вход', async () => {
    const mockResponse = {
      success: true,
      accessToken: 'test-access-token',
    };
    (api.post as any).mockResolvedValue(mockResponse);

    const { login, isAdmin } = useAdminAuth();
    const result = await login('correct-password');

    expect(result.success).toBe(true);
    expect(api.post).toHaveBeenCalledWith('/admin/login', { password: 'correct-password' });
  });

  it('должен обрабатывать ошибку при неверном пароле', async () => {
    const { ApiError } = await import('../../src/api/client');
    const mockError = new ApiError('Invalid password', 401);
    (api.post as any).mockRejectedValue(mockError);

    const { login } = useAdminAuth();
    const result = await login('wrong-password');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('должен выполнять выход', async () => {
    localStorage.setItem('admin_access_token', 'test-token');
    (api.post as any).mockResolvedValue({ success: true });

    const { logout, isAdmin } = useAdminAuth();
    await logout();

    expect(localStorage.getItem('admin_access_token')).toBeNull();
  });
});
