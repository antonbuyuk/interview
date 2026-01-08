<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" :class="{ 'is-small': isSmall }" @click.stop>
      <div class="modal-header">
        <h2>Авторизация администратора</h2>
        <button class="close-btn" @click="close">
          <XMarkIcon class="icon-small" />
        </button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Пароль:</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Введите пароль администратора"
            autofocus
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" :disabled="isLoading" @click="close">
            Отмена
          </button>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'Авторизация...' : 'Авторизоваться' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { ref, watch } from 'vue';
import { useAdminAuth } from '../composables/useAdminAuth';

const props = defineProps({
  isOpen: Boolean,
  isSmall: Boolean,
});

const emit = defineEmits(['close', 'success']);

const { login, isLoading: authLoading, error: authError } = useAdminAuth();
const password = ref('');
const error = ref(null);
const isLoading = ref(false);

const close = () => {
  password.value = '';
  error.value = null;
  emit('close');
};

const handleSubmit = async () => {
  if (!password.value.trim()) {
    error.value = 'Пароль не может быть пустым';
    return;
  }

  isLoading.value = true;
  error.value = null;

  const result = await login(password.value);

  if (result.success) {
    password.value = '';
    emit('success');
    close();
  } else {
    error.value = result.error || 'Неверный пароль';
  }

  isLoading.value = false;
};

// Сбрасываем ошибку при открытии модального окна
watch(
  () => props.isOpen,
  newVal => {
    if (newVal) {
      password.value = '';
      error.value = null;
    }
  }
);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/modals' as *;

.error-message {
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  color: #e74c3c;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.modal-form {
  input[type='password'] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 0.9375rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: $primary-color;
    }

    &:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }
  }
}
</style>
