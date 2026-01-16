<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" aria-label="Закрыть" @click="handleCancel">
              <XMarkIcon class="icon" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn--secondary" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button :class="['btn', `btn--${confirmType}`]" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useConfirmDialog } from '../../composables/useConfirmDialog';

const {
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmType,
  closeOnOverlay,
  handleConfirm,
  handleCancel,
} = useConfirmDialog();

const handleOverlayClick = () => {
  if (closeOnOverlay.value) {
    handleCancel();
  }
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid $border-color;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: $text-light-gray;
  @include transition(all, 0.2s, ease);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .icon {
    width: 20px;
    height: 20px;
  }
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.modal-message {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid $border-color;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &--secondary {
    background: white;

    &:hover {
      background: $bg-light;
    }
  }

  &--primary {
    background: $primary-color;
    color: white;
    border-color: $primary-color;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }

  &--danger {
    background: #ef4444;
    color: white;
    border-color: #ef4444;

    &:hover {
      background: #dc2626;
    }
  }
}

// Анимации
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
