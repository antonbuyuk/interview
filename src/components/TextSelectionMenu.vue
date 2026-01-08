<template>
  <div
    v-if="shouldShowMenu"
    class="text-selection-menu"
    :style="{
      left: `${menuPosition.x}px`,
      top: `${menuPosition.y}px`,
    }"
    @click.stop
  >
    <!-- Карточка термина, если найден -->
    <div v-if="!checkingTerm && foundTerm" class="term-card">
      <div class="term-card-header">
        <h3 class="term-title">{{ foundTerm.term }}</h3>
      </div>
      <div class="term-card-body">
        <div class="translation-section">
          <span class="translation-label">Перевод:</span>
          <span class="translation-text">{{ foundTerm.translation || '—' }}</span>
        </div>
        <div v-if="foundTerm.examples && foundTerm.examples.length > 0" class="examples-preview">
          <span class="examples-label">Пример:</span>
          <span class="example-text">{{
            foundTerm.examples[0].example || foundTerm.examples[0]
          }}</span>
        </div>
      </div>
      <div class="term-card-footer">
        <button class="view-dictionary-btn" @click="goToDictionary">
          <BookOpenIcon class="menu-icon" />
          <span>Посмотреть в словаре</span>
        </button>
      </div>
    </div>

    <!-- Кнопка добавления, если термин не найден -->
    <button v-else class="menu-button" @click="handleAddToDictionary">
      <BookOpenIcon class="menu-icon" />
      <span class="menu-text">Добавить в словарь</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTextSelection } from '../composables/useTextSelection';
import { getTermByExactName } from '../api/terms';
import { BookOpenIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-to-dictionary']);

const router = useRouter();
const { selectedText, showMenu, menuPosition, clearSelection } = useTextSelection();

const foundTerm = ref(null);
const checkingTerm = ref(false);
const checkDebounceTimer = ref(null);

// Проверка существования термина с debounce
const checkTermExists = async termText => {
  if (!termText || termText.trim().length < 2) {
    foundTerm.value = null;
    return;
  }

  // Очищаем предыдущий таймер
  if (checkDebounceTimer.value) {
    clearTimeout(checkDebounceTimer.value);
  }

  // Устанавливаем новый таймер с debounce 400ms
  checkDebounceTimer.value = setTimeout(async () => {
    const termToCheck = termText.trim();
    if (termToCheck.length < 2) {
      foundTerm.value = null;
      checkingTerm.value = false;
      return;
    }

    checkingTerm.value = true;
    try {
      const term = await getTermByExactName(termToCheck);
      foundTerm.value = term;
    } catch (error) {
      console.error('Ошибка проверки термина:', error);
      // При ошибке считаем что термин не найден
      foundTerm.value = null;
    } finally {
      checkingTerm.value = false;
    }
  }, 400);
};

// Watcher на selectedText для проверки термина
watch(
  () => selectedText.value,
  newText => {
    if (newText) {
      checkTermExists(newText);
    } else {
      // Очищаем состояние при очистке выделения
      foundTerm.value = null;
      checkingTerm.value = false;
      if (checkDebounceTimer.value) {
        clearTimeout(checkDebounceTimer.value);
        checkDebounceTimer.value = null;
      }
    }
  }
);

// Очистка таймера при размонтировании
onUnmounted(() => {
  if (checkDebounceTimer.value) {
    clearTimeout(checkDebounceTimer.value);
  }
});

const handleAddToDictionary = () => {
  if (selectedText.value) {
    emit('add-to-dictionary', selectedText.value);
    clearSelection();
  }
};

const goToDictionary = () => {
  clearSelection();
  router.push('/vocabulary');
};

// Показываем меню только для админов
const shouldShowMenu = computed(() => props.isAdmin && showMenu.value && selectedText.value);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.text-selection-menu {
  position: fixed;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: auto;
  margin-top: 8px;
  min-width: 280px;
  max-width: 400px;
}

.menu-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  @include shadow-lg;
  font-size: 0.875rem;
  color: $text-gray;

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  @include shadow-lg;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  color: $text-dark;
  @include transition(all, 0.2s, ease);
  white-space: nowrap;

  &:hover {
    background: $primary-color;
    color: white;
    border-color: $primary-color;
    transform: translateY(-2px);
    @include shadow-hover;
  }

  &:active {
    transform: translateY(0);
  }
}

.term-card {
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  @include shadow-lg;
  overflow: hidden;
}

.term-card-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;
}

.term-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
}

.term-card-body {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.translation-section {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.translation-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-lighter-gray;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.translation-text {
  font-size: 0.9375rem;
  color: $text-dark;
  font-weight: 500;
}

.examples-preview {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid $border-color;
}

.examples-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-lighter-gray;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.example-text {
  font-size: 0.875rem;
  color: $text-light-gray;
  font-style: italic;
  line-height: 1.4;
}

.term-card-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid $border-color;
  background: $bg-light;
}

.view-dictionary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: $primary-color;
  color: white;
  border: none;
  @include rounded-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover {
    background: $primary-hover;
    transform: translateY(-1px);
    @include shadow-hover;
  }

  &:active {
    transform: translateY(0);
  }
}

.menu-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: inherit;
  flex-shrink: 0;
}

.menu-text {
  line-height: 1;
}
</style>
