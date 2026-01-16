<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <h2>Что-то пошло не так</h2>
      <p>{{ errorMessage }}</p>
      <div class="error-actions">
        <button class="retry-btn" @click="handleRetry">Попробовать снова</button>
        <button class="reload-btn" @click="handleReload">Перезагрузить страницу</button>
      </div>
      <details v-if="errorDetails" class="error-details">
        <summary>Детали ошибки</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue';

const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');

onErrorCaptured((err: unknown, _instance, info) => {
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
  errorDetails.value = `Error: ${err instanceof Error ? err.stack : String(err)}\nInfo: ${info}`;

  // Логируем ошибку для отладки
  console.error('ErrorBoundary caught error:', err, info);

  // Возвращаем false, чтобы предотвратить дальнейшее распространение ошибки
  return false;
});

const handleRetry = () => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  // Можно добавить логику для повторной попытки
};

const handleReload = () => {
  window.location.reload();
};

// Обработка необработанных ошибок
onMounted(() => {
  window.addEventListener('error', event => {
    hasError.value = true;
    errorMessage.value = event.message || 'Произошла ошибка';
    errorDetails.value = `File: ${event.filename}\nLine: ${event.lineno}\nColumn: ${event.colno}\nError: ${event.error?.stack || event.message}`;
  });

  window.addEventListener('unhandledrejection', event => {
    hasError.value = true;
    errorMessage.value = 'Необработанная ошибка Promise';
    errorDetails.value =
      event.reason instanceof Error
        ? event.reason.stack || String(event.reason)
        : String(event.reason);
  });
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  max-width: 600px;
  text-align: center;
  background: $bg-light;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid $border-color;
  box-shadow: $shadow-md;

  h2 {
    color: $error-color;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 2rem;
  }
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;

  button {
    padding: 0.75rem 1.5rem;
    border: 1px solid $border-color;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    @include transition(all, 0.2s, ease);

    &:hover {
      background: $bg-light;
      border-color: $primary-color;
    }

    &.retry-btn {
      background: $primary-color;
      color: white;
      border-color: $primary-color;

      &:hover {
        background: $primary-hover;
      }
    }
  }
}

.error-details {
  margin-top: 1.5rem;
  text-align: left;

  summary {
    cursor: pointer;
    color: $text-light-gray;
    margin-bottom: 0.5rem;
    user-select: none;
  }

  pre {
    background: $code-bg-dark;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.875rem;
    color: $code-text;
    margin: 0;
  }
}
</style>
