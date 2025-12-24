<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :class="{ 'recording': isRecording }"
        :placeholder="isRecording ? 'Говорите...' : 'Поиск по вопросам...'"
        @input="handleSearch"
        @focus="isFocused = true"
        @blur="handleBlur"
        :disabled="isRecording"
      />
      <span class="search-icon">🔍</span>
      <button
        v-if="!isRecording && !searchQuery"
        @click="startVoiceSearch"
        class="voice-btn"
        title="Голосовой поиск"
      >
        🎤
      </button>
      <button
        v-if="isRecording"
        @click="stopVoiceSearch"
        class="voice-btn recording"
        title="Остановить запись"
      >
        ⏹
      </button>
      <button
        v-if="searchQuery && !isRecording"
        @click="clearSearch"
        class="clear-btn"
        title="Очистить поиск"
      >
        ✕
      </button>
      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        <span class="recording-text">Идет запись...</span>
      </div>
    </div>

    <!-- Результаты поиска -->
    <div v-if="searchQuery && (localResults.length > 0 || globalResults.length > 0)" class="search-results">
      <!-- Локальные результаты (текущая секция) -->
      <div v-if="localResults.length > 0" class="results-section">
        <h4 class="results-title">
          В текущем разделе ({{ localResults.length }})
        </h4>
        <div class="results-list">
          <a
            v-for="result in localResults"
            :key="result.id"
            :href="`#${result.id}`"
            @click.prevent="scrollToResult(result.id)"
            class="result-item"
          >
            <span class="result-number">{{ result.number }}.</span>
            <span class="result-text" v-html="highlightText(result.text, searchQuery)"></span>
          </a>
        </div>
      </div>

      <!-- Глобальные результаты (другие разделы) -->
      <div v-if="globalResults.length > 0" class="results-section">
        <h4 class="results-title">
          В других разделах ({{ globalResults.length }})
        </h4>
        <div class="results-list">
          <router-link
            v-for="result in globalResults"
            :key="result.id"
            :to="`${result.path}#${result.id}`"
            class="result-item"
            @click="handleGlobalResultClick(result.id)"
          >
            <span class="result-section">{{ result.sectionTitle }}</span>
            <span class="result-text" v-html="highlightText(result.questionText, searchQuery)"></span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Нет результатов -->
    <div v-else-if="searchQuery && localResults.length === 0 && globalResults.length === 0" class="no-results">
      <p>Ничего не найдено</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { sections } from '../data/sections.js'

const props = defineProps({
  currentSection: {
    type: Object,
    default: null
  },
  questions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['result-click'])

const route = useRoute()
const searchQuery = ref('')
const isFocused = ref(false)
const localResults = ref([])
const globalResults = ref([])
const searchCache = ref(new Map())
const currentQuestions = ref([])
const pendingQuestionId = ref(null)
const isRecording = ref(false)
const recognition = ref(null)
const isSpeechSupported = ref(false)

// Поиск с задержкой (debounce)
let searchTimeout = null

// Инициализация Speech Recognition API
const initSpeechRecognition = () => {
  if (typeof window === 'undefined') return

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    isSpeechSupported.value = false
    return
  }

  isSpeechSupported.value = true
  recognition.value = new SpeechRecognition()
  recognition.value.continuous = false
  recognition.value.interimResults = false
  recognition.value.lang = 'ru-RU' // Русский язык

  recognition.value.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    searchQuery.value = transcript.trim()
    performSearch()
    isRecording.value = false
  }

  recognition.value.onerror = (event) => {
    console.error('Ошибка распознавания речи:', event.error)
    isRecording.value = false

    if (event.error === 'no-speech') {
      alert('Речь не распознана. Попробуйте еще раз.')
    } else if (event.error === 'not-allowed') {
      alert('Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.')
    }
  }

  recognition.value.onend = () => {
    isRecording.value = false
  }
}

// Инициализация при монтировании
onMounted(() => {
  initSpeechRecognition()
})

onUnmounted(() => {
  if (recognition.value && isRecording.value) {
    recognition.value.stop()
  }
})

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const loadCurrentSectionQuestions = async () => {
  if (!props.currentSection) {
    currentQuestions.value = []
    return
  }

  try {
    const response = await fetch(`./${props.currentSection.dir}/README.md`)
    if (!response.ok) return

    const markdown = await response.text()
    currentQuestions.value = extractQuestionsFromMarkdown(markdown)
  } catch (err) {
    console.error('Ошибка загрузки вопросов текущей секции:', err)
    currentQuestions.value = []
  }
}

// Функция для разбивки запроса на ключевые слова
const extractKeywords = (query) => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !['и', 'или', 'или', 'the', 'a', 'an', 'и', 'в', 'на', 'с', 'по'].includes(word))
}

// Поиск по ключевым словам
const matchesKeywords = (text, keywords) => {
  if (keywords.length === 0) return false

  const lowerText = text.toLowerCase()

  // Подсчитываем количество совпадений
  let matchCount = 0
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      matchCount++
    }
  }

  // Возвращаем объект с результатом и количеством совпадений
  return {
    matches: matchCount > 0,
    score: matchCount
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    localResults.value = []
    globalResults.value = []
    return
  }

  const query = searchQuery.value.trim()
  const keywords = extractKeywords(query)

  if (keywords.length === 0) {
    localResults.value = []
    globalResults.value = []
    return
  }

  // Загружаем вопросы текущей секции, если еще не загружены
  if (props.currentSection && currentQuestions.value.length === 0) {
    await loadCurrentSectionQuestions()
  }

  // Поиск в текущей секции - используем переданные questions или загружаем
  const questionsToSearch = props.questions.length > 0 ? props.questions : currentQuestions.value

  if (questionsToSearch.length > 0) {
    const results = questionsToSearch
      .map((q, index) => {
        const matchResult = matchesKeywords(q.text, keywords)
        return {
          id: q.id || `question-${index + 1}`,
          number: index + 1,
          text: q.text,
          score: matchResult.score
        }
      })
      .filter(q => q.score > 0)
      .sort((a, b) => b.score - a.score) // Сортируем по количеству совпадений
      .slice(0, 10) // Ограничиваем до 10 результатов

    localResults.value = results
  }

  // Поиск в других секциях
  if (query.length >= 2) {
    await searchInAllSections(keywords)
  } else {
    globalResults.value = []
  }
}

const searchInAllSections = async (keywords) => {
  const results = []
  const currentSectionId = props.currentSection?.id

  for (const section of sections) {
    // Пропускаем текущую секцию
    if (section.id === currentSectionId) continue

    try {
      // Проверяем кеш (используем строку ключевых слов для ключа кеша)
      const cacheKey = `${section.id}:${keywords.join(' ')}`
      if (searchCache.value.has(cacheKey)) {
        const cached = searchCache.value.get(cacheKey)
        results.push(...cached)
        continue
      }

      // Загружаем и ищем
      const response = await fetch(`./${section.dir}/README.md`)
      if (!response.ok) continue

      const markdown = await response.text()
      const questions = extractQuestionsFromMarkdown(markdown)

      const sectionResults = questions
        .map(q => {
          const matchResult = matchesKeywords(q.text, keywords)
          return {
            id: q.id,
            sectionTitle: section.title,
            questionText: q.text,
            path: section.path,
            score: matchResult.score
          }
        })
        .filter(q => q.score > 0)
        .sort((a, b) => b.score - a.score) // Сортируем по количеству совпадений
        .slice(0, 3) // По 3 результата из каждой секции

      // Кешируем результаты
      searchCache.value.set(cacheKey, sectionResults)
      results.push(...sectionResults)

      // Ограничиваем общее количество
      if (results.length >= 10) break
    } catch (err) {
      console.error(`Ошибка поиска в секции ${section.title}:`, err)
    }
  }

  // Сортируем все результаты по количеству совпадений
  results.sort((a, b) => b.score - a.score)
  globalResults.value = results.slice(0, 10)
}

const extractQuestionsFromMarkdown = (markdown) => {
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
  const questions = []
  let match

  while ((match = questionRegex.exec(markdown)) !== null) {
    const questionText = match[1].trim()
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim()

    questions.push({
      id: `question-${questions.length + 1}`,
      text: questionText
    })
  }

  return questions
}

const highlightText = (text, query) => {
  if (!query) return text

  // Разбиваем запрос на ключевые слова для подсветки
  const keywords = extractKeywords(query)

  let highlightedText = text
  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
  }

  return highlightedText
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const scrollToResult = (id) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = 120
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })

    emit('result-click', id)
    closeSearch()
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  localResults.value = []
  globalResults.value = []
  isFocused.value = false
}

const closeSearch = () => {
  isFocused.value = false
}

const handleGlobalResultClick = (questionId) => {
  pendingQuestionId.value = questionId
  closeSearch()
}

// Голосовой поиск
const startVoiceSearch = () => {
  if (!isSpeechSupported.value) {
    alert('Голосовой поиск не поддерживается в вашем браузере. Используйте Chrome, Edge или Safari.')
    return
  }

  if (!recognition.value) {
    initSpeechRecognition()
  }

  try {
    isRecording.value = true
    recognition.value.start()
  } catch (err) {
    console.error('Ошибка запуска распознавания:', err)
    isRecording.value = false
    alert('Не удалось запустить распознавание речи. Проверьте доступ к микрофону.')
  }
}

const stopVoiceSearch = () => {
  if (recognition.value && isRecording.value) {
    recognition.value.stop()
    isRecording.value = false
  }
}

// Функция для прокрутки к вопросу после загрузки раздела
const scrollToPendingQuestion = () => {
  if (!pendingQuestionId.value) return

  // Ждем загрузки контента и рендеринга DOM
  const attemptScroll = () => {
    const element = document.getElementById(pendingQuestionId.value)
    if (element) {
      const offset = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      pendingQuestionId.value = null
      return true
    }
    return false
  }

  // Пробуем сразу
  if (attemptScroll()) return

  // Если не получилось, пробуем через небольшие интервалы
  let attempts = 0
  const maxAttempts = 20
  const interval = setInterval(() => {
    attempts++
    if (attemptScroll() || attempts >= maxAttempts) {
      clearInterval(interval)
      if (attempts >= maxAttempts) {
        pendingQuestionId.value = null
      }
    }
  }, 100)
}

const handleBlur = () => {
  // Задержка, чтобы клики по результатам успели сработать
  setTimeout(() => {
    isFocused.value = false
  }, 200)
}

// Следим за изменением секции
watch(() => route.path, () => {
  clearSearch()
  searchCache.value.clear()
  currentQuestions.value = []

  // Если есть hash в URL, прокручиваем к вопросу
  if (route.hash) {
    const questionId = route.hash.substring(1)
    if (questionId) {
      pendingQuestionId.value = questionId
      nextTick(() => {
        scrollToPendingQuestion()
      })
    }
  }
})

// Следим за изменением hash в URL
watch(() => route.hash, (newHash) => {
  if (newHash) {
    const questionId = newHash.substring(1)
    if (questionId) {
      pendingQuestionId.value = questionId
      nextTick(() => {
        scrollToPendingQuestion()
      })
    }
  }
})

// Загружаем вопросы при изменении секции
watch(() => props.currentSection, async (newSection) => {
  currentQuestions.value = []
  if (newSection && searchQuery.value) {
    await loadCurrentSectionQuestions()
    performSearch()
  }
}, { immediate: true })
</script>

<style scoped>
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
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  color: #333;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input.recording {
  border-color: #e74c3c;
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
  border-color: #42b883;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.search-icon {
  position: absolute;
  left: 0.625rem;
  font-size: 0.875rem;
  pointer-events: none;
}

.voice-btn {
  position: absolute;
  right: 0.4rem;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  z-index: 5;
}

.voice-btn:hover {
  background: #f5f5f5;
  color: #42b883;
}

.voice-btn.recording {
  color: #e74c3c;
  animation: pulse 1.5s ease-in-out infinite;
}

.voice-btn.recording:hover {
  background: #fee;
  color: #c0392b;
}

@keyframes pulse {
  0%, 100% {
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
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  z-index: 5;
}

.clear-btn:hover {
  background: #f5f5f5;
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
  background: #fee;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #c0392b;
  z-index: 1101;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
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
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  transition: all 0.2s;
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
  border-radius: 8px;
  text-align: center;
  color: #999;
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
  background: #f5f5f5;
}

.search-results::-webkit-scrollbar-thumb,
.results-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover,
.results-list::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}
</style>

