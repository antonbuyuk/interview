/**
 * Типизированный composable для работы с API
 * Предоставляет общие паттерны для загрузки данных, обработки ошибок и состояний загрузки
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { ApiError } from '../api/client';

/**
 * Состояние загрузки данных
 */
export interface UseApiState<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

/**
 * Возвращаемые значения composable
 */
export interface UseApiReturn<T> {
  data: ComputedRef<T | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic composable для загрузки данных через API
 */
export function useApi<T>(apiCall: () => Promise<T>, immediate = false): UseApiReturn<T> {
  const data = ref<T | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const execute = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await apiCall();
      data.value = result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Неизвестная ошибка';
      error.value = errorMessage;
      data.value = null;
      console.error('API call failed:', err);
    } finally {
      loading.value = false;
    }
  };

  const reset = (): void => {
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  if (immediate) {
    execute();
  }

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    execute,
    reset,
  };
}

/**
 * Composable для мутаций (POST, PUT, DELETE)
 */
export interface UseMutationReturn<TData, TVariables = unknown> {
  data: ComputedRef<TData | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  mutate: (variables?: TVariables) => Promise<TData | null>;
  reset: () => void;
}

export function useMutation<TData, TVariables = unknown>(
  mutationFn: (variables?: TVariables) => Promise<TData>
): UseMutationReturn<TData, TVariables> {
  const data = ref<TData | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const mutate = async (variables?: TVariables): Promise<TData | null> => {
    loading.value = true;
    error.value = null;
    data.value = null;

    try {
      const result = await mutationFn(variables);
      data.value = result;
      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Неизвестная ошибка';
      error.value = errorMessage;
      console.error('Mutation failed:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reset = (): void => {
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    mutate,
    reset,
  };
}
