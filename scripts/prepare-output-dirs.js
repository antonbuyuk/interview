const { mkdirSync, existsSync } = require('fs')
const { join } = require('path')

const sections = [
  'javascript-typescript',
  'vuejs',
  'nuxtjs',
  'typescript',
  'microfrontends',
  'css-styling',
  'web-performance',
  'http-api',
  'general-questions',
  'practical-tasks',
  'architecture-patterns',
  'performance',
  'security',
  'testing',
  'accessibility-a11y',
  'practical-tasks-senior'
]

const rootDir = process.cwd()
const outputDir = join(rootDir, '.output', 'public')

// Создаем директории для секций
sections.forEach(section => {
  const dir = join(outputDir, section)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    console.log(`✓ Создана директория: .output/public/${section}`)
  }
})

console.log('✅ Все директории подготовлены!')

