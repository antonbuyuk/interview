/**
 * Generic factory для создания типизированных Pinia stores
 * Предоставляет общий паттерн для stores с загрузкой данных
 */

import { defineStore } from 'pinia';
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { ApiError } from '../api/client';

/**
 * Конфигурация для generic store
 */
export interface StoreConfig<T> {
  storeName: string;
  loadData: () => Promise<T[]>;
  initialData?: T[];
}

/**
 * Состояние generic store
 */
export interface GenericStoreState<T> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  loadPromise: Promise<T[]> | null;
}

/**
 * Возвращаемые значения generic store
 */
export interface GenericStoreReturn<T> {
  items: ComputedRef<T[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  loadItems: (force?: boolean) => Promise<void>;
  refreshItems: () => Promise<void>;
  getItemById: (id: string, idField?: keyof T) => T | undefined;
  getItemsArray: () => T[];
}

/**
 * Создает generic store с паттерном загрузки данных
 */
export function createGenericStore<T extends { id: string }>(config: StoreConfig<T>) {
  return defineStore(config.storeName, (): GenericStoreReturn<T> => {
    const items = ref<T[]>(config.initialData ?? []);
    const loading: Ref<boolean> = ref<boolean>(false);
    const error: Ref<string | null> = ref<string | null>(null);
    let loadPromise: Promise<T[]> | null = null;

    const loadItems = async (force = false): Promise<void> => {
      try {
        // Если уже загружены и не принудительная загрузка, не загружаем повторно
        if (!force && items.value.length > 0 && !loading.value) {
          return;
        }

        // Если уже идет загрузка, возвращаем существующий промис
        if (loadPromise) {
          await loadPromise;
          return;
        }

        loading.value = true;
        error.value = null;

        loadPromise = config
          .loadData()
          .then((data: T[]) => {
            items.value = data;
            loadPromise = null;
            return data;
          })
          .catch((err: unknown) => {
            const errorMessage =
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Неизвестная ошибка';
            error.value = errorMessage;
            console.error(`Ошибка загрузки данных в store ${config.storeName}:`, err);
            loadPromise = null;
            throw err;
          })
          .finally(() => {
            loading.value = false;
          });

        await loadPromise;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Неизвестная ошибка';
        error.value = errorMessage;
        console.error(`Ошибка загрузки данных в store ${config.storeName}:`, err);
        loadPromise = null;
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const refreshItems = async (): Promise<void> => {
      items.value = [];
      loadPromise = null;
      await loadItems(true);
    };

    const getItemById = (id: string, idField: keyof T = 'id' as keyof T): T | undefined => {
      return items.value.find(item => (item as T)[idField] === id) as T | undefined;
    };

    const getItemsArray = (): T[] => {
      return items.value as T[];
    };

    return {
      items: computed(() => items.value as T[]),
      loading: computed(() => loading.value),
      error: computed(() => error.value),
      loadItems,
      refreshItems,
      getItemById,
      getItemsArray,
    };
  });
}
