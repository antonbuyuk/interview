/**
 * Composable для управления keyboard shortcuts
 */

import { onMounted, onUnmounted } from 'vue';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description?: string;
}

const shortcuts: KeyboardShortcut[] = [];

/**
 * Регистрирует keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): () => void {
  shortcuts.push(shortcut);

  // Возвращаем функцию для отмены регистрации
  return () => {
    const index = shortcuts.indexOf(shortcut);
    if (index > -1) {
      shortcuts.splice(index, 1);
    }
  };
}

/**
 * Обработчик нажатий клавиш
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  // Игнорируем, если пользователь вводит текст в input/textarea
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }

  for (const shortcut of shortcuts) {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = shortcut.ctrl
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;

    if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
      event.preventDefault();
      shortcut.handler();
      break;
    }
  }
};

/**
 * Composable для использования keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    registerShortcut,
  };
}

/**
 * Инициализация стандартных shortcuts
 */
export function initDefaultShortcuts(): void {
  // Ctrl/Cmd + K - открыть поиск
  registerShortcut({
    key: 'k',
    ctrl: true,
    handler: () => {
      const event = new CustomEvent('open-search');
      window.dispatchEvent(event);
    },
    description: 'Открыть поиск',
  });

  // Esc - закрыть модальные окна
  registerShortcut({
    key: 'Escape',
    handler: () => {
      const event = new CustomEvent('close-modals');
      window.dispatchEvent(event);
    },
    description: 'Закрыть модальные окна',
  });

  // j/k - навигация по вопросам (только на странице раздела)
  registerShortcut({
    key: 'j',
    handler: () => {
      const event = new CustomEvent('navigate-questions', { detail: { direction: 'next' } });
      window.dispatchEvent(event);
    },
    description: 'Следующий вопрос',
  });

  registerShortcut({
    key: 'k',
    handler: () => {
      const event = new CustomEvent('navigate-questions', { detail: { direction: 'prev' } });
      window.dispatchEvent(event);
    },
    description: 'Предыдущий вопрос',
  });
}
