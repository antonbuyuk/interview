import { defineStore } from 'pinia';
import { ref, computed, type Ref } from 'vue';
import { getSections } from '../api/sections';
import type { Section } from '../types/api';

export const useSectionsStore = defineStore('sections', () => {
  const sections: Ref<Section[]> = ref([]);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // Промис текущей загрузки для предотвращения дублирования запросов
  let loadPromise: Promise<Section[]> | null = null;

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
        .then(data => {
          sections.value = data;
          loadPromise = null;
          return data;
        })
        .catch(err => {
          error.value = err instanceof Error ? err.message : 'Неизвестная ошибка';
          console.error('Ошибка загрузки разделов:', err);
          loadPromise = null;
          throw err;
        })
        .finally(() => {
          loading.value = false;
        });

      await loadPromise;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка';
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
  };
});
