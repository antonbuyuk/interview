<template>
  <div class="vocabulary-view">
    <div class="vocabulary-header">
      <h1>📖 Словарь технических терминов</h1>
      <p class="subtitle">Английские термины с переводом и примерами использования</p>
    </div>

    <!-- Поиск и фильтры -->
    <div class="controls-panel">
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по термину или переводу..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Категория:</label>
          <select v-model="selectedCategory" class="filter-select">
            <option value="all">Все категории</option>
            <option
              v-for="category in uniqueCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.title }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Сортировка:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="term">По термину (A-Z)</option>
            <option value="category">По категории</option>
            <option value="translation">По переводу (A-Z)</option>
          </select>
        </div>
      </div>

      <div class="results-info">
        Найдено терминов: <strong>{{ filteredTerms.length }}</strong>
      </div>
    </div>

    <!-- Карточки терминов -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка словаря...</p>
    </div>

    <div v-else-if="filteredTerms.length === 0" class="empty-state">
      <p>Термины не найдены. Попробуйте изменить параметры поиска.</p>
    </div>

    <div v-else class="vocabulary-grid">
      <div
        v-for="term in filteredTerms"
        :key="term.term"
        class="vocabulary-card"
      >
        <div class="card-header">
          <h3 class="term-title">{{ term.term }}</h3>
          <span class="term-category">{{ getCategoryTitle(term.category) }}</span>
        </div>

        <div class="card-body">
          <div class="translation-section">
            <span class="translation-label">Перевод:</span>
            <span class="translation-text">{{ term.translation || '—' }}</span>
          </div>

          <div v-if="term.phrases && term.phrases.length > 0" class="phrases-section">
            <span class="phrases-label">Примеры словосочетаний:</span>
            <div class="phrases-list">
              <span
                v-for="(phrase, idx) in term.phrases"
                :key="idx"
                class="phrase-tag"
              >
                {{ phrase }}
              </span>
            </div>
          </div>

          <div v-if="term.examples && term.examples.length > 0" class="examples-section">
            <span class="examples-label">Примеры использования:</span>
            <ul class="examples-list">
              <li
                v-for="(example, idx) in term.examples"
                :key="idx"
                class="example-item"
              >
                {{ example }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import vocabularyData from '../data/vocabulary.json'
import { sections } from '../data/sections.js'

const vocabulary = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('term')

// Загружаем словарь
onMounted(async () => {
  try {
    // Можно также попробовать загрузить извлеченные термины
    // const extracted = await extractVocabularyFromMarkdown()
    // vocabulary.value = [...vocabularyData, ...extracted]
    vocabulary.value = vocabularyData
  } catch (error) {
    console.error('Ошибка загрузки словаря:', error)
    vocabulary.value = vocabularyData
  } finally {
    loading.value = false
  }
})

// Уникальные категории
const uniqueCategories = computed(() => {
  const categoriesMap = new Map()
  vocabulary.value.forEach(term => {
    if (!categoriesMap.has(term.category)) {
      const section = sections.find(s => s.id === term.category)
      categoriesMap.set(term.category, {
        id: term.category,
        title: section ? section.title : term.categoryTitle || term.category
      })
    }
  })
  return Array.from(categoriesMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  )
})

// Получить название категории
const getCategoryTitle = (categoryId) => {
  const section = sections.find(s => s.id === categoryId)
  return section ? section.title : categoryId
}

// Фильтрация и сортировка
const filteredTerms = computed(() => {
  let filtered = vocabulary.value

  // Фильтр по поисковому запросу
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(term => {
      const termLower = term.term.toLowerCase()
      const translationLower = (term.translation || '').toLowerCase()
      const phrasesLower = (term.phrases || []).join(' ').toLowerCase()
      return (
        termLower.includes(query) ||
        translationLower.includes(query) ||
        phrasesLower.includes(query)
      )
    })
  }

  // Фильтр по категории
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(term => term.category === selectedCategory.value)
  }

  // Сортировка
  const sorted = [...filtered]
  sorted.sort((a, b) => {
    switch (sortBy.value) {
      case 'term':
        return a.term.localeCompare(b.term)
      case 'translation':
        return (a.translation || '').localeCompare(b.translation || '')
      case 'category':
        const categoryA = getCategoryTitle(a.category)
        const categoryB = getCategoryTitle(b.category)
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB)
        }
        return a.term.localeCompare(b.term)
      default:
        return 0
    }
  })

  return sorted
})
</script>

<style scoped>
.vocabulary-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.vocabulary-header {
  margin-bottom: 2rem;
  text-align: center;
}

.vocabulary-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e1e1e;
}

.subtitle {
  font-size: 1.125rem;
  color: #666;
}

.controls-panel {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.125rem;
}

.filters-container {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #42b883;
}

.results-info {
  font-size: 0.9375rem;
  color: #666;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.results-info strong {
  color: #42b883;
  font-weight: 600;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.vocabulary-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.vocabulary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #42b883;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.term-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e1e1e;
  margin: 0;
  flex: 1;
}

.term-category {
  font-size: 0.75rem;
  font-weight: 500;
  color: #42b883;
  background: #f0f7ff;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  white-space: nowrap;
  margin-left: 0.75rem;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.translation-section {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.translation-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.translation-text {
  font-size: 1.125rem;
  color: #1e1e1e;
  font-weight: 500;
}

.phrases-section,
.examples-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.phrases-label,
.examples-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phrases-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.phrase-tag {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #333;
  border: 1px solid #e0e0e0;
}

.examples-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-item {
  font-size: 0.9375rem;
  color: #555;
  line-height: 1.6;
  padding-left: 1rem;
  position: relative;
}

.example-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #42b883;
  font-weight: bold;
}

@media (max-width: 768px) {
  .vocabulary-view {
    padding: 1rem;
  }

  .vocabulary-header h1 {
    font-size: 2rem;
  }

  .vocabulary-grid {
    grid-template-columns: 1fr;
  }

  .filters-container {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .card-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .term-category {
    margin-left: 0;
    align-self: flex-start;
  }
}
</style>