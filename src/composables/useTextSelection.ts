import { ref, onMounted, onUnmounted, type Ref } from 'vue';

interface MenuPosition {
  x: number;
  y: number;
}

interface SelectionResult {
  text: string;
  range: Range;
}

interface UseTextSelectionReturn {
  selectedText: Ref<string>;
  showMenu: Ref<boolean>;
  menuPosition: Ref<MenuPosition>;
  clearSelection: () => void;
}

/**
 * Composable для отслеживания выделения текста и показа контекстного меню
 */
export function useTextSelection(): UseTextSelectionReturn {
  const selectedText = ref('');
  const showMenu = ref(false);
  const menuPosition = ref<MenuPosition>({ x: 0, y: 0 });
  const selectionRange = ref<Range | null>(null);

  const getSelectedText = (): SelectionResult | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const text = selection.toString().trim();
    if (!text || text.length === 0) {
      return null;
    }

    // Проверяем, что выделение не находится внутри элементов, которые не должны быть выделяемы
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Игнорируем выделение внутри блоков кода (pre, code)
    let node: Node | null =
      container.nodeType === Node.TEXT_NODE
        ? (container as Text).parentElement
        : (container as Element);
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === 'PRE' || element.tagName === 'CODE') {
          return null;
        }
      }
      node = node.parentElement;
    }

    return {
      text,
      range: range.cloneRange(),
    };
  };

  const handleMouseUp = (event: MouseEvent): void => {
    // Игнорируем выделение в input, textarea и других интерактивных элементах
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('input, textarea, [contenteditable="true"]')
    ) {
      return;
    }

    const selection = getSelectedText();

    if (!selection) {
      showMenu.value = false;
      selectedText.value = '';
      return;
    }

    // Игнорируем очень короткие выделения (меньше 2 символов)
    if (selection.text.length < 2) {
      showMenu.value = false;
      selectedText.value = '';
      return;
    }

    selectedText.value = selection.text;
    selectionRange.value = selection.range;

    // Получаем позицию для меню
    const range = selection.range;
    const rect = range.getBoundingClientRect();

    // Вычисляем позицию с учетом границ экрана
    const menuHeight = 50; // Примерная высота меню
    const menuWidth = 200; // Примерная ширина меню
    const padding = 10;

    let x = rect.left + rect.width / 2;
    let y = rect.bottom + padding; // По умолчанию показываем снизу

    // Проверяем границы экрана
    if (x - menuWidth / 2 < padding) {
      x = menuWidth / 2 + padding;
    } else if (x + menuWidth / 2 > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth / 2 - padding;
    }

    if (y + menuHeight > window.innerHeight - padding) {
      // Если не помещается снизу, показываем сверху
      y = rect.top - padding;
    }

    // Позиционируем меню над выделенным текстом
    menuPosition.value = {
      x,
      y,
    };

    showMenu.value = true;
  };

  const handleClick = (event: MouseEvent): void => {
    // Не закрываем меню при клике на само меню
    const target = event.target as HTMLElement;
    if (target.closest('.text-selection-menu')) {
      return;
    }

    // Закрываем меню при клике вне выделения
    if (showMenu.value) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
        showMenu.value = false;
        selectedText.value = '';
      }
    }
  };

  const clearSelection = (): void => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    showMenu.value = false;
    selectedText.value = '';
    selectionRange.value = null;
  };

  onMounted(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClick);
  });

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('click', handleClick);
  });

  return {
    selectedText,
    showMenu,
    menuPosition,
    clearSelection,
  };
}
