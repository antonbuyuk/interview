<template>
  <div v-if="isVisible" class="test-container">
    <div class="test-header">
      <button @click="closeTest" class="close-btn">×</button>
    </div>

    <div v-if="!testStarted" class="test-intro">
      <p>Выберите правильный ответ из 4 вариантов.</p>
      <button @click="startTest" class="start-btn">Начать тест</button>
    </div>

    <div v-else-if="loadingQuestions" class="test-content">
      <div class="loading-state">
        <p>Загрузка вопросов...</p>
      </div>
    </div>

    <div v-else-if="testStarted && !loadingQuestions && testQuestions.length === 0" class="test-content">
      <div class="error-state">
        <p>Не удалось загрузить вопросы для теста.</p>
        <button @click="closeTest" class="close-btn-secondary">Закрыть</button>
      </div>
    </div>

    <div v-else-if="testStarted && testQuestions.length > 0 && currentQuestionIndex < testQuestions.length" class="test-content">
      <div class="test-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }"
          ></div>
        </div>
        <p class="progress-text">
          Вопрос {{ currentQuestionIndex + 1 }} из {{ totalQuestions }}
        </p>
      </div>

      <div class="question-container">
        <h3 class="question-title">{{ currentQuestion.text }}</h3>

        <div class="answers-list" v-if="shuffledAnswers.length > 0">
          <button
            v-for="(answer, index) in shuffledAnswers"
            :key="index"
            @click="selectAnswer(index)"
            :disabled="selectedAnswer !== null"
            :class="[
              'answer-btn',
              {
                'selected': selectedAnswer === index,
                'correct': selectedAnswer !== null && index === currentQuestion.correctIndex,
                'incorrect': selectedAnswer === index && selectedAnswer !== currentQuestion.correctIndex
              }
            ]"
          >
            <span class="answer-letter">{{ String.fromCharCode(65 + index) }}.</span>
            <span class="answer-text">{{ answer }}</span>
          </button>
        </div>

        <div v-if="selectedAnswer !== null" class="answer-feedback">
          <p v-if="selectedAnswer === currentQuestion.correctIndex" class="feedback-correct">
            ✓ Правильно!
          </p>
          <p v-else class="feedback-incorrect">
            ✗ Неправильно. Правильный ответ: {{ String.fromCharCode(65 + currentQuestion.correctIndex) }}
          </p>
          <button @click="nextQuestion" class="next-btn">
            {{ currentQuestionIndex === totalQuestions - 1 ? 'Завершить тест' : 'Следующий вопрос' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="testStarted && !loadingQuestions && testQuestions.length > 0 && currentQuestionIndex >= testQuestions.length" class="test-results">
      <h2>Тест завершен!</h2>
      <div class="results-stats">
        <p class="score">
          Правильных ответов: <strong>{{ correctAnswers }}</strong> из {{ totalQuestions }}
        </p>
        <p class="percentage" v-if="totalQuestions > 0">
          Процент правильных ответов: <strong>{{ totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0 }}%</strong>
        </p>
      </div>
      <div class="results-actions">
        <button @click="restartTest" class="restart-btn">Пройти снова</button>
        <button @click="closeTest" class="close-btn-secondary">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  sectionDir: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(true)
const testStarted = ref(false)
const loadingQuestions = ref(false)
const testQuestions = ref([])
const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const correctAnswers = ref(0)
const shuffledAnswers = ref([])

const totalQuestions = computed(() => testQuestions.value.length)
const currentQuestion = computed(() => {
  return testQuestions.value[currentQuestionIndex.value] || {}
})

// Загрузка тестовых вопросов с ответами
const loadTestQuestions = async () => {
  loadingQuestions.value = true
  try {
    const response = await fetch(`/${props.sectionDir}/README.md?t=${Date.now()}`)
    if (!response.ok) {
      console.error('Ошибка загрузки файла:', response.statusText)
      loadingQuestions.value = false
      return
    }

    const markdown = await response.text()
    console.log('Загружен markdown, длина:', markdown.length)
    const questions = extractTestQuestions(markdown)
    console.log('Извлечено вопросов:', questions.length)

    if (questions.length === 0) {
      console.warn('Не найдено вопросов с ответами')
      console.warn('Проверьте формат: вопросы должны иметь ### N. и ответы **Ответ:**')
      loadingQuestions.value = false
      testQuestions.value = [] // Явно устанавливаем пустой массив
      return
    }

    // Выбираем случайные вопросы для теста (максимум 10)
    const selectedQuestions = questions.length > 10
      ? [...questions].sort(() => Math.random() - 0.5).slice(0, 10)
      : questions

    const generated = generateTestQuestions(selectedQuestions)
    testQuestions.value = generated

    console.log('Загружено вопросов для теста:', generated.length)
    console.log('Первый вопрос (полный объект):', JSON.stringify(generated[0], null, 2))

    if (generated.length > 0) {
      currentQuestionIndex.value = 0
      selectedAnswer.value = null
      correctAnswers.value = 0
      // Используем nextTick чтобы убедиться, что reactive обновления применены
      await nextTick()
      loadCurrentQuestion()
      console.log('Тест готов, текущий вопрос:', JSON.stringify(currentQuestion.value, null, 2))
    } else {
      console.error('Не удалось сгенерировать вопросы для теста')
      testQuestions.value = []
    }
  } catch (err) {
    console.error('Ошибка загрузки теста:', err)
    testQuestions.value = [] // Убеждаемся, что массив пустой при ошибке
  } finally {
    loadingQuestions.value = false
  }
}

// Извлечение вопросов с ответами из markdown
const extractTestQuestions = (markdown) => {
  const questions = []
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
  // Ищем ответ в формате **Ответ:** или **Ответ:** на отдельной строке
  const answerStartRegex = /^\*\*Ответ:\*\*\s*(.+)$/gm
  const answerStartRegexMultiline = /\*\*Ответ:\*\*\s*(.+?)(?=\*\*Ответ Senior:\*\*|###|$)/gsm
  const seniorAnswerRegex = /^\*\*Ответ Senior:\*\*/gm
  const nextQuestionRegex = /^###\s+\d+\.\s+/gm

  let match

  // Находим все вопросы
  const questionMatches = []
  questionRegex.lastIndex = 0 // Сбрасываем regex
  while ((match = questionRegex.exec(markdown)) !== null) {
    questionMatches.push({
      text: match[1].trim().replace(/\*\*/g, '').replace(/`/g, ''),
      index: match.index
    })
  }

  console.log('Найдено вопросов в markdown:', questionMatches.length)

  // Для каждого вопроса находим ответ
  questionMatches.forEach((q, idx) => {
    const nextQuestionIndex = questionMatches[idx + 1]?.index || markdown.length
    const questionSection = markdown.substring(q.index, nextQuestionIndex)

    // Ищем начало ответа (пробуем разные варианты формата)
    let answerStartMatch = null
    let answerStartIndex = -1

    // Ищем маркер ответа **Ответ:** (может быть на отдельной строке или в той же)
    const answerPattern = /\*\*Ответ:\*\*\s*/i
    const answerMarkerMatch = questionSection.match(answerPattern)

    if (answerMarkerMatch) {
      answerStartIndex = answerMarkerMatch.index + answerMarkerMatch[0].length
    } else {
      // Пробуем без звездочек
      const simplePattern = /Ответ:\s*/i
      const simpleMatch = questionSection.match(simplePattern)
      if (simpleMatch) {
        answerStartIndex = simpleMatch.index + simpleMatch[0].length
      }
    }

    if (answerStartIndex === -1) {
      console.log('Ответ не найден для вопроса:', q.text.substring(0, 50))
      return
    }

    // Берем текст после маркера ответа
    let answerSection = questionSection.substring(answerStartIndex).trim()

    // Убираем начальные переносы строк
    answerSection = answerSection.replace(/^\n+/, '').trim()

    // Находим конец ответа (до "Ответ Senior:" или до следующего вопроса)
    let answerEndIndex = answerSection.length

    // Ищем "Ответ Senior:" - сбрасываем lastIndex перед поиском
    seniorAnswerRegex.lastIndex = 0
    const seniorMatch = seniorAnswerRegex.exec(answerSection)
    if (seniorMatch) {
      answerEndIndex = seniorMatch.index
    }

    // Извлекаем текст ответа
    let answerText = answerSection.substring(0, answerEndIndex).trim()

    // Убираем markdown разметку (но сохраняем структуру)
    answerText = answerText
      .replace(/\*\*/g, '') // Убираем жирный текст
      .replace(/`([^`]+)`/g, '$1') // Убираем inline код, но сохраняем содержимое
      .replace(/```[\s\S]*?```/g, '[код]') // Блоки кода заменяем на [код]
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Убираем ссылки
      .replace(/^[-*+]\s+/gm, '') // Убираем маркеры списков
      .replace(/\n{3,}/g, '\n\n') // Убираем лишние переносы

    // Берем первый абзац или предложение
    // Ищем конец первого предложения (точка, восклицательный или вопросительный знак с пробелом после)
    let extractedText = answerText
    const sentenceEnd = extractedText.search(/[.!?]\s+/)

    if (sentenceEnd > 20) {
      // Если нашли конец предложения после 20 символов, берем до него
      extractedText = extractedText.substring(0, sentenceEnd + 1).trim()
    } else {
      // Иначе берем до 300 символов или до первого переноса строки
      const lineBreak = extractedText.indexOf('\n')
      if (lineBreak > 50 && lineBreak < 300) {
        extractedText = extractedText.substring(0, lineBreak).trim()
      } else {
        extractedText = extractedText.substring(0, 300).trim()
      }
    }

    // Убираем лишние пробелы
    answerText = extractedText.replace(/\s+/g, ' ').trim()

    if (answerText && answerText.length > 15) {
      questions.push({
        question: q.text,
        answer: answerText
      })
    }
  })

  return questions
}

// Генерация тестовых вопросов с вариантами ответов
const generateTestQuestions = (questions) => {
  if (questions.length === 0) return []

  return questions.map((q, index) => {
    // Создаем неправильные варианты ответов из других вопросов
    const wrongAnswers = new Set()
    const otherQuestions = questions.filter((_, i) => i !== index)

    // Берем ответы из других вопросов (случайно выбранные)
    const shuffledOthers = [...otherQuestions].sort(() => Math.random() - 0.5)

    for (const otherQ of shuffledOthers) {
      if (wrongAnswers.size >= 3) break

      const otherAnswer = otherQ.answer.trim()
      // Убеждаемся, что ответ отличается от правильного
      if (otherAnswer !== q.answer && otherAnswer.length > 20) {
        // Обрезаем до разумной длины
        let shortAnswer = otherAnswer
        if (shortAnswer.length > 200) {
          const firstSentence = shortAnswer.match(/^[^.!?]+[.!?]/)
          shortAnswer = firstSentence ? firstSentence[0] : shortAnswer.substring(0, 150) + '...'
        }
        wrongAnswers.add(shortAnswer)
      }
    }

    // Если недостаточно неправильных ответов, добавляем общие варианты
    while (wrongAnswers.size < 3) {
      const wrongAnswer = generateWrongAnswer(q.question, q.answer)
      wrongAnswers.add(wrongAnswer)
    }

    // Преобразуем Set в массив
    const wrongAnswersArray = Array.from(wrongAnswers).slice(0, 3)

    // Создаем массив всех ответов
    const allAnswers = [q.answer, ...wrongAnswersArray]

    // Перемешиваем и находим индекс правильного ответа
    const shuffled = [...allAnswers].sort(() => Math.random() - 0.5)
    const correctIndex = shuffled.findIndex(a => a === q.answer)

    return {
      text: q.question,
      answers: shuffled,
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    }
  })
}

// Генерация неправильного ответа
const generateWrongAnswer = (question, correctAnswer) => {
  // Пытаемся создать правдоподобный неправильный ответ на основе вопроса
  const questionLower = question.toLowerCase()

  // Если вопрос про "разницу" или "отличие", генерируем соответствующий ответ
  if (questionLower.includes('разница') || questionLower.includes('отличие')) {
    return 'Оба подхода идентичны по функциональности и могут использоваться взаимозаменяемо.'
  }

  // Если вопрос про "что такое", генерируем общий ответ
  if (questionLower.includes('что такое')) {
    return 'Это устаревший подход, который больше не рекомендуется к использованию.'
  }

  // Общие шаблоны неправильных ответов
  const wrongTemplates = [
    'Это зависит от конкретной ситуации и используемых технологий.',
    'Требуется дополнительное исследование и анализ требований проекта.',
    'Необходимо учитывать контекст применения и специфику задачи.',
    'Для этого нет однозначного ответа, всё зависит от выбранного фреймворка.',
    'Это определяется настройками сборщика и конфигурацией проекта.'
  ]

  // Пытаемся создать ответ, который немного похож на правильный, но неверный
  const words = correctAnswer.split(' ').slice(0, 3)
  if (words.length > 0) {
    return `${words.join(' ')} не является решением этой задачи.`
  }

  return wrongTemplates[Math.floor(Math.random() * wrongTemplates.length)]
}

const startTest = async () => {
  testStarted.value = true
  await loadTestQuestions()
}

const loadCurrentQuestion = () => {
  const question = currentQuestion.value
  console.log('loadCurrentQuestion вызван, currentQuestionIndex:', currentQuestionIndex.value)
  console.log('testQuestions.value.length:', testQuestions.value.length)
  console.log('Текущий вопрос (сырой):', question)

  if (question && question.answers && Array.isArray(question.answers) && question.answers.length > 0) {
    shuffledAnswers.value = [...question.answers]
    selectedAnswer.value = null
    console.log('✓ Загружен вопрос:', question.text)
    console.log('✓ Варианты ответов (первые 2):', shuffledAnswers.value.slice(0, 2))
    console.log('✓ Всего вариантов:', shuffledAnswers.value.length)
  } else {
    console.warn('✗ Текущий вопрос не найден или не имеет ответов')
    console.warn('question:', question)
    console.warn('question.answers:', question?.answers)
    shuffledAnswers.value = []
  }
}

const selectAnswer = (index) => {
  if (selectedAnswer.value !== null) return
  selectedAnswer.value = index

  if (index === currentQuestion.value.correctIndex) {
    correctAnswers.value++
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < testQuestions.value.length - 1) {
    currentQuestionIndex.value++
    loadCurrentQuestion()
  } else {
    // Последний вопрос - переходим к результатам
    // Увеличиваем индекс, чтобы условие в шаблоне сработало
    currentQuestionIndex.value = testQuestions.value.length
  }
}

const restartTest = () => {
  testStarted.value = false
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  correctAnswers.value = 0
  testQuestions.value = []
}

const closeTest = () => {
  emit('close')
}

watch(() => props.questions, () => {
  if (props.questions.length > 0) {
    loadTestQuestions()
  }
}, { immediate: true })
</script>

<style scoped>
.test-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
  overflow-y: auto;
}

.test-header {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.test-header h2 {
  margin: 0;
  color: #1e1e1e;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.test-content,
.test-intro,
.test-results {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.test-intro {
  text-align: center;
}

.test-intro p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.start-btn,
.next-btn,
.restart-btn,
.close-btn-secondary {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.start-btn {
  background: #42b883;
  color: white;
}

.start-btn:hover {
  background: #369461;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.test-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b883, #369461);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.question-container {
  margin-top: 2rem;
}

.question-title {
  font-size: 1.25rem;
  color: #1e1e1e;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.answer-btn {
  display: flex;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-size: 1rem;
}

.answer-btn:hover:not(:disabled) {
  border-color: #42b883;
  background: #f0fdf4;
  transform: translateX(4px);
}

.answer-btn:disabled {
  cursor: not-allowed;
}

.answer-btn.selected {
  border-color: #42b883;
  background: #f0fdf4;
}

.answer-btn.correct {
  border-color: #10b981;
  background: #d1fae5;
}

.answer-btn.incorrect {
  border-color: #ef4444;
  background: #fee2e2;
}

.answer-letter {
  font-weight: 600;
  color: #42b883;
  margin-right: 0.75rem;
  flex-shrink: 0;
  min-width: 24px;
}

.answer-text {
  flex: 1;
  line-height: 1.5;
  color: #333;
}

.answer-feedback {
  padding: 1rem;
  border-radius: 8px;
  background: #f5f5f5;
  margin-top: 1rem;
}

.feedback-correct {
  color: #10b981;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.feedback-incorrect {
  color: #ef4444;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.next-btn {
  background: #42b883;
  color: white;
  width: 100%;
}

.next-btn:hover {
  background: #369461;
}

.test-results {
  text-align: center;
}

.test-results h2 {
  color: #1e1e1e;
  margin-bottom: 2rem;
}

.results-stats {
  margin-bottom: 2rem;
}

.score,
.percentage {
  font-size: 1.1rem;
  color: #666;
  margin: 1rem 0;
}

.score strong,
.percentage strong {
  color: #42b883;
  font-size: 1.3rem;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.restart-btn {
  background: #42b883;
  color: white;
}

.restart-btn:hover {
  background: #369461;
}

.close-btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.close-btn-secondary:hover {
  background: #d0d0d0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 2rem;
}

.loading-state p,
.error-state p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.error-state {
  color: #ef4444;
}

@media (max-width: 768px) {
  .test-container {
    padding: 1rem;
  }

  .test-content,
  .test-intro,
  .test-results {
    padding: 1.5rem;
  }

  .results-actions {
    flex-direction: column;
  }

  .restart-btn,
  .close-btn-secondary {
    width: 100%;
  }
}
</style>

