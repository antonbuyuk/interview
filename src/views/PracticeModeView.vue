<template>
  <div class="practice-mode-view">
    <div class="practice-header">
      <h1>
        <ClockIcon class="title-icon" />
        Режим самопроверки
      </h1>
      <p class="subtitle">Тренируйтесь отвечать на вопросы с таймером</p>
    </div>

    <!-- Настройки -->
    <div v-if="!started" class="settings-panel">
      <div class="setting-group">
        <label class="setting-label">Выберите раздел:</label>
        <select v-model="selectedSection" class="setting-select">
          <option value="all">Все разделы</option>
          <option v-for="section in sections" :key="section.id" :value="section.sectionId">
            {{ section.title }}
          </option>
        </select>
      </div>

      <div class="setting-group">
        <label class="setting-label">Время на ответ (минуты):</label>
        <select v-model="practiceTimerDuration" class="setting-select">
          <option :value="1">1 минута</option>
          <option :value="2">2 минуты</option>
          <option :value="3">3 минуты</option>
          <option :value="5">5 минут</option>
          <option :value="0">Без ограничения</option>
        </select>
      </div>

      <div class="setting-group">
        <label class="setting-label">
          <input v-model="shuffleQuestions" type="checkbox" class="setting-checkbox" />
          Перемешать вопросы
        </label>
      </div>

      <button class="start-btn" :disabled="!canStart" @click="startPractice">
        Начать практику
      </button>
    </div>

    <!-- Режим практики -->
    <div v-else class="practice-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <div class="progress-text">
        Вопрос {{ currentIndex + 1 }} из {{ filteredQuestions.length }}
      </div>

      <!-- Таймер -->
      <div class="timer-container">
        <div
          class="timer"
          :class="{ 'timer-warning': timeLeft <= 60, 'timer-danger': timeLeft <= 30 }"
        >
          <span class="timer-label">Осталось времени:</span>
          <span class="timer-value">{{ formattedTime }}</span>
        </div>
      </div>

      <!-- Вопрос -->
      <div v-if="currentQuestion" class="question-card">
        <div class="question-header">
          <div class="question-label">Вопрос</div>
          <button
            v-if="isSupported && currentQuestion.question"
            class="tts-btn"
            title="Озвучить вопрос"
            @click="speakQuestion(currentQuestion.question)"
          >
            🔊
          </button>
        </div>
        <div class="question-text" v-html="formattedQuestion"></div>
      </div>

      <!-- Поле для ответа -->
      <div class="answer-section">
        <label class="answer-label">Ваш ответ (на английском):</label>
        <textarea
          v-model="userAnswer"
          class="answer-textarea"
          placeholder="Введите свой ответ здесь..."
          rows="8"
          :disabled="showCorrectAnswer"
        ></textarea>
        <div class="answer-actions">
          <button
            class="action-btn primary"
            :disabled="!userAnswer.trim() && !showCorrectAnswer"
            @click="showAnswer"
          >
            {{ showCorrectAnswer ? 'Скрыть правильный ответ' : 'Показать правильный ответ' }}
          </button>
        </div>
      </div>

      <!-- Правильный ответ -->
      <div v-if="showCorrectAnswer && currentQuestion" class="correct-answer-card">
        <div class="answer-header">
          <div class="answer-label">Answer EN (эталонный ответ):</div>
          <button
            v-if="isSupported && currentQuestion.answerEn"
            class="tts-btn"
            title="Озвучить ответ"
            @click="speakAnswer(currentQuestion.answerEn)"
          >
            🔊
          </button>
        </div>
        <div class="answer-text" v-html="formattedAnswer"></div>
      </div>

      <!-- Управление -->
      <div class="practice-controls">
        <button class="control-btn" :disabled="currentIndex === 0" @click="previousQuestion">
          ← Предыдущий
        </button>
        <button class="control-btn primary" @click="nextQuestion">Следующий вопрос →</button>
      </div>

      <div class="practice-actions">
        <button class="action-btn" @click="restartPractice">
          <ArrowPathIcon class="icon-inline" />
          Начать заново
        </button>
        <button class="action-btn" @click="stopPractice">
          <StopIcon class="icon-inline" />
          Завершить
        </button>
      </div>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка вопросов...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadQuestions">Повторить</button>
    </div>

    <!-- Нет вопросов -->
    <div
      v-if="!loading && !error && filteredQuestions.length === 0 && started"
      class="no-questions"
    >
      <p>Вопросы не найдены. Выберите другой раздел.</p>
      <button class="action-btn" @click="started = false">Вернуться к настройкам</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { storeToRefs } from 'pinia';
import { useTrainingMode } from '../composables/useTrainingMode';
import { useTextToSpeech } from '../composables/useTextToSpeech';
import { getQuestions } from '../api/questions';
import { useSectionsStore } from '../stores/sections';
import { ClockIcon, StopIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import type { Section, Question, CodeBlock } from '../types/api';

interface QuestionForTraining {
  id: string;
  number: number;
  question: string;
  questionRaw: string;
  answerEn: string | null;
  answerRu: string | null;
  answerSenior: string | null;
  sectionId: string;
  hasAnswerEn: boolean;
  hasAnswerRu: boolean;
  hasAnswerSenior: boolean;
  codeBlocks: CodeBlock[];
}

const { practiceTimerDuration } = useTrainingMode();
const { isSupported, speakQuestion, speakAnswer, stop: stopTTS } = useTextToSpeech();
const sectionsStore = useSectionsStore();
const { sections } = storeToRefs(sectionsStore);

const loading = ref(false);
const error = ref<string | null>(null);
const started = ref(false);
const selectedSection = ref('all');
const shuffleQuestions = ref(true);
const currentIndex = ref(0);
const showCorrectAnswer = ref(false);
const userAnswer = ref('');
const allQuestions = ref<QuestionForTraining[]>([]);
const timeLeft = ref(0);

let timerInterval: ReturnType<typeof setInterval> | null = null;

const filteredQuestions = computed(() => {
  if (selectedSection.value === 'all') {
    return allQuestions.value;
  }
  return allQuestions.value.filter(q => q.sectionId === selectedSection.value);
});

const currentQuestion = computed(() => {
  if (filteredQuestions.value.length === 0) return null;
  return filteredQuestions.value[currentIndex.value];
});

const formattedQuestion = computed(() => {
  if (!currentQuestion.value?.question) return '';
  return marked.parse(`### ${currentQuestion.value.question}`);
});

const formattedAnswer = computed(() => {
  if (!currentQuestion.value?.answerEn) return '';
  return marked.parse(currentQuestion.value.answerEn);
});

const progressPercent = computed(() => {
  if (filteredQuestions.value.length === 0) return 0;
  return ((currentIndex.value + 1) / filteredQuestions.value.length) * 100;
});

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const canStart = computed(() => {
  return !loading.value && !error.value;
});

const startTimer = () => {
  clearTimer();
  if (practiceTimerDuration.value > 0) {
    timeLeft.value = practiceTimerDuration.value * 60;
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--;
      } else {
        clearTimer();
        // Можно добавить уведомление о том, что время вышло
      }
    }, 1000);
  }
};

const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled: T[] = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
};

const loadQuestions = async () => {
  loading.value = true;
  error.value = null;
  allQuestions.value = [];

  try {
    const sectionsToLoad =
      selectedSection.value === 'all'
        ? sections.value
        : sections.value.filter((s: Section) => s.sectionId === selectedSection.value);

    for (const section of sectionsToLoad) {
      try {
        // Получаем раздел из store по ID
        const dbSection = sectionsStore.getSectionById(section.id);

        if (!dbSection) {
          console.warn(`Раздел ${section.title} не найден в store`);
          continue;
        }

        // Загружаем вопросы через API
        const questions = await getQuestions(dbSection.id);

        // Преобразуем данные из API в формат для тренировки
        const questionsForTraining: QuestionForTraining[] = questions
          .filter((q: Question) => {
            // Фильтруем только вопросы с Answer EN
            return q.answers && q.answers.some(a => a.type === 'en');
          })
          .map((q: Question) => {
            const answerEn = q.answers?.find(a => a.type === 'en');
            return {
              id: q.id,
              number: q.number,
              question: q.question,
              questionRaw: q.questionRaw,
              answerEn: answerEn ? answerEn.content : null,
              answerRu: q.answers?.find(a => a.type === 'ru')?.content || null,
              answerSenior: q.answers?.find(a => a.type === 'senior')?.content || null,
              sectionId: section.sectionId,
              hasAnswerEn: !!answerEn,
              hasAnswerRu: !!q.answers?.find(a => a.type === 'ru'),
              hasAnswerSenior: !!q.answers?.find(a => a.type === 'senior'),
              codeBlocks: (q.codeBlocks || []) as CodeBlock[],
            };
          });

        allQuestions.value.push(...questionsForTraining);
      } catch (err) {
        console.warn(`Ошибка загрузки раздела ${section.title}:`, err);
      }
    }

    if (shuffleQuestions.value) {
      allQuestions.value = shuffleArray(allQuestions.value);
    }

    if (allQuestions.value.length === 0) {
      error.value = 'Не найдено вопросов с английскими ответами';
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    error.value = `Ошибка загрузки: ${errorMessage}`;
    console.error('Ошибка загрузки вопросов:', err);
  } finally {
    loading.value = false;
  }
};

const startPractice = async () => {
  await loadQuestions();
  if (allQuestions.value.length > 0) {
    started.value = true;
    currentIndex.value = 0;
    showCorrectAnswer.value = false;
    userAnswer.value = '';
    startTimer();
  }
};

const showAnswer = () => {
  showCorrectAnswer.value = !showCorrectAnswer.value;
  // Автоматическое озвучивание правильного ответа
  if (showCorrectAnswer.value && isSupported.value && currentQuestion.value?.answerEn) {
    const answerText = currentQuestion.value.answerEn;
    setTimeout(() => {
      speakAnswer(answerText);
    }, 200);
  } else {
    stopTTS();
  }
};

const nextQuestion = () => {
  stopTTS();
  if (currentIndex.value < filteredQuestions.value.length - 1) {
    currentIndex.value++;
    showCorrectAnswer.value = false;
    userAnswer.value = '';
    if (practiceTimerDuration.value > 0) {
      startTimer();
    }

    // Автоматическое озвучивание вопроса
    if (isSupported.value && currentQuestion.value?.question) {
      const questionText = currentQuestion.value.question;
      setTimeout(() => {
        speakQuestion(questionText);
      }, 200);
    }
  }
};

const previousQuestion = () => {
  stopTTS();
  if (currentIndex.value > 0) {
    currentIndex.value--;
    showCorrectAnswer.value = false;
    userAnswer.value = '';
    if (practiceTimerDuration.value > 0) {
      startTimer();
    }

    // Автоматическое озвучивание вопроса
    if (isSupported.value && currentQuestion.value?.question) {
      const questionText = currentQuestion.value.question;
      setTimeout(() => {
        speakQuestion(questionText);
      }, 200);
    }
  }
};

const restartPractice = () => {
  currentIndex.value = 0;
  showCorrectAnswer.value = false;
  userAnswer.value = '';
  clearTimer();
  if (shuffleQuestions.value) {
    allQuestions.value = shuffleArray(allQuestions.value);
  }
  if (practiceTimerDuration.value > 0) {
    startTimer();
  }
};

const stopPractice = () => {
  started.value = false;
  currentIndex.value = 0;
  showCorrectAnswer.value = false;
  userAnswer.value = '';
  clearTimer();
  timeLeft.value = 0;
};

watch(practiceTimerDuration, () => {
  if (started.value && practiceTimerDuration.value > 0) {
    startTimer();
  }
});

onMounted(() => {
  // Секции уже загружены в App.vue через store
});

onUnmounted(() => {
  clearTimer();
  stopTTS();
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.practice-mode-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: $breakpoint-mobile) {
    padding: 1rem;
  }
}

.practice-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: $text-dark;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    .title-icon {
      width: 2rem;
      height: 2rem;
      color: $primary-color;
      flex-shrink: 0;
    }

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.5rem;

      .title-icon {
        width: 1.5rem;
        height: 1.5rem;
      }
    }
  }

  .subtitle {
    color: $text-gray;
    font-size: 1rem;
  }
}

.settings-panel {
  background: $bg-white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  @media (max-width: $breakpoint-mobile) {
    padding: 1.5rem;
  }
}

.setting-group {
  margin-bottom: 1.5rem;

  &:last-of-type {
    margin-bottom: 1rem;
  }
}

.setting-label {
  display: block;
  font-weight: 500;
  color: $text-dark;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.setting-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.9375rem;
  background: $bg-white;
  color: $text-dark;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: $primary-color;
  }

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
  }
}

.setting-checkbox {
  margin-right: 0.5rem;
  cursor: pointer;
}

.start-btn {
  width: 100%;
  padding: 1rem;
  background: $primary-color;
  color: white;
  border: none;
  @include rounded-md;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: $primary-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.practice-container {
  background: $bg-white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: visible;

  @media (max-width: $breakpoint-mobile) {
    padding: 1.5rem;
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: $bg-light;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: $primary-color;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: $text-gray;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.timer-container {
  margin-bottom: 2rem;
}

.timer {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  @include rounded-md;
  color: white;

  &.timer-warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.timer-danger {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    animation: pulse 1s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.timer-label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.timer-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.question-card {
  background: $bg-light;
  @include rounded-md;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid $primary-color;
}

.question-header,
.answer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.question-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: $primary-color;
  font-weight: 600;
}

.tts-btn {
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  @include transition;
  color: $text-gray;

  &:hover {
    background: #e9ecef;
    border-color: $primary-color;
    color: $primary-color;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.question-text {
  font-size: 1.125rem;
  line-height: 1.7;
  color: $text-dark;

  :deep(h3) {
    margin: 0;
    font-size: 1.25rem;
    color: $text-dark;
  }

  :deep(p) {
    margin: 0.5rem 0;
  }

  :deep(code) {
    background: rgba(66, 184, 131, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
}

.answer-section {
  margin-bottom: 2rem;
}

.answer-label {
  display: block;
  font-weight: 500;
  color: $text-dark;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.answer-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid $border-color;
  @include rounded-md;
  font-size: 0.9375rem;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
  }

  &:disabled {
    background: $bg-light;
    cursor: not-allowed;
  }
}

.answer-actions {
  margin-top: 1rem;
}

.correct-answer-card {
  background: #e6f3ff;
  border: 2px solid #4da6ff;
  @include rounded-md;
  padding: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.answer-text {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: $text-dark;

  :deep(p) {
    margin: 0.75rem 0;
  }

  :deep(strong) {
    font-weight: 700;
    color: $text-dark;
  }

  :deep(code) {
    background: rgba(77, 166, 255, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.75rem 0;
    padding-left: 2rem;
  }

  :deep(li) {
    margin: 0.5rem 0;
  }
}

.practice-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;

  @media (max-width: $breakpoint-mobile) {
    flex-direction: column;
  }
}

.control-btn {
  padding: 0.75rem 1.5rem;
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.9375rem;
  cursor: pointer;
  @include transition;
  flex: 1;

  &:hover:not(:disabled) {
    background: #e9ecef;
    border-color: $primary-color;
    color: $primary-color;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: $primary-color;
    color: white;
    border-color: $primary-color;

    &:hover:not(:disabled) {
      background: $primary-hover;
    }
  }
}

.practice-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: $breakpoint-mobile) {
    flex-direction: column;
  }
}

.action-btn {
  padding: 0.75rem 1.5rem;
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.9375rem;
  cursor: pointer;
  @include transition;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: visible;
  white-space: nowrap;

  .icon-inline {
    width: 1.125rem;
    height: 1.125rem;
    color: inherit;
    flex-shrink: 0;
  }

  &:hover {
    background: #e9ecef;
    border-color: $primary-color;
    color: $primary-color;
  }

  &.primary {
    background: $primary-color;
    color: white;
    border-color: $primary-color;

    &:hover {
      background: $primary-hover;
    }
  }
}

.loading-state,
.error-state,
.no-questions {
  text-align: center;
  padding: 3rem 2rem;
  background: $bg-white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9375rem;
  transition: background 0.2s;

  &:hover {
    background: $primary-hover;
  }
}
</style>
