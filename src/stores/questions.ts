import { defineStore } from 'pinia';
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { getQuestions } from '../api/questions';
import type { Question } from '../types/api';
import { ApiError } from '../api/client';

// Типы для возвращаемых значений store
export interface QuestionsStoreReturn {
  questions: ComputedRef<Map<string, Question[]>>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  loadQuestions: (sectionId: string, force?: boolean) => Promise<Question[]>;
  getQuestionsBySection: (sectionId: string) => Question[];
  clearQuestions: (sectionId?: string) => void;
  refreshQuestions: (sectionId: string) => Promise<Question[]>;
  // Оптимистичные обновления
  optimisticAddQuestion: (sectionId: string, question: Question) => void;
  optimisticUpdateQuestion: (
    sectionId: string,
    questionId: string,
    updates: Partial<Question>
  ) => void;
  optimisticRemoveQuestion: (sectionId: string, questionId: string) => void;
  optimisticReorderQuestions: (sectionId: string, questionIds: string[]) => void;
  rollbackOptimisticUpdate: (sectionId: string) => void;
}

export const useQuestionsStore = defineStore('questions', (): QuestionsStoreReturn => {
  // Кеш вопросов по sectionId
  const questions: Ref<Map<string, Question[]>> = ref<Map<string, Question[]>>(new Map());
  const loading: Ref<boolean> = ref<boolean>(false);
  const error: Ref<string | null> = ref<string | null>(null);

  // Промисы текущих загрузок для предотвращения дублирования запросов
  const loadPromises: Map<string, Promise<Question[]>> = new Map();

  // Состояние для отката оптимистичных обновлений
  const previousQuestions: Map<string, Question[]> = new Map();

  const loadQuestions = async (sectionId: string, force = false): Promise<Question[]> => {
    try {
      // Если уже загружены и не принудительная загрузка, возвращаем из кеша
      if (!force && questions.value.has(sectionId) && !loading.value) {
        return questions.value.get(sectionId) || [];
      }

      // Если уже идет загрузка для этого раздела, возвращаем существующий промис
      const existingPromise = loadPromises.get(sectionId);
      if (existingPromise) {
        return await existingPromise;
      }

      loading.value = true;
      error.value = null;

      const promise = getQuestions(sectionId)
        .then((data: Question[]) => {
          questions.value.set(sectionId, data);
          loadPromises.delete(sectionId);
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
          console.error('Ошибка загрузки вопросов:', err);
          loadPromises.delete(sectionId);
          throw err;
        })
        .finally(() => {
          loading.value = false;
        });

      loadPromises.set(sectionId, promise);
      return await promise;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Неизвестная ошибка';
      error.value = errorMessage;
      console.error('Ошибка загрузки вопросов:', err);
      loadPromises.delete(sectionId);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getQuestionsBySection = (sectionId: string): Question[] => {
    return questions.value.get(sectionId) || [];
  };

  const clearQuestions = (sectionId?: string): void => {
    if (sectionId) {
      questions.value.delete(sectionId);
      loadPromises.delete(sectionId);
    } else {
      questions.value.clear();
      loadPromises.clear();
    }
  };

  const refreshQuestions = async (sectionId: string): Promise<Question[]> => {
    // Очищаем кеш перед загрузкой
    questions.value.delete(sectionId);
    loadPromises.delete(sectionId);
    return await loadQuestions(sectionId, true);
  };

  // Оптимистичное добавление вопроса
  const optimisticAddQuestion = (sectionId: string, question: Question): void => {
    const currentQuestions = questions.value.get(sectionId) || [];
    previousQuestions.set(sectionId, [...currentQuestions]);
    questions.value.set(sectionId, [question, ...currentQuestions]);
  };

  // Оптимистичное обновление вопроса
  const optimisticUpdateQuestion = (
    sectionId: string,
    questionId: string,
    updates: Partial<Question>
  ): void => {
    const currentQuestions = questions.value.get(sectionId) || [];
    previousQuestions.set(sectionId, [...currentQuestions]);
    questions.value.set(
      sectionId,
      currentQuestions.map(q => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  // Оптимистичное удаление вопроса
  const optimisticRemoveQuestion = (sectionId: string, questionId: string): void => {
    const currentQuestions = questions.value.get(sectionId) || [];
    previousQuestions.set(sectionId, [...currentQuestions]);
    questions.value.set(
      sectionId,
      currentQuestions.filter(q => q.id !== questionId)
    );
  };

  // Оптимистичное изменение порядка вопросов
  const optimisticReorderQuestions = (sectionId: string, questionIds: string[]): void => {
    const currentQuestions = questions.value.get(sectionId) || [];
    previousQuestions.set(sectionId, [...currentQuestions]);
    const questionMap = new Map(currentQuestions.map(q => [q.id, q]));
    const reordered = questionIds.map(id => questionMap.get(id)).filter(Boolean) as Question[];
    questions.value.set(sectionId, reordered);
  };

  // Откат оптимистичного обновления
  const rollbackOptimisticUpdate = (sectionId: string): void => {
    const previous = previousQuestions.get(sectionId);
    if (previous) {
      questions.value.set(sectionId, previous);
      previousQuestions.delete(sectionId);
    }
  };

  return {
    // State
    questions: computed(() => questions.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Actions
    loadQuestions,
    getQuestionsBySection,
    clearQuestions,
    refreshQuestions,

    // Optimistic updates
    optimisticAddQuestion,
    optimisticUpdateQuestion,
    optimisticRemoveQuestion,
    optimisticReorderQuestions,
    rollbackOptimisticUpdate,
  };
});
