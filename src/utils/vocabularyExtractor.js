/**
 * Утилита для извлечения технических терминов из Markdown файлов
 */

import { sections } from '../data/sections.js'

/**
 * Извлекает технические термины из текста
 * @param {string} text - текст для анализа
 * @returns {Set<string>} - множество найденных терминов
 */
function extractTerms(text) {
  const terms = new Set()

  // Удаляем блоки кода для отдельной обработки
  const codeBlockRegex = /```[\s\S]*?```/g
  const codeBlocks = []
  let codeMatch
  while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push(codeMatch[0])
  }
  const textWithoutCode = text.replace(codeBlockRegex, ' ')

  // 1. PascalCase и camelCase слова (минимум 2 символа, начинается с заглавной или camelCase)
  const pascalCaseRegex = /\b([A-Z][a-z]+(?:[A-Z][a-z]*)*)\b/g
  let match
  while ((match = pascalCaseRegex.exec(textWithoutCode)) !== null) {
    const term = match[1]
    // Исключаем слишком короткие и общие слова
    if (term.length >= 3 && !isCommonWord(term)) {
      terms.add(term)
    }
  }

  // 2. Технические аббревиатуры (2-5 заглавных букв подряд)
  const acronymRegex = /\b([A-Z]{2,5})\b/g
  while ((match = acronymRegex.exec(textWithoutCode)) !== null) {
    const term = match[1]
    // Исключаем общие слова
    if (!isCommonAcronym(term)) {
      terms.add(term)
    }
  }

  // 3. Словосочетания из секций "Answer EN" (2-3 слова)
  const answerEnRegex = /\*\*Answer EN:\*\*\s*([\s\S]*?)(?=\*\*|###|$)/gi
  while ((match = answerEnRegex.exec(text)) !== null) {
    const answerText = match[1]
    // Ищем технические словосочетания
    const phraseRegex = /\b([a-z]+(?:\s+[a-z]+){1,2})\s+(?:is|are|can|allows?|provides?|supports?|uses?|works?|helps?|enables?)/gi
    let phraseMatch
    while ((phraseMatch = phraseRegex.exec(answerText)) !== null) {
      const phrase = phraseMatch[1].trim()
      if (phrase.length >= 5 && !isCommonPhrase(phrase)) {
        terms.add(phrase)
      }
    }
  }

  // 4. Термины из блоков кода (имена функций, классов, переменных)
  codeBlocks.forEach(block => {
    // Удаляем markdown разметку
    const code = block.replace(/```[\w]*\n?/g, '').trim()
    // Ищем camelCase и PascalCase в коде
    const codeTermsRegex = /\b([A-Z][a-z]+(?:[A-Z][a-z]*)*|[a-z]+[A-Z][a-z]*)\b/g
    while ((match = codeTermsRegex.exec(code)) !== null) {
      const term = match[1]
      if (term.length >= 3 && !isCommonWord(term)) {
        terms.add(term)
      }
    }
  })

  // 5. Популярные технические словосочетания из текста
  const commonPhrases = [
    'static typing', 'dynamic typing', 'type inference', 'type safety',
    'lexical environment', 'execution context', 'closure', 'hoisting',
    'event loop', 'call stack', 'prototype chain', 'scope chain',
    'component lifecycle', 'reactive system', 'virtual DOM', 'render function',
    'server-side rendering', 'client-side rendering', 'hydration',
    'code splitting', 'lazy loading', 'tree shaking', 'bundling',
    'dependency injection', 'higher-order function', 'pure function',
    'immutability', 'mutation', 'side effect', 'referential transparency',
    'async/await', 'promise', 'observable', 'stream',
    'middleware', 'interceptor', 'decorator', 'factory pattern',
    'singleton pattern', 'observer pattern', 'pub/sub', 'event emitter'
  ]

  commonPhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    if (regex.test(text)) {
      terms.add(phrase)
    }
  })

  return terms
}

/**
 * Проверяет, является ли слово общим (не техническим)
 */
function isCommonWord(word) {
  const commonWords = [
    'The', 'This', 'That', 'These', 'Those', 'There', 'Here',
    'When', 'Where', 'What', 'Which', 'Who', 'How', 'Why',
    'Can', 'Could', 'Should', 'Would', 'Will', 'May', 'Might',
    'Have', 'Has', 'Had', 'Do', 'Does', 'Did', 'Get', 'Got',
    'All', 'Any', 'Some', 'Many', 'Much', 'More', 'Most',
    'One', 'Two', 'Three', 'First', 'Second', 'Third',
    'New', 'Old', 'Good', 'Bad', 'Big', 'Small', 'Long', 'Short'
  ]
  return commonWords.includes(word)
}

/**
 * Проверяет, является ли аббревиатура общей (не технической)
 */
function isCommonAcronym(acronym) {
  const commonAcronyms = ['EN', 'RU', 'API', 'URL', 'HTTP', 'HTTPS', 'CSS', 'HTML', 'JS', 'TS']
  // API, DOM, CSS, HTML, JS, TS - это технические, но слишком общие, оставим их
  return false // Включаем все аббревиатуры, пользователь может отфильтровать
}

/**
 * Проверяет, является ли фраза общей (не технической)
 */
function isCommonPhrase(phrase) {
  const commonPhrases = [
    'is a', 'is the', 'is an', 'are the', 'can be', 'can do',
    'this is', 'that is', 'there is', 'there are'
  ]
  return commonPhrases.some(cp => phrase.toLowerCase().includes(cp))
}

/**
 * Извлекает примеры использования термина из контекста
 * @param {string} text - текст для поиска
 * @param {string} term - искомый термин
 * @returns {string[]} - массив примеров
 */
function extractExamples(text, term) {
  const examples = []
  const regex = new RegExp(`([^.!?]*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*[.!?])`, 'gi')
  let match
  let count = 0
  while ((match = regex.exec(text)) !== null && count < 3) {
    const example = match[1].trim()
    if (example.length > 20 && example.length < 200) {
      examples.push(example)
      count++
    }
  }
  return examples
}

/**
 * Извлекает словосочетания с термином
 * @param {string} text - текст для поиска
 * @param {string} term - искомый термин
 * @returns {string[]} - массив словосочетаний
 */
function extractPhrases(text, term) {
  const phrases = new Set()
  // Ищем словосочетания вида "term + noun" или "adjective + term"
  const patterns = [
    new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+[a-z]+)\\b`, 'gi'),
    new RegExp(`\\b([a-z]+\\s+${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
  ]

  patterns.forEach(pattern => {
    let match
    let count = 0
    while ((match = pattern.exec(text)) !== null && count < 5) {
      const phrase = match[1].trim()
      if (phrase.length >= term.length + 3 && phrase.length < 50) {
        phrases.add(phrase)
        count++
      }
    }
  })

  return Array.from(phrases).slice(0, 5)
}

/**
 * Основная функция для извлечения словаря из всех Markdown файлов
 * @returns {Promise<Array>} - массив объектов словаря
 */
export async function extractVocabularyFromMarkdown() {
  const vocabulary = []
  const termMap = new Map() // Для объединения дубликатов

  // Проходим по всем секциям
  for (const section of sections) {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${baseUrl}${section.dir}/README.md`)

      if (!response.ok) {
        console.warn(`Не удалось загрузить ${section.dir}/README.md`)
        continue
      }

      const markdown = await response.text()
      const terms = extractTerms(markdown)

      // Обрабатываем каждый термин
      terms.forEach(term => {
        const key = term.toLowerCase()
        const examples = extractExamples(markdown, term)
        const phrases = extractPhrases(markdown, term)

        if (!termMap.has(key)) {
          termMap.set(key, {
            term: term,
            translation: '', // Будет заполнено вручную или через словарь
            category: section.id,
            categoryTitle: section.title,
            examples: examples,
            phrases: phrases,
            source: section.dir
          })
        } else {
          // Объединяем данные из разных секций
          const existing = termMap.get(key)
          if (!existing.examples.length && examples.length) {
            existing.examples = examples
          }
          if (!existing.phrases.length && phrases.length) {
            existing.phrases = phrases
          }
          // Добавляем категорию, если её еще нет
          if (!existing.categories) {
            existing.categories = [existing.category]
          }
          if (!existing.categories.includes(section.id)) {
            existing.categories.push(section.id)
          }
        }
      })
    } catch (error) {
      console.error(`Ошибка при обработке ${section.dir}:`, error)
    }
  }

  // Преобразуем Map в массив
  return Array.from(termMap.values())
}

/**
 * Создает базовый словарь с популярными терминами frontend разработки
 * @returns {Array} - массив объектов словаря
 */
export function getDefaultVocabulary() {
  return [
    {
      term: 'TypeScript',
      translation: 'TypeScript',
      category: 'typescript',
      categoryTitle: 'TypeScript',
      examples: ['TypeScript is a superset of JavaScript that adds static typing.'],
      phrases: ['TypeScript compiler', 'TypeScript types', 'TypeScript interface']
    },
    {
      term: 'JavaScript',
      translation: 'JavaScript',
      category: 'javascript-typescript',
      categoryTitle: 'JavaScript / TypeScript',
      examples: ['JavaScript is a dynamic programming language.'],
      phrases: ['JavaScript engine', 'JavaScript runtime', 'JavaScript framework']
    },
    {
      term: 'Vue',
      translation: 'Vue.js',
      category: 'vuejs',
      categoryTitle: 'Vue.js',
      examples: ['Vue is a progressive JavaScript framework.'],
      phrases: ['Vue component', 'Vue instance', 'Vue directive']
    },
    {
      term: 'React',
      translation: 'React',
      category: 'general',
      categoryTitle: 'Общие вопросы',
      examples: ['React is a JavaScript library for building user interfaces.'],
      phrases: ['React component', 'React hook', 'React state']
    },
    {
      term: 'API',
      translation: 'API (Application Programming Interface)',
      category: 'http-api',
      categoryTitle: 'HTTP / API',
      examples: ['REST API provides a way to access web services.'],
      phrases: ['REST API', 'GraphQL API', 'API endpoint', 'API response']
    },
    {
      term: 'DOM',
      translation: 'DOM (Document Object Model)',
      category: 'general',
      categoryTitle: 'Общие вопросы',
      examples: ['DOM represents the structure of HTML documents.'],
      phrases: ['DOM manipulation', 'DOM element', 'virtual DOM']
    },
    {
      term: 'closure',
      translation: 'замыкание',
      category: 'javascript-typescript',
      categoryTitle: 'JavaScript / TypeScript',
      examples: ['A closure is a function that has access to variables from its outer scope.'],
      phrases: ['closure scope', 'closure variable', 'closure function']
    },
    {
      term: 'hoisting',
      translation: 'поднятие',
      category: 'javascript-typescript',
      categoryTitle: 'JavaScript / TypeScript',
      examples: ['Hoisting is a JavaScript mechanism where variables and function declarations are moved to the top.'],
      phrases: ['variable hoisting', 'function hoisting', 'hoisting behavior']
    },
    {
      term: 'reactive',
      translation: 'реактивный',
      category: 'vuejs',
      categoryTitle: 'Vue.js',
      examples: ['Vue uses a reactive system to track data changes.'],
      phrases: ['reactive data', 'reactive property', 'reactive system']
    },
    {
      term: 'component',
      translation: 'компонент',
      category: 'vuejs',
      categoryTitle: 'Vue.js',
      examples: ['A component is a reusable Vue instance.'],
      phrases: ['Vue component', 'component lifecycle', 'component props']
    }
  ]
}