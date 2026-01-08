<template>
  <div class="section-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
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
        @edit-question="openEditQuestion"
      />
    </div>

    <!-- Модальное окно для добавления/редактирования вопросов -->
    <AddQuestionModal
      :is-open="showQuestionModal"
      :question="editingQuestion"
      :default-section-id="currentSectionId"
      :is-admin="isAdmin"
      @close="closeQuestionModal"
      @saved="handleQuestionSaved"
      @deleted="handleQuestionDeleted"
    />

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

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import QuestionNav from '../components/QuestionNav.vue';
import AddQuestionModal from '../components/AddQuestionModal.vue';
import QuestionContent from '../components/QuestionContent.vue';
import { useAdminAuth } from '../composables/useAdminAuth';
import { getQuestions } from '../api/questions';
import { getSectionById } from '../api/sections';
import { XMarkIcon } from '@heroicons/vue/24/outline';
// Используем темную тему и переопределим цвета для VS Code стиля
import 'highlight.js/styles/github-dark.css';
import '../styles/code.scss';
import '../styles/vscode-theme.scss';
import '../styles/highlight-fix.scss';

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const contentRef = ref(null);
const questions = ref([]);
const filterOpen = ref(false);
const fullQuestionsData = ref([]); // Полные данные вопросов для редактирования
const currentSectionId = ref(null); // UUID текущего раздела

// Модалка для добавления/редактирования вопросов
const showQuestionModal = ref(false);
const editingQuestion = ref(null);

// Training mode - больше не используем здесь, перенесено в Header
// const { englishOnly, ttsEnabled } = useTrainingMode();

// Admin auth
const { isAdmin } = useAdminAuth();

// Закрытие фильтра
const closeFilter = () => {
  filterOpen.value = false;
  const event = new CustomEvent('filter-closed');
  window.dispatchEvent(event);
};

// Обработчик открытия/закрытия фильтра
const handleToggleFilter = event => {
  filterOpen.value = event.detail.open;
};

// Методы для работы с модалкой вопросов
const openAddQuestion = async () => {
  editingQuestion.value = null;
  showQuestionModal.value = true;
  // Автоматически заполняем sectionId текущим разделом
  // Это будет обработано в модалке через prop
};

const openEditQuestion = question => {
  editingQuestion.value = question;
  showQuestionModal.value = true;
};

const closeQuestionModal = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
};

const handleQuestionSaved = () => {
  // Перезагружаем контент после сохранения
  loadContent();
};

const handleQuestionDeleted = () => {
  // Перезагружаем контент после удаления
  loadContent();
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
    // Получаем раздел по sectionId для получения UUID
    const section = await getSectionById(props.section.id);
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
    error.value = err.message || 'Ошибка загрузки контента';
    console.error('Ошибка загрузки контента:', err);
  } finally {
    loading.value = false;
  }
};

// Обработчик открытия добавления вопроса из Header
const handleOpenAddQuestion = () => {
  openAddQuestion();
};

// Слушаем события от Header для открытия/закрытия фильтра
onMounted(() => {
  window.addEventListener('toggle-filter', handleToggleFilter);
  window.addEventListener('open-add-question', handleOpenAddQuestion);
});

onUnmounted(() => {
  window.removeEventListener('toggle-filter', handleToggleFilter);
  window.removeEventListener('open-add-question', handleOpenAddQuestion);
});

watch(
  () => props.section.id,
  () => {
    loadContent();
    // Передаем текущий раздел в Header
    const sectionEvent = new CustomEvent('current-section-updated', {
      detail: { section: props.section },
    });
    window.dispatchEvent(sectionEvent);
  },
  { immediate: true }
);

// Функция для прокрутки к вопросу
const scrollToQuestion = questionId => {
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

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #c33;

  h2 {
    margin-bottom: 0.5rem;
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: $primary-hover;
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
  background: $bg-white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 56px - 2rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  @media (max-width: $breakpoint-mobile) {
    max-height: calc(100vh - 56px - 1rem);
    border-radius: 8px;
  }
}

.filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.875rem 1rem;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: $text-dark;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1rem;
    }
  }
}

.filter-close-btn {
  background: transparent;
  border: none;
  color: $text-lighter-gray;
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
  transition: all 0.2s;

  &:hover {
    background: $border-color;
    color: $text-gray;
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
