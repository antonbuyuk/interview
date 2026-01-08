import { ref, computed, watch, type ComputedRef } from 'vue';
import { parseQuestionsForTraining } from '../utils/questionParser';

const STORAGE_KEY = 'training-mode-settings';

interface TrainingSettings {
  englishOnly: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: SpeechSynthesisVoice | null;
  flashCardAutoFlip: boolean;
  flashCardDuration: number;
  practiceTimerDuration: number;
}

const DEFAULT_SETTINGS: TrainingSettings = {
  englishOnly: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoice: null,
  flashCardAutoFlip: false,
  flashCardDuration: 10,
  practiceTimerDuration: 2,
};

interface ParsedQuestion {
  id: string;
  number: number;
  question: string;
  questionRaw: string;
  answerRu: string | null;
  answerEn: string | null;
  answerSenior: string | null;
  codeBlocks: Array<{ language: string; code: string }>;
  rawMarkdown: string;
  sectionId: string;
  hasAnswerEn: boolean;
  hasAnswerRu: boolean;
  hasAnswerSenior: boolean;
}

interface UseTrainingModeReturn {
  englishOnly: ComputedRef<boolean>;
  ttsRate: ComputedRef<number>;
  ttsPitch: ComputedRef<number>;
  flashCardDuration: ComputedRef<number>;
  practiceTimerDuration: ComputedRef<number>;
  settings: ComputedRef<TrainingSettings>;
  extractQuestionData: (markdown: string, sectionId: string) => ParsedQuestion[];
  resetSettings: () => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

// Глобальное состояние
const settings = ref<TrainingSettings>({
  ...DEFAULT_SETTINGS,
});

// Загружаем настройки из localStorage
const loadSettings = (): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<TrainingSettings>;
      settings.value = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек тренировки:', error);
  }
};

// Сохраняем настройки в localStorage
const saveSettings = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
  } catch (error) {
    console.error('Ошибка сохранения настроек тренировки:', error);
  }
};

// Загружаем настройки при инициализации
loadSettings();

// Автоматически сохраняем при изменении настроек
watch(
  settings,
  () => {
    saveSettings();
  },
  { deep: true }
);

/**
 * Composable для управления режимами обучения
 */
export function useTrainingMode(): UseTrainingModeReturn {
  const englishOnly = computed({
    get: () => settings.value.englishOnly,
    set: (value: boolean) => {
      settings.value.englishOnly = value;
    },
  });

  const ttsRate = computed({
    get: () => settings.value.ttsRate,
    set: (value: number) => {
      settings.value.ttsRate = value;
    },
  });

  const ttsPitch = computed({
    get: () => settings.value.ttsPitch,
    set: (value: number) => {
      settings.value.ttsPitch = value;
    },
  });

  const flashCardDuration = computed({
    get: () => settings.value.flashCardDuration,
    set: (value: number) => {
      settings.value.flashCardDuration = value;
    },
  });

  const practiceTimerDuration = computed({
    get: () => settings.value.practiceTimerDuration,
    set: (value: number) => {
      settings.value.practiceTimerDuration = value;
    },
  });

  /**
   * Извлекает структурированные данные о вопросах из markdown
   */
  const extractQuestionData = (markdown: string, sectionId: string): ParsedQuestion[] => {
    return parseQuestionsForTraining(markdown, sectionId);
  };

  /**
   * Сбрасывает настройки к значениям по умолчанию
   */
  const resetSettings = (): void => {
    settings.value = { ...DEFAULT_SETTINGS };
    saveSettings();
  };

  return {
    // Состояние
    englishOnly,
    ttsRate,
    ttsPitch,
    flashCardDuration,
    practiceTimerDuration,
    settings: computed(() => settings.value),

    // Методы
    extractQuestionData,
    resetSettings,
    saveSettings,
    loadSettings,
  };
}
