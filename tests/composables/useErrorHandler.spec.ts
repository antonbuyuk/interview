import { describe, it, expect } from 'vitest';
import {
  useErrorHandler,
  handleApiError,
  getUserFriendlyMessage,
} from '../../src/composables/useErrorHandler';
import { ApiError } from '../../src/api/client';

describe('useErrorHandler', () => {
  it('должен обрабатывать ApiError', () => {
    const error = new ApiError('Test error', 400, 'TEST_CODE');
    const errorInfo = handleApiError(error);

    expect(errorInfo.message).toBe('Test error');
    expect(errorInfo.status).toBe(400);
    expect(errorInfo.code).toBe('TEST_CODE');
  });

  it('должен обрабатывать обычную Error', () => {
    const error = new Error('Generic error');
    const errorInfo = handleApiError(error);

    expect(errorInfo.message).toBe('Generic error');
  });

  it('должен возвращать пользовательские сообщения для разных кодов', () => {
    const rateLimitError = { message: 'Rate limit', code: 'RATE_LIMIT_EXCEEDED', status: 429 };
    const message = getUserFriendlyMessage(rateLimitError as any);

    expect(message.toLowerCase()).toContain('слишком много');
  });

  it('должен возвращать пользовательские сообщения для статус кодов', () => {
    const notFoundError = { message: 'Not found', status: 404 };
    const message = getUserFriendlyMessage(notFoundError as any);

    expect(message).toContain('не найден');
  });

  it('должен использовать composable правильно', () => {
    const { globalError, handleApiError, clearError } = useErrorHandler();

    const error = new ApiError('Test', 500);
    handleApiError(error);

    expect(globalError.value).toBeTruthy();
    expect(globalError.value?.message).toBe('Test');

    clearError();
    expect(globalError.value).toBeNull();
  });
});
