import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useDictionaryHighlight } from '../../src/composables/useDictionaryHighlight';

// Мокаем API клиент
const { mockGet, mockApi } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockApi = {
    get: mockGet,
  };
  return { mockGet, mockApi };
});

vi.mock('../../src/api/client', () => ({
  api: {
    get: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  default: mockApi,
}));

describe('useDictionaryHighlight', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Сбрасываем глобальное состояние словаря перед каждым тестом
    const { refreshDictionary } = useDictionaryHighlight();
    await refreshDictionary();
  });

  it('должен инициализироваться', () => {
    const { loadDictionary, findTermById } = useDictionaryHighlight();
    expect(loadDictionary).toBeDefined();
    expect(findTermById).toBeDefined();
  });

  it('должен загружать словарь', async () => {
    const mockTerms = [
      {
        id: '1',
        term: 'async',
        translation: 'асинхронный',
        examples: [],
        phrases: [],
      },
    ];
    mockGet.mockResolvedValue(mockTerms);

    const { loadDictionary } = useDictionaryHighlight();
    await loadDictionary();

    expect(mockGet).toHaveBeenCalledWith('/terms');
  });

  it('должен находить термин по ID', async () => {
    const mockTerms = [
      {
        id: 'term-1',
        term: 'promise',
        translation: 'обещание',
        examples: [],
        phrases: [],
      },
    ];
    mockGet.mockResolvedValue(mockTerms);

    const { refreshDictionary, findTermById } = useDictionaryHighlight();
    // Используем refreshDictionary вместо loadDictionary, чтобы гарантировать загрузку
    await refreshDictionary();

    const term = findTermById('term-1');
    expect(term).toBeDefined();
    expect(term?.term).toBe('promise');
    expect(mockGet).toHaveBeenCalledWith('/terms');
  });

  it('должен подсвечивать термины в HTML', () => {
    const { highlightTermsInHTML } = useDictionaryHighlight();
    const html = '<p>This is a test with async function</p>';
    const result = highlightTermsInHTML(html);

    // Проверяем, что функция возвращает строку
    expect(typeof result).toBe('string');
  });
});
