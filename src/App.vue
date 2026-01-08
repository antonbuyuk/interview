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
    <TextSelectionMenu :is-admin="isAdmin" @add-to-dictionary="handleAddToDictionaryFromSelection" />

    <SecondaryMenu />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import Header from './components/Header.vue';
import AddSectionModal from './components/AddSectionModal.vue';
import AddTermModal from './components/AddTermModal.vue';
import TextSelectionMenu from './components/TextSelectionMenu.vue';
import { getSections, deleteSection as deleteSectionApi } from './api/sections';
import { useAdminAuth } from './composables/useAdminAuth';
import SecondaryMenu from './components/SecondaryMenu.vue';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();

const sections = ref([]);
const sectionsLoading = ref(false);
const showSectionsModal = ref(false);
const showAddSectionModal = ref(false);
const editingSection = ref(null);
const showAddTermModal = ref(false);
const editingTerm = ref(null);
const initialTerm = ref('');
const { isAdmin } = useAdminAuth();

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

const handleAddToDictionaryFromSelection = (selectedText) => {
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

onMounted(() => {
  // Слушаем событие открытия управления разделами из Sidebar
  window.addEventListener('open-manage-sections', handleOpenManageSections);
  // Слушаем событие открытия добавления термина из SecondaryMenu
  window.addEventListener('open-add-term', handleOpenAddTerm);
});

onUnmounted(() => {
  window.removeEventListener('open-manage-sections', handleOpenManageSections);
  window.removeEventListener('open-add-term', handleOpenAddTerm);
});
</script>

<style lang="scss">
@use './styles/variables' as *;
@use './styles/mixins' as *;
@use './styles/modals' as *;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: $text-gray;
  background: $bg-light;
}

.app {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 100%;
  position: relative;
  margin-top: 64px;

  @include mobile {
    margin-top: 56px;
    padding: 1rem;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Стили для модального окна управления разделами
.sections-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-body {
  padding: 1.5rem;
}

.add-section-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  .icon-inline {
    width: 1.125rem;
    height: 1.125rem;
    color: inherit;
  }

  &:hover {
    background: #35a372;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(66, 184, 131, 0.3);
  }
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #42b883;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.section-info {
  flex: 1;

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e1e1e;
  }

  .section-meta {
    margin: 0;
    font-size: 0.8125rem;
    color: #666;
  }
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

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

.loading-state,
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}

@media (max-width: 768px) {
  .section-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-actions {
    margin-left: 0;
    margin-top: 1rem;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
