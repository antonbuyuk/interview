const { mkdirSync, existsSync } = require('fs')
const { join } = require('path')

const sections = [
  'javascript-typescript',
  'vuejs',
  'nuxtjs',
  'typescript',
  'микрофронтенды',
  'css-styling',
  'web-performance',
  'http-api',
  'общие-вопросы',
  'практические-задачи',
  'архитектура-и-паттерны',
  'производительность',
  'безопасность',
  'тестирование',
  'accessibility-a11y',
  'практические-задачи-senior'
]

const rootDir = process.cwd()
const outputDir = join(rootDir, '.output', 'public')

// Создаем директории для секций
sections.forEach(section => {
  const dir = join(outputDir, section)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

