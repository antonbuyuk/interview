<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :class="{ recording: isRecording }"
        :placeholder="isRecording ? 'Говорите...' : 'Поиск по вопросам...'"
        :disabled="isRecording"
        @input="handleSearch"
        @focus="isFocused = true"
        @blur="handleBlur"
      />
      <MagnifyingGlassIcon class="search-icon" />
      <button
        v-if="!isRecording && !searchQuery"
        class="voice-btn"
        title="Голосовой поиск"
        @click="startVoiceSearch"
      >
        <MicrophoneIcon class="icon-small" />
      </button>
      <button
        v-if="isRecording"
        class="voice-btn recording"
        title="Остановить запись"
        @click="stopVoiceSearch"
      >
        <StopIconSolid class="icon-small" />
      </button>
      <button
        v-if="searchQuery && !isRecording"
        class="clear-btn"
        title="Очистить поиск"
        @click="clearSearch"
      >
        <XMarkIcon class="icon-small" />
      </button>
      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        <span class="recording-text">Идет запись...</span>
      </div>
    </div>

    <!-- Результаты поиска -->
    <div
      v-if="searchQuery && (localResults.length > 0 || globalResults.length > 0)"
      class="search-results"
    >
      <!-- Локальные результаты (текущая секция) -->
      <div v-if="localResults.length > 0" class="results-section">
        <h4 class="results-title">В текущем разделе ({{ localResults.length }})</h4>
        <div class="results-list">
          <a
            v-for="result in localResults"
            :key="result.id"
            :href="`#${result.id}`"
            class="result-item"
            @click.prevent="scrollToResult(result.id)"
          >
            <span class="result-number">{{ result.number }}.</span>
            <span class="result-text" v-html="highlightText(result.text, searchQuery)"></span>
          </a>
        </div>
      </div>

      <!-- Глобальные результаты (другие разделы) -->
      <div v-if="globalResults.length > 0" class="results-section">
        <h4 class="results-title">В других разделах ({{ globalResults.length }})</h4>
        <div class="results-list">
          <router-link
            v-for="result in globalResults"
            :key="result.id"
            :to="`${result.path}#${result.id}`"
            class="result-item"
            @click="handleGlobalResultClick(result.id)"
          >
            <span class="result-section">{{ result.sectionTitle }}</span>
            <span
              class="result-text"
              v-html="highlightText(result.questionText, searchQuery)"
            ></span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Нет результатов -->
    <div
      v-else-if="searchQuery && localResults.length === 0 && globalResults.length === 0"
      class="no-results"
    >
      <p>Ничего не найдено</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSectionsStore } from '../../stores/sections';
import { getQuestions } from '../../api/questions.js';
import { MagnifyingGlassIcon, MicrophoneIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { StopIcon as StopIconSolid } from '@heroicons/vue/24/solid';
import type { Section, Question } from '../../types/api';

// Типы для результатов поиска
interface LocalSearchResult {
  id: string;
  number: number;
  text: string;
  score: number;
}

interface GlobalSearchResult {
  id: string;
  sectionTitle: string;
  questionText: string;
  path: string;
  score: number;
}

interface QuestionSearchItem {
  id: string;
  text: string;
  number: number;
}

// Расширяем Window интерфейс для Speech Recognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const props = defineProps<{
  currentSection: Section | null;
  questions: Question[];
}>();

const emit = defineEmits<{
  'result-click': [id: string];
}>();

const route = useRoute();
const searchQuery = ref('');
const isFocused = ref(false);
const localResults = ref<LocalSearchResult[]>([]);
const globalResults = ref<GlobalSearchResult[]>([]);
const searchCache = ref<Map<string, GlobalSearchResult[]>>(new Map());
const currentQuestions = ref<QuestionSearchItem[]>([]);
const pendingQuestionId = ref<string | null>(null);
const isRecording = ref(false);
const recognition = ref<SpeechRecognition | null>(null);
const isSpeechSupported = ref(false);
const sectionsStore = useSectionsStore();
const { sections: allSections } = storeToRefs(sectionsStore);

// Поиск с задержкой (debounce)
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Инициализация Speech Recognition API
const initSpeechRecognition = () => {
  if (typeof window === 'undefined') return;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    isSpeechSupported.value = false;
    return;
  }

  isSpeechSupported.value = true;
  recognition.value = new SpeechRecognitionClass();
  if (recognition.value) {
    recognition.value.continuous = false;
    recognition.value.interimResults = false;
    recognition.value.lang = 'ru-RU'; // Русский язык

    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
      const firstResult = event.results[0];
      if (firstResult && firstResult[0]) {
        const transcript = firstResult[0].transcript;
        searchQuery.value = transcript.trim();
        performSearch();
        isRecording.value = false;
      }
    };

    recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Ошибка распознавания речи:', event.error);
      isRecording.value = false;

      if (event.error === 'no-speech') {
        alert('Речь не распознана. Попробуйте еще раз.');
      } else if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.');
      }
    };

    recognition.value.onend = () => {
      isRecording.value = false;
    };
  }
};

// Инициализация при монтировании
onMounted(() => {
  initSpeechRecognition();
});

onUnmounted(() => {
  if (recognition.value && isRecording.value) {
    recognition.value.stop();
  }
});

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
};

const loadCurrentSectionQuestions = async () => {
  if (!props.currentSection) {
    currentQuestions.value = [];
    return;
  }

  try {
    // Получаем раздел из store по sectionId
    const section = allSections.value.find(
      (s: Section) => s.sectionId === props.currentSection?.sectionId
    );

    if (!section) {
      currentQuestions.value = [];
      return;
    }

    // Загружаем вопросы через API
    const questions = await getQuestions(section.id);
    currentQuestions.value = questions.map((q: Question) => ({
      id: `question-${q.number}`,
      text: q.question,
      number: q.number,
    }));
  } catch (err) {
    console.error('Ошибка загрузки вопросов текущей секции:', err);
    currentQuestions.value = [];
  }
};

// Функция для разбивки запроса на ключевые слова
const extractKeywords = (query: string): string[] => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word: string) => word.length > 0)
    .filter(
      (word: string) =>
        !['и', 'или', 'или', 'the', 'a', 'an', 'и', 'в', 'на', 'с', 'по'].includes(word)
    );
};

// Поиск по ключевым словам
const matchesKeywords = (text: string, keywords: string[]): { matches: boolean; score: number } => {
  if (keywords.length === 0) return { matches: false, score: 0 };

  const lowerText = text.toLowerCase();

  // Подсчитываем количество совпадений
  let matchCount = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      matchCount++;
    }
  }

  // Возвращаем объект с результатом и количеством совпадений
  return {
    matches: matchCount > 0,
    score: matchCount,
  };
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    localResults.value = [];
    globalResults.value = [];
    return;
  }

  const query = searchQuery.value.trim();
  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    localResults.value = [];
    globalResults.value = [];
    return;
  }

  // Загружаем вопросы текущей секции, если еще не загружены
  if (props.currentSection && currentQuestions.value.length === 0) {
    await loadCurrentSectionQuestions();
  }

  // Поиск в текущей секции - используем переданные questions или загружаем
  const questionsToSearch: QuestionSearchItem[] =
    props.questions.length > 0
      ? props.questions.map(q => ({
          id: `question-${q.number}`,
          text: q.question,
          number: q.number,
        }))
      : currentQuestions.value;

  if (questionsToSearch.length > 0) {
    const results: LocalSearchResult[] = questionsToSearch
      .map((q, index) => {
        const matchResult = matchesKeywords(q.text, keywords);
        return {
          id: q.id || `question-${index + 1}`,
          number: q.number || index + 1,
          text: q.text,
          score: matchResult.score,
        };
      })
      .filter((q): q is LocalSearchResult => q.score > 0)
      .sort((a, b) => b.score - a.score) // Сортируем по количеству совпадений
      .slice(0, 10); // Ограничиваем до 10 результатов

    localResults.value = results;
  }

  // Поиск в других секциях
  if (query.length >= 2) {
    await searchInAllSections(keywords);
  } else {
    globalResults.value = [];
  }
};

const searchInAllSections = async (keywords: string[]) => {
  const results: GlobalSearchResult[] = [];
  const currentSectionId = props.currentSection?.sectionId;

  // Используем секции из store (они уже загружены в App.vue)
  if (allSections.value.length === 0) {
    return;
  }

  for (const section of allSections.value as Section[]) {
    // Пропускаем текущую секцию
    if (section.sectionId === currentSectionId) continue;

    try {
      // Проверяем кеш (используем строку ключевых слов для ключа кеша)
      const cacheKey = `${section.sectionId}:${keywords.join(' ')}`;
      if (searchCache.value.has(cacheKey)) {
        const cached = searchCache.value.get(cacheKey);
        if (cached) {
          results.push(...cached);
        }
        continue;
      }

      // Загружаем вопросы через API
      const questions = await getQuestions(section.id);

      const sectionResults: GlobalSearchResult[] = questions
        .map((q: Question) => {
          const matchResult = matchesKeywords(q.question, keywords);
          return {
            id: `question-${q.number}`,
            sectionTitle: section.title,
            questionText: q.question,
            path: section.path,
            score: matchResult.score,
          };
        })
        .filter((q): q is GlobalSearchResult => q.score > 0)
        .sort((a, b) => b.score - a.score) // Сортируем по количеству совпадений
        .slice(0, 3); // По 3 результата из каждой секции

      // Кешируем результаты
      searchCache.value.set(cacheKey, sectionResults);
      results.push(...sectionResults);

      // Ограничиваем общее количество
      if (results.length >= 10) break;
    } catch (err) {
      console.error(`Ошибка поиска в секции ${section.title}:`, err);
    }
  }

  // Сортируем все результаты по количеству совпадений
  results.sort((a, b) => b.score - a.score);
  globalResults.value = results.slice(0, 10);
};

const highlightText = (text: string, query: string): string => {
  if (!query) return text;

  // Разбиваем запрос на ключевые слова для подсветки
  const keywords = extractKeywords(query);

  let highlightedText = text;
  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  }

  return highlightedText;
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const scrollToResult = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 120;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    emit('result-click', id);
    closeSearch();
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  localResults.value = [];
  globalResults.value = [];
  isFocused.value = false;
};

const closeSearch = () => {
  isFocused.value = false;
};

const handleGlobalResultClick = (questionId: string) => {
  pendingQuestionId.value = questionId;
  closeSearch();
};

// Голосовой поиск
const startVoiceSearch = () => {
  if (!isSpeechSupported.value) {
    alert(
      'Голосовой поиск не поддерживается в вашем браузере. Используйте Chrome, Edge или Safari.'
    );
    return;
  }

  if (!recognition.value) {
    initSpeechRecognition();
  }

  try {
    isRecording.value = true;
    if (recognition.value) {
      recognition.value.start();
    }
  } catch (err) {
    console.error('Ошибка запуска распознавания:', err);
    isRecording.value = false;
    alert('Не удалось запустить распознавание речи. Проверьте доступ к микрофону.');
  }
};

const stopVoiceSearch = () => {
  if (recognition.value && isRecording.value) {
    recognition.value.stop();
    isRecording.value = false;
  }
};

// Функция для прокрутки к вопросу после загрузки раздела
const scrollToPendingQuestion = () => {
  if (!pendingQuestionId.value) return;

  // Ждем загрузки контента и рендеринга DOM
  const attemptScroll = (): boolean => {
    if (!pendingQuestionId.value) return false;
    const element = document.getElementById(pendingQuestionId.value);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      pendingQuestionId.value = null;
      return true;
    }
    return false;
  };

  // Пробуем сразу
  if (attemptScroll()) return;

  // Если не получилось, пробуем через небольшие интервалы
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (attemptScroll() || attempts >= maxAttempts) {
      clearInterval(interval);
      if (attempts >= maxAttempts) {
        pendingQuestionId.value = null;
      }
    }
  }, 100);
};

const handleBlur = () => {
  // Задержка, чтобы клики по результатам успели сработать
  setTimeout(() => {
    isFocused.value = false;
  }, 200);
};

// Следим за изменением секции
watch(
  () => route.path,
  () => {
    clearSearch();
    searchCache.value.clear();
    currentQuestions.value = [];

    // Если есть hash в URL, прокручиваем к вопросу
    if (route.hash) {
      const questionId = route.hash.substring(1);
      if (questionId) {
        pendingQuestionId.value = questionId;
        nextTick(() => {
          scrollToPendingQuestion();
        });
      }
    }
  }
);

// Следим за изменением hash в URL
watch(
  () => route.hash,
  (newHash: string) => {
    if (newHash) {
      const questionId = newHash.substring(1);
      if (questionId) {
        pendingQuestionId.value = questionId;
        nextTick(() => {
          scrollToPendingQuestion();
        });
      }
    }
  }
);

// Загружаем вопросы при изменении секции
watch(
  () => props.currentSection,
  async (newSection: Section | null) => {
    currentQuestions.value = [];
    if (newSection && searchQuery.value) {
      await loadCurrentSectionQuestions();
      performSearch();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.search-container {
  position: relative;
  z-index: 11;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2rem;
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  color: #333;
  font-size: 0.875rem;
  @include transition;
}

.search-input.recording {
  border-color: $error-color;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.search-input:disabled {
  background: #f9f9f9;
  cursor: not-allowed;
}

.search-input.recording {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: $primary-color;
  background: white;
  @include shadow-focus;
}

.search-input::placeholder {
  color: $text-light-gray;
}

.search-icon {
  position: absolute;
  left: 0.625rem;
  width: 0.875rem;
  height: 0.875rem;
  color: $text-light-gray;
  pointer-events: none;
}

.voice-btn {
  position: absolute;
  right: 0.4rem;
  background: transparent;
  border: none;
  color: $text-light-gray;
  cursor: pointer;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  @include transition;
  z-index: 5;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }
}

.voice-btn:hover {
  background: $bg-light;
  color: #42b883;
}

.voice-btn.recording {
  color: $error-color;
  animation: pulse 1.5s ease-in-out infinite;
}

.voice-btn.recording:hover {
  background: $error-bg;
  color: $error-color;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.clear-btn {
  position: absolute;
  right: 0.4rem;
  background: transparent;
  border: none;
  color: $text-light-gray;
  cursor: pointer;
  font-size: 1rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  @include transition;
  z-index: 5;

  .icon-small {
    width: 0.875rem;
    height: 0.875rem;
    color: inherit;
  }
}

.clear-btn:hover {
  background: $bg-light;
  color: #333;
}

.recording-indicator {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: $error-bg;
  border: 1px solid $error-color;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: $error-color;
  z-index: 1101;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: $error-color;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.recording-text {
  font-weight: 500;
}

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid $border-color;
  min-width: 25rem;
  @include rounded-md;
  @include shadow-lg;
  z-index: 1100 !important;
}

@media (max-width: 768px) {
  .search-results {
    max-height: calc(100vh - 200px);
    border-radius: 6px;
  }

  .search-input {
    font-size: 1rem; /* Увеличиваем для лучшей читаемости на мобильных */
  }
}

.results-section {
  padding: 0.5rem 0;
}

.results-title {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  padding: 0.4rem 0.75rem;
  margin: 0;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: #333;
  @include transition;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:hover {
  background: #f5f5f5;
  color: #42b883;
}

.result-item:last-child {
  border-bottom: none;
}

.result-number {
  font-weight: 600;
  color: #42b883;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.result-section {
  font-size: 0.75rem;
  color: #666;
  margin-right: 0.5rem;
  flex-shrink: 0;
  font-weight: 500;
}

.result-text {
  font-size: 0.8125rem;
  line-height: 1.4;
  flex: 1;
}

.result-text :deep(mark) {
  background: rgba(66, 184, 131, 0.3);
  color: #42b883;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

.no-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  @include rounded-md;
  text-align: center;
  color: $text-light-gray;
  font-size: 0.875rem;
  z-index: 1100 !important;
}

/* Скроллбар */
.search-results::-webkit-scrollbar,
.results-list::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track,
.results-list::-webkit-scrollbar-track {
  background: $bg-light;
}

.search-results::-webkit-scrollbar-thumb,
.results-list::-webkit-scrollbar-thumb {
  background: $border-color;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover,
.results-list::-webkit-scrollbar-thumb:hover {
  background: $text-light-gray;
}
</style>
