import { ref, computed, onUnmounted } from 'vue';
import { useTrainingMode } from './useTrainingMode';

/**
 * Composable для работы с Text-to-Speech API
 */
export function useTextToSpeech() {
  const { ttsEnabled, ttsRate, ttsPitch } = useTrainingMode();

  const isSupported = ref(false);
  const isSpeaking = ref(false);
  const currentUtterance = ref(null);
  const availableVoices = ref([]);
  const selectedVoice = ref(null);

  // Проверяем поддержку Web Speech API
  const checkSupport = () => {
    isSupported.value = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (isSupported.value) {
      loadVoices();
    }
  };

  // Загружаем доступные голоса
  const loadVoices = () => {
    if (!isSupported.value) return;

    const voices = window.speechSynthesis.getVoices();
    availableVoices.value = voices;

    // Пытаемся найти английский голос по умолчанию
    if (!selectedVoice.value && voices.length > 0) {
      // Ищем английский голос
      const englishVoice =
        voices.find(voice => voice.lang.startsWith('en')) ||
        voices.find(voice => voice.lang.includes('en')) ||
        voices[0];
      selectedVoice.value = englishVoice;
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
   * @param {string} text - текст для озвучивания
   * @param {Object} options - опции (lang, rate, pitch, voice)
   */
  const speak = (text, options = {}) => {
    if (!isSupported.value || !ttsEnabled.value) {
      console.warn('Text-to-Speech не поддерживается или отключен');
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

    // Настройки из опций или из настроек по умолчанию
    utterance.rate = options.rate || ttsRate.value;
    utterance.pitch = options.pitch || ttsPitch.value;
    utterance.lang = options.lang || selectedVoice.value?.lang || 'en-US';
    utterance.voice = options.voice || selectedVoice.value;

    // Обработчики событий
    utterance.onstart = () => {
      isSpeaking.value = true;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
      currentUtterance.value = null;
    };

    utterance.onerror = event => {
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
  const stop = () => {
    if (window.speechSynthesis && isSpeaking.value) {
      window.speechSynthesis.cancel();
      isSpeaking.value = false;
      currentUtterance.value = null;
    }
  };

  /**
   * Приостанавливает воспроизведение
   */
  const pause = () => {
    if (window.speechSynthesis && isSpeaking.value) {
      window.speechSynthesis.pause();
    }
  };

  /**
   * Возобновляет воспроизведение
   */
  const resume = () => {
    if (window.speechSynthesis && !isSpeaking.value) {
      window.speechSynthesis.resume();
      isSpeaking.value = true;
    }
  };

  /**
   * Озвучивает вопрос
   */
  const speakQuestion = questionText => {
    speak(questionText, { lang: 'en-US' });
  };

  /**
   * Озвучивает ответ
   */
  const speakAnswer = answerText => {
    speak(answerText, { lang: 'en-US' });
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
    setVoice: voice => {
      selectedVoice.value = voice;
    },
  };
}
