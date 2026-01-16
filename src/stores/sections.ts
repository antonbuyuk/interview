import { defineStore } from 'pinia';
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { getSections } from '../api/sections';
import type { Section } from '../types/api';
import { ApiError } from '../api/client';

// Типы для возвращаемых значений store
export interface SectionsStoreReturn {
  sections: ComputedRef<Section[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  loadSections: (force?: boolean) => Promise<void>;
  refreshSections: () => Promise<void>;
  getSectionById: (id: string) => Section | undefined;
  getSectionByPath: (path: string) => Section | undefined;
  getSectionsArray: () => Section[];
  // Оптимистичные обновления
  optimisticAddSection: (section: Section) => void;
  optimisticUpdateSection: (id: string, updates: Partial<Section>) => void;
  optimisticRemoveSection: (id: string) => void;
  rollbackOptimisticUpdate: () => void;
}

export const useSectionsStore = defineStore('sections', (): SectionsStoreReturn => {
  const sections: Ref<Section[]> = ref<Section[]>([]);
  const loading: Ref<boolean> = ref<boolean>(false);
  const error: Ref<string | null> = ref<string | null>(null);

  // Промис текущей загрузки для предотвращения дублирования запросов
  let loadPromise: Promise<Section[]> | null = null;

  // Состояние для отката оптимистичных обновлений
  let previousSections: Section[] | null = null;

  const loadSections = async (force = false): Promise<void> => {
    try {
      // Если уже загружены и не принудительная загрузка, не загружаем повторно
      if (!force && sections.value.length > 0 && !loading.value) {
        return;
      }

      // Если уже идет загрузка, возвращаем существующий промис
      if (loadPromise) {
        await loadPromise;
        return;
      }

      loading.value = true;
      error.value = null;

      loadPromise = getSections()
        .then((data: Section[]) => {
          sections.value = data;
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
          console.error('Ошибка загрузки разделов:', err);
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
      console.error('Ошибка загрузки разделов:', err);
      loadPromise = null;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refreshSections = async (): Promise<void> => {
    // Очищаем секции и промис перед загрузкой
    sections.value = [];
    loadPromise = null;
    await loadSections(true);
  };

  const getSectionById = (id: string): Section | undefined => {
    return sections.value.find(section => section.id === id);
  };

  const getSectionByPath = (path: string): Section | undefined => {
    return sections.value.find(section => section.path === path);
  };

  // Геттер для получения массива разделов напрямую (для использования вне компонентов)
  const getSectionsArray = (): Section[] => {
    return sections.value;
  };

  // Оптимистичное добавление раздела
  const optimisticAddSection = (section: Section): void => {
    previousSections = [...sections.value];
    sections.value = [section, ...sections.value];
  };

  // Оптимистичное обновление раздела
  const optimisticUpdateSection = (id: string, updates: Partial<Section>): void => {
    previousSections = [...sections.value];
    sections.value = sections.value.map(section =>
      section.id === id ? { ...section, ...updates } : section
    );
  };

  // Оптимистичное удаление раздела
  const optimisticRemoveSection = (id: string): void => {
    previousSections = [...sections.value];
    sections.value = sections.value.filter(section => section.id !== id);
  };

  // Откат оптимистичного обновления
  const rollbackOptimisticUpdate = (): void => {
    if (previousSections) {
      sections.value = previousSections;
      previousSections = null;
    }
  };

  return {
    // State
    sections: computed(() => sections.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Actions
    loadSections,
    refreshSections,
    getSectionById,
    getSectionByPath,
    getSectionsArray,

    // Optimistic updates
    optimisticAddSection,
    optimisticUpdateSection,
    optimisticRemoveSection,
    rollbackOptimisticUpdate,
  };
});
