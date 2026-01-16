import { ref, computed, watch, type ComputedRef } from 'vue';

const STORAGE_KEY = 'training-mode-settings';

interface TrainingSettings {
  englishOnly: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: SpeechSynthesisVoice | null;
}

const DEFAULT_SETTINGS: TrainingSettings = {
  englishOnly: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoice: null,
};

interface UseTrainingModeReturn {
  englishOnly: ComputedRef<boolean>;
  ttsRate: ComputedRef<number>;
  ttsPitch: ComputedRef<number>;
  settings: ComputedRef<TrainingSettings>;
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
    settings: computed(() => settings.value),

    // Методы
    resetSettings,
    saveSettings,
    loadSettings,
  };
}
