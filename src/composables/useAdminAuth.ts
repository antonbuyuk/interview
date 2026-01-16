import { ref, computed, onMounted, onUnmounted, type ComputedRef } from 'vue';
import { api, ApiError } from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/api';

const STORAGE_KEY = 'is_auth_admin';
const ACCESS_TOKEN_KEY = 'admin_access_token';

interface UseAdminAuthReturn {
  isAdmin: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuthStatus: () => boolean;
}

/**
 * Composable для работы с авторизацией администратора
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const isAdmin = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Проверяет наличие токена в localStorage
   * Поддерживает как старый метод (is_auth_admin), так и новый (JWT)
   */
  const checkAuthStatus = (): boolean => {
    // Проверяем новый JWT токен
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      // Проверяем, не истек ли токен (базовая проверка)
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length !== 3 || !tokenParts[1]) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          isAdmin.value = false;
          return false;
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          isAdmin.value = true;
          return true;
        } else {
          // Токен истек, удаляем его
          localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
      } catch {
        // Невалидный токен, удаляем
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }

    // Проверяем старый метод для обратной совместимости
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      isAdmin.value = true;
      return true;
    }

    isAdmin.value = false;
    return false;
  };

  /**
   * Сохраняет токен авторизации в localStorage
   */
  const saveAuthToken = (accessToken?: string): void => {
    if (accessToken) {
      // Сохраняем JWT токен
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      // Для обратной совместимости сохраняем старый метод
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    isAdmin.value = true;
    // Уведомляем другие вкладки об изменении
    window.dispatchEvent(
      new CustomEvent('admin-auth-changed', {
        detail: { isAdmin: true },
      })
    );
  };

  /**
   * Удаляет токен авторизации из localStorage
   */
  const removeAuthToken = async (): Promise<void> => {
    // Удаляем оба типа токенов
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    isAdmin.value = false;

    // Вызываем API для очистки refresh token cookie
    try {
      await api.post('/admin/logout');
    } catch (error) {
      // Игнорируем ошибки при logout
      console.warn('Ошибка при выходе из системы:', error);
    }

    // Уведомляем другие вкладки об изменении
    window.dispatchEvent(
      new CustomEvent('admin-auth-changed', {
        detail: { isAdmin: false },
      })
    );
  };

  /**
   * Обработчик события изменения авторизации (для синхронизации между вкладками)
   */
  const handleAuthChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{ isAdmin: boolean }>;
    isAdmin.value = customEvent.detail.isAdmin;
  };

  /**
   * Обработчик события storage (для синхронизации между вкладками)
   */
  const handleStorageChange = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      checkAuthStatus();
    }
  };

  /**
   * Авторизация администратора
   */
  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post<LoginResponse>('/admin/login', { password } as LoginRequest);

      if (response.success) {
        // Сохраняем JWT токен в localStorage
        const accessToken = (response as { accessToken?: string }).accessToken;
        saveAuthToken(accessToken);
        return { success: true };
      } else {
        const errorMessage = response.error || 'Login failed';
        error.value = errorMessage;
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Ошибка авторизации';
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Выход из системы администратора
   */
  const logout = async (): Promise<void> => {
    await removeAuthToken();
  };

  // Проверяем статус при монтировании
  onMounted(() => {
    checkAuthStatus();
    // Слушаем изменения localStorage для синхронизации между вкладками
    window.addEventListener('storage', handleStorageChange);
    // Слушаем кастомные события для синхронизации между вкладками
    window.addEventListener('admin-auth-changed', handleAuthChange);
  });

  // Очищаем слушатели при размонтировании
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('admin-auth-changed', handleAuthChange);
  });

  return {
    isAdmin: computed(() => isAdmin.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    logout,
    checkAuthStatus,
  };
}
