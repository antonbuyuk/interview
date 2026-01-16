/**
 * Composable для управления Toast уведомлениями
 */

import { ref, type Ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // В миллисекундах, по умолчанию 5000
}

const toasts: Ref<Toast[]> = ref([]);

/**
 * Показывает toast уведомление
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 5000
): void {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const toast: Toast = {
    id,
    message,
    type,
    duration,
  };

  toasts.value.push(toast);

  // Автоматически удаляем toast через указанное время
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

/**
 * Удаляет toast уведомление
 */
export function removeToast(id: string): void {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
}

/**
 * Очищает все toast уведомления
 */
export function clearToasts(): void {
  toasts.value = [];
}

/**
 * Composable для использования toast уведомлений
 */
export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
}
