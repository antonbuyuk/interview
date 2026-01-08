<template>
  <div class="vocabulary-view">
    <div class="vocabulary-header">
      <div class="header-content">
        <div>
          <h1>
            <BookOpenIcon class="title-icon" />
            Словарь технических терминов
          </h1>
          <p class="subtitle">Английские термины с переводом и примерами использования</p>
        </div>
        <button v-if="isAdmin" class="add-btn" @click="openAddModal">+ Добавить термин</button>
      </div>
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
        <MagnifyingGlassIcon class="search-icon" />
      </div>

      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Сортировка:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="term">По термину (A-Z)</option>
            <option value="translation">По переводу (A-Z)</option>
          </select>
        </div>
      </div>

      <div class="results-info">
        Найдено терминов: <strong>{{ filteredTerms.length }}</strong>
      </div>
    </div>

    <!-- Карточки терминов -->
    <div v-if="loading" class="vocabulary-grid">
      <Skeleton v-for="n in 8" :key="`skeleton-${n}`" variant="vocabulary-card" />
    </div>

    <div v-else-if="filteredTerms.length === 0" class="empty-state">
      <p>Термины не найдены. Попробуйте изменить параметры поиска.</p>
    </div>

    <div v-else class="vocabulary-grid">
      <div v-for="term in filteredTerms" :key="term.id || term.term" class="vocabulary-card">
        <div class="card-header">
          <div class="term-header-row">
            <h3 class="term-title">{{ term.term }}</h3>
            <button
              class="play-btn"
              :class="{ disabled: !isSupported }"
              :title="isSupported ? 'Воспроизвести термин' : 'Браузер не поддерживает озвучку'"
              :disabled="!isSupported"
              @click.stop="speakTerm(term.term)"
            >
              <SpeakerWaveIcon class="icon-small" />
            </button>
          </div>
          <div v-if="isAdmin" class="card-actions-top">
            <button class="edit-btn" title="Редактировать" @click="editTerm(term)">
              <PencilIcon class="icon-small" />
            </button>
            <button class="delete-btn" title="Удалить" @click="deleteTerm(term)">
              <TrashIcon class="icon-small" />
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="translation-section">
            <span class="translation-label">Перевод:</span>
            <span class="translation-text">{{ term.translation || '—' }}</span>
          </div>

          <div v-if="term.phrases && term.phrases.length > 0" class="phrases-section">
            <span class="phrases-label">Примеры словосочетаний:</span>
            <div class="phrases-list">
              <span v-for="(phrase, idx) in term.phrases" :key="idx" class="phrase-tag">
                {{ phrase.phrase }}
              </span>
            </div>
          </div>

          <div v-if="term.examples && term.examples.length > 0" class="examples-section">
            <span class="examples-label">Примеры использования:</span>
            <ul class="examples-list">
              <li v-for="(example, idx) in term.examples" :key="idx" class="example-item">
                {{ example.example }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для добавления/редактирования термина -->
    <AddTermModal
      :is-open="showAddModal"
      :term="editingTerm || undefined"
      @close="closeAddModal"
      @saved="handleTermSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { getTerms, deleteTerm as deleteTermApi } from '../api/terms';
import AddTermModal from '../components/AddTermModal.vue';
import Skeleton from '../components/Skeleton.vue';
import { useAdminAuth } from '../composables/useAdminAuth';
import { useTextToSpeech } from '../composables/useTextToSpeech';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  SpeakerWaveIcon,
} from '@heroicons/vue/24/outline';

interface VocabularyItem {
  id: string;
  term: string;
  translation: string;
  examples: Array<{ example: string }>;
  phrases: Array<{ phrase: string }>;
}

const vocabulary = ref<VocabularyItem[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const sortBy = ref('term');
const showAddModal = ref(false);
const editingTerm = ref<VocabularyItem | null>(null);
const searchDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const { isAdmin } = useAdminAuth();
const { isSupported, speak } = useTextToSpeech();

// Загружаем словарь через API
const loadTerms = async () => {
  loading.value = true;
  try {
    const filters = {
      search: searchQuery.value.trim() || undefined,
      sortBy: sortBy.value,
    };
    const termsData = await getTerms(filters);
    // Преобразуем данные из API в формат, совместимый с компонентом
    vocabulary.value = termsData.map(term => ({
      id: term.id,
      term: term.term,
      translation: term.translation,
      examples: term.examples?.map(e => ({ example: e.example })) || [],
      phrases: term.phrases?.map(p => ({ phrase: p.phrase })) || [],
    }));
  } catch (error) {
    console.error('Ошибка загрузки словаря:', error);
    vocabulary.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTerms();
  // Слушаем событие обновления терминов из глобального модального окна
  window.addEventListener('terms-updated', loadTerms);
});

// Очищаем таймер при размонтировании компонента
onBeforeUnmount(() => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
  window.removeEventListener('terms-updated', loadTerms);
});

// Debounced watch для поиска (500ms)
watch(
  () => searchQuery.value,
  () => {
    // Очищаем предыдущий таймер
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value);
    }

    // Устанавливаем новый таймер с debounce 500ms
    searchDebounceTimer.value = setTimeout(() => {
      loadTerms();
    }, 500);
  }
);

// Перезагружаем при изменении сортировки (без debounce)
watch(
  () => sortBy.value,
  () => {
    loadTerms();
  }
);

// Фильтрация и сортировка (теперь выполняется на сервере, но оставляем для совместимости)
const filteredTerms = computed(() => {
  return vocabulary.value;
});

const openAddModal = () => {
  editingTerm.value = null;
  showAddModal.value = true;
};

const editTerm = (term: VocabularyItem) => {
  editingTerm.value = term;
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  editingTerm.value = null;
};

const handleTermSaved = () => {
  loadTerms();
};

const deleteTerm = async (term: VocabularyItem) => {
  if (!confirm(`Удалить термин "${term.term}"?`)) {
    return;
  }

  try {
    await deleteTermApi(term.id);
    loadTerms();
  } catch (error) {
    console.error('Ошибка удаления термина:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    alert('Ошибка удаления: ' + errorMessage);
  }
};

const speakTerm = (termText: string) => {
  speak(termText, { lang: 'en-GB' });
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.vocabulary-view {
  max-width: 60rem;
  margin-inline: auto;
  padding: 2rem;

  @include mobile {
    padding: 1rem;
  }
}

.vocabulary-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: $text-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    .title-icon {
      width: 2.5rem;
      height: 2.5rem;
      color: $primary-color;
      flex-shrink: 0;
    }

    @include mobile {
      font-size: 2rem;

      .title-icon {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}

.header-content {
  @include flex-between;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 1rem;

  > div {
    text-align: center;
    flex: 1;
    min-width: 200px;
  }
}

.add-btn {
  @include button-primary;
  white-space: nowrap;
}

.subtitle {
  font-size: 1.125rem;
  color: $text-lighter-gray;
}

.controls-panel {
  @include card;
  margin-bottom: 2rem;
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  border: 2px solid $border-color;
  border-radius: 6px;
  @include transition(border-color);

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: $text-lighter-gray;
  pointer-events: none;
}

.filters-container {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  @include mobile {
    flex-direction: column;
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @include mobile {
    width: 100%;
  }
}

.filter-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: $text-gray;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid $border-color;
  border-radius: 4px;
  background: $bg-white;
  cursor: pointer;
  @include transition(border-color);

  @include mobile {
    flex: 1;
  }

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.results-info {
  font-size: 0.9375rem;
  color: $text-lighter-gray;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;

  strong {
    color: $primary-color;
    font-weight: 600;
  }
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: $text-lighter-gray;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: $primary-color;
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.vocabulary-card {
  @include card;
}

.card-actions-top {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.edit-btn,
.delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid $border-color;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  @include transition;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }
}

.edit-btn:hover {
  background: #f0f7ff;
  border-color: $primary-color;
}

.delete-btn:hover {
  background: #fff5f5;
  border-color: #ff4444;
}

.card-header {
  @include flex-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;

  @include mobile {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.term-header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.term-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
  flex: 1;
}

.play-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid $border-color;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  @include transition;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary-color;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }

  &:hover:not(.disabled) {
    background: #f0f7ff;
    border-color: $primary-color;
    transform: scale(1.05);
  }

  &:active:not(.disabled) {
    transform: scale(0.95);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: $text-lighter-gray;

    &:hover {
      transform: none;
      background: rgba(255, 255, 255, 0.9);
      border-color: $border-color;
    }
  }
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
  color: $text-lighter-gray;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.translation-text {
  font-size: 1.125rem;
  color: $text-dark;
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
  color: $text-lighter-gray;
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
  background: $bg-light;
  border-radius: 4px;
  color: $text-gray;
  border: 1px solid $border-color;
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
  color: $text-light-gray;
  line-height: 1.6;
  padding-left: 1rem;
  position: relative;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: $primary-color;
    font-weight: bold;
  }
}
</style>
