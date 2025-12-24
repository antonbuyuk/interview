const { copyFileSync, mkdirSync, existsSync } = require('fs')
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
const contentDir = join(rootDir, 'content')

sections.forEach(dir => {
  const sourcePath = join(contentDir, dir, 'README.md')
  const targetDir = join(rootDir, 'public', dir)
  const targetPath = join(targetDir, 'README.md')

  if (existsSync(sourcePath)) {
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }
    copyFileSync(sourcePath, targetPath)
    console.log(`✓ Скопирован: content/${dir}/README.md → public/${dir}/README.md`)
  } else {
    console.warn(`⚠ Не найден: ${sourcePath}`)
  }
})

console.log('✅ Все файлы скопированы!')
