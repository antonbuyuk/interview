import { ref, computed, type ComputedRef } from 'vue';
import { getTerms } from '../api/terms';
import type { Term } from '../types/api';

interface UseDictionaryHighlightReturn {
  terms: ComputedRef<Term[]>;
  loading: ComputedRef<boolean>;
  loadDictionary: () => Promise<void>;
  refreshDictionary: () => Promise<void>;
  findTerm: (word: string) => Term | null;
  findTermById: (id: string) => Term | null;
  highlightTermsInHTML: (html: string) => string;
  highlightTermsInText: (text: string) => string;
}

// Глобальное состояние словаря (синглтон)
const terms = ref<Term[]>([]);
const loading = ref(false);
const termsMap = ref(new Map<string, Term>()); // Map для быстрого поиска: lowercase термин -> объект термина
const termsByIdMap = ref(new Map<string, Term>()); // Map для поиска по ID: id -> объект термина

/**
 * Composable для работы со словарем терминов и подсветкой
 * Использует глобальное состояние для всех компонентов
 */
export function useDictionaryHighlight(): UseDictionaryHighlightReturn {
  /**
   * Загружает весь словарь терминов (один раз глобально)
   */
  const loadDictionary = async (): Promise<void> => {
    if (terms.value.length > 0) {
      return; // Уже загружено
    }

    loading.value = true;
    try {
      const allTerms = await getTerms({});
      terms.value = allTerms;

      // Создаем Map для быстрого поиска по имени
      const nameMap = new Map<string, Term>();
      // Создаем Map для быстрого поиска по ID
      const idMap = new Map<string, Term>();

      allTerms.forEach(term => {
        const key = term.term.toLowerCase().trim();
        nameMap.set(key, term);
        idMap.set(term.id, term);
      });

      termsMap.value = nameMap;
      termsByIdMap.value = idMap;
    } catch (error) {
      console.error('Ошибка загрузки словаря:', error);
      terms.value = [];
      termsMap.value = new Map();
      termsByIdMap.value = new Map();
    } finally {
      loading.value = false;
    }
  };

  /**
   * Находит термин по ID (использует уже загруженные данные)
   */
  const findTermById = (id: string): Term | null => {
    if (!id) {
      return null;
    }
    return termsByIdMap.value.get(id) || null;
  };

  /**
   * Проверяет, является ли слово термином из словаря
   */
  const findTerm = (word: string): Term | null => {
    if (!word || typeof word !== 'string') {
      return null;
    }

    const normalized = word.toLowerCase().trim();
    return termsMap.value.get(normalized) || null;
  };

  /**
   * Обрабатывает HTML и добавляет подсветку терминам
   */
  const highlightTermsInHTML = (html: string): string => {
    if (!html || typeof html !== 'string' || termsMap.value.size === 0) {
      return html;
    }

    // Проверка на наличие document (для SSR)
    if (typeof document === 'undefined') {
      return html;
    }

    // Создаем временный DOM элемент для парсинга
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    interface WordItem {
      type: 'text' | 'term';
      content: string;
      term?: Term;
    }

    // Функция для обработки текстовых узлов
    const processTextNode = (node: Text): void => {
      const text = node.textContent;
      if (!text || text.trim().length === 0) {
        return;
      }

      // Регулярное выражение для поиска слов (учитывает пунктуацию)
      const wordRegex = /\b([a-zA-Z][a-zA-Z0-9]*)\b/g;
      const words: WordItem[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = wordRegex.exec(text)) !== null) {
        const word = match[1];
        const term = findTerm(word);

        if (term) {
          // Добавляем текст до слова
          if (match.index > lastIndex) {
            words.push({
              type: 'text',
              content: text.substring(lastIndex, match.index),
            });
          }

          // Добавляем подсвеченное слово
          words.push({
            type: 'term',
            content: word,
            term: term,
          });

          lastIndex = match.index + word.length;
        }
      }

      // Добавляем оставшийся текст
      if (lastIndex < text.length) {
        words.push({
          type: 'text',
          content: text.substring(lastIndex),
        });
      }

      // Если нашли термины, заменяем текстовый узел
      if (words.some(w => w.type === 'term')) {
        const fragment = document.createDocumentFragment();

        words.forEach(item => {
          if (item.type === 'term' && item.term) {
            const span = document.createElement('span');
            span.className = 'dictionary-term';
            span.setAttribute('data-term', item.term.term);
            span.setAttribute('data-term-id', item.term.id);
            span.textContent = item.content;
            fragment.appendChild(span);
          } else {
            fragment.appendChild(document.createTextNode(item.content));
          }
        });

        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      }
    };

    // Рекурсивно обрабатываем все текстовые узлы
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        // Пропускаем узлы внутри code, pre, script, style
        let parent = node.parentElement;
        while (parent && parent !== tempDiv) {
          const tagName = parent.tagName?.toLowerCase();
          if (tagName && ['code', 'pre', 'script', 'style'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      }
    }

    // Обрабатываем текстовые узлы в обратном порядке, чтобы не нарушить индексы
    textNodes.reverse().forEach(processTextNode);

    return tempDiv.innerHTML;
  };

  /**
   * Обрабатывает простой текст и возвращает HTML с подсветкой
   */
  const highlightTermsInText = (text: string): string => {
    if (!text || typeof text !== 'string' || termsMap.value.size === 0) {
      return text;
    }

    // Экранируем HTML для безопасности
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Регулярное выражение для поиска слов
    const wordRegex = /\b([a-zA-Z][a-zA-Z0-9]*)\b/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[1];
      const term = findTerm(word);

      if (term) {
        // Добавляем текст до слова
        result += escaped.substring(lastIndex, match.index);

        // Добавляем подсвеченное слово
        result += `<span class="dictionary-term" data-term="${term.term}" data-term-id="${term.id}">${word}</span>`;

        lastIndex = match.index + word.length;
      }
    }

    // Добавляем оставшийся текст
    result += escaped.substring(lastIndex);

    return result || escaped;
  };

  /**
   * Обновляет словарь (например, после добавления нового термина)
   */
  const refreshDictionary = async (): Promise<void> => {
    terms.value = [];
    termsMap.value = new Map();
    termsByIdMap.value = new Map();
    await loadDictionary();
  };

  return {
    terms: computed(() => terms.value),
    loading: computed(() => loading.value),
    loadDictionary,
    refreshDictionary,
    findTerm,
    findTermById,
    highlightTermsInHTML,
    highlightTermsInText,
  };
}
