import { ref, computed, watch } from 'vue';
import { parseQuestionsForTraining } from '../utils/questionParser';

const STORAGE_KEY = 'training-mode-settings';
const DEFAULT_SETTINGS = {
  englishOnly: false,
  ttsEnabled: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoice: null,
  flashCardAutoFlip: false,
  flashCardDuration: 10,
  practiceTimerDuration: 2,
};

// Глобальное состояние
const settings = ref({
  ...DEFAULT_SETTINGS,
});

// Загружаем настройки из localStorage
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      settings.value = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек тренировки:', error);
  }
};

// Сохраняем настройки в localStorage
const saveSettings = () => {
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
export function useTrainingMode() {
  const englishOnly = computed({
    get: () => settings.value.englishOnly,
    set: value => {
      settings.value.englishOnly = value;
    },
  });

  const ttsEnabled = computed({
    get: () => settings.value.ttsEnabled,
    set: value => {
      settings.value.ttsEnabled = value;
    },
  });

  const ttsRate = computed({
    get: () => settings.value.ttsRate,
    set: value => {
      settings.value.ttsRate = value;
    },
  });

  const ttsPitch = computed({
    get: () => settings.value.ttsPitch,
    set: value => {
      settings.value.ttsPitch = value;
    },
  });

  const flashCardDuration = computed({
    get: () => settings.value.flashCardDuration,
    set: value => {
      settings.value.flashCardDuration = value;
    },
  });

  const practiceTimerDuration = computed({
    get: () => settings.value.practiceTimerDuration,
    set: value => {
      settings.value.practiceTimerDuration = value;
    },
  });

  /**
   * Извлекает структурированные данные о вопросах из markdown
   */
  const extractQuestionData = (markdown, sectionId) => {
    return parseQuestionsForTraining(markdown, sectionId);
  };

  /**
   * Сбрасывает настройки к значениям по умолчанию
   */
  const resetSettings = () => {
    settings.value = { ...DEFAULT_SETTINGS };
    saveSettings();
  };

  return {
    // Состояние
    englishOnly,
    ttsEnabled,
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
