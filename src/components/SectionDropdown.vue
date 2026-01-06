<template>
  <div class="section-dropdown">
    <router-link
      :to="section.path"
      class="nav-item"
      :class="{ active: isActive }"
      @click="handleSectionClick"
    >
      <span class="nav-text">{{ section.title }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSectionById } from '../api/sections.js';
import { getQuestions } from '../api/questions.js';

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const route = useRoute();

const showDropdown = ref(false);
const questions = ref([]);
const isLoading = ref(false);
const questionsCache = ref(new Map());
let closeTimeout = null;

const isActive = computed(() => {
  return route.path === props.section.path || route.path.startsWith(props.section.path + '#');
});

const handleSectionClick = () => {
  // Отменяем таймер при клике
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  showDropdown.value = false;
};

// Очищаем таймер при размонтировании
onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }
});

const loadQuestions = async () => {
  // Проверяем кеш
  if (questionsCache.value.has(props.section.id)) {
    questions.value = questionsCache.value.get(props.section.id);
    return;
  }

  isLoading.value = true;
  try {
    // Получаем раздел по ID для получения UUID
    const section = await getSectionById(props.section.id);

    if (!section) {
      questions.value = [];
      return;
    }

    // Загружаем вопросы через API
    const questionsData = await getQuestions(section.id);
    const extractedQuestions = questionsData.map(q => ({
      id: `question-${q.number}`,
      text: q.question,
    }));

    questions.value = extractedQuestions;
    questionsCache.value.set(props.section.id, extractedQuestions);
  } catch (err) {
    console.error(`Ошибка загрузки вопросов для ${props.section.title}:`, err);
    questions.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Предзагрузка вопросов для активного раздела
watch(
  () => route.path,
  newPath => {
    if (newPath === props.section.path) {
      loadQuestions();
    }
  },
  { immediate: true }
);
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
