<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingSection ? 'Редактировать раздел' : 'Добавить раздел' }}</h2>
        <button class="close-btn" @click="close">
          <XMarkIcon class="icon-small" />
        </button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>ID раздела (уникальный идентификатор):</label>
          <input
            v-model="formData.sectionId"
            type="text"
            required
            placeholder="например: javascript-typescript"
            :disabled="editingSection"
          />
          <small v-if="editingSection" class="form-hint">
            ID раздела нельзя изменить после создания
          </small>
        </div>

        <div class="form-group">
          <label>Название раздела:</label>
          <input
            v-model="formData.title"
            type="text"
            required
            placeholder="например: JavaScript / TypeScript"
          />
        </div>

        <div class="form-group">
          <label>Путь (path):</label>
          <input
            v-model="formData.path"
            type="text"
            required
            placeholder="например: /javascript-typescript"
          />
          <small class="form-hint"> Путь должен начинаться с "/" </small>
        </div>

        <div class="form-group">
          <label>Директория (dir):</label>
          <input
            v-model="formData.dir"
            type="text"
            required
            placeholder="например: javascript-typescript"
          />
          <small class="form-hint"> Название директории для файлов раздела </small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="close">Отмена</button>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Сохранение...' : editingSection ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { ref, watch, computed } from 'vue';
import { createSection, updateSection } from '../api/sections';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  section: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const formData = ref({
  sectionId: '',
  title: '',
  path: '',
  dir: '',
});

const editingSection = computed(() => !!props.section);

watch(
  () => props.isOpen,
  newVal => {
    if (newVal && props.section) {
      // Заполняем форму данными раздела
      formData.value = {
        sectionId: props.section.sectionId,
        title: props.section.title,
        path: props.section.path,
        dir: props.section.dir,
      };
    } else if (newVal) {
      // Сброс формы для нового раздела
      formData.value = {
        sectionId: '',
        title: '',
        path: '',
        dir: '',
      };
    }
  }
);

const close = () => {
  emit('close');
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Нормализуем путь (добавляем / в начале, если его нет)
    const normalizedPath = formData.value.path.startsWith('/')
      ? formData.value.path
      : `/${formData.value.path}`;

    const sectionData = {
      sectionId: formData.value.sectionId,
      title: formData.value.title,
      path: normalizedPath,
      dir: formData.value.dir,
    };

    if (editingSection.value) {
      await updateSection(props.section.id, sectionData);
    } else {
      await createSection(sectionData);
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Ошибка сохранения раздела:', error);
    alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use '../styles/modals' as *;
@use '../styles/variables' as *;
.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: $text-light-gray;
  font-style: italic;
}
</style>
