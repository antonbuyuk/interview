/**
 * Утилита для парсинга вопросов из markdown файлов
 */

/**
 * Проверяет, является ли элемент маркером русского ответа
 */
const isRussianAnswerMarker = (text) => {
  return /\*\*Ответ:\*\*\s*/.test(text)
}

/**
 * Проверяет, является ли элемент маркером английского ответа
 */
const isAnswerEnMarker = (text) => {
  return /\*\*Answer EN:\*\*\s*/.test(text)
}

/**
 * Проверяет, является ли элемент маркером senior ответа
 */
const isSeniorMarker = (text) => {
  return /\*\*Ответ Senior:\*\*\s*/.test(text)
}

/**
 * Проверяет, является ли раздел русским разделом (жирный текст с кириллицей)
 */
const isRussianSectionMarker = (text) => {
  const match = text.match(/\*\*([^*]+):\*\*/)
  if (!match) return false
  const headerText = match[1]
  // Проверяем наличие кириллицы, но исключаем маркеры "Ответ", "Ответ Senior", "Answer EN"
  if (/[а-яёА-ЯЁ]/.test(headerText)) {
    const lowerText = headerText.toLowerCase()
    return !lowerText.includes('ответ') && !lowerText.includes('answer en')
  }
  return false
}

/**
 * Извлекает содержимое блока до следующего маркера
 */
const extractBlockContent = (text, startIndex, endIndex) => {
  // Ищем конец блока - следующий маркер или конец текста
  let blockEnd = endIndex

  // Ищем маркер Senior ответа
  const seniorIndex = text.indexOf('**Ответ Senior:**', startIndex)
  if (seniorIndex !== -1 && seniorIndex < blockEnd) {
    blockEnd = seniorIndex
  }

  // Ищем русские разделы
  const sectionRegex = /\*\*[^*]+:\*\*/g
  sectionRegex.lastIndex = startIndex
  let sectionMatch
  while ((sectionMatch = sectionRegex.exec(text)) !== null) {
    if (sectionMatch.index >= blockEnd) break
    if (isRussianSectionMarker(sectionMatch[0])) {
      blockEnd = sectionMatch.index
      break
    }
  }

  // Ищем следующий вопрос
  const nextQuestionIndex = text.indexOf('###', startIndex + 1)
  if (nextQuestionIndex !== -1 && nextQuestionIndex < blockEnd) {
    blockEnd = nextQuestionIndex
  }

  return text.substring(startIndex, blockEnd).trim()
}

/**
 * Парсит markdown и извлекает структурированные данные о вопросах
 * @param {string} markdown - содержимое markdown файла
 * @returns {Array} массив объектов с данными о вопросах
 */
export function parseQuestions(markdown) {
  const questions = []
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm

  // Находим все вопросы
  const questionMatches = []
  let match
  questionRegex.lastIndex = 0

  while ((match = questionRegex.exec(markdown)) !== null) {
    questionMatches.push({
      text: match[1].trim(),
      index: match.index,
      fullMatch: match[0]
    })
  }

  // Обрабатываем каждый вопрос
  questionMatches.forEach((qMatch, idx) => {
    const questionIndex = qMatch.index
    const nextIndex = questionMatches[idx + 1]
      ? questionMatches[idx + 1].index
      : markdown.length

    const questionSection = markdown.substring(questionIndex, nextIndex)

    // Очищаем текст вопроса от markdown разметки
    const cleanQuestionText = qMatch.text
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim()

    // Ищем русский ответ
    let answerRu = null
    const answerRuMatch = questionSection.match(/\*\*Ответ:\*\*\s*/)
    if (answerRuMatch) {
      const answerRuStart = questionSection.indexOf(answerRuMatch[0]) + answerRuMatch[0].length
      let answerRuEnd = questionSection.length

      // Ищем конец русского ответа (начало Answer EN или Senior)
      const answerEnStart = questionSection.indexOf('**Answer EN:**')
      if (answerEnStart !== -1 && answerEnStart > answerRuStart) {
        answerRuEnd = answerEnStart
      } else {
        const seniorStart = questionSection.indexOf('**Ответ Senior:**')
        if (seniorStart !== -1 && seniorStart > answerRuStart) {
          answerRuEnd = seniorStart
        }
      }

      const answerRuText = questionSection
        .substring(answerRuStart, answerRuEnd)
        .trim()
      if (answerRuText) {
        answerRu = answerRuText
      }
    }

    // Ищем Answer EN
    let answerEn = null
    const answerEnMatch = questionSection.match(/\*\*Answer EN:\*\*\s*/)
    if (answerEnMatch) {
      const answerEnStart =
        questionSection.indexOf(answerEnMatch[0]) + answerEnMatch[0].length
      let answerEnEnd = questionSection.length

      // Ищем конец Answer EN
      const seniorStart = questionSection.indexOf('**Ответ Senior:**', answerEnStart)
      if (seniorStart !== -1) {
        answerEnEnd = seniorStart
      } else {
        // Ищем русские разделы
        const sectionRegex = /\*\*[^*]+:\*\*/g
        sectionRegex.lastIndex = answerEnStart
        let sectionMatch
        while ((sectionMatch = sectionRegex.exec(questionSection)) !== null) {
          if (sectionMatch.index < answerEnStart) continue
          if (isRussianSectionMarker(sectionMatch[0])) {
            answerEnEnd = sectionMatch.index
            break
          }
        }
      }

      const answerEnText = questionSection
        .substring(answerEnStart, answerEnEnd)
        .trim()
      if (answerEnText) {
        answerEn = answerEnText
      }
    }

    // Ищем Senior ответ
    let answerSenior = null
    const seniorMatch = questionSection.match(/\*\*Ответ Senior:\*\*\s*/)
    if (seniorMatch) {
      const seniorStart =
        questionSection.indexOf(seniorMatch[0]) + seniorMatch[0].length
      const seniorEnd = questionSection.length
      const seniorText = questionSection.substring(seniorStart, seniorEnd).trim()
      if (seniorText) {
        answerSenior = seniorText
      }
    }

    // Извлекаем блоки кода из всего вопроса
    const codeBlocks = []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let codeMatch
    while ((codeMatch = codeBlockRegex.exec(questionSection)) !== null) {
      codeBlocks.push({
        language: codeMatch[1] || '',
        code: codeMatch[2].trim()
      })
    }

    questions.push({
      id: `question-${idx + 1}`,
      number: idx + 1,
      question: cleanQuestionText,
      questionRaw: qMatch.text,
      answerRu: answerRu,
      answerEn: answerEn,
      answerSenior: answerSenior,
      codeBlocks: codeBlocks,
      rawMarkdown: questionSection
    })
  })

  return questions
}

/**
 * Парсит вопросы из markdown для использования в режиме тренировки
 * @param {string} markdown - содержимое markdown файла
 * @param {string} sectionId - ID раздела
 * @returns {Array} массив объектов с данными для тренировки
 */
export function parseQuestionsForTraining(markdown, sectionId) {
  const questions = parseQuestions(markdown)
  return questions.map((q) => ({
    ...q,
    sectionId,
    hasAnswerEn: !!q.answerEn,
    hasAnswerRu: !!q.answerRu,
    hasAnswerSenior: !!q.answerSenior
  }))
}
