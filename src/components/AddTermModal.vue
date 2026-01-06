<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingTerm ? 'Редактировать термин' : 'Добавить термин' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Термин:</label>
          <input
            v-model="formData.term"
            type="text"
            required
            placeholder="Введите термин на английском"
          />
        </div>

        <div class="form-group">
          <label>Перевод:</label>
          <input
            v-model="formData.translation"
            type="text"
            required
            placeholder="Введите перевод"
          />
        </div>

        <div class="form-group">
          <label>Категория:</label>
          <select v-model="formData.category" required>
            <option value="">Выберите категорию</option>
            <option v-for="section in sections" :key="section.id" :value="section.id">
              {{ section.title }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Примеры использования (по одному на строку):</label>
          <textarea
            v-model="examplesText"
            rows="4"
            placeholder="Введите примеры, каждый с новой строки"
          />
        </div>

        <div class="form-group">
          <label>Словосочетания (через запятую):</label>
          <input
            v-model="phrasesText"
            type="text"
            placeholder="Введите словосочетания через запятую"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="close">Отмена</button>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Сохранение...' : editingTerm ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { createTerm, updateTerm } from '../api/terms';
import { sections } from '../data/sections.js';

const props = defineProps({
  isOpen: Boolean,
  term: Object,
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const formData = ref({
  term: '',
  translation: '',
  category: '',
  categoryTitle: '',
});

const examplesText = ref('');
const phrasesText = ref('');

const editingTerm = computed(() => !!props.term);

watch(
  () => props.isOpen,
  newVal => {
    if (newVal && props.term) {
      // Заполняем форму данными термина
      formData.value = {
        term: props.term.term,
        translation: props.term.translation,
        category: props.term.category,
        categoryTitle: props.term.categoryTitle,
      };
      examplesText.value = (props.term.examples || []).map(e => e.example || e).join('\n');
      phrasesText.value = (props.term.phrases || []).map(p => p.phrase || p).join(', ');
    } else if (newVal) {
      // Сброс формы для нового термина
      formData.value = {
        term: '',
        translation: '',
        category: '',
        categoryTitle: '',
      };
      examplesText.value = '';
      phrasesText.value = '';
    }
  }
);

const close = () => {
  emit('close');
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const selectedSection = sections.find(s => s.id === formData.value.category);

    const termData = {
      term: formData.value.term,
      translation: formData.value.translation,
      category: formData.value.category,
      categoryTitle: selectedSection ? selectedSection.title : formData.value.category,
      examples: examplesText.value
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0),
      phrases: phrasesText.value
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0),
    };

    if (editingTerm.value) {
      await updateTerm(props.term.id, termData);
    } else {
      await createTerm(termData);
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Ошибка сохранения термина:', error);
    alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use '../styles/modals' as *;
</style>
