<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingTerm ? 'Редактировать термин' : 'Добавить термин' }}</h2>
        <button class="close-btn" @click="close">
          <XMarkIcon class="icon-small" />
        </button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Термин:</label>
          <div class="input-with-loader">
            <input
              v-model="formData.term"
              type="text"
              required
              placeholder="Введите термин на английском"
            />
            <span v-if="suggestionsLoading" class="ai-loader">🤖 Генерация предложений...</span>
          </div>
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

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { ref, watch, computed } from 'vue';
import { createTerm, updateTerm, getTermSuggestions } from '../../api/terms';

const props = defineProps({
  isOpen: Boolean,
  term: {
    type: Object,
    default: null,
  },
  initialTerm: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const suggestionsLoading = ref(false);
const formData = ref({
  term: '',
  translation: '',
});

const examplesText = ref('');
const phrasesText = ref('');
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const hasUserEdited = ref({
  translation: false,
  phrases: false,
  examples: false,
});

const editingTerm = computed(() => !!props.term);

watch(
  () => props.isOpen,
  newVal => {
    if (newVal && props.term) {
      // Заполняем форму данными термина
      formData.value = {
        term: props.term.term,
        translation: props.term.translation,
      };
      examplesText.value = (props.term.examples || [])
        .map((e: { example?: string } | string) =>
          typeof e === 'object' && e !== null && 'example' in e ? e.example : e
        )
        .join('\n');
      phrasesText.value = (props.term.phrases || [])
        .map((p: { phrase?: string } | string) =>
          typeof p === 'object' && p !== null && 'phrase' in p ? p.phrase : p
        )
        .join(', ');
      // Сбрасываем флаги редактирования при редактировании существующего термина
      hasUserEdited.value = {
        translation: true,
        phrases: true,
        examples: true,
      };
    } else if (newVal) {
      // Сброс формы для нового термина или предзаполнение из initialTerm
      formData.value = {
        term: props.initialTerm || '',
        translation: '',
      };
      examplesText.value = '';
      phrasesText.value = '';
      hasUserEdited.value = {
        translation: false,
        phrases: false,
        examples: false,
      };
    }
  }
);

// Debounced watcher для получения AI-предложений
watch(
  () => formData.value.term,
  newTerm => {
    // Очищаем предыдущий таймер
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }

    // Не запрашиваем предложения если:
    // - Редактируем существующий термин
    // - Термин слишком короткий (меньше 2 символов)
    // - Модальное окно закрыто
    if (editingTerm.value || !props.isOpen || !newTerm || newTerm.trim().length < 2) {
      return;
    }

    // Устанавливаем новый таймер с debounce 800ms
    debounceTimer.value = setTimeout(async () => {
      const termToSearch = newTerm.trim();
      if (termToSearch.length < 2) {
        return;
      }

      suggestionsLoading.value = true;
      try {
        const suggestions = await getTermSuggestions(termToSearch);

        // Автозаполняем только те поля, которые пользователь не редактировал
        if (!hasUserEdited.value.translation && suggestions.translation) {
          formData.value.translation = suggestions.translation;
        }

        if (!hasUserEdited.value.phrases && suggestions.phrases && suggestions.phrases.length > 0) {
          phrasesText.value = suggestions.phrases.join(', ');
        }

        if (
          !hasUserEdited.value.examples &&
          suggestions.examples &&
          suggestions.examples.length > 0
        ) {
          examplesText.value = suggestions.examples.join('\n');
        }
      } catch (error) {
        // Обработка ошибок AI
        let errorMessage = 'Неизвестная ошибка';
        let errorType = '';

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'response' in error) {
          const responseError = error as {
            response?: { data?: { message?: string; error?: string } };
          };
          errorMessage = responseError.response?.data?.message || errorMessage;
          errorType = responseError.response?.data?.error || '';
        }

        // Игнорируем ошибку о слишком коротком термине - это нормальное поведение
        if (
          errorMessage.includes('at least 2 characters') ||
          errorMessage.includes('Term must be')
        ) {
          return;
        }

        // Показываем предупреждение только для критических ошибок (квота, авторизация)
        if (errorType.includes('quota') || errorType.includes('authentication')) {
          console.warn('AI недоступен:', errorMessage);
          // Можно показать уведомление пользователю, но не блокируем работу формы
        } else {
          // Для остальных ошибок просто логируем
          console.warn('Не удалось получить AI-предложения:', errorMessage);
        }
      } finally {
        suggestionsLoading.value = false;
      }
    }, 800);
  }
);

// Отслеживаем ручное редактирование полей
watch(
  () => formData.value.translation,
  () => {
    if (formData.value.translation) {
      hasUserEdited.value.translation = true;
    }
  }
);

watch(
  () => phrasesText.value,
  () => {
    if (phrasesText.value) {
      hasUserEdited.value.phrases = true;
    }
  }
);

watch(
  () => examplesText.value,
  () => {
    if (examplesText.value) {
      hasUserEdited.value.examples = true;
    }
  }
);

const close = () => {
  // Очищаем таймер при закрытии
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
    debounceTimer.value = null;
  }
  emit('close');
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const termData = {
      term: formData.value.term.toLowerCase(),
      translation: formData.value.translation,
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
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    alert('Ошибка сохранения: ' + errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use '../../styles/modals' as *;
@use '../../styles/variables' as *;

.input-with-loader {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ai-loader {
  font-size: 0.875rem;
  color: $primary-color;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border: 2px solid $primary-color;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
