<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast--${toast.type}`]"
      @click="removeToast(toast.id)"
    >
      <div class="toast__icon">
        <CheckCircleIcon v-if="toast.type === 'success'" class="icon" />
        <ExclamationCircleIcon v-else-if="toast.type === 'error'" class="icon" />
        <InformationCircleIcon v-else-if="toast.type === 'info'" class="icon" />
        <ExclamationTriangleIcon v-else class="icon" />
      </div>
      <div class="toast__content">
        <p class="toast__message">{{ toast.message }}</p>
      </div>
      <button class="toast__close" aria-label="Закрыть" @click.stop="removeToast(toast.id)">
        <XMarkIcon class="icon-small" />
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { useToast } from '../../composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;

  @media (max-width: 768px) {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: 100%;
  }
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  &--success {
    border-left: 4px solid #10b981;
  }

  &--error {
    border-left: 4px solid #ef4444;
  }

  &--warning {
    border-left: 4px solid #f59e0b;
  }

  &--info {
    border-left: 4px solid #3b82f6;
  }
}

.toast__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;

  .icon {
    width: 100%;
    height: 100%;
  }
}

.toast--success .toast__icon {
  color: #10b981;
}

.toast--error .toast__icon {
  color: #ef4444;
}

.toast--warning .toast__icon {
  color: #f59e0b;
}

.toast--info .toast__icon {
  color: #3b82f6;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.toast__close {
  flex-shrink: 0;
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: $text-light-gray;
  @include transition(all, 0.2s, ease);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .icon-small {
    width: 16px;
    height: 16px;
  }
}

// Анимации
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
