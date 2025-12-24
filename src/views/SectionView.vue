<template>
  <div class="section-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button @click="loadContent" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="section-wrapper">
      <div class="mobile-nav-wrapper">
        <Search :current-section="section" :questions="questions" />
      </div>
      <article class="content" ref="contentRef" v-html="htmlContent" @click="handleCodeBlockClick"></article>
      <div class="right-sidebar">
        <Search :current-section="section" :questions="questions" />
        <QuestionNav :questions="questions" class="desktop-nav" />
      </div>
    </div>

    <!-- Модальное окно для вопросов на мобильных -->
    <div v-if="filterOpen" class="filter-overlay" @click="closeFilter">
      <div class="filter-modal" @click.stop>
        <div class="filter-modal-header">
          <h3>Навигация по вопросам</h3>
          <button @click="closeFilter" class="filter-close-btn" aria-label="Закрыть">×</button>
        </div>
        <div class="filter-modal-content">
          <QuestionNav :questions="questions" class="mobile-filter" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import QuestionNav from '../components/QuestionNav.vue'
import Search from '../components/Search.vue'
// Используем темную тему и переопределим цвета для VS Code стиля
import 'highlight.js/styles/github-dark.css'
import '../styles/code.css'
import '../styles/vscode-theme.css'
import '../styles/highlight-fix.css'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const htmlContent = ref('')
const contentRef = ref(null)
const questions = ref([])
const filterOpen = ref(false)

// Закрытие фильтра
const closeFilter = () => {
  filterOpen.value = false
  const event = new CustomEvent('filter-closed')
  window.dispatchEvent(event)
}

// Обработчик открытия/закрытия фильтра
const handleToggleFilter = (event) => {
  filterOpen.value = event.detail.open
}

// Передаем количество вопросов в Header через событие
watch(questions, (newQuestions) => {
  const event = new CustomEvent('questions-count-updated', {
    detail: { count: newQuestions.length }
  })
  window.dispatchEvent(event)
}, { immediate: true })

// Настройка marked для подсветки синтаксиса
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

const loadContent = async () => {
  loading.value = true
  error.value = null

  try {
    // Путь к файлу в public директории (с учетом base URL для GitHub Pages)
    const baseUrl = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${baseUrl}${props.section.dir}/README.md?t=${Date.now()}`)

    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл: ${response.statusText}`)
    }

    const markdown = await response.text()
    // Извлекаем вопросы перед парсингом
    extractQuestions(markdown)
    let parsedHtml = marked.parse(markdown)
    // Оборачиваем ответы в аккордеоны
    parsedHtml = wrapAnswersInAccordions(parsedHtml)
    htmlContent.value = parsedHtml
    // Добавляем кнопки копирования и якоря после рендеринга DOM
    await nextTick()
    setTimeout(() => {
      addCopyButtons()
      addQuestionAnchors()
      initAccordions()
      // Применяем подсветку после создания аккордеонов
      ensureHighlightClasses()
      // Повторно применяем через небольшую задержку для аккордеонов
      setTimeout(() => {
        ensureHighlightClasses()
      }, 100)
    }, 150)
  } catch (err) {
    error.value = err.message
    console.error('Ошибка загрузки контента:', err)
  } finally {
    loading.value = false
  }
}

// Слушаем события от Header для открытия/закрытия фильтра
onMounted(() => {
  window.addEventListener('toggle-filter', handleToggleFilter)
  loadContent()
})

onUnmounted(() => {
  window.removeEventListener('toggle-filter', handleToggleFilter)
})

watch(() => props.section.id, () => {
  loadContent()
})

// Обработчик клика для копирования кода
const handleCodeBlockClick = (event) => {
  const copyBtn = event.target.closest('.copy-code-btn')
  if (copyBtn) {
    const codeBlock = copyBtn.closest('pre')
    if (codeBlock) {
      const code = codeBlock.querySelector('code')
      if (code) {
        navigator.clipboard.writeText(code.textContent || code.innerText)
        copyBtn.textContent = '✓ Скопировано'
        copyBtn.classList.add('copied')
        setTimeout(() => {
          copyBtn.textContent = '📋'
          copyBtn.classList.remove('copied')
        }, 2000)
      }
    }
  }
}

// Убеждаемся, что классы highlight.js применены
const ensureHighlightClasses = () => {
  if (!contentRef.value) return

  // Находим все блоки кода, включая внутри аккордеонов (даже скрытых)
  const codeBlocks = contentRef.value.querySelectorAll('pre code')

  codeBlocks.forEach(block => {
    // Проверяем, есть ли уже подсветка (есть ли элементы с классами hljs-*)
    const hasHighlight = block.querySelector('.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function')

    // Получаем исходный текст для подсветки
    const originalText = block.textContent || block.innerText

    if (!hasHighlight && originalText && originalText.trim()) {
      // Если подсветки нет, применяем её
      try {
        // Определяем язык из класса родительского элемента или самого code
        let language = null

        // Проверяем классы на code элементе
        const codeClassMatch = block.className.match(/language-(\w+)/)
        if (codeClassMatch) {
          language = codeClassMatch[1]
        } else {
          // Проверяем классы на pre элементе
          const pre = block.closest('pre')
          if (pre) {
            const preClassMatch = pre.className.match(/language-(\w+)/)
            if (preClassMatch) {
              language = preClassMatch[1]
            }
          }
        }

        // Если язык не найден, пробуем автоматическое определение
        if (!language || !hljs.getLanguage(language)) {
          const highlighted = hljs.highlightAuto(originalText)
          block.innerHTML = highlighted.value
          block.classList.add('hljs')
          // Сохраняем определенный язык
          if (highlighted.language) {
            block.classList.add(`language-${highlighted.language}`)
          }
        } else {
          const highlighted = hljs.highlight(originalText, { language })
          block.innerHTML = highlighted.value
          block.classList.add('hljs')
          block.classList.add(`language-${language}`)
        }
      } catch (e) {
        console.warn('Ошибка подсветки кода:', e, block)
        // Если не удалось подсветить, хотя бы добавим класс и базовые стили
        if (!block.classList.contains('hljs')) {
          block.classList.add('hljs')
        }
      }
    } else if (!block.classList.contains('hljs')) {
      // Если подсветка есть в HTML, но нет класса hljs - добавляем
      block.classList.add('hljs')
    }

    // Убеждаемся, что у pre есть правильный фон
    const pre = block.closest('pre')
    if (pre && !pre.style.backgroundColor) {
      pre.style.backgroundColor = '#1e1e1e'
    }
  })

  // Дополнительно применяем highlightAll для любых пропущенных блоков
  // Это важно для блоков, которые могли быть пропущены
  try {
    // Применяем highlightAll только к блокам без подсветки
    const unhighlighted = contentRef.value.querySelectorAll('pre code:not(.hljs)')
    unhighlighted.forEach(block => {
      if (block.textContent && block.textContent.trim()) {
        try {
          hljs.highlightElement(block)
        } catch (e) {
          // Игнорируем ошибки для конкретных блоков
        }
      }
    })
  } catch (e) {
    console.warn('Ошибка highlightAll:', e)
  }
}

// Добавление кнопок копирования к блокам кода
const addCopyButtons = () => {
  if (!contentRef.value) return
  const codeBlocks = contentRef.value.querySelectorAll('pre code')
  codeBlocks.forEach(block => {
    const pre = block.parentElement
    if (pre && !pre.querySelector('.copy-code-btn')) {
      const copyBtn = document.createElement('button')
      copyBtn.className = 'copy-code-btn'
      copyBtn.textContent = '📋'
      copyBtn.title = 'Копировать код'
      pre.style.position = 'relative'
      pre.appendChild(copyBtn)
    }
  })
}

// Извлечение вопросов из markdown
const extractQuestions = (markdown) => {
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
  const extractedQuestions = []
  let match

  while ((match = questionRegex.exec(markdown)) !== null) {
    const questionText = match[1].trim()
    // Убираем markdown разметку из текста вопроса
    const cleanText = questionText
      .replace(/\*\*/g, '') // Убираем жирный текст
      .replace(/`/g, '') // Убираем код
      .trim()

    extractedQuestions.push({
      id: `question-${extractedQuestions.length + 1}`,
      text: cleanText
    })
  }

  questions.value = extractedQuestions
  console.log('Извлечено вопросов:', extractedQuestions.length, extractedQuestions)
}

// Добавление ID к вопросам (h3) для навигации
const addQuestionAnchors = () => {
  if (!contentRef.value) return
  const h3Elements = contentRef.value.querySelectorAll('h3')
  let questionIndex = 1

  h3Elements.forEach((h3) => {
    const text = h3.textContent || ''
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (/^\d+\.\s+/.test(text.trim())) {
      h3.id = `question-${questionIndex}`
      h3.style.scrollMarginTop = '120px'
      questionIndex++
    }
  })

  console.log('Добавлено якорей к вопросам:', questionIndex - 1)
}

watch(htmlContent, async () => {
  if (htmlContent.value && contentRef.value) {
    await nextTick()
    setTimeout(() => {
      addCopyButtons()
      addQuestionAnchors()
      initAccordions()
      // Применяем подсветку после создания аккордеонов
      ensureHighlightClasses()
      // Повторно применяем через небольшую задержку для аккордеонов
      setTimeout(() => {
        ensureHighlightClasses()
      }, 100)
      // Альтернативное извлечение вопросов из HTML, если они не были извлечены из markdown
      if (questions.value.length === 0) {
        extractQuestionsFromHTML()
      }

      // Прокручиваем к вопросу, если он указан в hash
      if (route.hash) {
        const questionId = route.hash.substring(1)
        if (questionId) {
          scrollToQuestion(questionId)
        }
      }
    }, 150)
  }
})

// Функция для прокрутки к вопросу
const scrollToQuestion = (questionId) => {
  const attemptScroll = () => {
    const element = document.getElementById(questionId)
    if (element) {
      const offset = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
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
    }
  }, 100)
}

// Следим за изменением hash
watch(() => route.hash, (newHash) => {
  if (newHash && htmlContent.value) {
    const questionId = newHash.substring(1)
    if (questionId) {
      nextTick(() => {
        setTimeout(() => {
          scrollToQuestion(questionId)
        }, 200)
      })
    }
  }
})

// Альтернативный способ извлечения вопросов из HTML
const extractQuestionsFromHTML = () => {
  if (!contentRef.value) return
  const h3Elements = contentRef.value.querySelectorAll('h3')
  const extractedQuestions = []

  h3Elements.forEach((h3, index) => {
    const text = h3.textContent || ''
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (/^\d+\.\s+/.test(text.trim())) {
      const cleanText = text.trim().replace(/^\d+\.\s+/, '').trim()
      extractedQuestions.push({
        id: `question-${index + 1}`,
        text: cleanText
      })
    }
  })

  if (extractedQuestions.length > 0) {
    questions.value = extractedQuestions
    console.log('Извлечено вопросов из HTML:', extractedQuestions.length)
  }
}

// Проверка, является ли элемент маркером senior ответа
const isSeniorMarker = (element) => {
  const text = (element.textContent || '').toLowerCase().trim()
  const html = (element.innerHTML || '').toLowerCase()

  // Проверяем различные варианты маркеров
  const seniorPatterns = [
    /ответ\s+senior/i,
    /senior\s+ответ/i,
    /сеньор/i,
    /ответ\s+сеньор/i,
    /сеньор\s+ответ/i,
    /^\*\*ответ\s+senior/i,
    /^\*\*senior/i
  ]

  // Проверяем текст элемента
  for (const pattern of seniorPatterns) {
    if (pattern.test(text) || pattern.test(html)) {
      return true
    }
  }

  // Проверяем жирный текст (strong)
  if (element.tagName === 'STRONG' || element.tagName === 'B') {
    for (const pattern of seniorPatterns) {
      if (pattern.test(text)) {
        return true
      }
    }
  }

  // Проверяем заголовки
  if (['H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
    for (const pattern of seniorPatterns) {
      if (pattern.test(text)) {
        return true
      }
    }
  }

  return false
}

// Проверка, является ли элемент маркером английского ответа
const isAnswerEnMarker = (element) => {
  const text = (element.textContent || '').toLowerCase().trim()
  const html = (element.innerHTML || '').toLowerCase()

  // Проверяем различные варианты маркеров
  const answerEnPatterns = [
    /answer\s+en/i,
    /^\*\*answer\s+en:\*\*/i,
    /answer\s+en:/i
  ]

  // Проверяем текст элемента
  for (const pattern of answerEnPatterns) {
    if (pattern.test(text) || pattern.test(html)) {
      return true
    }
  }

  // Проверяем жирный текст (strong)
  if (element.tagName === 'STRONG' || element.tagName === 'B') {
    for (const pattern of answerEnPatterns) {
      if (pattern.test(text)) {
        return true
      }
    }
  }

  // Проверяем заголовки
  if (['H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
    for (const pattern of answerEnPatterns) {
      if (pattern.test(text)) {
        return true
      }
    }
  }

  return false
}

// Оборачивание ответов в аккордеоны
const wrapAnswersInAccordions = (html) => {
  // Создаем временный контейнер для работы с DOM
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Находим все h3 элементы (вопросы)
  const h3Elements = Array.from(tempDiv.querySelectorAll('h3'))

  // Обрабатываем каждый вопрос
  h3Elements.forEach((h3) => {
    const text = h3.textContent || ''
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (!/^\d+\.\s+/.test(text.trim())) return

    // Находим все элементы после h3 до следующего h3 или конца
    const allElements = []
    let currentElement = h3.nextElementSibling

    while (currentElement) {
      // Если встретили следующий вопрос, останавливаемся
      if (currentElement.tagName === 'H3' && /^\d+\.\s+/.test((currentElement.textContent || '').trim())) {
        break
      }

      allElements.push(currentElement)
      currentElement = currentElement.nextElementSibling
    }

    if (allElements.length === 0) return

    // Ищем маркеры Answer EN и senior ответа
    let answerEnMarkerIndex = -1
    let seniorMarkerIndex = -1

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i]

      // Проверяем маркер Answer EN
      if (answerEnMarkerIndex === -1) {
        // Проверяем сам элемент
        if (isAnswerEnMarker(el)) {
          answerEnMarkerIndex = i
        } else {
          // Проверяем содержимое элемента (для параграфов)
          const innerElements = el.querySelectorAll('strong, b, h3, h4, h5, h6, p')
          for (const innerEl of innerElements) {
            if (isAnswerEnMarker(innerEl)) {
              answerEnMarkerIndex = i
              break
            }
          }

          // Проверяем текст элемента напрямую (для случаев, когда маркер в начале параграфа)
          if (answerEnMarkerIndex === -1) {
            const text = (el.textContent || '').toLowerCase().trim()
            const html = (el.innerHTML || '').toLowerCase()

            // Проверяем различные варианты
            if (text.includes('answer en:') ||
                text.startsWith('answer en:') ||
                /answer\s+en:/i.test(text) ||
                html.includes('answer en:') ||
                /<strong>answer\s+en:<\/strong>/i.test(html)) {
              answerEnMarkerIndex = i
            }
          }
        }
      }

      // Проверяем маркер senior ответа
      if (seniorMarkerIndex === -1) {
        if (isSeniorMarker(el)) {
          seniorMarkerIndex = i
        } else {
          // Проверяем содержимое элемента
          const innerElements = el.querySelectorAll('strong, b, h3, h4, h5, h6, p')
          for (const innerEl of innerElements) {
            if (isSeniorMarker(innerEl)) {
              seniorMarkerIndex = i
              break
            }
          }

          // Проверяем текст элемента напрямую
          if (seniorMarkerIndex === -1) {
            const text = (el.textContent || '').toLowerCase().trim()
            if (text.includes('ответ senior') || text.includes('senior ответ') ||
                text.includes('ответ сеньор') || text.includes('сеньор ответ') ||
                /^\*\*ответ\s+senior/i.test(text) || /^\*\*senior/i.test(text)) {
              seniorMarkerIndex = i
            }
          }
        }
      }

      // Если нашли оба маркера, можно прервать поиск
      if (answerEnMarkerIndex >= 0 && seniorMarkerIndex >= 0) break
    }

    // Определяем конец обычного ответа (минимум из двух маркеров, если они найдены)
    let regularAnswerEndIndex = allElements.length
    if (answerEnMarkerIndex >= 0) {
      regularAnswerEndIndex = Math.min(regularAnswerEndIndex, answerEnMarkerIndex)
    }
    if (seniorMarkerIndex >= 0) {
      regularAnswerEndIndex = Math.min(regularAnswerEndIndex, seniorMarkerIndex)
    }

    // Разделяем элементы на обычный ответ, Answer EN и senior ответ
    const regularAnswerElements = allElements.slice(0, regularAnswerEndIndex)

    // Находим элементы для блока Answer EN
    let answerEnElements = []
    if (answerEnMarkerIndex >= 0) {
      // Блок Answer EN начинается с маркера и заканчивается перед "Ответ Senior:" или перед следующим вопросом
      let answerEnEndIndex = allElements.length

      // Если есть senior маркер после Answer EN, блок Answer EN заканчивается перед ним
      if (seniorMarkerIndex >= 0 && seniorMarkerIndex > answerEnMarkerIndex) {
        answerEnEndIndex = seniorMarkerIndex
      } else {
        // Иначе ищем, где заканчивается блок Answer EN
        for (let i = answerEnMarkerIndex + 1; i < allElements.length; i++) {
          const el = allElements[i]
          const text = (el.textContent || '').toLowerCase().trim()

          // Если это следующий вопрос, останавливаемся
          if (el.tagName === 'H3' && /^\d+\.\s+/.test(text)) {
            answerEnEndIndex = i
            break
          }

          // Если это маркер senior (на случай, если он не был найден ранее)
          if (isSeniorMarker(el)) {
            answerEnEndIndex = i
            break
          }
        }
      }

      answerEnElements = allElements.slice(answerEnMarkerIndex, answerEnEndIndex)
    }

    // Для senior ответа: начинаем с маркера senior
    let seniorAnswerElements = []
    if (seniorMarkerIndex >= 0) {
      seniorAnswerElements = allElements.slice(seniorMarkerIndex)
    }

    // Создаем аккордеон для обычного ответа
    if (regularAnswerElements.length > 0) {
      const regularAccordion = createAccordion('Показать ответ', regularAnswerElements)
      h3.insertAdjacentElement('afterend', regularAccordion)
    }

    // Создаем аккордеон для Answer EN (если есть)
    if (answerEnElements.length > 0) {
      const answerEnContentElements = []
      const firstElement = answerEnElements[0]

      // Проверяем, содержит ли первый элемент только маркер или еще и текст
      if (firstElement) {
        const fullText = firstElement.textContent || ''
        const markerMatch = fullText.match(/answer\s+en:\s*(.+)/i)

        if (markerMatch && markerMatch[1] && markerMatch[1].trim()) {
          // Есть текст после маркера - создаем новый элемент с этим текстом
          const textAfterMarker = markerMatch[1].trim()
          const newP = document.createElement('p')
          newP.textContent = textAfterMarker
          answerEnContentElements.push(newP)
        } else {
          // Нет текста после маркера в первом элементе - проверяем, есть ли другие элементы
          // Если первый элемент содержит только маркер, пропускаем его
          const hasOnlyMarker = isAnswerEnMarker(firstElement) ||
                                (firstElement.querySelector('strong, b') &&
                                 !fullText.replace(/answer\s+en:\s*/i, '').trim())

          if (!hasOnlyMarker) {
            // В элементе есть другой контент, добавляем его (без маркера)
            const cloned = firstElement.cloneNode(true)
            const strongElements = cloned.querySelectorAll('strong, b')
            strongElements.forEach(strong => {
              const text = (strong.textContent || '').toLowerCase().trim()
              if (text.includes('answer en')) {
                strong.remove()
              }
            })
            if (cloned.textContent && cloned.textContent.trim()) {
              answerEnContentElements.push(cloned)
            }
          }
        }
      }

      // Добавляем остальные элементы (начиная со второго, если первый был только маркером)
      const startIndex = (firstElement && (firstElement.textContent || '').match(/answer\s+en:\s*$/i)) ? 1 : 1
      for (let i = startIndex; i < answerEnElements.length; i++) {
        answerEnContentElements.push(answerEnElements[i].cloneNode(true))
      }

      if (answerEnContentElements.length > 0) {
        const answerEnAccordion = createAccordion('Answer EN', answerEnContentElements, false)
        // Вставляем после обычного аккордеона или после вопроса
        const insertAfter = regularAnswerElements.length > 0
          ? h3.nextElementSibling
          : h3
        answerEnAccordion.setAttribute('data-type', 'answer-en')
        insertAfter.insertAdjacentElement('afterend', answerEnAccordion)
      }
    }

    // Создаем аккордеон для senior ответа
    if (seniorAnswerElements.length > 0) {
      // Исключаем маркер из содержимого
      const seniorContentElements = seniorAnswerElements.slice(1) // Пропускаем первый элемент (маркер)
      if (seniorContentElements.length > 0) {
        const seniorAccordion = createAccordion('Ответ senior', seniorContentElements, true)
        // Вставляем после Answer EN аккордеона, обычного аккордеона или после вопроса
        let insertAfter = h3
        if (answerEnElements.length > 0) {
          // Ищем последний аккордеон (Answer EN)
          const lastAccordion = h3.nextElementSibling
          if (lastAccordion) {
            insertAfter = lastAccordion
          }
        } else if (regularAnswerElements.length > 0) {
          insertAfter = h3.nextElementSibling
        }
        insertAfter.insertAdjacentElement('afterend', seniorAccordion)
      }
    }

    // Удаляем оригинальные элементы (в обратном порядке)
    allElements.reverse().forEach(el => {
      if (el.parentNode) {
        el.remove()
      }
    })
  })

  return tempDiv.innerHTML
}

// Создание аккордеона с заданным заголовком и элементами
const createAccordion = (label, elements, isSenior = false) => {
  const accordionWrapper = document.createElement('div')
  accordionWrapper.className = 'answer-accordion'
  if (isSenior) {
    accordionWrapper.setAttribute('data-type', 'senior')
  }

  const accordionToggle = document.createElement('button')
  accordionToggle.className = 'answer-accordion-toggle'
  accordionToggle.type = 'button'
  accordionToggle.innerHTML = `
    <span class="answer-accordion-icon">▶</span>
    <span class="answer-accordion-label">${label}</span>
  `

  const accordionContent = document.createElement('div')
  accordionContent.className = 'answer-accordion-content'

  const accordionInner = document.createElement('div')
  accordionInner.className = 'answer-accordion-inner'

  // Клонируем и добавляем все элементы внутрь аккордеона
  elements.forEach(el => {
    // Используем cloneNode(true) для глубокого клонирования со всем HTML
    const cloned = el.cloneNode(true)

    // Убеждаемся, что код внутри сохраняет подсветку
    const codeBlocks = cloned.querySelectorAll('pre code')
    codeBlocks.forEach(codeBlock => {
      // Проверяем, есть ли уже подсветка
      const hasHighlight = codeBlock.querySelector('.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function')

      if (!hasHighlight) {
        // Получаем исходный текст
        const originalText = codeBlock.textContent || codeBlock.innerText

        if (originalText && originalText.trim()) {
          try {
            // Определяем язык
            let language = codeBlock.className.match(/language-(\w+)/)?.[1]
            if (!language) {
              const pre = codeBlock.closest('pre')
              if (pre) {
                language = pre.className.match(/language-(\w+)/)?.[1]
              }
            }

            if (language && hljs.getLanguage(language)) {
              const highlighted = hljs.highlight(originalText, { language })
              codeBlock.innerHTML = highlighted.value
              codeBlock.classList.add('hljs')
              if (!codeBlock.classList.contains(`language-${language}`)) {
                codeBlock.classList.add(`language-${language}`)
              }
            } else {
              // Автоматическое определение
              const highlighted = hljs.highlightAuto(originalText)
              codeBlock.innerHTML = highlighted.value
              codeBlock.classList.add('hljs')
              if (highlighted.language) {
                codeBlock.classList.add(`language-${highlighted.language}`)
              }
            }
          } catch (e) {
            console.warn('Ошибка подсветки при создании аккордеона:', e)
          }
        }
      } else {
        // Если подсветка уже есть, убеждаемся что есть класс hljs
        if (!codeBlock.classList.contains('hljs')) {
          codeBlock.classList.add('hljs')
        }
      }

      // Убеждаемся, что у pre есть правильный фон
      const pre = codeBlock.closest('pre')
      if (pre) {
        pre.style.backgroundColor = '#1e1e1e'
      }
    })

    accordionInner.appendChild(cloned)
  })

  accordionContent.appendChild(accordionInner)
  accordionWrapper.appendChild(accordionToggle)
  accordionWrapper.appendChild(accordionContent)

  return accordionWrapper
}

// Инициализация аккордеонов после рендеринга
const initAccordions = () => {
  if (!contentRef.value) return

  const accordionToggles = contentRef.value.querySelectorAll('.answer-accordion-toggle')

  accordionToggles.forEach(toggle => {
    // Убираем старый обработчик, если есть
    const newToggle = toggle.cloneNode(true)
    toggle.parentNode.replaceChild(newToggle, toggle)

    // Добавляем обработчик клика
    newToggle.addEventListener('click', () => {
      const accordion = newToggle.closest('.answer-accordion')
      const content = accordion?.querySelector('.answer-accordion-content')
      const icon = newToggle.querySelector('.answer-accordion-icon')

      if (accordion && content && icon) {
        const isOpen = accordion.classList.toggle('open')
        const inner = content.querySelector('.answer-accordion-inner')

        if (isOpen) {
          icon.textContent = '▼'
          if (inner) {
            content.style.maxHeight = inner.scrollHeight + 'px'

            // Применяем подсветку к коду внутри аккордеона при раскрытии
            setTimeout(() => {
              const codeBlocks = inner.querySelectorAll('pre code')
              codeBlocks.forEach(block => {
                const hasHighlight = block.querySelector('.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function')
                if (!hasHighlight && block.textContent) {
                  try {
                    const language = block.className.match(/language-(\w+)/)?.[1] ||
                                    block.getAttribute('data-lang') ||
                                    'javascript'

                    if (hljs.getLanguage(language)) {
                      const highlighted = hljs.highlight(block.textContent, { language })
                      block.innerHTML = highlighted.value
                      block.classList.add('hljs')
                    } else {
                      const highlighted = hljs.highlightAuto(block.textContent)
                      block.innerHTML = highlighted.value
                      block.classList.add('hljs')
                    }
                  } catch (e) {
                    console.warn('Ошибка подсветки кода в аккордеоне:', e)
                  }
                }
              })

              // Добавляем кнопки копирования, если их нет
              const preBlocks = inner.querySelectorAll('pre')
              preBlocks.forEach(pre => {
                if (!pre.querySelector('.copy-code-btn')) {
                  const copyBtn = document.createElement('button')
                  copyBtn.className = 'copy-code-btn'
                  copyBtn.textContent = '📋'
                  copyBtn.title = 'Копировать код'
                  pre.style.position = 'relative'
                  pre.appendChild(copyBtn)
                }
              })
            }, 50)
          }
        } else {
          icon.textContent = '▶'
          content.style.maxHeight = '0'
        }
      }
    })
  })
}
</script>

<style scoped>
.section-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  overflow: visible;
}

.section-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
  position: relative;
}

.mobile-nav-wrapper {
  display: none;
}

.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: sticky;
  top: 2rem;
  align-self: start;
}

@media (max-width: 1200px) {
  .section-wrapper {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    position: relative;
    top: 0;
    margin-top: 2rem;
  }
}

@media (max-width: 768px) {
  .section-view {
    padding: 0;
  }

  .section-wrapper {
    display: flex;
    flex-direction: column;
  }

  .mobile-nav-wrapper {
    display: block;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
  }

  .content {
    padding: 1rem;
    border-radius: 0;
  }

  .right-sidebar {
    display: none;
  }

  .right-sidebar .desktop-nav {
    display: none;
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #c33;
}

.error h2 {
  margin-bottom: 0.5rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-btn:hover {
  background: #35a372;
}

.content {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.8;
}

@media (max-width: 768px) {
  .content {
    max-width: 100%;
    padding: 1.5rem;
    border-radius: 8px;
  }
}

/* Стили для markdown контента */
.content :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
  color: #1e1e1e;
}

.content :deep(h2) {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
  color: #1e1e1e;
}

.content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  color: #42b883;
  line-height: 1.5;
  scroll-margin-top: 120px;
}

.content :deep(h3[id]) {
  position: relative;
}

.content :deep(h3[id]::before) {
  content: '';
  display: block;
  height: 120px;
  margin-top: -120px;
  visibility: hidden;
}

.content :deep(h4) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: #1e1e1e;
}

.content :deep(p) {
  margin: 1rem 0;
  line-height: 1.8;
  color: #333;
}

.content :deep(p:first-of-type) {
  margin-top: 0;
}

.content :deep(ul),
.content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
  line-height: 1.8;
}

.content :deep(li) {
  margin: 0.75rem 0;
  line-height: 1.8;
  color: #333;
}

.content :deep(li::marker) {
  color: #42b883;
  font-weight: 600;
}

.content :deep(strong) {
  font-weight: 600;
  color: #1e1e1e;
  font-weight: 700;
}

.content :deep(em) {
  font-style: italic;
  color: #555;
}

/* Стили только для инлайн кода (не в блоках) */
.content :deep(p code),
.content :deep(li code),
.content :deep(td code),
.content :deep(strong code),
.content :deep(em code) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #e83e8c;
  font-weight: 500;
  border: 1px solid rgba(232, 62, 140, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Убираем стили инлайн кода для блоков */
.content :deep(pre code) {
  background: none !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  font-weight: normal !important;
}

.content :deep(pre) {
  position: relative;
  background: #1e1e1e !important;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  padding-top: 2.75rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  font-size: 0.875rem;
  line-height: 1.5;
}

.content :deep(pre:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Убеждаемся, что все элементы внутри pre используют правильные стили */
.content :deep(pre *) {
  color: inherit;
}

/* Кнопка копирования кода */
.content :deep(.copy-code-btn) {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #abb2bf;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.content :deep(.copy-code-btn:hover) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: scale(1.05);
}

.content :deep(.copy-code-btn.copied) {
  background: rgba(98, 239, 152, 0.2);
  border-color: rgba(98, 239, 152, 0.4);
  color: #62ef98;
  font-size: 0.875rem;
}

/* Красивый скроллбар для блоков кода */
.content :deep(pre::-webkit-scrollbar) {
  height: 10px;
}

.content :deep(pre::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  margin: 0.5rem 0;
}

.content :deep(pre::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 2px solid #1e1e1e;
}

.content :deep(pre::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.3);
}

.content :deep(pre code) {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  font-size: 0.875rem !important;
  line-height: 1.5 !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-variant-ligatures: common-ligatures;
  tab-size: 2;
  display: block;
  overflow-x: visible;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
}

/* Базовые цвета для блоков кода */
.content :deep(pre code.hljs) {
  color: #d4d4d4 !important;
  background: transparent !important;
}

/* Переопределяем все стили highlight.js для VS Code стиля */
.content :deep(pre code),
.content :deep(pre code *) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
}

/* Переопределяем цвета темы для лучшей читаемости */
.content :deep(pre code .hljs-comment),
.content :deep(pre code .hljs-quote),
.content :deep(pre code.hljs .hljs-comment),
.content :deep(pre code.hljs .hljs-quote) {
  color: #6a9955 !important;
  font-style: italic !important;
}

.content :deep(pre code .hljs-keyword),
.content :deep(pre code .hljs-selector-tag),
.content :deep(pre code.hljs .hljs-keyword),
.content :deep(pre code.hljs .hljs-selector-tag) {
  color: #569cd6 !important;
}

.content :deep(pre code .hljs-string),
.content :deep(pre code .hljs-meta .hljs-meta-string),
.content :deep(pre code.hljs .hljs-string),
.content :deep(pre code.hljs .hljs-meta .hljs-meta-string) {
  color: #ce9178 !important;
}

.content :deep(pre code .hljs-number),
.content :deep(pre code .hljs-literal),
.content :deep(pre code.hljs .hljs-number),
.content :deep(pre code.hljs .hljs-literal) {
  color: #b5cea8 !important;
}

.content :deep(pre code .hljs-function),
.content :deep(pre code .hljs-title),
.content :deep(pre code .hljs-title.function_),
.content :deep(pre code.hljs .hljs-function),
.content :deep(pre code.hljs .hljs-title:not(.hljs-class):not(.hljs-type)) {
  color: #dcdcaa !important;
}

.content :deep(pre code .hljs-type),
.content :deep(pre code .hljs-class),
.content :deep(pre code.hljs .hljs-type),
.content :deep(pre code.hljs .hljs-class) {
  color: #4ec9b0 !important;
}

.content :deep(pre code .hljs-variable),
.content :deep(pre code .hljs-params),
.content :deep(pre code.hljs .hljs-variable),
.content :deep(pre code.hljs .hljs-params) {
  color: #9cdcfe !important;
}

.content :deep(pre code .hljs-property),
.content :deep(pre code .hljs-attr),
.content :deep(pre code.hljs .hljs-property),
.content :deep(pre code.hljs .hljs-attr) {
  color: #92c5f7 !important;
}

.content :deep(pre code .hljs-built_in),
.content :deep(pre code.hljs .hljs-built_in) {
  color: #569cd6 !important;
}

.content :deep(pre code .hljs-regexp),
.content :deep(pre code.hljs .hljs-regexp) {
  color: #d16969 !important;
}

.content :deep(blockquote) {
  border-left: 4px solid #42b883;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #666;
  font-style: italic;
}

.content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.content :deep(table th),
.content :deep(table td) {
  border: 1px solid #e0e0e0;
  padding: 0.75rem;
  text-align: left;
}

.content :deep(table th) {
  background: #f5f5f5;
  font-weight: 600;
}

.content :deep(hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 2rem 0;
}

.content :deep(a) {
  color: #42b883;
  text-decoration: none;
}

.content :deep(a:hover) {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
    border-radius: 0;
    font-size: 0.9375rem;
  }

  .content :deep(h1) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .content :deep(h2) {
    font-size: 1.25rem;
    margin: 1.5rem 0 0.75rem 0;
  }

  .content :deep(h3) {
    font-size: 1.125rem;
    margin: 1.5rem 0 0.75rem 0;
    padding-top: 0.75rem;
  }

  .content :deep(p) {
    margin: 0.75rem 0;
    line-height: 1.7;
  }

  .content :deep(ul),
  .content :deep(ol) {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  .content :deep(li) {
    margin: 0.5rem 0;
  }

  .content :deep(pre) {
    padding: 1rem;
    padding-top: 2.5rem;
    font-size: 0.8125rem;
    margin: 1rem 0;
    border-radius: 6px;
    overflow-x: auto;
  }

  .content :deep(.copy-code-btn) {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
  }

  .content :deep(table) {
    font-size: 0.875rem;
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .content :deep(table th),
  .content :deep(table td) {
    padding: 0.5rem;
    min-width: 100px;
  }

  .content :deep(.answer-accordion-toggle) {
    padding: 0.625rem 0.875rem;
    font-size: 0.8125rem;
  }
}

/* Модальное окно фильтра вопросов */
.filter-overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.filter-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 56px - 2rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.filter-modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #1e1e1e;
}

.filter-close-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.filter-close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.filter-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.question-nav.mobile-filter {
  position: relative !important;
  top: 0 !important;
  max-height: none;
  border: none;
  box-shadow: none;
  padding: 0;
}

.question-nav.mobile-filter .question-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .filter-overlay {
    padding: 0.5rem;
  }

  .filter-modal {
    max-height: calc(100vh - 56px - 1rem);
    border-radius: 8px;
  }

  .filter-modal-header {
    padding: 0.875rem 1rem;
  }

  .filter-modal-header h3 {
    font-size: 1rem;
  }

  .filter-modal-content {
    padding: 0.75rem;
  }
}

/* Стили для аккордеонов с ответами */
.content :deep(.answer-accordion) {
  margin: 1rem 0 2rem 0;
}

.content :deep(.answer-accordion-toggle) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
  user-select: none;
  margin: 0;
  font-family: inherit;
}

.content :deep(.answer-accordion-toggle:hover) {
  background: #e9ecef;
  border-color: #42b883;
  color: #42b883;
}

.content :deep(.answer-accordion-toggle:focus) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.content :deep(.answer-accordion-icon) {
  display: inline-block;
  transition: transform 0.3s ease;
  color: #666;
  font-size: 0.75rem;
}

.content :deep(.answer-accordion-toggle:hover .answer-accordion-icon) {
  color: #42b883;
}

.content :deep(.answer-accordion.open .answer-accordion-icon) {
  transform: rotate(90deg);
}

.content :deep(.answer-accordion-label) {
  flex: 1;
  text-align: left;
}

.content :deep(.answer-accordion-content) {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
}

.content :deep(.answer-accordion-inner) {
  padding: 1rem 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 0.5rem;
}

/* Стили для Answer EN аккордеона */
.content :deep(.answer-accordion[data-type="answer-en"]) {
  margin-top: 1rem;
}

.content :deep(.answer-accordion[data-type="answer-en"] .answer-accordion-toggle) {
  background: #e6f3ff;
  border-color: #4da6ff;
  color: #0066cc;
}

.content :deep(.answer-accordion[data-type="answer-en"] .answer-accordion-toggle:hover) {
  background: #cce6ff;
  border-color: #3399ff;
  color: #0052a3;
}

.content :deep(.answer-accordion[data-type="answer-en"] .answer-accordion-toggle .answer-accordion-icon) {
  color: #0066cc;
}

.content :deep(.answer-accordion[data-type="answer-en"] .answer-accordion-inner) {
  border-top-color: #4da6ff;
}

/* Стили для senior аккордеона */
.content :deep(.answer-accordion[data-type="senior"]) {
  margin-top: 1rem;
}

.content :deep(.answer-accordion[data-type="senior"] .answer-accordion-toggle) {
  background: #fff5e6;
  border-color: #ffd700;
  color: #cc6600;
}

.content :deep(.answer-accordion[data-type="senior"] .answer-accordion-toggle:hover) {
  background: #ffe6cc;
  border-color: #ffb84d;
  color: #b35900;
}

.content :deep(.answer-accordion[data-type="senior"] .answer-accordion-toggle .answer-accordion-icon) {
  color: #cc6600;
}

.content :deep(.answer-accordion[data-type="senior"] .answer-accordion-inner) {
  border-top-color: #ffd700;
}

/* Подсветка кода внутри аккордеонов */
.content :deep(.answer-accordion pre code),
.content :deep(.answer-accordion pre code.hljs) {
  background: transparent !important;
  color: #d4d4d4 !important;
}

.content :deep(.answer-accordion pre) {
  background: #1e1e1e !important;
}

/* Убеждаемся, что все классы highlight.js работают внутри аккордеонов */
.content :deep(.answer-accordion .hljs-keyword) {
  color: #569cd6 !important;
}

.content :deep(.answer-accordion .hljs-string) {
  color: #ce9178 !important;
}

.content :deep(.answer-accordion .hljs-comment) {
  color: #6a9955 !important;
  font-style: italic !important;
}

.content :deep(.answer-accordion .hljs-number),
.content :deep(.answer-accordion .hljs-literal) {
  color: #b5cea8 !important;
}

.content :deep(.answer-accordion .hljs-function),
.content :deep(.answer-accordion .hljs-title:not(.hljs-class):not(.hljs-type)) {
  color: #dcdcaa !important;
}

.content :deep(.answer-accordion .hljs-type),
.content :deep(.answer-accordion .hljs-class) {
  color: #4ec9b0 !important;
}

.content :deep(.answer-accordion .hljs-variable),
.content :deep(.answer-accordion .hljs-params) {
  color: #9cdcfe !important;
}

.content :deep(.answer-accordion .hljs-property),
.content :deep(.answer-accordion .hljs-attr) {
  color: #92c5f7 !important;
}

.content :deep(.answer-accordion .hljs-built_in) {
  color: #569cd6 !important;
}

.content :deep(.answer-accordion .hljs-regexp) {
  color: #d16969 !important;
}
</style>
