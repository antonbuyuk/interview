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
    const questionRegex = /^###\s+(\d+)\.\s+(.+)$/gm
    const questions = []
    let match

    while ((match = questionRegex.exec(content)) !== null) {
      questions.push({
        number: match[1],
        text: match[2].trim(),
        index: match.index
      })
    }

    // Проверяем каждый вопрос
    questions.forEach((q, idx) => {
      const startIndex = q.index
      const endIndex = idx < questions.length - 1 ? questions[idx + 1].index : content.length
      const questionSection = content.substring(startIndex, endIndex)

      // Ищем блок Answer EN
      const answerEnMatch = questionSection.match(/\*\*Answer EN:\*\*/)
      if (!answerEnMatch) return

      const answerEnStart = startIndex + answerEnMatch.index

      // Находим конец блока Answer EN (до "Ответ Senior:" или следующего вопроса)
      let answerEnEnd = endIndex
      const seniorMatch = questionSection.indexOf('**Ответ Senior:**', answerEnMatch.index)
      if (seniorMatch !== -1) {
        answerEnEnd = startIndex + seniorMatch
      }

      // Извлекаем содержимое блока Answer EN
      // Но сначала нужно найти, где заканчивается блок Answer EN по логике SectionView.vue
      // Блок Answer EN заканчивается перед русским разделом (жирный текст с кириллицей)
      let actualAnswerEnEnd = answerEnEnd

      // Ищем русские разделы (жирный текст с кириллицей, но не "Ответ" или "Answer EN")
      // Также ищем разделы, которые могут быть на английском, но после которых идет русский текст
      const sectionRegex = /\*\*[^\*]+:\*\*/g
      sectionRegex.lastIndex = answerEnStart
      let sectionMatch
      while ((sectionMatch = sectionRegex.exec(content)) !== null) {
        if (sectionMatch.index >= actualAnswerEnEnd) break

        const matchText = sectionMatch[0].toLowerCase()
        // Пропускаем маркеры "Ответ", "Ответ Senior", "Answer EN"
        if (!matchText.includes('ответ') && !matchText.includes('answer en')) {
          // Проверяем, есть ли кириллица в заголовке
          const hasCyrillicInHeader = /[А-Яа-яЁё]/.test(sectionMatch[0])

          // Проверяем содержимое после раздела (следующие 300 символов)
          const contentAfter = content.substring(
            sectionMatch.index + sectionMatch[0].length,
            Math.min(sectionMatch.index + sectionMatch[0].length + 300, actualAnswerEnEnd)
          )
          const hasCyrillicInContent = /[А-Яа-яЁё]/.test(contentAfter)

          // Если есть кириллица в заголовке или в содержимом, это конец блока Answer EN
          if (hasCyrillicInHeader || hasCyrillicInContent) {
            if (sectionMatch.index > answerEnStart) {
              actualAnswerEnEnd = sectionMatch.index
              break
            }
          }
        }
      }

      const answerEnContent = content.substring(
        answerEnStart + 13, // длина "**Answer EN:**"
        actualAnswerEnEnd
      ).trim()

      // Проверяем наличие кириллицы в блоке Answer EN
      // Игнорируем блоки кода (между ```)
      const lines = answerEnContent.split('\n')
      let inCodeBlock = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Отслеживаем блоки кода
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock
          continue
        }

        // Пропускаем строки внутри блоков кода
        if (inCodeBlock) continue

        // Проверяем наличие кириллицы
        if (/[а-яёА-ЯЁ]/.test(line)) {
          // Пропускаем комментарии в коде (// или *)
          if (line.startsWith('//') || (line.startsWith('*') && !line.startsWith('**'))) {
            continue
          }

          // Если это не пустая строка и содержит кириллицу - это проблема
          if (line.length > 3) {
            // Проверяем, не является ли это просто частью английского текста с одним русским словом
            const cyrillicCount = (line.match(/[а-яёА-ЯЁ]/g) || []).length
            const totalChars = line.replace(/\s/g, '').length

            // Если более 20% символов - кириллица, это проблема
            if (cyrillicCount > 2 || (totalChars > 0 && cyrillicCount / totalChars > 0.2)) {
              issues.push({
                section,
                question: `${q.number}. ${q.text}`,
                line: answerEnStart + 13 + content.substring(answerEnStart + 13, answerEnStart + 13 + answerEnContent.substring(0, answerEnContent.indexOf(line)).length).split('\n').length,
                content: line.substring(0, 100),
                fullContext: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n')
              })
              break // Нашли проблему, переходим к следующему вопросу
            }
          }
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
  console.log('✅ Все блоки Answer EN содержат только английский текст!')
} else {
  console.log(`Найдено проблем: ${issues.length}\n`)

  issues.forEach(issue => {
    console.log(`[${issue.section}] ${issue.question}`)
    console.log(`  Строка ${issue.line}: ${issue.content}`)
    console.log(`  Контекст:`)
    console.log(issue.fullContext.split('\n').map(l => `    ${l}`).join('\n'))
    console.log('')
  })
}

process.exit(issues.length > 0 ? 1 : 0)
