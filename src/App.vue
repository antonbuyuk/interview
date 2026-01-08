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
                  {{ section._count?.questions || 0 }}
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
                  :disabled="section._count?.questions > 0"
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
      :section="editingSection"
      @close="closeAddSectionModal"
      @saved="handleSectionSaved"
    />

    <!-- Модальное окно для добавления/редактирования термина -->
    <AddTermModal
      :is-open="showAddTermModal"
      :term="editingTerm"
      :initial-term="initialTerm"
      @close="closeAddTermModal"
      @saved="handleTermSaved"
    />

    <!-- Контекстное меню для выделенного текста -->
    <TextSelectionMenu
      :is-admin="isAdmin"
      @add-to-dictionary="handleAddToDictionaryFromSelection"
    />

    <!-- Tooltip для терминов из словаря -->
    <TermTooltip :term="hoveredTerm" :position="tooltipPosition" @close="handleTermTooltipClose" />

    <SecondaryMenu />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Header from './components/Header.vue';
import AddSectionModal from './components/AddSectionModal.vue';
import AddTermModal from './components/AddTermModal.vue';
import TextSelectionMenu from './components/TextSelectionMenu.vue';
import TermTooltip from './components/TermTooltip.vue';
import { getSections, deleteSection as deleteSectionApi } from './api/sections';
import { useAdminAuth } from './composables/useAdminAuth';
import { useDictionaryHighlight } from './composables/useDictionaryHighlight';
import SecondaryMenu from './components/SecondaryMenu.vue';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const sections = ref([]);
const sectionsLoading = ref(false);
const showSectionsModal = ref(false);
const showAddSectionModal = ref(false);
const editingSection = ref(null);
const showAddTermModal = ref(false);
const editingTerm = ref(null);
const initialTerm = ref('');
const hoveredTerm = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const { isAdmin } = useAdminAuth();
const { loadDictionary, findTermById } = useDictionaryHighlight();

const loadSections = async () => {
  sectionsLoading.value = true;
  try {
    sections.value = await getSections();
  } catch (error) {
    console.error('Ошибка загрузки разделов:', error);
    alert('Ошибка загрузки разделов: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    sectionsLoading.value = false;
  }
};

const handleOpenManageSections = () => {
  if (isAdmin.value) {
    showSectionsModal.value = true;
    loadSections();
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

const editSection = section => {
  editingSection.value = section;
  showAddSectionModal.value = true;
  showSectionsModal.value = false;
};

const deleteSection = async section => {
  if (section._count?.questions > 0) {
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
    await loadSections();
    // Эмитим событие обновления разделов для Sidebar
    window.dispatchEvent(new CustomEvent('sections-updated'));
  } catch (error) {
    console.error('Ошибка удаления раздела:', error);
    const errorMessage = error.message || error.error || 'Неизвестная ошибка';
    alert(`Ошибка удаления: ${errorMessage}`);
  }
};

const handleSectionSaved = async () => {
  await loadSections();
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

const handleAddToDictionaryFromSelection = selectedText => {
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

const handleTermHover = event => {
  if (!event || !event.term) {
    hoveredTerm.value = null;
    return;
  }

  // Используем уже загруженные данные из словаря
  const term = findTermById(event.term.id);
  if (term) {
    hoveredTerm.value = term;
    tooltipPosition.value = event.position || { x: 0, y: 0 };
  } else {
    hoveredTerm.value = null;
  }
};

const handleTermTooltipClose = () => {
  hoveredTerm.value = null;
};

onMounted(() => {
  // Загружаем словарь один раз при старте приложения
  loadDictionary();

  // Слушаем событие открытия управления разделами из Sidebar
  window.addEventListener('open-manage-sections', handleOpenManageSections);
  // Слушаем событие открытия добавления термина из SecondaryMenu
  window.addEventListener('open-add-term', handleOpenAddTerm);
  // Слушаем событие hover на термине
  window.addEventListener('term-hover', e => handleTermHover(e.detail));
  // Слушаем обновление словаря для перезагрузки
  window.addEventListener('terms-updated', () => {
    const { refreshDictionary } = useDictionaryHighlight();
    refreshDictionary();
  });
});

onUnmounted(() => {
  window.removeEventListener('open-manage-sections', handleOpenManageSections);
  window.removeEventListener('open-add-term', handleOpenAddTerm);
  window.removeEventListener('term-hover', e => handleTermHover(e.detail));
});
</script>

<style lang="scss" scoped>
.action-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
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
    border-color: #42b883;
    background: #f0f7ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.delete-btn:hover:not(:disabled) {
    border-color: #e74c3c;
    background: #fee;
  }
}
</style>
