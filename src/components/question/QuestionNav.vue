<template>
  <nav class="question-nav" :class="{ empty: questions.length === 0 }">
    <div class="question-nav-header">
      <h3>Навигация по вопросам</h3>
      <span v-if="questions.length > 0" class="question-count">{{ questions.length }}</span>
    </div>
    <div v-if="questions.length === 0" class="no-questions">
      <p>Вопросы не найдены</p>
    </div>
    <ul v-else class="question-list">
      <li v-for="(question, index) in questions" :key="index" class="question-item">
        <a
          :href="`#question-${index + 1}`"
          class="question-link"
          :class="{ active: activeQuestion === question.id }"
          @click.prevent="scrollToQuestion(question.id)"
        >
          <span class="question-number">{{ index + 1 }}.</span>
          <span class="question-text">{{ question.text }}</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface QuestionNavItem {
  id: string;
  text: string;
}

defineProps<{
  questions: QuestionNavItem[];
}>();

const emit = defineEmits<{
  'question-click': [questionId: string];
}>();

const activeQuestion = ref<string | null>(null);

const scrollToQuestion = (questionId: string) => {
  const element = document.getElementById(questionId);
  if (element) {
    const offset = 100; // Отступ от верха
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    activeQuestion.value = questionId;
    emit('question-click', questionId);

    // Закрываем фильтр на мобильных после клика на вопрос
    if (window.innerWidth <= 768) {
      const event = new CustomEvent('filter-closed');
      window.dispatchEvent(event);
    }
  }
};

// Отслеживание активного вопроса при прокрутке
const handleScroll = () => {
  const questionElements = document.querySelectorAll<HTMLElement>('[id^="question-"]');
  if (questionElements.length === 0) return;

  const scrollPosition = window.pageYOffset + 120;
  let currentActive: string | null = null;

  questionElements.forEach((question: HTMLElement) => {
    const questionTop = question.offsetTop;
    const questionBottom = questionTop + question.offsetHeight;

    if (scrollPosition >= questionTop - 50 && scrollPosition < questionBottom) {
      currentActive = question.id;
    }
  });

  // Если мы в самом верху, выбираем первый вопрос
  if (!currentActive && window.pageYOffset < 100) {
    const firstElement = questionElements[0] as HTMLElement | undefined;
    currentActive = firstElement?.id || null;
  }

  // Если мы прокрутили вниз и нет активного, выбираем последний
  if (!currentActive && questionElements.length > 0) {
    const lastQuestion = questionElements[questionElements.length - 1] as HTMLElement | undefined;
    if (lastQuestion && scrollPosition >= lastQuestion.offsetTop - 50) {
      currentActive = lastQuestion.id;
    }
  }

  if (currentActive) {
    activeQuestion.value = currentActive;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Проверяем сразу
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped lang="scss">
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.question-nav {
  position: sticky !important;
  top: 2rem !important;
  align-self: start;
  background: var(bg-light);
  @include rounded-md;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  overflow-x: visible;
  min-width: 260px;
  width: 100%;
  z-index: 10;
  will-change: transform;
}

.question-nav.mobile {
  position: relative !important;
  top: 0 !important;
  max-height: 400px;
  @include rounded-md;
  margin-bottom: 1rem;
}

.question-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.question-nav-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.question-count {
  font-size: 0.75rem;
  color: var(--text-dark);
  background: var(--bg-card);
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
}

.question-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.question-item {
  margin: 0.25rem 0;
}

.question-link {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0.625rem;
  text-decoration: none;
  color: var(--text-dark);
  border-radius: 4px;
  @include transition;
  border-left: 2px solid transparent;
}

.question-link:hover {
  background: var(--bg-card);
  color: $primary-color;
}

.question-link.active {
  background: var(--bg-light);
  border-left-color: $primary-color;
  color: $primary-color;
  font-weight: 500;
}

.question-number {
  font-weight: 600;
  color: $primary-color;
  margin-right: 0.4rem;
  flex-shrink: 0;
  font-size: 0.8125rem;
}

.question-text {
  font-size: 0.8125rem;
  line-height: 1.4;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.question-link.active .question-text {
  font-weight: 500;
}

/* Скроллбар для навигации */
.question-nav::-webkit-scrollbar {
  width: 6px;
}

.question-nav::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.question-nav::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.question-nav::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

.no-questions {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.875rem;
}

.question-nav.empty {
  opacity: 0.6;
}

@media (max-width: 1200px) {
  .question-nav:not(.mobile) {
    position: relative;
    top: 0;
    max-height: none;
    margin-bottom: 2rem;
  }
}

@media (max-width: 768px) {
  .question-nav {
    min-width: auto;
    padding: 0.75rem;
    @include rounded-md;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .question-nav-header {
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .question-nav-header h3 {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .question-count {
    font-size: 0.75rem;
    padding: 0.15rem 0.35rem;
  }

  .question-list {
    max-height: 350px;
    overflow-y: auto;
  }

  .question-link {
    padding: 0.625rem 0.5rem;
    border-radius: 6px;
  }

  .question-text {
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .question-number {
    font-size: 0.75rem;
    margin-right: 0.5rem;
    min-width: 20px;
  }

  .no-questions {
    padding: 0.75rem;
    font-size: 0.8125rem;
  }

  /* Улучшенный скроллбар для мобильных */
  .question-nav::-webkit-scrollbar {
    width: 4px;
  }

  .question-nav::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  .question-nav::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}
</style>
