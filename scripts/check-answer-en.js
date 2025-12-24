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

      // Извлекаем короткие версии для проверки
      let answerEnText = null
      if (hasAnswerEn) {
        const answerEnMatch = questionSection.match(/\*\*Answer EN:\*\*\s+([^\n]+(?:\n(?!\*\*|###)[^\n]+)*)/)
        if (answerEnMatch) {
          answerEnText = answerEnMatch[1].trim().substring(0, 200)
        }
      }

      questions.push({
        text: qMatch.text,
        hasAnswer,
        hasAnswerEn,
        hasSenior,
        answerEnText,
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

