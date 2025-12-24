const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')

const contentDir = join(process.cwd(), 'content')
const sections = readdirSync(contentDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'assets')
  .map(dirent => dirent.name)

const issues = []

sections.forEach(section => {
  const readmePath = join(contentDir, section, 'README.md')
  try {
    const content = readFileSync(readmePath, 'utf-8')

    // Находим все вопросы
    const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
    const answerRegex = /\*\*Ответ:\*\*\s*(.+?)(?=\*\*Answer EN:\*\*|\*\*Ответ Senior:\*\*|###|$)/gs
    const answerEnRegex = /\*\*Answer EN:\*\*\s*(.+?)(?=\*\*Ответ Senior:\*\*|###|$)/gs
    const seniorRegex = /\*\*Ответ Senior:\*\*/g

    const questions = []
    let match

    // Находим все вопросы более эффективно
    const questionMatches = []
    questionRegex.lastIndex = 0
    while ((match = questionRegex.exec(content)) !== null) {
      questionMatches.push({
        text: match[1].trim(),
        index: match.index
      })
    }

    // Обрабатываем каждый вопрос
    questionMatches.forEach((qMatch, idx) => {
      const questionIndex = qMatch.index
      const nextIndex = questionMatches[idx + 1] ? questionMatches[idx + 1].index : content.length
      const questionSection = content.substring(questionIndex, nextIndex)

      // Ищем ответы (используем более простые проверки)
      const hasAnswer = /\*\*Ответ:\*\*\s+/.test(questionSection)
      const hasAnswerEn = /\*\*Answer EN:\*\*\s+/.test(questionSection)
      const hasSenior = seniorRegex.test(questionSection)

      // Извлекаем текст Answer EN для проверки
      let answerEnText = null
      let answerEnFullText = null
      if (hasAnswerEn) {
        // Ищем блок Answer EN до следующего маркера (Ответ Senior, следующий вопрос или русский раздел)
        // Останавливаемся на **Преимущества:** или других русских разделах (жирный текст с кириллицей)
        // Ищем до первого русского раздела (жирный текст с кириллицей, но не "Ответ" или "Answer EN")
        const answerEnStart = questionSection.indexOf('**Answer EN:**')
        if (answerEnStart !== -1) {
          let answerEnEnd = questionSection.length

          // Ищем маркер "Ответ Senior:"
          const seniorIndex = questionSection.indexOf('**Ответ Senior:**', answerEnStart)
          if (seniorIndex !== -1 && seniorIndex < answerEnEnd) {
            answerEnEnd = seniorIndex
          }

          // Ищем русские разделы (жирный текст с кириллицей, но не "Ответ" или "Answer EN")
          // Также проверяем разделы, после которых идет русский текст
          const sectionRegex = /\*\*[^\*]+:\*\*/g
          sectionRegex.lastIndex = answerEnStart
          let sectionMatch
          while ((sectionMatch = sectionRegex.exec(questionSection)) !== null) {
            const matchText = sectionMatch[0].toLowerCase()
            // Пропускаем маркеры "Ответ", "Ответ Senior", "Answer EN"
            if (!matchText.includes('ответ') && !matchText.includes('answer en')) {
              if (sectionMatch.index < answerEnEnd && sectionMatch.index > answerEnStart) {
                // Проверяем, есть ли кириллица в заголовке или в содержимом после него
                const hasCyrillicInHeader = /[А-Яа-яЁё]/.test(sectionMatch[0])

                // Проверяем содержимое после раздела (следующие 200 символов)
                const contentAfter = questionSection.substring(
                  sectionMatch.index + sectionMatch[0].length,
                  Math.min(sectionMatch.index + sectionMatch[0].length + 200, questionSection.length)
                )
                const hasCyrillicInContent = /[А-Яа-яЁё]/.test(contentAfter)

                // Если есть кириллица в заголовке или в содержимом, это конец блока Answer EN
                if (hasCyrillicInHeader || hasCyrillicInContent) {
                  answerEnEnd = sectionMatch.index
                  break
                }
              }
            }
          }

          // Ищем следующий вопрос
          const nextQuestionIndex = questionSection.indexOf('###', answerEnStart + 1)
          if (nextQuestionIndex !== -1 && nextQuestionIndex < answerEnEnd) {
            answerEnEnd = nextQuestionIndex
          }

          const answerEnBlock = questionSection.substring(answerEnStart + 13, answerEnEnd).trim()
          if (answerEnBlock) {
            answerEnFullText = answerEnBlock
            answerEnText = answerEnFullText.substring(0, 200)
          }
        }
      }

      questions.push({
        text: qMatch.text,
        hasAnswer,
        hasAnswerEn,
        hasSenior,
        answerEnText,
        answerEnFullText,
        section
      })
    })

    // Проверяем каждый вопрос
    questions.forEach((q, index) => {
      if (q.hasAnswer && !q.hasAnswerEn) {
        issues.push({
          type: 'missing',
          section,
          question: `${index + 1}. ${q.text}`,
          message: 'Есть русский ответ, но нет Answer EN'
        })
      }

      if (q.hasAnswerEn && !q.hasAnswer) {
        issues.push({
          type: 'orphan',
          section,
          question: `${index + 1}. ${q.text}`,
          message: 'Есть Answer EN, но нет русского ответа'
        })
      }

      if (q.hasAnswerEn && q.answerEnText && q.answerEnText.length < 20) {
        issues.push({
          type: 'incomplete',
          section,
          question: `${index + 1}. ${q.text}`,
          message: `Answer EN слишком короткий: "${q.answerEnText}"`
        })
      }

      // Проверяем, что Answer EN не пустой (только пробелы или переносы строк)
      if (q.hasAnswerEn && q.answerEnText && q.answerEnText.trim().length === 0) {
        issues.push({
          type: 'empty',
          section,
          question: `${index + 1}. ${q.text}`,
          message: 'Answer EN пустой'
        })
      }

      // Проверяем наличие русского текста (кириллицы) в Answer EN
      if (q.hasAnswerEn && q.answerEnFullText) {
        // Проверяем наличие кириллицы в тексте
        const hasCyrillic = /[а-яёА-ЯЁ]/.test(q.answerEnFullText)

        if (hasCyrillic) {
          // Находим строки с кириллицей для примера
          const lines = q.answerEnFullText.split('\n')
          const russianLines = lines
            .map((line, idx) => ({ line: line.trim(), idx }))
            .filter(({ line }) => line && /[а-яёА-ЯЁ]/.test(line))
            .slice(0, 3) // Берем первые 3 строки с русским текстом

          const examples = russianLines.map(({ line }) => {
            const preview = line.length > 60 ? line.substring(0, 60) + '...' : line
            return preview
          }).join('; ')

          issues.push({
            type: 'russian-in-answer-en',
            section,
            question: `${index + 1}. ${q.text}`,
            message: `В Answer EN найден русский текст: ${examples}`,
            russianLines: russianLines.map(({ line, idx }) => ({ line, lineNumber: idx + 1 }))
          })
        }
      }
    })

    console.log(`✓ ${section}: проверено ${questions.length} вопросов`)
  } catch (err) {
    console.error(`✗ Ошибка при проверке ${section}:`, err.message)
  }
})

console.log('\n=== Результаты проверки ===\n')

if (issues.length === 0) {
  console.log('✅ Все блоки Answer EN корректны!')
} else {
  console.log(`Найдено проблем: ${issues.length}\n`)

  const byType = {}
  issues.forEach(issue => {
    if (!byType[issue.type]) {
      byType[issue.type] = []
    }
    byType[issue.type].push(issue)
  })

  Object.keys(byType).forEach(type => {
    console.log(`\n${type.toUpperCase()}: ${byType[type].length}`)
    byType[type].forEach(issue => {
      console.log(`  [${issue.section}] ${issue.question}`)
      console.log(`    ${issue.message}`)
    })
  })
}

process.exit(issues.length > 0 ? 1 : 0)

