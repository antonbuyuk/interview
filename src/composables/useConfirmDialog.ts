/**
 * Composable для управления диалогом подтверждения
 */

import { ref, type Ref } from 'vue';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger';
  closeOnOverlay?: boolean;
}

const isOpen: Ref<boolean> = ref(false);
const title: Ref<string> = ref('Подтверждение');
const message: Ref<string> = ref('');
const confirmText: Ref<string> = ref('Подтвердить');
const cancelText: Ref<string> = ref('Отмена');
const confirmType: Ref<'primary' | 'danger'> = ref('primary');
const closeOnOverlay: Ref<boolean> = ref(true);
const confirmCallback: Ref<(() => void) | null> = ref(null);
const cancelCallback: Ref<(() => void) | null> = ref(null);

/**
 * Показывает диалог подтверждения
 */
export function showConfirmDialog(
  options: ConfirmDialogOptions,
  onConfirm?: () => void,
  onCancel?: () => void
): void {
  title.value = options.title || 'Подтверждение';
  message.value = options.message;
  confirmText.value = options.confirmText || 'Подтвердить';
  cancelText.value = options.cancelText || 'Отмена';
  confirmType.value = options.confirmType || 'primary';
  closeOnOverlay.value = options.closeOnOverlay !== undefined ? options.closeOnOverlay : true;
  confirmCallback.value = onConfirm || null;
  cancelCallback.value = onCancel || null;
  isOpen.value = true;
}

/**
 * Закрывает диалог подтверждения
 */
export function closeConfirmDialog(): void {
  isOpen.value = false;
  confirmCallback.value = null;
  cancelCallback.value = null;
}

/**
 * Вызывает callback подтверждения и закрывает диалог
 */
export function handleConfirm(): void {
  if (confirmCallback.value) {
    confirmCallback.value();
  }
  closeConfirmDialog();
}

/**
 * Вызывает callback отмены и закрывает диалог
 */
export function handleCancel(): void {
  if (cancelCallback.value) {
    cancelCallback.value();
  }
  closeConfirmDialog();
}

/**
 * Composable для использования диалога подтверждения
 */
export function useConfirmDialog() {
  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    confirmType,
    closeOnOverlay,
    showConfirmDialog,
    closeConfirmDialog,
    handleConfirm,
    handleCancel,
  };
}
