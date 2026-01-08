import { ref, computed, onUnmounted, type ComputedRef, type Ref } from 'vue';
import { useTrainingMode } from './useTrainingMode';

interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseTextToSpeechReturn {
  isSupported: Ref<boolean>;
  isSpeaking: Ref<boolean>;
  availableVoices: ComputedRef<SpeechSynthesisVoice[]>;
  selectedVoice: ComputedRef<SpeechSynthesisVoice | null>;
  speak: (text: string, options?: SpeakOptions) => void;
  speakQuestion: (questionText: string) => void;
  speakAnswer: (answerText: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  loadVoices: () => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
}

/**
 * Composable для работы с Text-to-Speech API
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const { ttsRate, ttsPitch } = useTrainingMode();

  const isSupported = ref(false);
  const isSpeaking = ref(false);
  const currentUtterance = ref<SpeechSynthesisUtterance | null>(null);
  const availableVoices = ref<SpeechSynthesisVoice[]>([]);
  const selectedVoice = ref<SpeechSynthesisVoice | null>(null);

  // Проверяем поддержку Web Speech API
  const checkSupport = (): void => {
    isSupported.value =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window;
    if (isSupported.value) {
      loadVoices();
    }
  };

  // Загружаем доступные голоса
  const loadVoices = (): void => {
    if (!isSupported.value || typeof window === 'undefined' || !window.speechSynthesis) return;

    const voices = window.speechSynthesis.getVoices();
    availableVoices.value = voices;

    // Пытаемся найти качественный британский английский голос
    if (!selectedVoice.value && voices.length > 0) {
      // Приоритет: en-GB голоса с качественными синтезаторами
      type VoicePredicate = (_voice: SpeechSynthesisVoice) => boolean;
      const preferredVoices: VoicePredicate[] = [
        // Google TTS голоса (обычно высокого качества)
        voice => voice.lang === 'en-GB' && voice.name.toLowerCase().includes('google'),
        // Microsoft голоса
        voice => voice.lang === 'en-GB' && voice.name.toLowerCase().includes('microsoft'),
        // Amazon Polly голоса
        voice => voice.lang === 'en-GB' && voice.name.toLowerCase().includes('amazon'),
        // Любые en-GB голоса
        voice => voice.lang === 'en-GB',
        // Fallback: любые английские голоса
        voice => voice.lang.startsWith('en'),
        voice => voice.lang.includes('en'),
      ];

      let foundVoice: SpeechSynthesisVoice | undefined = undefined;
      for (const check of preferredVoices) {
        foundVoice = voices.find(check);
        if (foundVoice) break;
      }

      selectedVoice.value = foundVoice || voices[0] || null;
    }
  };

  // Инициализация
  checkSupport();

  // Слушаем события загрузки голосов
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }

  /**
   * Озвучивает текст
   */
  const speak = (text: string, options: SpeakOptions = {}): void => {
    if (!isSupported.value) {
      console.warn('Text-to-Speech не поддерживается');
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    // Останавливаем текущее воспроизведение
    stop();

    if (!text || !text.trim()) {
      return;
    }

    // Очищаем HTML теги из текста для озвучивания
    const cleanText = text
      .replace(/<[^>]*>/g, ' ') // Убираем HTML теги
      .replace(/&nbsp;/g, ' ') // Заменяем &nbsp;
      .replace(/&[a-z]+;/gi, ' ') // Убираем HTML entities
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim();

    if (!cleanText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Убеждаемся, что голоса загружены
    if (availableVoices.value.length === 0) {
      loadVoices();
    }

    // Выбираем голос: сначала из опций, потом из выбранного, иначе ищем лучший en-GB
    let voiceToUse = options.voice || selectedVoice.value;
    const targetLang = options.lang || 'en-GB';
    if (!voiceToUse || (targetLang === 'en-GB' && voiceToUse.lang !== 'en-GB')) {
      // Если нужен en-GB, но текущий голос не en-GB, ищем лучший
      const enGBVoice =
        availableVoices.value.find(
          v => v.lang === 'en-GB' && v.name.toLowerCase().includes('google')
        ) ||
        availableVoices.value.find(
          v => v.lang === 'en-GB' && v.name.toLowerCase().includes('microsoft')
        ) ||
        availableVoices.value.find(v => v.lang === 'en-GB') ||
        selectedVoice.value;
      voiceToUse = enGBVoice || voiceToUse;
    }

    // Настройки из опций или из настроек по умолчанию
    utterance.rate = options.rate || ttsRate.value;
    utterance.pitch = options.pitch || ttsPitch.value;
    utterance.lang = options.lang || voiceToUse?.lang || 'en-GB';
    utterance.voice = voiceToUse;

    // Обработчики событий
    utterance.onstart = () => {
      isSpeaking.value = true;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
      currentUtterance.value = null;
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('Ошибка TTS:', event.error);
      isSpeaking.value = false;
      currentUtterance.value = null;
    };

    currentUtterance.value = utterance;
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Останавливает текущее воспроизведение
   */
  const stop = (): void => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking.value) {
      window.speechSynthesis.cancel();
      isSpeaking.value = false;
      currentUtterance.value = null;
    }
  };

  /**
   * Приостанавливает воспроизведение
   */
  const pause = (): void => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking.value) {
      window.speechSynthesis.pause();
    }
  };

  /**
   * Возобновляет воспроизведение
   */
  const resume = (): void => {
    if (typeof window !== 'undefined' && window.speechSynthesis && !isSpeaking.value) {
      window.speechSynthesis.resume();
      isSpeaking.value = true;
    }
  };

  /**
   * Озвучивает вопрос
   */
  const speakQuestion = (questionText: string): void => {
    speak(questionText, { lang: 'en-GB' });
  };

  /**
   * Озвучивает ответ
   */
  const speakAnswer = (answerText: string): void => {
    speak(answerText, { lang: 'en-GB' });
  };

  // Очистка при размонтировании
  onUnmounted(() => {
    stop();
  });

  return {
    // Состояние
    isSupported,
    isSpeaking,
    availableVoices: computed(() => availableVoices.value),
    selectedVoice: computed(() => selectedVoice.value),

    // Методы
    speak,
    speakQuestion,
    speakAnswer,
    stop,
    pause,
    resume,
    loadVoices,
    setVoice: (voice: SpeechSynthesisVoice | null) => {
      selectedVoice.value = voice;
    },
  };
}
