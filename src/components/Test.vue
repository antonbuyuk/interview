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

// Индекс концепций по темам для генерации неправильных ответов
const conceptsIndex = ref(new Map())

const totalQuestions = computed(() => testQuestions.value.length)
const currentQuestion = computed(() => {
  return testQuestions.value[currentQuestionIndex.value] || {}
})

// Загрузка тестовых вопросов с ответами
const loadTestQuestions = async () => {
  loadingQuestions.value = true
  try {
    // Используем base URL для корректной работы на GitHub Pages
    const baseUrl = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${baseUrl}${props.sectionDir}/README.md?t=${Date.now()}`)
    if (!response.ok) {
      console.error('Ошибка загрузки файла:', response.statusText)
      loadingQuestions.value = false
      return
    }

    const markdown = await response.text()
    console.log('Загружен markdown, длина:', markdown.length)

    // Извлекаем вопросы для теста
    const questions = extractTestQuestions(markdown)
    console.log('Извлечено вопросов:', questions.length)

    // Извлекаем все концепции для построения индекса
    const allConcepts = extractAllConcepts(markdown)
    console.log('Извлечено концепций для индекса:', allConcepts.length)

    // Строим индекс концепций по темам
    const index = buildConceptsIndex(allConcepts, props.sectionDir)
    conceptsIndex.value = index
    console.log('Индекс концепций построен:', Array.from(index.keys()))

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

// Извлечение всех концепций из markdown для построения индекса
const extractAllConcepts = (markdown) => {
  const concepts = []
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
  const seniorAnswerRegex = /^\*\*Ответ Senior:\*\*/gm

  let match
  const questionMatches = []
  questionRegex.lastIndex = 0

  while ((match = questionRegex.exec(markdown)) !== null) {
    questionMatches.push({
      text: match[1].trim().replace(/\*\*/g, '').replace(/`/g, ''),
      index: match.index
    })
  }

  console.log(`[extractAllConcepts] Найдено вопросов для индексации: ${questionMatches.length}`)

  // Для каждого вопроса извлекаем концепцию (вопрос + краткое описание из ответа)
  questionMatches.forEach((q, idx) => {
    const nextQuestionIndex = questionMatches[idx + 1]?.index || markdown.length
    const questionSection = markdown.substring(q.index, nextQuestionIndex)

    // Ищем начало ответа
    const answerPattern = /\*\*Ответ:\*\*\s*/i
    const answerMarkerMatch = questionSection.match(answerPattern)

    let answerStartIndex = -1

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
      return // Пропускаем вопросы без ответов
    }

    let answerSection = questionSection.substring(answerStartIndex).trim()
    answerSection = answerSection.replace(/^\n+/, '').trim()

    // Находим конец ответа (до "Ответ Senior:" или до следующего вопроса)
    let answerEndIndex = answerSection.length
    seniorAnswerRegex.lastIndex = 0
    const seniorMatch = seniorAnswerRegex.exec(answerSection)
    if (seniorMatch) {
      answerEndIndex = seniorMatch.index
    }

    // Извлекаем текст ответа
    let answerText = answerSection.substring(0, answerEndIndex).trim()

    // Убираем markdown разметку
    answerText = answerText
      .replace(/\*\*/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')

    // Берем первое предложение или до 200 символов
    let extractedText = answerText
    const sentenceEnd = extractedText.search(/[.!?]\s+/)

    if (sentenceEnd > 20 && sentenceEnd <= 200) {
      extractedText = extractedText.substring(0, sentenceEnd + 1).trim()
    } else {
      const lineBreak = extractedText.indexOf('\n')
      if (lineBreak > 50 && lineBreak < 200) {
        extractedText = extractedText.substring(0, lineBreak).trim()
      } else {
        extractedText = extractedText.substring(0, 200).trim()
      }
    }

    answerText = extractedText.replace(/\s+/g, ' ').trim()

    if (answerText && answerText.length > 15) {
      concepts.push({
        concept: q.text, // Название концепции (вопрос)
        description: answerText // Краткое описание концепции
      })
    }
  })

  console.log(`[extractAllConcepts] Извлечено концепций: ${concepts.length}`)
  return concepts
}

// Построение индекса концепций по темам
const buildConceptsIndex = (concepts, sectionDir) => {
  const index = new Map()
  const topic = detectQuestionTopic('', sectionDir || props.sectionDir)

  console.log(`[buildConceptsIndex] Построение индекса для темы: ${topic}, концепций: ${concepts.length}`)

  if (!index.has(topic)) {
    index.set(topic, [])
  }

  // Добавляем все концепции в индекс для данной темы
  concepts.forEach(concept => {
    index.get(topic).push(concept)
  })

  console.log(`[buildConceptsIndex] Индекс построен: ${index.get(topic).length} концепций для темы "${topic}"`)

  return index
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

// Расширенный список стоп-слов
const STOP_WORDS = new Set([
  'что', 'такое', 'разница', 'между', 'и', 'или', 'как', 'для', 'когда', 'где',
  'почему', 'зачем', 'какой', 'какая', 'какое', 'какие', 'чем', 'от', 'до',
  'в', 'на', 'с', 'по', 'из', 'к', 'у', 'о', 'об', 'про', 'со', 'во',
  'это', 'этот', 'эта', 'это', 'эти', 'его', 'её', 'их', 'него', 'неё',
  'есть', 'быть', 'является', 'являются', 'может', 'может быть', 'будет',
  'не', 'нет', 'да', 'также', 'тоже', 'еще', 'уже', 'только', 'лишь',
  'все', 'всего', 'всех', 'всем', 'всеми', 'всему', 'всею',
  'один', 'одна', 'одно', 'одни', 'одного', 'одной', 'одним',
  'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'
])

// Извлечение базовых форм слов (убираем окончания для лучшего сопоставления)
const getBaseForm = (word) => {
  // Убираем типичные окончания русского языка
  const endings = [
    /(ый|ий|ая|ое|ые|ого|ому|ым|ом|ую|ой|ей|его|ему|им|ем|ую|ой|ей)$/i, // прилагательные
    /(ов|ев|ин|ын|ых|их|ым|им|ами|ями|ах|ях|ами|ями|ов|ев|ин|ын)$/i, // родительный падеж
    /(ами|ями|ах|ях|ов|ев|ин|ын)$/i, // множественное число
    /(ами|ями)$/i, // творительный падеж
    /(ах|ях)$/i, // предложный падеж
    /(ов|ев|ин|ын)$/i, // родительный падеж множественного числа
  ]

  let base = word.toLowerCase()

  // Пробуем убрать окончания
  for (const ending of endings) {
    if (ending.test(base) && base.length > 5) {
      base = base.replace(ending, '')
      break
    }
  }

  return base
}

// Извлечение ключевых терминов из вопроса (улучшенная версия)
const extractQuestionTerms = (question) => {
  if (!question || typeof question !== 'string') return []

  // Сначала извлекаем CamelCase слова (например, WeakMap, WeakSet)
  const camelCaseWords = []
  const camelCaseRegex = /([A-Z][a-z]+(?:[A-Z][a-z]+)*)/g
  let match
  while ((match = camelCaseRegex.exec(question)) !== null) {
    const camelWord = match[1].toLowerCase()
    camelCaseWords.push(camelWord)
    // Также добавляем части CamelCase (WeakMap -> weakmap, weak, map)
    const parts = camelWord.match(/[a-z]+/g)
    if (parts) {
      parts.forEach(part => {
        if (part.length >= 3) camelCaseWords.push(part)
      })
    }
  }

  // Убираем знаки препинания, скобки, слэши и приводим к нижнему регистру
  const cleaned = question.toLowerCase()
    .replace(/[()\[\]{}]/g, ' ') // Убираем скобки всех типов
    .replace(/[.,!?;:\/\u2014\u2013-]/g, ' ') // Убираем знаки препинания, тире (—, –, -) и слэши (дефис в конце)
    .replace(/`([^`]+)`/g, ' $1 ') // Извлекаем содержимое из обратных кавычек
    .replace(/\s+/g, ' ') // Нормализуем пробелы
    .trim()

  // Разбиваем на слова и фильтруем
  const words = cleaned.split(' ')
    .filter(word => word.length > 2) // Только слова длиннее 2 символов
    .filter(word => !STOP_WORDS.has(word)) // Убираем стоп-слова
    .filter(word => !/^\d+$/.test(word)) // Убираем числа
    .filter(word => !/^[a-z]$/i.test(word)) // Убираем одиночные буквы

  // Объединяем обычные слова и CamelCase слова
  const allWords = [...words, ...camelCaseWords]

  // Создаем набор терминов: полные слова + базовые формы
  const terms = new Set()

  allWords.forEach(word => {
    // Добавляем полное слово
    terms.add(word)

    // Добавляем базовую форму (если отличается)
    const base = getBaseForm(word)
    if (base !== word && base.length > 3) {
      terms.add(base)
    }

    // Добавляем части слова (для составных терминов)
    // Например, "прототипное наследование" -> "прототип", "наследование"
    if (word.length > 6) {
      // Пробуем найти корень слова (первые 4-6 символов)
      const root = word.substring(0, Math.min(6, word.length - 2))
      if (root.length >= 4) {
        terms.add(root)
      }
    }
  })

  const uniqueTerms = Array.from(terms)

  // Логирование для отладки
  if (process.env.NODE_ENV === 'development') {
    console.log(`[extractQuestionTerms] Вопрос: "${question.substring(0, 50)}..."`)
    console.log(`[extractQuestionTerms] Извлечено терминов: ${uniqueTerms.length}`, uniqueTerms)
  }

  return uniqueTerms
}

// Алиас для обратной совместимости
const extractKeyTerms = extractQuestionTerms

// Проверка, содержит ли текст запрещенные термины (улучшенная версия с проверкой форм слов)
const containsForbiddenTerms = (text, forbiddenTerms) => {
  if (!forbiddenTerms || forbiddenTerms.length === 0) return false
  if (!text || typeof text !== 'string') return false

  const textLower = text.toLowerCase()
  const foundTerms = []

  for (const term of forbiddenTerms) {
    if (!term || term.length < 3) continue

    // Проверка 1: Точное совпадение слова (с границами слов)
    const exactRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (exactRegex.test(textLower)) {
      foundTerms.push(term)
      continue
    }

    // Проверка 2: Частичное совпадение (слово содержит термин или термин содержит слово)
    // Это нужно для случаев типа "прототип" в вопросе и "прототипное" в ответе
    if (term.length >= 4) {
      // Проверяем, содержит ли текст слово, начинающееся с термина
      const partialRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[а-яёa-z]*\\b`, 'i')
      if (partialRegex.test(textLower)) {
        foundTerms.push(term)
        continue
      }

      // Проверяем, содержит ли текст слово, которое является частью термина
      // Например, если термин "прототипное наследование", проверяем "прототип" и "наследование"
      const wordsInTerm = term.split(/\s+/).filter(w => w.length >= 4)
      for (const word of wordsInTerm) {
        const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[а-яёa-z]*\\b`, 'i')
        if (wordRegex.test(textLower)) {
          foundTerms.push(term)
          break
        }
      }
    }
  }

  if (foundTerms.length > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[containsForbiddenTerms] Найдены запрещенные термины:`, foundTerms, `в тексте: "${text.substring(0, 60)}..."`)
  }

  return foundTerms.length > 0
}

// Проверка схожести ответов (чтобы избежать слишком похожих)
const areAnswersTooSimilar = (answer1, answer2, threshold = 0.7) => {
  if (!answer1 || !answer2) return false

  const words1 = new Set(answer1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(answer2.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  if (words1.size === 0 || words2.size === 0) return false

  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])

  const similarity = intersection.size / union.size
  return similarity > threshold
}

// Определение тематической близости между вопросами (улучшенная версия)
const getThematicSimilarity = (question1, question2) => {
  const terms1 = extractQuestionTerms(question1)
  const terms2 = extractQuestionTerms(question2)

  if (terms1.length === 0 || terms2.length === 0) return 0

  // Подсчитываем количество общих терминов
  const set1 = new Set(terms1)
  const set2 = new Set(terms2)
  const commonTerms = terms1.filter(term => set2.has(term))

  // Используем коэффициент Жаккара для более точной оценки
  const intersection = commonTerms.length
  const union = new Set([...terms1, ...terms2]).size

  const similarity = union > 0 ? intersection / union : 0

  if (process.env.NODE_ENV === 'development' && similarity > 0.3) {
    console.log(`[getThematicSimilarity] Схожесть: ${similarity.toFixed(2)}`, {
      q1: question1.substring(0, 40),
      q2: question2.substring(0, 40),
      common: commonTerms
    })
  }

  return similarity
}

// Обрезка длинного ответа до первого предложения или до указанной длины
const truncateAnswer = (answer, maxLength = 150) => {
  if (!answer || typeof answer !== 'string') return ''
  if (answer.length <= maxLength) return answer.trim()

  // Пытаемся найти конец первого предложения
  const sentenceEnd = answer.search(/[.!?]\s+/)
  if (sentenceEnd > 20 && sentenceEnd <= maxLength) {
    return answer.substring(0, sentenceEnd + 1).trim()
  }

  // Если первое предложение слишком длинное или не найдено, обрезаем до maxLength
  const truncated = answer.substring(0, maxLength).trim()
  // Пытаемся обрезать по последнему пробелу, чтобы не резать слово
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...'
  }
  return truncated + '...'
}

// Определение типа вопроса
const detectQuestionType = (question) => {
  const questionLower = question.toLowerCase()

  if (questionLower.includes('разница') || questionLower.includes('отличие') || questionLower.includes('различи')) {
    return 'comparison'
  }
  if (questionLower.includes('что такое') || questionLower.includes('что такое') || questionLower.match(/^что\s+/)) {
    return 'definition'
  }
  if (questionLower.includes('как') || questionLower.includes('когда') || questionLower.includes('где') || questionLower.includes('для чего') || questionLower.includes('зачем')) {
    return 'usage'
  }
  if (questionLower.includes('почему') || questionLower.includes('зачем')) {
    return 'explanation'
  }

  return 'general'
}

// Проверка качества ответа
const validateAnswerQuality = (answer, forbiddenTerms) => {
  if (!answer || typeof answer !== 'string') return false

  // Проверка длины
  if (answer.length < 20 || answer.length > 150) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[validateAnswerQuality] Неподходящая длина: ${answer.length}`, answer.substring(0, 50))
    }
    return false
  }

  // Проверка на запрещенные термины
  if (containsForbiddenTerms(answer, forbiddenTerms)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[validateAnswerQuality] Содержит запрещенные термины:`, answer.substring(0, 50))
    }
    return false
  }

  // Проверка на очевидно неправильные ответы
  const obviouslyWrong = [
    'это не существует',
    'такого не бывает',
    'это невозможно',
    'неправильный ответ',
    'это ошибка'
  ]

  const answerLower = answer.toLowerCase()
  if (obviouslyWrong.some(phrase => answerLower.includes(phrase))) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[validateAnswerQuality] Очевидно неправильный ответ:`, answer.substring(0, 50))
    }
    return false
  }

  // Проверка на техническую грамотность (должно содержать технические термины)
  const technicalTerms = ['механизм', 'метод', 'способ', 'техника', 'паттерн', 'подход', 'система', 'процесс', 'алгоритм', 'структура', 'функция', 'компонент', 'модуль', 'интерфейс', 'протокол', 'формат', 'стандарт']
  const hasTechnicalTerm = technicalTerms.some(term => answerLower.includes(term))

  if (!hasTechnicalTerm && process.env.NODE_ENV === 'development') {
    console.log(`[validateAnswerQuality] Возможно недостаточно технических терминов:`, answer.substring(0, 50))
  }

  return true
}

// Генерация тестовых вопросов с вариантами ответов (полностью переработанная версия)
const generateTestQuestions = (questions) => {
  if (questions.length === 0) {
    console.warn('[generateTestQuestions] Получен пустой массив вопросов')
    return []
  }

  console.log(`[generateTestQuestions] Начало генерации для ${questions.length} вопросов`)

  return questions.map((q, index) => {
    console.log(`\n[generateTestQuestions] Обработка вопроса ${index + 1}/${questions.length}: "${q.question.substring(0, 50)}..."`)

    // Извлекаем ключевые термины из вопроса
    const questionTerms = extractQuestionTerms(q.question)
    console.log(`[generateTestQuestions] Извлечено ${questionTerms.length} ключевых терминов:`, questionTerms)

    // Определяем тип вопроса
    const questionType = detectQuestionType(q.question)
    console.log(`[generateTestQuestions] Тип вопроса: ${questionType}`)

    // Создаем неправильные варианты ответов
    const wrongAnswers = []
    const otherQuestions = questions.filter((_, i) => i !== index)

    if (otherQuestions.length === 0) {
      console.warn(`[generateTestQuestions] Нет других вопросов для генерации неправильных ответов`)
    }

    // Этап 1: Выбор ответов из других вопросов с приоритетом тематически близким
    console.log(`[generateTestQuestions] Этап 1: Поиск ответов из других вопросов...`)

    const sortedBySimilarity = otherQuestions
      .map(otherQ => ({
        question: otherQ,
        similarity: getThematicSimilarity(q.question, otherQ.question)
      }))
      .sort((a, b) => b.similarity - a.similarity) // Сначала более близкие по теме

    let fromOtherQuestions = 0
    for (const { question: otherQ, similarity } of sortedBySimilarity) {
      if (wrongAnswers.length >= 3) break

      const otherAnswer = otherQ.answer.trim()

      // СТРОГАЯ ПРОВЕРКА: проверяем наличие запрещенных терминов ДО validateAnswerQuality
      const hasForbiddenTerms = containsForbiddenTerms(otherAnswer, questionTerms)

      if (hasForbiddenTerms) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[generateTestQuestions] ✗ Пропущен ответ из другого вопроса (содержит запрещенные термины): "${otherAnswer.substring(0, 50)}..."`)
        }
        continue
      }

      // Проверяем все требования перед добавлением
      if (
        otherAnswer !== q.answer && // Ответ отличается от правильного
        validateAnswerQuality(otherAnswer, questionTerms) && // Проходит проверку качества
        !wrongAnswers.some(ans => areAnswersTooSimilar(ans, otherAnswer)) // Не слишком похож на уже добавленные
      ) {
        const shortAnswer = truncateAnswer(otherAnswer, 150)

        // Повторная СТРОГАЯ проверка после обрезки
        const shortAnswerHasForbidden = containsForbiddenTerms(shortAnswer, questionTerms)
        if (!shortAnswerHasForbidden && validateAnswerQuality(shortAnswer, questionTerms)) {
          wrongAnswers.push(shortAnswer)
          fromOtherQuestions++
          console.log(`[generateTestQuestions] ✓ Добавлен ответ из другого вопроса (схожесть: ${similarity.toFixed(2)}): "${shortAnswer.substring(0, 40)}..."`)
        } else if (shortAnswerHasForbidden && process.env.NODE_ENV === 'development') {
          console.log(`[generateTestQuestions] ✗ Пропущен обрезанный ответ (содержит запрещенные термины): "${shortAnswer.substring(0, 50)}..."`)
        }
      }
    }

    console.log(`[generateTestQuestions] Добавлено ${fromOtherQuestions} ответов из других вопросов`)

    // Этап 2: Генерация ответов через generateWrongAnswer
    if (wrongAnswers.length < 3) {
      console.log(`[generateTestQuestions] Этап 2: Генерация ответов через шаблоны...`)

      let attempts = 0
      const maxAttempts = 50
      while (wrongAnswers.length < 3 && attempts < maxAttempts) {
        attempts++
        const wrongAnswer = generateWrongAnswer(q.question, q.answer, questionTerms, props.sectionDir, questionType)

        // СТРОГАЯ ПРОВЕРКА: проверяем наличие запрещенных терминов
        const hasForbiddenTerms = containsForbiddenTerms(wrongAnswer, questionTerms)

        if (hasForbiddenTerms) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[generateTestQuestions] ✗ Пропущен сгенерированный ответ (содержит запрещенные термины, попытка ${attempts}): "${wrongAnswer.substring(0, 50)}..."`)
          }
          continue
        }

        // Проверяем качество и уникальность
        if (
          validateAnswerQuality(wrongAnswer, questionTerms) &&
          !wrongAnswers.some(ans => areAnswersTooSimilar(ans, wrongAnswer)) &&
          !wrongAnswers.includes(wrongAnswer)
        ) {
          wrongAnswers.push(wrongAnswer)
          console.log(`[generateTestQuestions] ✓ Сгенерирован ответ (попытка ${attempts}): "${wrongAnswer.substring(0, 40)}..."`)
        }
      }

      console.log(`[generateTestQuestions] Сгенерировано ${wrongAnswers.length - fromOtherQuestions} ответов через шаблоны (попыток: ${attempts})`)
    }

    // Этап 3: Запасные варианты, если все еще недостаточно
    if (wrongAnswers.length < 3) {
      console.log(`[generateTestQuestions] Этап 3: Добавление запасных вариантов...`)

      const fallbackAnswers = [
        'Это зависит от конкретной реализации и используемых инструментов.',
        'Требуется анализ архитектуры и требований проекта.',
        'Выбор определяется спецификой задачи и ограничениями системы.',
        'Необходимо учитывать производительность и масштабируемость решения.',
        'Это настраивается через конфигурационные файлы и параметры сборки.'
      ]

      for (const fallback of fallbackAnswers) {
        if (wrongAnswers.length >= 3) break

        // Проверяем, что запасной вариант не содержит запрещенных терминов
        if (
          validateAnswerQuality(fallback, questionTerms) &&
          !wrongAnswers.some(ans => areAnswersTooSimilar(ans, fallback)) &&
          !wrongAnswers.includes(fallback)
        ) {
          wrongAnswers.push(fallback)
          console.log(`[generateTestQuestions] ✓ Добавлен запасной вариант: "${fallback}"`)
        }
      }
    }

    // Финализация: берем первые 3 ответа
    const wrongAnswersArray = wrongAnswers.slice(0, 3)

    if (wrongAnswersArray.length < 3) {
      console.warn(`[generateTestQuestions] ⚠ Внимание: получено только ${wrongAnswersArray.length} неправильных ответов вместо 3`)
    }

    console.log(`[generateTestQuestions] Итого неправильных ответов: ${wrongAnswersArray.length}`)

    // Создаем массив всех ответов
    const allAnswers = [q.answer, ...wrongAnswersArray]

    // Перемешиваем и находим индекс правильного ответа
    const shuffled = [...allAnswers].sort(() => Math.random() - 0.5)
    const correctIndex = shuffled.findIndex(a => a === q.answer)

    console.log(`[generateTestQuestions] ✓ Вопрос готов. Правильный ответ на позиции: ${correctIndex + 1}`)

    return {
      text: q.question,
      answers: shuffled,
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    }
  })
}

// Определение темы вопроса по контексту
const detectQuestionTopic = (question, sectionDir) => {
  const questionLower = question.toLowerCase()
  const sectionLower = (sectionDir || '').toLowerCase()

  // Определяем тему по названию раздела
  if (sectionLower.includes('javascript') || sectionLower.includes('typescript')) {
    if (sectionLower.includes('typescript') && !sectionLower.includes('javascript')) {
      return 'typescript'
    }
    return 'javascript'
  }
  if (sectionLower.includes('vue') && !sectionLower.includes('nuxt')) {
    return 'vue'
  }
  if (sectionLower.includes('nuxt')) {
    return 'nuxt'
  }
  if (sectionLower.includes('css') || sectionLower.includes('styling')) {
    return 'css'
  }
  if (sectionLower.includes('performance') || sectionLower.includes('производительность')) {
    return 'performance'
  }
  if (sectionLower.includes('http') || sectionLower.includes('api')) {
    return 'http'
  }
  if (sectionLower.includes('security') || sectionLower.includes('безопасность')) {
    return 'security'
  }
  if (sectionLower.includes('testing') || sectionLower.includes('тестирование')) {
    return 'testing'
  }
  if (sectionLower.includes('accessibility') || sectionLower.includes('a11y')) {
    return 'accessibility'
  }
  if (sectionLower.includes('архитектура') || sectionLower.includes('паттерн')) {
    return 'architecture'
  }
  if (sectionLower.includes('микрофронтенд')) {
    return 'microfrontends'
  }

  // Определяем тему по ключевым словам в вопросе
  if (questionLower.includes('vue') || questionLower.includes('composable') || questionLower.includes('directive')) {
    return 'vue'
  }
  if (questionLower.includes('nuxt') || questionLower.includes('ssr') || questionLower.includes('ssg')) {
    return 'nuxt'
  }
  if (questionLower.includes('typescript') || questionLower.includes('тип') || questionLower.includes('interface')) {
    return 'typescript'
  }
  if (questionLower.includes('css') || questionLower.includes('стиль') || questionLower.includes('flexbox') || questionLower.includes('grid')) {
    return 'css'
  }

  // По умолчанию возвращаем javascript
  return 'javascript'
}

// Тематические шаблоны неправильных ответов
const getThematicTemplates = (topic) => {
  const templates = {
    javascript: [
      'Механизм поднятия переменных в начало области видимости перед выполнением кода.',
      'Способ создания объектов через конструктор с прототипом.',
      'Паттерн для управления асинхронными операциями через колбэки.',
      'Метод автоматического преобразования типов при сравнении значений.',
      'Техника оптимизации производительности через мемоизацию результатов.',
      'Механизм обработки ошибок через специальные объекты исключений.',
      'Способ управления состоянием приложения через централизованное хранилище.',
      'Метод кэширования данных для уменьшения количества запросов.',
      'Техника разделения кода на модули через систему импортов и экспортов.',
      'Механизм работы с асинхронным кодом через генераторы и итераторы.',
      'Способ создания копий объектов через поверхностное копирование свойств.',
      'Паттерн для реализации наследования через цепочку прототипов.',
      'Метод оптимизации загрузки через динамический импорт модулей.',
      'Техника работы с коллекциями через методы массивов и объектов.',
      'Механизм управления памятью через сборщик мусора и ссылочный подсчет.'
    ],
    typescript: [
      'Механизм вывода типов на основе использования переменных в коде.',
      'Способ создания сложных типов через объединение и пересечение.',
      'Паттерн для обеспечения типобезопасности через дженерики.',
      'Метод ограничения типов через условные типы и маппинг.',
      'Техника работы с типами через утилитарные типы и хелперы.',
      'Механизм проверки типов на этапе компиляции через анализатор.',
      'Способ создания интерфейсов через декларацию структуры данных.',
      'Метод обеспечения совместимости через структурную типизацию.',
      'Техника работы с типами через type guards и type narrowing.',
      'Механизм расширения типов через declaration merging и augmentation.',
      'Способ создания типов через template literal types и mapped types.',
      'Паттерн для работы с типами через branded types и nominal typing.',
      'Метод обеспечения типобезопасности через strict mode и опции компилятора.',
      'Техника работы с типами через conditional types и infer keyword.',
      'Механизм создания типов через utility types и built-in helpers.'
    ],
    vue: [
      'Директива для условного рендеринга элементов в шаблоне.',
      'Composable для управления состоянием компонента и реактивностью.',
      'Механизм реактивности через Proxy объекты и отслеживание изменений.',
      'Способ передачи данных от родителя к потомку через props.',
      'Метод передачи событий от потомка к родителю через emit.',
      'Техника оптимизации рендеринга через виртуальный DOM и diff алгоритм.',
      'Механизм работы с формами через директивы v-model и валидацию.',
      'Способ организации маршрутизации через Vue Router и навигацию.',
      'Паттерн для управления состоянием через Pinia или Vuex.',
      'Метод работы с жизненным циклом компонента через хуки и composables.',
      'Техника оптимизации производительности через lazy loading компонентов.',
      'Механизм работы с асинхронными данными через Suspense и async setup.',
      'Способ создания переиспользуемых компонентов через slots и scoped slots.',
      'Метод работы с CSS через scoped styles и CSS modules.',
      'Техника тестирования компонентов через Vue Test Utils и unit тесты.'
    ],
    nuxt: [
      'Механизм серверного рендеринга через генерацию HTML на сервере.',
      'Способ создания статических сайтов через предварительный рендеринг страниц.',
      'Паттерн для работы с данными через useFetch и useAsyncData composables.',
      'Метод организации маршрутизации через file-based routing систему.',
      'Техника оптимизации загрузки через автоматический code splitting.',
      'Механизм работы с API через server routes и middleware.',
      'Способ управления конфигурацией через nuxt.config файл и модули.',
      'Метод работы с метаданными через useHead и useSeoMeta composables.',
      'Техника оптимизации производительности через автоматическую оптимизацию изображений.',
      'Механизм работы с плагинами через plugins директорию и регистрацию.',
      'Способ организации компонентов через auto-imports и компонентную систему.',
      'Метод работы с серверными функциями через server utilities и API routes.',
      'Техника работы с типами через автоматическую генерацию типов.',
      'Механизм деплоя через адаптеры для различных платформ и хостингов.',
      'Способ работы с состоянием через серверное состояние и гидратацию.'
    ],
    css: [
      'Техника позиционирования элементов через flexbox и grid системы.',
      'Метод создания адаптивных макетов через media queries и breakpoints.',
      'Механизм работы с анимациями через transitions и keyframes.',
      'Способ организации стилей через CSS modules и scoped styles.',
      'Паттерн для работы с переменными через CSS custom properties.',
      'Метод оптимизации производительности через hardware acceleration.',
      'Техника работы с типографикой через font loading и fallback шрифты.',
      'Механизм создания эффектов через filters, transforms и backdrop filters.',
      'Способ организации кода через методологии BEM, OOCSS или SMACSS.',
      'Метод работы с цветами через color functions и color spaces.',
      'Техника создания адаптивных изображений через srcset и sizes атрибуты.',
      'Механизм работы с селекторами через псевдоклассы и псевдоэлементы.',
      'Способ оптимизации загрузки через critical CSS и inline styles.',
      'Метод работы с анимациями через will-change и transform properties.',
      'Техника создания эффектов через gradients, shadows и border radius.'
    ],
    performance: [
      'Метод оптимизации загрузки через code splitting и lazy loading.',
      'Техника уменьшения размера бандла через tree shaking и minification.',
      'Механизм кэширования ресурсов через service workers и cache API.',
      'Способ оптимизации изображений через современные форматы и lazy loading.',
      'Паттерн для оптимизации рендеринга через virtual scrolling и pagination.',
      'Метод уменьшения времени загрузки через preload, prefetch и preconnect.',
      'Техника оптимизации JavaScript через debouncing и throttling.',
      'Механизм работы с памятью через garbage collection и memory leaks prevention.',
      'Способ оптимизации сети через HTTP/2, compression и CDN использование.',
      'Метод улучшения производительности через Web Workers и offloading.',
      'Техника оптимизации рендеринга через requestAnimationFrame и batching.',
      'Механизм работы с ресурсами через resource hints и priority hints.',
      'Способ оптимизации загрузки через critical rendering path optimization.',
      'Метод уменьшения времени отклика через server-side optimizations.',
      'Техника улучшения производительности через performance monitoring и profiling.'
    ],
    http: [
      'Протокол для передачи данных через методы GET, POST, PUT и DELETE.',
      'Механизм работы с заголовками через request и response headers.',
      'Способ управления состоянием через cookies, session storage и local storage.',
      'Метод работы с аутентификацией через JWT токены и OAuth протоколы.',
      'Техника оптимизации запросов через HTTP/2 multiplexing и server push.',
      'Механизм работы с кэшированием через cache-control и ETag заголовки.',
      'Способ обработки ошибок через status codes и error handling.',
      'Метод работы с CORS через preflight requests и access-control headers.',
      'Техника работы с данными через JSON, XML и form-data форматы.',
      'Механизм оптимизации через compression, gzip и brotli алгоритмы.',
      'Способ работы с безопасностью через HTTPS, TLS и certificate validation.',
      'Метод работы с API через RESTful principles и GraphQL queries.',
      'Техника работы с потоковой передачей через chunked transfer encoding.',
      'Механизм работы с версионированием через API versioning strategies.',
      'Способ оптимизации через connection pooling и keep-alive connections.'
    ],
    security: [
      'Метод защиты от XSS через sanitization и content security policy.',
      'Техника предотвращения CSRF через токены и same-site cookies.',
      'Механизм работы с аутентификацией через secure password hashing.',
      'Способ защиты данных через encryption и secure storage.',
      'Паттерн для работы с авторизацией через role-based access control.',
      'Метод защиты от SQL injection через parameterized queries.',
      'Техника работы с безопасностью через HTTPS и TLS протоколы.',
      'Механизм защиты от clickjacking через X-Frame-Options заголовки.',
      'Способ работы с токенами через secure token storage и expiration.',
      'Метод защиты от man-in-the-middle через certificate pinning.',
      'Техника работы с безопасностью через security headers и CSP.',
      'Механизм защиты от brute force через rate limiting и captcha.',
      'Способ работы с данными через input validation и sanitization.',
      'Метод защиты от session hijacking через secure session management.',
      'Техника работы с безопасностью через security audits и penetration testing.'
    ],
    testing: [
      'Метод тестирования компонентов через unit тесты и мокирование зависимостей.',
      'Техника работы с тестами через integration тесты и E2E тестирование.',
      'Механизм работы с тестами через test runners и assertion libraries.',
      'Способ организации тестов через test suites и test cases.',
      'Паттерн для работы с тестами через mocking, stubbing и spying.',
      'Метод работы с тестами через snapshot testing и visual regression.',
      'Техника работы с тестами через coverage reports и code quality metrics.',
      'Механизм работы с тестами через test data management и fixtures.',
      'Способ работы с тестами через async testing и promise handling.',
      'Метод работы с тестами через test isolation и cleanup procedures.',
      'Техника работы с тестами через test doubles и dependency injection.',
      'Механизм работы с тестами через behavior-driven development подходы.',
      'Способ работы с тестами через performance testing и load testing.',
      'Метод работы с тестами через accessibility testing и a11y проверки.',
      'Техника работы с тестами через continuous integration и test automation.'
    ],
    accessibility: [
      'Метод обеспечения доступности через semantic HTML и ARIA атрибуты.',
      'Техника работы с доступностью через keyboard navigation и focus management.',
      'Механизм работы с доступностью через screen reader compatibility.',
      'Способ обеспечения доступности через color contrast и visual indicators.',
      'Паттерн для работы с доступностью через alternative text и descriptions.',
      'Метод работы с доступностью через form labels и error messages.',
      'Техника работы с доступностью через skip links и landmark regions.',
      'Механизм работы с доступностью через live regions и announcements.',
      'Способ работы с доступностью через focus indicators и visible focus.',
      'Метод работы с доступностью через heading hierarchy и document structure.',
      'Техника работы с доступностью через touch target sizes и interaction areas.',
      'Механизм работы с доступностью через motion preferences и reduced motion.',
      'Способ работы с доступностью через language attributes и text alternatives.',
      'Метод работы с доступностью через form validation и error handling.',
      'Техника работы с доступностью через accessibility audits и WCAG compliance.'
    ],
    architecture: [
      'Паттерн для организации кода через MVC, MVP или MVVM архитектуры.',
      'Метод работы с архитектурой через component-based и modular подходы.',
      'Техника организации кода через separation of concerns и single responsibility.',
      'Механизм работы с архитектурой через dependency injection и inversion of control.',
      'Способ организации кода через design patterns и architectural patterns.',
      'Метод работы с архитектурой через microservices и service-oriented architecture.',
      'Техника организации кода через event-driven и message-based архитектуры.',
      'Механизм работы с архитектурой через layered architecture и tier separation.',
      'Способ организации кода через clean architecture и hexagonal architecture.',
      'Метод работы с архитектурой через domain-driven design и bounded contexts.',
      'Техника организации кода через feature-based и module-based структуры.',
      'Механизм работы с архитектурой через state management и unidirectional data flow.',
      'Способ организации кода через composition over inheritance принципы.',
      'Метод работы с архитектурой через API design и contract-first подходы.',
      'Техника организации кода через scalability patterns и performance optimization.'
    ],
    microfrontends: [
      'Метод организации приложений через независимые микроприложения и модули.',
      'Техника работы с микрофронтендами через module federation и dynamic imports.',
      'Механизм интеграции через iframe, web components или runtime integration.',
      'Способ работы с микрофронтендами через shared dependencies и versioning.',
      'Паттерн для работы с микрофронтендами через single-spa и orchestration.',
      'Метод работы с микрофронтендами через independent deployment и CI/CD.',
      'Техника организации через team autonomy и technology diversity.',
      'Механизм работы с микрофронтендами через shared state и communication patterns.',
      'Способ работы с микрофронтендами через routing и navigation strategies.',
      'Метод работы с микрофронтендами через build-time и runtime integration.',
      'Техника организации через monorepo и polyrepo структуры.',
      'Механизм работы с микрофронтендами через shared UI libraries и design systems.',
      'Способ работы с микрофронтендами через cross-cutting concerns и shared services.',
      'Метод работы с микрофронтендами через testing strategies и quality assurance.',
      'Техника организации через governance и architectural decision records.'
    ]
  }

  return templates[topic] || templates.javascript
}

// Получение концепций из индекса для темы
const getConceptsFromIndex = (topic, count = 5) => {
  if (!conceptsIndex.value || !conceptsIndex.value.has(topic)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getConceptsFromIndex] Индекс не содержит тему "${topic}"`)
    }
    return []
  }

  const concepts = conceptsIndex.value.get(topic)
  if (concepts.length === 0) {
    return []
  }

  // Перемешиваем и берем случайные концепции
  const shuffled = [...concepts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, concepts.length))
}

// Генерация неправильного ответа на основе концепций из индекса
const generateWrongAnswerFromConcepts = (question, forbiddenTerms, topic, count = 3) => {
  // Берем больше концепций, чтобы было из чего выбирать после фильтрации
  const concepts = getConceptsFromIndex(topic, count * 5)

  if (concepts.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[generateWrongAnswerFromConcepts] Нет концепций для темы "${topic}"`)
    }
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswerFromConcepts] Проверка ${concepts.length} концепций для темы "${topic}"`)
  }

  // Фильтруем концепции: убираем те, что содержат запрещенные термины
  // Проверяем как описание, так и название концепции
  const filteredConcepts = concepts.filter(concept => {
    const description = concept.description || ''
    const conceptName = concept.concept || ''

    // Проверяем описание концепции
    const descriptionHasForbidden = containsForbiddenTerms(description, forbiddenTerms)

    // Проверяем название концепции (вопрос)
    const nameHasForbidden = containsForbiddenTerms(conceptName, forbiddenTerms)

    // Проверяем качество ответа
    const isValidQuality = validateAnswerQuality(description, forbiddenTerms)

    if (process.env.NODE_ENV === 'development' && (descriptionHasForbidden || nameHasForbidden)) {
      console.log(`[generateWrongAnswerFromConcepts] ✗ Отфильтрована концепция: "${conceptName.substring(0, 40)}..."`)
      if (descriptionHasForbidden) console.log(`  - Описание содержит запрещенные термины`)
      if (nameHasForbidden) console.log(`  - Название содержит запрещенные термины`)
    }

    return !descriptionHasForbidden && !nameHasForbidden && isValidQuality
  })

  if (filteredConcepts.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[generateWrongAnswerFromConcepts] Все ${concepts.length} концепций содержат запрещенные термины`)
    }
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswerFromConcepts] После фильтрации осталось ${filteredConcepts.length} подходящих концепций`)
  }

  // Выбираем случайную концепцию из отфильтрованных
  const selectedConcept = filteredConcepts[Math.floor(Math.random() * filteredConcepts.length)]
  const answer = truncateAnswer(selectedConcept.description, 150)

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswerFromConcepts] ✓ Выбрана концепция: "${selectedConcept.concept.substring(0, 40)}..."`)
    console.log(`[generateWrongAnswerFromConcepts] Ответ: "${answer.substring(0, 50)}..."`)
  }

  return answer
}

// Генерация неправильного ответа (полностью переработанная версия)
const generateWrongAnswer = (question, correctAnswer, questionTerms = null, sectionDir = null, questionType = null) => {
  // Извлекаем термины, если они не переданы
  const forbiddenTerms = questionTerms || extractQuestionTerms(question)
  const questionLower = question.toLowerCase()

  // Определяем тип вопроса, если не передан
  const type = questionType || detectQuestionType(question)

  // Определяем тему вопроса
  const topic = detectQuestionTopic(question, sectionDir || props.sectionDir)

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswer] Генерация ответа для вопроса: "${question.substring(0, 50)}..."`)
    console.log(`[generateWrongAnswer] Тип: ${type}, Тема: ${topic}, Запрещенных терминов: ${forbiddenTerms.length}`)
  }

  // ПРИОРИТЕТ 1: Пытаемся использовать концепции из индекса базы знаний
  const conceptAnswer = generateWrongAnswerFromConcepts(question, forbiddenTerms, topic)
  if (conceptAnswer) {
    return conceptAnswer
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswer] Концепции из индекса не подошли, используем шаблоны`)
  }

  // ПРИОРИТЕТ 2: Используем тематические шаблоны
  const thematicTemplates = getThematicTemplates(topic)

  // Шаблоны для вопросов типа "разница между X и Y" (comparison)
  const comparisonWrongAnswers = [
    'Оба подхода идентичны по функциональности и могут использоваться взаимозаменяемо.',
    'Различия существуют только в синтаксисе, но семантика полностью совпадает.',
    'Один является расширенной версией другого с дополнительными возможностями.',
    'Разница заключается только в способе объявления, поведение идентично.',
    'Оба механизма работают одинаково, отличаются лишь названиями.',
    'Функциональность полностью эквивалентна, выбор зависит от предпочтений разработчика.',
    'Различия минимальны и касаются только внутренней реализации.',
    'Оба варианта создают одинаковые структуры данных с идентичным поведением.',
    'Разница существует только в версиях спецификации, функциональность та же.',
    'Один является синтаксическим сахаром для другого без изменений в логике.'
  ]

  // Шаблоны для вопросов про применение/использование (usage)
  const usageWrongAnswers = [
    'Это определяется настройками сборщика и конфигурацией проекта.',
    'Выбор зависит от конкретной ситуации и используемых технологий.',
    'Требуется дополнительное исследование и анализ требований проекта.',
    'Необходимо учитывать контекст применения и специфику задачи.',
    'Для этого нет однозначного ответа, всё зависит от выбранного фреймворка.',
    'Это настраивается через параметры компилятора или транспайлера.',
    'Выбор зависит от версии используемой библиотеки и её возможностей.',
    'Это определяется архитектурными решениями и паттернами проекта.',
    'Требуется анализ производительности и масштабируемости решения.',
    'Выбор зависит от требований к совместимости и поддержке браузеров.'
  ]

  // Шаблоны для вопросов типа "почему" (explanation)
  const explanationWrongAnswers = [
    'Это связано с особенностями реализации в ранних версиях языка.',
    'Такое поведение обусловлено требованиями обратной совместимости.',
    'Это результат эволюции стандартов и спецификаций.',
    'Такое решение было принято для упрощения синтаксиса и читаемости кода.',
    'Это связано с ограничениями браузерной совместимости и поддержкой.',
    'Такое поведение обеспечивает лучшую производительность и оптимизацию.',
    'Это результат компромисса между функциональностью и простотой использования.',
    'Такое решение было принято для обеспечения безопасности и предотвращения ошибок.'
  ]

  // Определяем стратегию выбора шаблонов в зависимости от типа вопроса
  let templates = []
  let strategy = ''

  switch (type) {
    case 'comparison':
      // Для вопросов о различиях: приоритет шаблонам сравнения, затем тематические
      templates = [...comparisonWrongAnswers, ...thematicTemplates]
      strategy = 'comparison + thematic'
      break

    case 'definition':
      // Для вопросов "что такое": только тематические шаблоны
      templates = thematicTemplates
      strategy = 'thematic only'
      break

    case 'usage':
      // Для вопросов про применение: usage шаблоны + тематические
      templates = [...usageWrongAnswers, ...thematicTemplates]
      strategy = 'usage + thematic'
      break

    case 'explanation':
      // Для вопросов "почему": explanation + тематические
      templates = [...explanationWrongAnswers, ...thematicTemplates]
      strategy = 'explanation + thematic'
      break

    default:
      // Для общих вопросов: смешиваем все типы, приоритет тематическим
      templates = [...thematicTemplates, ...comparisonWrongAnswers, ...usageWrongAnswers, ...explanationWrongAnswers]
      strategy = 'mixed (thematic priority)'
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[generateWrongAnswer] Стратегия: ${strategy}, Доступно шаблонов: ${templates.length}`)
  }

  // Пытаемся найти ответ, который не содержит запрещенных терминов
  const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5)
  let attempts = 0
  const maxAttempts = templates.length

  for (const template of shuffledTemplates) {
    attempts++
    if (!containsForbiddenTerms(template, forbiddenTerms)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[generateWrongAnswer] ✓ Найден подходящий ответ (попытка ${attempts}): "${template.substring(0, 50)}..."`)
      }
      return template
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[generateWrongAnswer] ⚠ Все ${attempts} шаблонов содержат запрещенные термины, используем запасные варианты`)
  }

  // Если все шаблоны содержат запрещенные термины, создаем общий ответ
  const fallbackAnswers = [
    'Это зависит от конкретной реализации и используемых инструментов.',
    'Требуется анализ архитектуры и требований проекта.',
    'Выбор определяется спецификой задачи и ограничениями системы.',
    'Необходимо учитывать производительность и масштабируемость решения.',
    'Это настраивается через конфигурационные файлы и параметры сборки.',
    'Требуется дополнительное исследование и анализ требований проекта.',
    'Выбор зависит от конкретной ситуации и используемых технологий.',
    'Это определяется архитектурными решениями и паттернами проекта.'
  ]

  // Фильтруем запасные варианты от запрещенных терминов
  const filteredFallbacks = fallbackAnswers.filter(fallback =>
    !containsForbiddenTerms(fallback, forbiddenTerms)
  )

  if (filteredFallbacks.length > 0) {
    const selected = filteredFallbacks[Math.floor(Math.random() * filteredFallbacks.length)]
    if (process.env.NODE_ENV === 'development') {
      console.log(`[generateWrongAnswer] ✓ Использован запасной вариант: "${selected}"`)
    }
    return selected
  }

  // Последний резервный вариант (если даже запасные содержат запрещенные термины)
  const ultimateFallback = 'Это определяется спецификой задачи и используемыми технологиями.'
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[generateWrongAnswer] ⚠ Использован последний резервный вариант`)
  }
  return ultimateFallback
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
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 1rem;
  }

  .test-content,
  .test-intro,
  .test-results {
    padding: 1rem;
    max-height: calc(100vh - 2rem);
    border-radius: 8px;
  }

  .test-header {
    top: 0.5rem;
    right: 0.5rem;
  }

  .close-btn {
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
  }

  .question-title {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }

  .answer-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
  }

  .answer-letter {
    min-width: 20px;
    font-size: 0.875rem;
  }

  .answer-text {
    font-size: 0.9375rem;
  }

  .results-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .restart-btn,
  .close-btn-secondary {
    width: 100%;
  }

  .test-progress {
    margin-bottom: 1.5rem;
  }

  .progress-text {
    font-size: 0.8125rem;
  }
}
</style>

