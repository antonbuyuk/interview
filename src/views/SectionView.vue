<template>
  <div class="section-view">
    <div v-if="loading" class="section-wrapper">
      <div class="question-content">
        <Skeleton v-for="n in 3" :key="`skeleton-${n}`" variant="question" />
      </div>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadContent">Повторить</button>
    </div>

    <div v-else class="section-wrapper">
      <QuestionContent
        ref="contentRef"
        :questions="fullQuestionsData"
        :is-admin="isAdmin"
        :section-id="currentSectionId || ''"
        @edit-question="openEditQuestion"
        @reordered="handleQuestionsReordered"
      />
    </div>

    <!-- Модальное окно для вопросов на мобильных -->
    <div v-if="filterOpen" class="filter-overlay" @click="closeFilter">
      <div class="filter-modal" @click.stop>
        <div class="filter-modal-header">
          <h3>Навигация по вопросам</h3>
          <button class="filter-close-btn" aria-label="Закрыть" @click="closeFilter">
            <XMarkIcon class="icon-small" />
          </button>
        </div>
        <div class="filter-modal-content">
          <QuestionNav :questions="questions" :is-admin="isAdmin" class="mobile-filter" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
const QuestionNav = defineAsyncComponent(() => import('../components/question/QuestionNav.vue'));
const Skeleton = defineAsyncComponent(() => import('../components/ui/Skeleton.vue'));
const QuestionContent = defineAsyncComponent(
  () => import('../components/question/QuestionContent.vue')
);
import { useAdminAuth } from '../composables/useAdminAuth';
import { getQuestions } from '../api/questions';
import { useSectionsStore } from '../stores/sections';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { Section, Question } from '../types/api';
// Используем темную тему и переопределим цвета для VS Code стиля
import '../styles/code.scss';
import '../styles/highlight-fix.scss';

interface QuestionNavItem {
  id: string;
  text: string;
}

const props = defineProps<{
  section: Section;
}>();

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const questions = ref<QuestionNavItem[]>([]);
const filterOpen = ref(false);
const fullQuestionsData = ref<Question[]>([]); // Полные данные вопросов для редактирования
const currentSectionId = ref<string | null>(null); // UUID текущего раздела
const sectionsStore = useSectionsStore();

// Admin auth
const { isAdmin } = useAdminAuth();

// Закрытие фильтра
const closeFilter = () => {
  filterOpen.value = false;
  const event = new CustomEvent('filter-closed');
  window.dispatchEvent(event);
};

// Обработчик открытия/закрытия фильтра
const handleToggleFilter = (event: Event) => {
  const customEvent = event as CustomEvent<{ open: boolean }>;
  filterOpen.value = customEvent.detail.open;
};

// Метод для открытия редактирования вопроса
const openEditQuestion = (question: Question) => {
  // Эмитим глобальное событие для открытия модалки редактирования
  const event = new CustomEvent('edit-question', {
    detail: { question },
  });
  window.dispatchEvent(event);
};

// Передаем количество вопросов в Header через событие
watch(
  questions,
  newQuestions => {
    const event = new CustomEvent('questions-count-updated', {
      detail: { count: newQuestions.length },
    });
    window.dispatchEvent(event);

    // Передаем текущие вопросы в Header для поиска
    const questionsEvent = new CustomEvent('current-questions-updated', {
      detail: { questions: newQuestions },
    });
    window.dispatchEvent(questionsEvent);
  },
  { immediate: true }
);

const loadContent = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Получаем раздел из store по ID
    const section = sectionsStore.getSectionById(props.section.id);

    if (!section) {
      error.value = 'Раздел не найден';
      loading.value = false;
      return;
    }

    currentSectionId.value = section.id;

    // Загружаем вопросы через API
    const questionsData = await getQuestions(section.id);

    // Сохраняем полные данные вопросов для редактирования
    fullQuestionsData.value = questionsData;

    // Извлекаем вопросы для навигации
    questions.value = questionsData.map(q => ({
      id: `question-${q.number}`,
      text: q.question,
    }));

    // Отправляем событие с UUID раздела для App.vue
    const sectionEvent = new CustomEvent('current-section-updated', {
      detail: { section: props.section, sectionId: currentSectionId.value },
    });
    window.dispatchEvent(sectionEvent);

    // Прокручиваем к вопросу, если он указан в hash
    await nextTick();
    if (route.hash) {
      const questionId = route.hash.substring(1);
      if (questionId) {
        setTimeout(() => {
          scrollToQuestion(questionId);
        }, 200);
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки контента';
    error.value = errorMessage;
    console.error('Ошибка загрузки контента:', err);
  } finally {
    loading.value = false;
  }
};

// Обработчик перезагрузки контента после сохранения/удаления вопроса
const handleQuestionsNeedReload = () => {
  loadContent();
};

// Обработчик изменения порядка вопросов через drag & drop
const handleQuestionsReordered = () => {
  loadContent();
};

// Слушаем события
onMounted(() => {
  window.addEventListener('toggle-filter', handleToggleFilter);
  window.addEventListener('questions-need-reload', handleQuestionsNeedReload);
});

onUnmounted(() => {
  window.removeEventListener('toggle-filter', handleToggleFilter);
  window.removeEventListener('questions-need-reload', handleQuestionsNeedReload);
});

watch(
  () => props.section.id,
  () => {
    loadContent();
  },
  { immediate: true }
);

// Функция для прокрутки к вопросу
const scrollToQuestion = (questionId: string) => {
  const attemptScroll = () => {
    const element = document.getElementById(questionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      return true;
    }
    return false;
  };

  // Пробуем сразу
  if (attemptScroll()) return;

  // Если не получилось, пробуем через небольшие интервалы
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (attemptScroll() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
};

// Следим за изменением hash
watch(
  () => route.hash,
  newHash => {
    if (newHash && fullQuestionsData.value.length > 0) {
      const questionId = newHash.substring(1);
      if (questionId) {
        nextTick(() => {
          setTimeout(() => {
            scrollToQuestion(questionId);
          }, 200);
        });
      }
    }
  }
);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.section-view {
  margin: 0 auto;

  @media (max-width: $breakpoint-mobile) {
    padding: 0;
  }
}

.section-wrapper {
  gap: 1.5rem;
  position: relative;
  display: flex;

  @media (max-width: $breakpoint-mobile) {
    flex-direction: column;
  }
}

.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: sticky;
  top: 2rem;
  align-self: start;

  @media (max-width: $breakpoint-tablet) {
    position: relative;
    top: 0;
    margin-top: 2rem;
  }

  @media (max-width: $breakpoint-mobile) {
    display: none;

    .desktop-nav {
      display: none;
    }
  }
}

.question-content {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: var(--shadow-md);
  line-height: 1.8;
  max-width: 60rem;
  margin-inline: auto;
  width: 100%;

  @media (max-width: $breakpoint-mobile) {
    max-width: 100%;
    padding: 1rem;
    border-radius: 0;
    font-size: 0.9375rem;
  }
}

.error {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  @include rounded-md;
  padding: 2rem;
  text-align: center;
  color: var(--error-color);

  h2 {
    margin-bottom: 0.5rem;
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: var(--primary-hover);
  }
}

// Модальное окно фильтра вопросов
.filter-overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.5rem;
  }
}

.filter-modal {
  background: var(--bg-white);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 56px - 2rem);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;

  @media (max-width: $breakpoint-mobile) {
    max-height: calc(100vh - 56px - 1rem);
    @include rounded-md;
  }
}

.filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-light);

  @media (max-width: $breakpoint-mobile) {
    padding: 0.875rem 1rem;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-dark);

    @media (max-width: $breakpoint-mobile) {
      font-size: 1rem;
    }
  }
}

.filter-close-btn {
  background: transparent;
  border: none;
  color: var(--text-lighter-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;

  .icon-small {
    width: 1.25rem;
    height: 1.25rem;
    color: inherit;
  }
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  @include transition;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-gray);
  }
}

.filter-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.75rem;
  }
}

.question-nav.mobile-filter {
  position: relative !important;
  top: 0 !important;
  max-height: none;
  border: none;
  box-shadow: none;
  padding: 0;

  .question-list {
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }
}
</style>
