<template>
  <div
    class="section-dropdown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <router-link
      :to="section.path"
      class="nav-item"
      :class="{ active: isActive }"
      @click="handleSectionClick"
    >
      <span class="nav-text">{{ section.title }}</span>
      <span class="dropdown-arrow" :class="{ open: showDropdown }">▼</span>
      </router-link>

    <transition name="dropdown">
      <div
        v-if="showDropdown"
        ref="menuRef"
        class="dropdown-menu"
        :style="menuStyle"
        @mouseenter="handleMenuEnter"
        @mouseleave="handleMenuLeave"
      >
        <div class="dropdown-header">
          <span class="dropdown-title">{{ section.title }}</span>
          <span class="question-count">{{ questions.length }}</span>
        </div>
        <div v-if="isLoading" class="dropdown-loading">
          <p>Загрузка вопросов...</p>
        </div>
        <div v-else-if="questions.length === 0" class="dropdown-empty">
          <p>Вопросы не найдены</p>
        </div>
        <div v-else class="dropdown-list">
          <a
            v-for="(question, index) in questions"
            :key="question.id"
            :href="`${section.path}#${question.id}`"
            @click.prevent="goToQuestion(question.id)"
            class="dropdown-item"
          >
            <span class="question-number">{{ index + 1 }}.</span>
            <span class="question-text">{{ question.text }}</span>
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const route = useRoute()
const router = useRouter()

const showDropdown = ref(false)
const questions = ref([])
const isLoading = ref(false)
const questionsCache = ref(new Map())
const menuRef = ref(null)
const menuStyle = ref({})
let closeTimeout = null

const isActive = computed(() => {
  return route.path === props.section.path || route.path.startsWith(props.section.path + '#')
})

const handleMouseEnter = (event) => {
  // Отменяем закрытие, если было запланировано
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }

  showDropdown.value = true
  if (questions.value.length === 0 && !isLoading.value) {
    loadQuestions()
  }

  // Позиционируем меню
  nextTick(() => {
    positionMenu(event.currentTarget)
  })
}

const positionMenu = (triggerElement) => {
  if (!triggerElement) return

  const rect = triggerElement.getBoundingClientRect()
  menuStyle.value = {
    left: `${rect.right + 4}px`,
    top: `${rect.top}px`
  }

  // Проверяем после рендеринга, не выходит ли за пределы
  setTimeout(() => {
    if (menuRef.value) {
      const menuRect = menuRef.value.getBoundingClientRect()
      const newStyle = { ...menuStyle.value }

      if (menuRect.right > window.innerWidth - 20) {
        newStyle.left = `${rect.left - menuRect.width - 8}px`
      }
      if (menuRect.bottom > window.innerHeight - 20) {
        newStyle.top = `${window.innerHeight - menuRect.height - 20}px`
      }

      menuStyle.value = newStyle
    }
  }, 0)
}

const handleMouseLeave = () => {
  // Задержка перед закрытием, чтобы можно было переместиться на меню
  closeTimeout = setTimeout(() => {
    showDropdown.value = false
    closeTimeout = null
  }, 150)
}

const handleMenuEnter = () => {
  // Отменяем закрытие при входе в меню
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

const handleMenuLeave = () => {
  // Закрываем при выходе из меню
  showDropdown.value = false
}

const handleSectionClick = () => {
  // Отменяем таймер при клике
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
  showDropdown.value = false
}

// Очищаем таймер при размонтировании
onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
})

const loadQuestions = async () => {
  // Проверяем кеш
  if (questionsCache.value.has(props.section.id)) {
    questions.value = questionsCache.value.get(props.section.id)
    return
  }

  isLoading.value = true
  try {
    const response = await fetch(`./${props.section.dir}/README.md`)
    if (response.ok) {
      const markdown = await response.text()
      const extractedQuestions = extractQuestionsFromMarkdown(markdown)
      questions.value = extractedQuestions
      questionsCache.value.set(props.section.id, extractedQuestions)
    }
  } catch (err) {
    console.error(`Ошибка загрузки вопросов для ${props.section.title}:`, err)
  } finally {
    isLoading.value = false
  }
}

const extractQuestionsFromMarkdown = (markdown) => {
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm
  const extractedQuestions = []
  let match

  while ((match = questionRegex.exec(markdown)) !== null) {
    const questionText = match[1].trim()
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim()

    extractedQuestions.push({
      id: `question-${extractedQuestions.length + 1}`,
      text: questionText
    })
  }

  return extractedQuestions
}

const goToQuestion = (questionId) => {
  router.push(`${props.section.path}#${questionId}`)
  showDropdown.value = false

  // Прокрутка к вопросу после перехода
  setTimeout(() => {
    const element = document.getElementById(questionId)
    if (element) {
      const offset = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }, 300)
}

// Предзагрузка вопросов для активного раздела
watch(() => route.path, (newPath) => {
  if (newPath === props.section.path) {
    loadQuestions()
  }
}, { immediate: true })
</script>

<style scoped>
.section-dropdown {
  position: relative;
}

/* Невидимый мост между пунктом меню и выпадающим меню */
.section-dropdown::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 0;
  width: 8px;
  height: 100%;
  z-index: 999;
  pointer-events: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  color: #1e1e1e;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #1e1e1e;
}

.nav-item.active {
  background: #f0f7ff;
  border-left-color: #42b883;
  color: #42b883;
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform 0.2s;
  color: #666;
  margin-left: 0.5rem;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
  color: #42b883;
}

.nav-item.active .dropdown-arrow {
  color: #42b883;
}

.dropdown-menu {
  position: fixed;
  width: 320px;
  max-height: 500px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Уменьшаем промежуток и делаем меню ближе к пункту */
  pointer-events: auto;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.dropdown-title {
  font-weight: 600;
  color: #1e1e1e;
  font-size: 0.9375rem;
}

.question-count {
  font-size: 0.75rem;
  color: #666;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.dropdown-list {
  overflow-y: auto;
  max-height: 450px;
}

.dropdown-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #1e1e1e;
  transition: all 0.2s;
  border-bottom: 1px solid #e0e0e0;
}

.dropdown-item:hover {
  background: #f5f5f5;
  color: #42b883;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.question-number {
  font-weight: 600;
  color: #42b883;
  margin-right: 0.5rem;
  flex-shrink: 0;
  font-size: 0.875rem;
}

.question-text {
  font-size: 0.875rem;
  line-height: 1.5;
  flex: 1;
}

/* Анимация выпадающего меню */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  opacity: 1;
  transform: translateX(0);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Скроллбар */
.dropdown-list::-webkit-scrollbar {
  width: 6px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.dropdown-loading,
.dropdown-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

@media (max-width: 1200px) {
  .dropdown-menu {
    left: 0;
    right: 0;
    width: auto;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>

