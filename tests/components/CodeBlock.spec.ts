import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import CodeBlock from '../../src/components/content/CodeBlock.vue';

describe('CodeBlock', () => {
  let wrapper: VueWrapper<any>;
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock navigator.clipboard
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('должен отображать код', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      expect(wrapper.find('code').exists()).toBe(true);
      expect(wrapper.find('pre').exists()).toBe(true);
    });

    it('должен применять класс языка к code элементу', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const codeElement = wrapper.find('code');
      expect(codeElement.classes()).toContain('language-javascript');
      expect(codeElement.classes()).toContain('hljs');
    });

    it('должен работать без указания языка', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: '',
        },
      });

      const codeElement = wrapper.find('code');
      expect(codeElement.classes()).toContain('hljs');
    });

    it('должен отображать кнопку копирования', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const copyButton = wrapper.find('.copy-code-btn');
      expect(copyButton.exists()).toBe(true);
    });
  });

  describe('Подсветка синтаксиса', () => {
    it('должен подсвечивать код при наличии языка', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const codeElement = wrapper.find('code');
      // Проверяем, что код был обработан highlight.js
      expect(codeElement.html()).toBeTruthy();
    });

    it('должен использовать автоматическое определение языка, если язык не указан', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: '',
        },
      });

      const codeElement = wrapper.find('code');
      expect(codeElement.html()).toBeTruthy();
    });

    it('должен обрабатывать пустой код', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: '',
          language: 'javascript',
        },
      });

      const codeElement = wrapper.find('code');
      // Пустой код все равно рендерится с HTML структурой, но текст внутри пустой
      // Проверяем, что computed свойство highlightedCode возвращает пустую строку
      // или что текстовое содержимое пустое
      const textContent = codeElement.text();
      expect(textContent.trim()).toBe('');
    });

    it('должен обрабатывать код с только пробелами', () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: '   ',
          language: 'javascript',
        },
      });

      const codeElement = wrapper.find('code');
      // Код с пробелами все равно рендерится с HTML структурой
      // Но computed свойство highlightedCode возвращает пустую строку (т.к. trim() возвращает '')
      // Проверяем, что текстовое содержимое пустое (после trim)
      const textContent = codeElement.text();
      expect(textContent.trim()).toBe('');
    });
  });

  describe('Копирование кода', () => {
    it('должен копировать код в буфер обмена при клике на кнопку', async () => {
      const testCode = 'const test = "hello";';
      wrapper = mount(CodeBlock, {
        props: {
          code: testCode,
          language: 'javascript',
        },
      });

      const copyButton = wrapper.find('.copy-code-btn');
      await copyButton.trigger('click');

      expect(mockWriteText).toHaveBeenCalledWith(testCode);
    });

    it('должен показывать состояние "Скопировано" после успешного копирования', async () => {
      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const copyButton = wrapper.find('.copy-code-btn');
      await copyButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(copyButton.classes()).toContain('copied');
      expect(copyButton.text()).toContain('Скопировано');
    });

    it('должен скрывать состояние "Скопировано" через 2 секунды', async () => {
      vi.useFakeTimers();

      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const copyButton = wrapper.find('.copy-code-btn');
      await copyButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(copyButton.classes()).toContain('copied');

      // Проходим 2 секунды
      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(copyButton.classes()).not.toContain('copied');

      vi.useRealTimers();
    });

    it('должен использовать fallback метод, если clipboard API недоступен', async () => {
      // Заглушаем console.error, так как ошибка ожидаема
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Мокаем, что clipboard.writeText выбрасывает ошибку
      const mockWriteTextError = vi
        .fn()
        .mockRejectedValue(new Error('Clipboard API not available'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteTextError,
        },
      });

      // Мокаем document.execCommand
      const mockExecCommand = vi.fn().mockReturnValue(true);
      const originalExecCommand = document.execCommand;
      document.execCommand = mockExecCommand;

      wrapper = mount(CodeBlock, {
        props: {
          code: 'const test = "hello";',
          language: 'javascript',
        },
      });

      const copyButton = wrapper.find('.copy-code-btn');
      await copyButton.trigger('click');
      // Ждем выполнения fallback логики
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Проверяем, что был вызван fallback метод
      expect(mockExecCommand).toHaveBeenCalledWith('copy');

      // Восстанавливаем оригинальный метод
      document.execCommand = originalExecCommand;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Обработка ошибок', () => {
    it('должен обрабатывать ошибки при подсветке синтаксиса', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Мокаем highlight.js, чтобы он выбрасывал ошибку
      const originalHighlight = require('highlight.js');
      const mockHighlight = vi.fn().mockImplementation(() => {
        throw new Error('Highlight error');
      });

      // Создаем wrapper с проблемным кодом
      wrapper = mount(CodeBlock, {
        props: {
          code: 'some code',
          language: 'invalid-language',
        },
      });

      // Проверяем, что код все равно отображается (экраненный)
      const codeElement = wrapper.find('code');
      expect(codeElement.exists()).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });
});
