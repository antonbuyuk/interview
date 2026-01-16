<template>
  <div class="app">
    <Header />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Глобальное модальное окно управления разделами -->
    <div v-if="showSectionsModal && isAdmin" class="modal-overlay" @click="closeSectionsModal">
      <div class="modal-content sections-modal" @click.stop>
        <div class="modal-header">
          <h2>Управление разделами</h2>
          <button class="close-btn" @click="closeSectionsModal">
            <XMarkIcon class="icon-small" />
          </button>
        </div>

        <div class="modal-body">
          <button v-if="isAdmin" class="add-section-btn" @click="openAddSectionModal">
            <PlusIcon class="icon-inline" />
            Добавить раздел
          </button>

          <div v-if="sectionsLoading" class="loading-state">
            <p>Загрузка разделов...</p>
          </div>

          <div v-else-if="sections.length === 0" class="empty-state">
            <p>Разделы не найдены</p>
          </div>

          <div v-else class="sections-list">
            <div v-for="section in sections" :key="section.id" class="section-item">
              <div class="section-info">
                <h4>{{ section.title }}</h4>
                <p class="section-meta">
                  ID: {{ section.sectionId }} | Путь: {{ section.path }} | Вопросов:
                  {{ section._count?.questions ?? 0 }}
                </p>
              </div>
              <div v-if="isAdmin" class="section-actions">
                <button
                  class="action-btn edit-btn"
                  title="Редактировать"
                  @click="editSection(section)"
                >
                  <PencilIcon class="icon-small" />
                </button>
                <button
                  class="action-btn delete-btn"
                  title="Удалить"
                  :disabled="(section._count?.questions ?? 0) > 0"
                  @click="deleteSection(section)"
                >
                  <TrashIcon class="icon-small" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для добавления/редактирования раздела -->
    <AddSectionModal
      :is-open="showAddSectionModal"
      :section="editingSection || undefined"
      @close="closeAddSectionModal"
      @saved="handleSectionSaved"
    />

    <!-- Модальное окно для добавления/редактирования термина -->
    <AddTermModal
      :is-open="showAddTermModal"
      :term="editingTerm || undefined"
      :initial-term="initialTerm"
      @close="closeAddTermModal"
      @saved="handleTermSaved"
    />

    <!-- Модальное окно для добавления/редактирования вопросов -->
    <AddQuestionModal
      :is-open="showQuestionModal"
      :question="editingQuestion || undefined"
      :default-section-id="currentSectionId || undefined"
      :is-admin="isAdmin"
      @close="closeQuestionModal"
      @saved="handleQuestionSaved"
      @deleted="handleQuestionDeleted"
    />

    <!-- Контекстное меню для выделенного текста -->
    <TextSelectionMenu
      :is-admin="isAdmin"
      @add-to-dictionary="handleAddToDictionaryFromSelection"
    />

    <!-- Tooltip для терминов из словаря -->
    <TermTooltip
      :term="hoveredTerm || undefined"
      :position="tooltipPosition"
      @close="handleTermTooltipClose"
    />

    <SecondaryMenu />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Header from './components/Header.vue';
import AddSectionModal from './components/AddSectionModal.vue';
import AddTermModal from './components/AddTermModal.vue';
import AddQuestionModal from './components/AddQuestionModal.vue';
import TextSelectionMenu from './components/TextSelectionMenu.vue';
import TermTooltip from './components/TermTooltip.vue';
import { deleteSection as deleteSectionApi } from './api/sections';
import { useSectionsStore } from './stores/sections';
import { useAdminAuth } from './composables/useAdminAuth';
import { useDictionaryHighlight } from './composables/useDictionaryHighlight';
import SecondaryMenu from './components/SecondaryMenu.vue';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { Section, Question, Term } from './types/api';
import type { EditQuestionEvent, CurrentSectionUpdatedEvent, TermHoverEvent } from './types/events';

const sectionsStore = useSectionsStore();
const { sections, loading: sectionsLoading, refreshSections } = sectionsStore;
const showSectionsModal = ref(false);
const showAddSectionModal = ref(false);
const editingSection = ref<Section | null>(null);
const showAddTermModal = ref(false);
const editingTerm = ref<Term | null>(null);
const initialTerm = ref('');
const hoveredTerm = ref<Term | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showQuestionModal = ref(false);
const editingQuestion = ref<Question | null>(null);
const currentSectionId = ref<string | null>(null);
const { isAdmin } = useAdminAuth();
const { loadDictionary, findTermById } = useDictionaryHighlight();

const handleOpenManageSections = () => {
  if (isAdmin.value) {
    showSectionsModal.value = true;
  }
};

const closeSectionsModal = () => {
  showSectionsModal.value = false;
};

const openAddSectionModal = () => {
  editingSection.value = null;
  showAddSectionModal.value = true;
  showSectionsModal.value = false;
};

const closeAddSectionModal = () => {
  showAddSectionModal.value = false;
  editingSection.value = null;
};

const editSection = (section: Section) => {
  editingSection.value = section;
  showAddSectionModal.value = true;
  showSectionsModal.value = false;
};

const deleteSection = async (section: Section) => {
  if ((section._count?.questions ?? 0) > 0) {
    alert(
      'Невозможно удалить раздел с существующими вопросами. Сначала удалите или переместите вопросы.'
    );
    return;
  }

  if (!confirm(`Вы уверены, что хотите удалить раздел "${section.title}"?`)) {
    return;
  }

  try {
    await deleteSectionApi(section.id);
    // Обновляем список разделов
    await refreshSections();
    // Эмитим событие обновления разделов для Sidebar
    window.dispatchEvent(new CustomEvent('sections-updated'));
  } catch (error) {
    console.error('Ошибка удаления раздела:', error);
    const errorMessage =
      (error instanceof Error && error.message) ||
      (typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof error.error === 'string'
        ? error.error
        : 'Неизвестная ошибка');
    alert(`Ошибка удаления: ${errorMessage}`);
  }
};

const handleSectionSaved = async () => {
  await refreshSections();
  showAddSectionModal.value = false;
  editingSection.value = null;
  // Эмитим событие обновления разделов для Sidebar
  window.dispatchEvent(new CustomEvent('sections-updated'));
};

const handleOpenAddTerm = () => {
  if (isAdmin.value) {
    editingTerm.value = null;
    initialTerm.value = '';
    showAddTermModal.value = true;
  }
};

const handleAddToDictionaryFromSelection = (selectedText: string) => {
  if (isAdmin.value && selectedText) {
    editingTerm.value = null;
    initialTerm.value = selectedText.trim();
    showAddTermModal.value = true;
  }
};

const closeAddTermModal = () => {
  showAddTermModal.value = false;
  editingTerm.value = null;
  initialTerm.value = '';
};

const handleTermSaved = () => {
  showAddTermModal.value = false;
  editingTerm.value = null;
  initialTerm.value = '';
  // Эмитим событие обновления словаря для VocabularyView
  window.dispatchEvent(new CustomEvent('terms-updated'));
};

const handleTermHover = (event: TermHoverEvent) => {
  if (!event.detail?.term) {
    hoveredTerm.value = null;
    return;
  }

  // Используем уже загруженные данные из словаря
  const term = findTermById(event.detail.term.id);
  if (term) {
    hoveredTerm.value = term;
    tooltipPosition.value = event.detail.position || { x: 0, y: 0 };
  } else {
    hoveredTerm.value = null;
  }
};

const handleTermTooltipClose = () => {
  hoveredTerm.value = null;
};

const handleOpenAddQuestion = () => {
  if (isAdmin.value) {
    editingQuestion.value = null;
    showQuestionModal.value = true;
  }
};

const handleEditQuestion = (event: EditQuestionEvent) => {
  if (isAdmin.value && event.detail?.question) {
    editingQuestion.value = event.detail.question;
    showQuestionModal.value = true;
  }
};

const closeQuestionModal = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
};

const handleQuestionSaved = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
  // Эмитим событие для обновления контента в SectionView
  window.dispatchEvent(new CustomEvent('questions-need-reload'));
};

const handleQuestionDeleted = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
  // Эмитим событие для обновления контента в SectionView
  window.dispatchEvent(new CustomEvent('questions-need-reload'));
};

const handleCurrentSectionUpdated = (event: CurrentSectionUpdatedEvent) => {
  // Получаем UUID раздела из события (приоритет sectionId, затем section.id)
  if (event.detail?.sectionId) {
    currentSectionId.value = event.detail.sectionId;
  } else if (event.detail?.section?.id) {
    currentSectionId.value = event.detail.section.id;
  }
};

onMounted(async () => {
  // Загружаем секции один раз при старте приложения
  try {
    await sectionsStore.loadSections();
  } catch (error) {
    console.error('Ошибка загрузки секций:', error);
  }

  // Загружаем словарь один раз при старте приложения
  loadDictionary();

  // Слушаем событие открытия управления разделами из Sidebar
  window.addEventListener('open-manage-sections', handleOpenManageSections);
  // Слушаем событие открытия добавления термина из SecondaryMenu
  window.addEventListener('open-add-term', handleOpenAddTerm);
  // Слушаем событие открытия добавления вопроса из SecondaryMenu
  window.addEventListener('open-add-question', handleOpenAddQuestion);
  // Слушаем событие редактирования вопроса
  window.addEventListener('edit-question', handleEditQuestion);
  // Слушаем событие обновления текущего раздела
  window.addEventListener('current-section-updated', handleCurrentSectionUpdated);
  // Слушаем событие hover на термине
  window.addEventListener('term-hover', handleTermHover);
  // Слушаем обновление словаря для перезагрузки
  window.addEventListener('terms-updated', () => {
    const { refreshDictionary } = useDictionaryHighlight();
    refreshDictionary();
  });
  // Слушаем обновление секций для перезагрузки
  window.addEventListener('sections-updated', async () => {
    try {
      await sectionsStore.refreshSections();
    } catch (error) {
      console.error('Ошибка обновления секций:', error);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('open-manage-sections', handleOpenManageSections);
  window.removeEventListener('open-add-term', handleOpenAddTerm);
  window.removeEventListener('open-add-question', handleOpenAddQuestion);
  window.removeEventListener('edit-question', handleEditQuestion);
  window.removeEventListener('current-section-updated', handleCurrentSectionUpdated);
  window.removeEventListener('term-hover', handleTermHover);
});
</script>

<style lang="scss" scoped>
@use '../src/styles/_mixins' as *;
@use '../src/styles/_variables' as *;

.action-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  cursor: pointer;
  font-size: 1rem;
  @include transition(all, 0.2s, ease);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }

  &:hover:not(:disabled) {
    border-color: $primary-color;
    background: $bg-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.delete-btn:hover:not(:disabled) {
    border-color: $error-color;
    background: $error-bg;
  }
}
</style>
