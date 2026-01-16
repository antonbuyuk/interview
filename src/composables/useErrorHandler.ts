/**
 * Composable для централизованной обработки ошибок
 */

import { ref, type Ref } from 'vue';
import { ApiError } from '../api/client';

export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  timestamp: number;
}

const globalError: Ref<ErrorInfo | null> = ref(null);

/**
 * Обработка ошибок API
 */
export function handleApiError(error: unknown): ErrorInfo {
  let errorInfo: ErrorInfo;

  if (error instanceof ApiError) {
    errorInfo = {
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: Date.now(),
    };
  } else if (error instanceof Error) {
    errorInfo = {
      message: error.message,
      timestamp: Date.now(),
    };
  } else {
    errorInfo = {
      message: 'Произошла неизвестная ошибка',
      timestamp: Date.now(),
    };
  }

  // Устанавливаем глобальную ошибку
  globalError.value = errorInfo;

  // Логируем ошибку
  console.error('API Error:', errorInfo);

  return errorInfo;
}

/**
 * Очистка глобальной ошибки
 */
export function clearError(): void {
  globalError.value = null;
}

/**
 * Получить пользовательское сообщение об ошибке
 */
export function getUserFriendlyMessage(error: ErrorInfo): string {
  // Специфичные сообщения для разных кодов ошибок
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Слишком много запросов. Пожалуйста, попробуйте позже.';
    case 'AUTH_RATE_LIMIT_EXCEEDED':
      return 'Слишком много попыток входа. Пожалуйста, попробуйте позже.';
    case 'RATE_LIMIT':
      return 'Сервис временно недоступен. Пожалуйста, попробуйте позже.';
    case 'GROQ_RATE_LIMIT_EXCEEDED':
      return 'Слишком много запросов к AI сервису. Пожалуйста, попробуйте позже.';
    default:
      // Общие сообщения по статус кодам
      switch (error.status) {
        case 400:
          return 'Неверный запрос. Проверьте введенные данные.';
        case 401:
          return 'Требуется авторизация. Пожалуйста, войдите в систему.';
        case 403:
          return 'Доступ запрещен.';
        case 404:
          return 'Запрашиваемый ресурс не найден.';
        case 409:
          return 'Конфликт данных. Возможно, запись уже существует.';
        case 429:
          return 'Слишком много запросов. Пожалуйста, попробуйте позже.';
        case 500:
          return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
        case 503:
          return 'Сервис временно недоступен. Пожалуйста, попробуйте позже.';
        default:
          return error.message || 'Произошла ошибка. Пожалуйста, попробуйте позже.';
      }
  }
}

/**
 * Composable для использования обработки ошибок
 */
export function useErrorHandler() {
  return {
    globalError,
    handleApiError,
    clearError,
    getUserFriendlyMessage,
  };
}
