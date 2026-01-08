import { ref, computed, onUnmounted } from 'vue';
import { useTrainingMode } from './useTrainingMode';

/**
 * Composable для работы с Text-to-Speech API
 */
export function useTextToSpeech() {
  const { ttsRate, ttsPitch } = useTrainingMode();

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

    // Пытаемся найти качественный американский английский голос
    if (!selectedVoice.value && voices.length > 0) {
      // Приоритет: en-US голоса с качественными синтезаторами
      const preferredVoices = [
        // Google TTS голоса (обычно высокого качества)
        voice => voice.lang === 'en-US' && voice.name.toLowerCase().includes('google'),
        // Microsoft голоса
        voice => voice.lang === 'en-US' && voice.name.toLowerCase().includes('microsoft'),
        // Amazon Polly голоса
        voice => voice.lang === 'en-US' && voice.name.toLowerCase().includes('amazon'),
        // Любые en-US голоса
        voice => voice.lang === 'en-US',
        // Fallback: любые английские голоса
        voice => voice.lang.startsWith('en'),
        voice => voice.lang.includes('en'),
      ];

      let foundVoice = null;
      for (const check of preferredVoices) {
        foundVoice = voices.find(check);
        if (foundVoice) break;
      }

      selectedVoice.value = foundVoice || voices[0];
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
    if (!isSupported.value) {
      console.warn('Text-to-Speech не поддерживается');
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

    // Выбираем голос: сначала из опций, потом из выбранного, иначе ищем лучший en-US
    let voiceToUse = options.voice || selectedVoice.value;
    if (!voiceToUse || (options.lang === 'en-US' && voiceToUse.lang !== 'en-US')) {
      // Если нужен en-US, но текущий голос не en-US, ищем лучший
      const enUSVoice =
        availableVoices.value.find(
          v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')
        ) ||
        availableVoices.value.find(
          v => v.lang === 'en-US' && v.name.toLowerCase().includes('microsoft')
        ) ||
        availableVoices.value.find(v => v.lang === 'en-US') ||
        selectedVoice.value;
      voiceToUse = enUSVoice || voiceToUse;
    }

    // Настройки из опций или из настроек по умолчанию
    utterance.rate = options.rate || ttsRate.value;
    utterance.pitch = options.pitch || ttsPitch.value;
    utterance.lang = options.lang || voiceToUse?.lang || 'en-US';
    utterance.voice = voiceToUse;

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
