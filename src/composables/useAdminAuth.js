import { ref, computed, watch, onMounted } from 'vue';
import { api } from '../api/client';

/**
 * Composable для работы с авторизацией администратора
 */
export function useAdminAuth() {
  const isAdmin = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * Проверяет наличие cookie is_auth_admin
   */
  const checkAuthStatus = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    isAdmin.value = cookies.is_auth_admin === 'true';
    return isAdmin.value;
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
        // Проверяем статус после успешной авторизации
        checkAuthStatus();
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
    // Удаляем cookie
    document.cookie = 'is_auth_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    isAdmin.value = false;
  };

  // Проверяем статус при монтировании
  onMounted(() => {
    checkAuthStatus();
  });

  // Слушаем изменения cookies (для синхронизации между вкладками)
  const checkInterval = setInterval(() => {
    const wasAdmin = isAdmin.value;
    checkAuthStatus();
    // Если статус изменился, это может быть результат авторизации в другой вкладке
    if (wasAdmin !== isAdmin.value) {
      // Можно добавить событие для уведомления компонентов
      window.dispatchEvent(new CustomEvent('admin-auth-changed', {
        detail: { isAdmin: isAdmin.value }
      }));
    }
  }, 1000); // Проверяем каждую секунду

  // Очищаем интервал при размонтировании (хотя это composable, а не компонент)
  // В реальности интервал будет работать пока компонент использует composable

  return {
    isAdmin: computed(() => isAdmin.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    logout,
    checkAuthStatus,
  };
}