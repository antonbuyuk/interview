import { ref, computed, onMounted, onUnmounted, type ComputedRef } from 'vue';
import { api } from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/api';

const STORAGE_KEY = 'is_auth_admin';

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
   */
  const checkAuthStatus = (): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);
    isAdmin.value = stored === 'true';
    return isAdmin.value;
  };

  /**
   * Сохраняет токен авторизации в localStorage
   */
  const saveAuthToken = (): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
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
  const removeAuthToken = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    isAdmin.value = false;
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
        // Сохраняем токен в localStorage
        saveAuthToken();
        return { success: true };
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка авторизации';
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Выход из системы администратора
   */
  const logout = (): void => {
    removeAuthToken();
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
