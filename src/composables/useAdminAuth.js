import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '../api/client';

const STORAGE_KEY = 'is_auth_admin';

/**
 * Composable для работы с авторизацией администратора
 */
export function useAdminAuth() {
  const isAdmin = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * Проверяет наличие токена в localStorage
   */
  const checkAuthStatus = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    isAdmin.value = stored === 'true';
    return isAdmin.value;
  };

  /**
   * Сохраняет токен авторизации в localStorage
   */
  const saveAuthToken = () => {
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
  const removeAuthToken = () => {
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
  const handleAuthChange = event => {
    isAdmin.value = event.detail.isAdmin;
  };

  /**
   * Обработчик события storage (для синхронизации между вкладками)
   */
  const handleStorageChange = event => {
    if (event.key === STORAGE_KEY) {
      checkAuthStatus();
    }
  };

  /**
   * Авторизация администратора
   */
  const login = async password => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/admin/login', { password });

      if (response.success) {
        // Сохраняем токен в localStorage
        saveAuthToken();
        return { success: true };
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      error.value = err.message || 'Ошибка авторизации';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Выход из системы администратора
   */
  const logout = () => {
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
