<template>
  <div class="flash-cards-view">
    <div class="flash-cards-header">
      <h1>🎴 Флэш-карточки</h1>
      <p class="subtitle">Тренируйтесь отвечать на вопросы на английском</p>
    </div>

    <!-- Настройки -->
    <div class="settings-panel" v-if="!started">
      <div class="setting-group">
        <label class="setting-label">Выберите раздел:</label>
        <select v-model="selectedSection" class="setting-select">
          <option value="all">Все разделы</option>
          <option
            v-for="section in sections"
            :key="section.id"
            :value="section.id"
          >
            {{ section.title }}
          </option>
        </select>
      </div>

      <div class="setting-group">
        <label class="setting-label">Время показа (секунды):</label>
        <select v-model="flashCardDuration" class="setting-select">
          <option :value="5">5 секунд</option>
          <option :value="10">10 секунд</option>
          <option :value="15">15 секунд</option>
          <option :value="30">30 секунд</option>
          <option :value="0">Без ограничения</option>
        </select>
      </div>

      <div class="setting-group">
        <label class="setting-label">
          <input
            type="checkbox"
            v-model="autoFlip"
            class="setting-checkbox"
          />
          Автоматический переход
        </label>
      </div>

      <div class="setting-group">
        <label class="setting-label">
          <input
            type="checkbox"
            v-model="shuffleQuestions"
            class="setting-checkbox"
          />
          Перемешать вопросы
        </label>
      </div>

      <button @click="startTraining" class="start-btn" :disabled="!canStart">
        Начать тренировку
      </button>
    </div>

    <!-- Карточка -->
    <div v-else class="flash-card-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <div class="progress-text">
        Вопрос {{ currentIndex + 1 }} из {{ filteredQuestions.length }}
      </div>

      <div class="flash-card" @click="toggleCard">
        <div class="card-content">
          <div v-if="!showAnswer" class="card-front">
            <div class="card-header">
              <div class="card-label">Вопрос</div>
              <button
                v-if="ttsEnabled && isSupported"
                @click.stop="speakQuestion(currentQuestion.question)"
                class="tts-btn"
                title="Озвучить вопрос"
              >
                🔊
              </button>
            </div>
            <div class="card-text" v-html="currentQuestion.question"></div>
          </div>
          <div v-else class="card-back">
            <div class="card-header">
              <div class="card-label">Answer EN</div>
              <button
                v-if="ttsEnabled && isSupported && currentQuestion.answerEn"
                @click.stop="speakAnswer(currentQuestion.answerEn)"
                class="tts-btn"
                title="Озвучить ответ"
              >
                🔊
              </button>
            </div>
            <div
              class="card-text"
              v-html="formattedAnswer"
              v-if="currentQuestion.answerEn"
            ></div>
            <div v-else class="no-answer">
              Английский ответ не найден
            </div>
          </div>
        </div>
      </div>

      <div class="card-controls">
        <button
          @click="previousQuestion"
          class="control-btn"
          :disabled="currentIndex === 0"
        >
          ← Предыдущий
        </button>
        <button @click="toggleCard" class="control-btn primary">
          {{ showAnswer ? 'Скрыть ответ' : 'Показать ответ' }}
        </button>
        <button
          @click="nextQuestion"
          class="control-btn"
          :disabled="currentIndex === filteredQuestions.length - 1"
        >
          Следующий →
        </button>
      </div>

      <div class="card-actions">
        <button @click="restartTraining" class="action-btn">
          🔄 Начать заново
        </button>
        <button @click="stopTraining" class="action-btn">
          ⏹️ Завершить
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
      <button @click="loadQuestions" class="retry-btn">Повторить</button>
    </div>

    <!-- Нет вопросов -->
    <div v-if="!loading && !error && filteredQuestions.length === 0 && started" class="no-questions">
      <p>Вопросы не найдены. Выберите другой раздел.</p>
      <button @click="started = false" class="action-btn">
        Вернуться к настройкам
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { marked } from 'marked'
import { useTrainingMode } from '../composables/useTrainingMode'
import { useTextToSpeech } from '../composables/useTextToSpeech'
import { getQuestions } from '../api/questions'
import { getSectionById } from '../api/sections'
import { sections } from '../data/sections.js'

const { flashCardDuration, extractQuestionData, ttsEnabled } = useTrainingMode()
const {
  isSupported,
  speakQuestion,
  speakAnswer,
  stop: stopTTS
} = useTextToSpeech()

const loading = ref(false)
const error = ref(null)
const started = ref(false)
const selectedSection = ref('all')
const autoFlip = ref(false)
const shuffleQuestions = ref(true)
const currentIndex = ref(0)
const showAnswer = ref(false)
const allQuestions = ref([])

let autoFlipTimer = null

const filteredQuestions = computed(() => {
  if (selectedSection.value === 'all') {
    return allQuestions.value
  }
  return allQuestions.value.filter(
    (q) => q.sectionId === selectedSection.value
  )
})

const currentQuestion = computed(() => {
  if (filteredQuestions.value.length === 0) return null
  return filteredQuestions.value[currentIndex.value]
})

const formattedAnswer = computed(() => {
  if (!currentQuestion.value?.answerEn) return ''
  return marked.parse(currentQuestion.value.answerEn)
})

const progressPercent = computed(() => {
  if (filteredQuestions.value.length === 0) return 0
  return ((currentIndex.value + 1) / filteredQuestions.value.length) * 100
})

const canStart = computed(() => {
  return !loading.value && !error.value
})

const toggleCard = () => {
  stopTTS()
  showAnswer.value = !showAnswer.value
  if (showAnswer.value && autoFlip.value && flashCardDuration.value > 0) {
    startAutoFlip()
  } else {
    clearAutoFlip()
  }

  // Автоматическое озвучивание
  if (ttsEnabled.value && isSupported.value) {
    if (showAnswer.value && currentQuestion.value?.answerEn) {
      speakAnswer(currentQuestion.value.answerEn)
    } else if (!showAnswer.value && currentQuestion.value?.question) {
      speakQuestion(currentQuestion.value.question)
    }
  }
}

const nextQuestion = () => {
  stopTTS()
  if (currentIndex.value < filteredQuestions.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
    clearAutoFlip()
    if (autoFlip.value && flashCardDuration.value > 0) {
      setTimeout(() => {
        startAutoFlip()
      }, 100)
    }

    // Автоматическое озвучивание вопроса
    if (ttsEnabled.value && isSupported.value && currentQuestion.value?.question) {
      setTimeout(() => {
        speakQuestion(currentQuestion.value.question)
      }, 200)
    }
  }
}

const previousQuestion = () => {
  stopTTS()
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
    clearAutoFlip()

    // Автоматическое озвучивание вопроса
    if (ttsEnabled.value && isSupported.value && currentQuestion.value?.question) {
      setTimeout(() => {
        speakQuestion(currentQuestion.value.question)
      }, 200)
    }
  }
}

const startAutoFlip = () => {
  clearAutoFlip()
  if (!showAnswer.value) {
    autoFlipTimer = setTimeout(() => {
      showAnswer.value = true
      if (flashCardDuration.value > 0) {
        autoFlipTimer = setTimeout(() => {
          nextQuestion()
        }, flashCardDuration.value * 1000)
      }
    }, flashCardDuration.value * 1000)
  } else {
    autoFlipTimer = setTimeout(() => {
      nextQuestion()
    }, flashCardDuration.value * 1000)
  }
}

const clearAutoFlip = () => {
  if (autoFlipTimer) {
    clearTimeout(autoFlipTimer)
    autoFlipTimer = null
  }
}

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const loadQuestions = async () => {
  loading.value = true
  error.value = null
  allQuestions.value = []

  try {
    const sectionsToLoad =
      selectedSection.value === 'all'
        ? sections
        : sections.filter((s) => s.id === selectedSection.value)

    for (const section of sectionsToLoad) {
      try {
        // Получаем раздел из БД по sectionId
        const dbSection = await getSectionById(section.id)

        // Загружаем вопросы через API
        const questions = await getQuestions(dbSection.id)

        // Преобразуем данные из API в формат для тренировки
        const questionsForTraining = questions
          .filter((q) => {
            // Фильтруем только вопросы с Answer EN
            return q.answers && q.answers.some(a => a.type === 'en')
          })
          .map((q) => {
            const answerEn = q.answers.find(a => a.type === 'en')
            return {
              id: q.id,
              number: q.number,
              question: q.question,
              questionRaw: q.questionRaw,
              answerEn: answerEn ? answerEn.content : null,
              answerRu: q.answers.find(a => a.type === 'ru')?.content || null,
              answerSenior: q.answers.find(a => a.type === 'senior')?.content || null,
              sectionId: section.id,
              hasAnswerEn: !!answerEn,
              hasAnswerRu: !!q.answers.find(a => a.type === 'ru'),
              hasAnswerSenior: !!q.answers.find(a => a.type === 'senior'),
              codeBlocks: q.codeBlocks || []
            }
          })

        allQuestions.value.push(...questionsForTraining)
      } catch (err) {
        console.warn(`Ошибка загрузки раздела ${section.title}:`, err)
      }
    }

    if (shuffleQuestions.value) {
      allQuestions.value = shuffleArray(allQuestions.value)
    }

    if (allQuestions.value.length === 0) {
      error.value = 'Не найдено вопросов с английскими ответами'
    }
  } catch (err) {
    error.value = `Ошибка загрузки: ${err.message}`
    console.error('Ошибка загрузки вопросов:', err)
  } finally {
    loading.value = false
  }
}

const startTraining = async () => {
  await loadQuestions()
  if (allQuestions.value.length > 0) {
    started.value = true
    currentIndex.value = 0
    showAnswer.value = false
    if (autoFlip.value && flashCardDuration.value > 0) {
      startAutoFlip()
    }
  }
}

const restartTraining = () => {
  currentIndex.value = 0
  showAnswer.value = false
  clearAutoFlip()
  if (shuffleQuestions.value) {
    allQuestions.value = shuffleArray(allQuestions.value)
  }
  if (autoFlip.value && flashCardDuration.value > 0) {
    startAutoFlip()
  }
}

const stopTraining = () => {
  started.value = false
  currentIndex.value = 0
  showAnswer.value = false
  clearAutoFlip()
}

watch(flashCardDuration, () => {
  if (started.value && autoFlip.value) {
    clearAutoFlip()
    if (flashCardDuration.value > 0) {
      startAutoFlip()
    }
  }
})

onUnmounted(() => {
  clearAutoFlip()
  stopTTS()
})
</script>

<style lang="scss" scoped>
$primary-color: #42b883;
$primary-hover: #35a372;
$text-dark: #1e1e1e;
$text-gray: #333;
$border-color: #e0e0e0;
$bg-light: #f5f5f5;
$bg-white: white;
$breakpoint-mobile: 768px;

.flash-cards-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: $breakpoint-mobile) {
    padding: 1rem;
  }
}

.flash-cards-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: $text-dark;
    margin-bottom: 0.5rem;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.5rem;
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
  border-radius: 8px;
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

.flash-card-container {
  background: $bg-white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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
  margin-bottom: 2rem;
}

.flash-card {
  min-height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: $breakpoint-mobile) {
    min-height: 250px;
    padding: 1.5rem;
  }
}

.card-content {
  width: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.9;
}

.tts-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  color: white;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.card-text {
  font-size: 1.25rem;
  line-height: 1.6;
  font-weight: 500;
  text-align: left;
  max-width: 100%;

  :deep(p) {
    margin: 0.75rem 0;
    line-height: 1.7;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(strong) {
    font-weight: 700;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1rem 0 0.75rem 0;
    font-weight: 600;
    line-height: 1.4;

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) {
    font-size: 1.5rem;
  }

  :deep(h2) {
    font-size: 1.375rem;
  }

  :deep(h3) {
    font-size: 1.25rem;
  }

  :deep(h4) {
    font-size: 1.125rem;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
    line-height: 1.7;
  }

  :deep(li) {
    margin: 0.5rem 0;
    line-height: 1.7;
  }

  :deep(code) {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.1);

    code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      display: block;
      white-space: pre;
      color: rgba(255, 255, 255, 0.95);
      font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
    }

    // Стили для подсветки синтаксиса
    :deep(.hljs-keyword),
    :deep(.hljs-selector-tag) {
      color: #569cd6;
    }

    :deep(.hljs-string),
    :deep(.hljs-meta .hljs-meta-string) {
      color: #ce9178;
    }

    :deep(.hljs-comment),
    :deep(.hljs-quote) {
      color: #6a9955;
      font-style: italic;
    }

    :deep(.hljs-number),
    :deep(.hljs-literal) {
      color: #b5cea8;
    }

    :deep(.hljs-function),
    :deep(.hljs-title) {
      color: #dcdcaa;
    }

    :deep(.hljs-type),
    :deep(.hljs-class) {
      color: #4ec9b0;
    }

    :deep(.hljs-variable),
    :deep(.hljs-params) {
      color: #9cdcfe;
    }

    :deep(.hljs-property),
    :deep(.hljs-attr) {
      color: #92c5f7;
    }

    :deep(.hljs-built_in) {
      color: #569cd6;
    }

    :deep(.hljs-regexp) {
      color: #d16969;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid rgba(255, 255, 255, 0.5);
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    opacity: 0.9;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.9em;

    th,
    td {
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background: rgba(255, 255, 255, 0.1);
      font-weight: 600;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    margin: 1.5rem 0;
  }

  @media (max-width: $breakpoint-mobile) {
    font-size: 1.125rem;

    :deep(h1) {
      font-size: 1.375rem;
    }

    :deep(h2) {
      font-size: 1.25rem;
    }

    :deep(h3) {
      font-size: 1.125rem;
    }

    :deep(pre) {
      padding: 0.75rem;
      font-size: 0.8125rem;
    }
  }
}

.no-answer {
  font-size: 1rem;
  opacity: 0.8;
}

.card-controls {
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
  transition: all 0.2s;
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

.card-actions {
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
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    border-color: $primary-color;
    color: $primary-color;
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
