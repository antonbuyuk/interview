import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuestionItem from '../../src/components/question/QuestionItem.vue';

// Мокаем composable useDictionaryHighlight
const mockHighlightTermsInText = vi.fn((text: string) => text);
const mockHighlightTermsInHTML = vi.fn((html: string) => html);
vi.mock('../../src/composables/useDictionaryHighlight', () => ({
  useDictionaryHighlight: () => ({
    highlightTermsInText: mockHighlightTermsInText,
    highlightTermsInHTML: mockHighlightTermsInHTML,
  }),
}));

// Мокаем CodeBlock компонент
vi.mock('../../src/components/content/CodeBlock.vue', () => ({
  default: {
    name: 'CodeBlock',
    template: '<div class="code-block-mock">{{ code }}</div>',
    props: ['code', 'language'],
  },
}));

// Мокаем AnswerAccordion компонент
vi.mock('../../src/components/question/AnswerAccordion.vue', () => ({
  default: {
    name: 'AnswerAccordion',
    template: '<div class="answer-accordion-mock">{{ type }}: {{ content }}</div>',
    props: ['type', 'content'],
  },
}));

type QuestionItemInstance = InstanceType<typeof QuestionItem>;

describe('QuestionItem', () => {
  let wrapper: VueWrapper<QuestionItemInstance>;

  type MockQuestionOverrides = {
    id?: string;
    number?: number;
    question?: string;
    questionRaw?: string;
    questionEn?: string | null;
    codeBlocks?: Array<{ language: string; code: string }>;
    answers?: Array<{ type: string; content: string }>;
  };

  const createMockQuestion = (overrides: MockQuestionOverrides = {}) => {
    const result = {
      id: '1',
      number: 1,
      question: 'What is JavaScript?',
      questionRaw: 'What is JavaScript?',
      questionEn: 'What is JavaScript EN?',
      codeBlocks: [],
      answers: [
        { type: 'ru', content: 'JavaScript - это язык программирования' },
        { type: 'en', content: 'JavaScript is a programming language' },
        { type: 'senior', content: 'JavaScript is a high-level programming language' },
      ],
      ...overrides,
    };

    // Если question передан, но questionRaw нет - устанавливаем questionRaw = question
    // Это нужно, потому что компонент использует props.question.questionRaw || props.question.question
    if (overrides.question !== undefined && overrides.questionRaw === undefined) {
      result.questionRaw = overrides.question;
    }

    return result;
  };

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    mockHighlightTermsInText.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('должен отображать компонент вопроса', () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      expect(wrapper.find('.question-item').exists()).toBe(true);
      expect(wrapper.find('.question-item__header').exists()).toBe(true);
    });

    it('должен отображать текст вопроса с номером', async () => {
      const question = createMockQuestion({ number: 5, question: 'Test question?' });
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      // Ждем полного рендеринга шаблона
      await wrapper.vm.$nextTick();

      // Принудительно обращаемся к computed свойству, чтобы оно вычислилось
      // Используем as any для доступа к computed свойству через vm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedQuestion = (wrapper.vm as any).highlightedQuestion;
      expect(highlightedQuestion).toBeDefined();

      // Даем время для выполнения всех вычислений
      await wrapper.vm.$nextTick();

      // Проверяем, что highlightTermsInText был вызван при вычислении computed
      // Проверяем фактическое значение computed, которое должно быть результатом вызова мока
      expect(highlightedQuestion).toContain('5. Test question?');
      expect(mockHighlightTermsInText).toHaveBeenCalled();

      const header = wrapper.find('.question-item__header');
      expect(header.exists()).toBe(true);
    });

    it('должен иметь правильный id для вопроса', () => {
      const question = createMockQuestion({ number: 3 });
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      const header = wrapper.find('.question-item__header');
      expect(header.attributes('id')).toBe('question-3');
      expect(header.attributes('data-question-id')).toBe('1');
    });
  });

  describe('Сортировка ответов', () => {
    it('должен сортировать ответы в порядке: ru, en, senior', async () => {
      const question = createMockQuestion({
        answers: [
          { type: 'senior', content: 'Senior answer' },
          { type: 'en', content: 'English answer' },
          { type: 'ru', content: 'Русский ответ' },
        ],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick(); // Дополнительный nextTick для гарантии вычисления computed
      // Еще один nextTick для гарантии завершения рендеринга DOM
      await wrapper.vm.$nextTick();

      // СНАЧАЛА проверяем computed свойство sortedAnswers, чтобы понять, где проблема
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sortedAnswers = (wrapper.vm as any).sortedAnswers;
      expect(sortedAnswers).toBeDefined();
      expect(sortedAnswers.length).toBe(3);
      // Проверяем, что computed свойство правильно сортирует (порядок должен быть ru, en, senior)
      const sortedTypes = sortedAnswers.map((a: any) => a.type);
      expect(sortedTypes).toEqual(['ru', 'en', 'senior']);

      // Теперь проверяем порядок в DOM (основная проверка), так как v-for использует sortedAnswers
      const accordions = wrapper.findAll('.answer-accordion-mock');
      expect(accordions.length).toBe(3);
      // Проверяем порядок: ru должен быть первым, en вторым, senior третьим
      const firstAccordion = accordions[0];
      const secondAccordion = accordions[1];
      const thirdAccordion = accordions[2];

      expect(firstAccordion?.exists()).toBe(true);
      expect(secondAccordion?.exists()).toBe(true);
      expect(thirdAccordion?.exists()).toBe(true);

      // Проверяем порядок аккордеонов по типу в DOM (они должны быть отсортированы через sortedAnswers computed)
      expect(firstAccordion?.text()).toContain('ru');
      expect(firstAccordion?.text()).toContain('Русский ответ');
      expect(secondAccordion?.text()).toContain('en');
      expect(secondAccordion?.text()).toContain('English answer');
      expect(thirdAccordion?.text()).toContain('senior');
      expect(thirdAccordion?.text()).toContain('Senior answer');
    });

    it('должен обрабатывать вопросы без ответов', () => {
      const question = createMockQuestion({
        answers: [],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      const accordions = wrapper.findAll('.answer-accordion-mock');
      expect(accordions.length).toBe(0);
    });
  });

  describe('Режим englishOnly', () => {
    it('должен использовать английский вопрос при englishOnly=true и наличии questionEn', async () => {
      const question = createMockQuestion({
        question: 'Что такое JavaScript?',
        questionEn: 'What is JavaScript?',
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
          englishOnly: true,
        },
      });

      // Ждем, пока computed свойство вычислится
      await wrapper.vm.$nextTick();
      // Принудительно обращаемся к computed свойству, чтобы оно вычислилось
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedQuestion = (wrapper.vm as any).highlightedQuestion;
      expect(highlightedQuestion).toBeDefined();
      await wrapper.vm.$nextTick();

      // Проверяем, что был вызван highlightTermsInText с английским вопросом
      // Проверяем фактическое значение computed - оно должно содержать английский вопрос
      expect(highlightedQuestion).toContain('What is JavaScript?');
      expect(mockHighlightTermsInText).toHaveBeenCalled();
      const calls = mockHighlightTermsInText.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toContain('What is JavaScript?');
    });

    it('должен использовать оригинальный вопрос, если englishOnly=true но нет questionEn', async () => {
      const question = createMockQuestion({
        question: 'Что такое JavaScript?',
        questionEn: null,
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
          englishOnly: true,
        },
      });

      // Ждем, пока computed свойство вычислится
      await wrapper.vm.$nextTick();
      // Принудительно обращаемся к computed свойству, чтобы оно вычислилось
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedQuestion = (wrapper.vm as any).highlightedQuestion;
      expect(highlightedQuestion).toBeDefined();
      await wrapper.vm.$nextTick();

      // Проверяем, что computed содержит оригинальный вопрос (так как questionEn = null)
      expect(highlightedQuestion).toContain('Что такое JavaScript?');
      expect(mockHighlightTermsInText).toHaveBeenCalled();
    });

    it('должен показывать только английские ответы при englishOnly=true', () => {
      const question = createMockQuestion({
        answers: [
          { type: 'ru', content: 'Русский ответ' },
          { type: 'en', content: 'English answer' },
          { type: 'senior', content: 'Senior answer' },
        ],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
          englishOnly: true,
        },
      });

      const accordions = wrapper.findAll('.answer-accordion-mock');
      expect(accordions.length).toBe(1);
      const firstAccordion = accordions[0];
      expect(firstAccordion?.exists()).toBe(true);
      expect(firstAccordion?.text()).toContain('en');
    });

    it('должен показывать все ответы при englishOnly=false', () => {
      const question = createMockQuestion({
        answers: [
          { type: 'ru', content: 'Русский ответ' },
          { type: 'en', content: 'English answer' },
          { type: 'senior', content: 'Senior answer' },
        ],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
          englishOnly: false,
        },
      });

      const accordions = wrapper.findAll('.answer-accordion-mock');
      expect(accordions.length).toBe(3);
    });
  });

  describe('Code blocks', () => {
    it('должен отображать блоки кода', () => {
      const question = createMockQuestion({
        codeBlocks: [
          { language: 'javascript', code: 'const x = 1;' },
          { language: 'typescript', code: 'const y: number = 2;' },
        ],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      const codeBlocks = wrapper.findAll('.code-block-mock');
      expect(codeBlocks.length).toBe(2);
    });

    it('должен передавать правильные props в CodeBlock', () => {
      const question = createMockQuestion({
        codeBlocks: [{ language: 'javascript', code: 'const x = 1;' }],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      const codeBlock = wrapper.findComponent({ name: 'CodeBlock' });
      expect(codeBlock.exists()).toBe(true);
    });

    it('должен обрабатывать вопросы без блоков кода', () => {
      const question = createMockQuestion({
        codeBlocks: [],
      });

      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      const codeBlocks = wrapper.findAll('.code-block-mock');
      expect(codeBlocks.length).toBe(0);
    });
  });

  describe('Режим администратора', () => {
    it('должен показывать кнопку редактирования при isAdmin=true', () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
          isAdmin: true,
        },
      });

      const editButton = wrapper.find('.question-item__edit-btn');
      expect(editButton.exists()).toBe(true);
    });

    it('не должен показывать кнопку редактирования при isAdmin=false', () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
          isAdmin: false,
        },
      });

      const editButton = wrapper.find('.question-item__edit-btn');
      expect(editButton.exists()).toBe(false);
    });

    it('должен показывать drag handle при isAdmin=true', () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
          isAdmin: true,
        },
      });

      const dragHandle = wrapper.find('.question-item__drag-handle');
      expect(dragHandle.exists()).toBe(true);
    });

    it('должен эмитить событие edit-question при клике на кнопку редактирования', async () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
          isAdmin: true,
        },
      });

      const editButton = wrapper.find('.question-item__edit-btn');
      await editButton.trigger('click');

      expect(wrapper.emitted('edit-question')).toBeTruthy();
      expect(wrapper.emitted('edit-question')?.[0]).toEqual([question]);
    });
  });

  describe('Подсветка терминов', () => {
    it('должен вызывать highlightTermsInText для текста вопроса', async () => {
      const question = createMockQuestion({ question: 'What is JavaScript?' });
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      // Ждем, пока computed свойство вычислится и шаблон отрендерится
      await wrapper.vm.$nextTick();

      // Принудительно обращаемся к computed свойству, чтобы оно вычислилось
      // Используем as any для доступа к computed свойству через vm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedQuestion = (wrapper.vm as any).highlightedQuestion;
      expect(highlightedQuestion).toBeDefined();

      // Даем время для выполнения всех вычислений
      await wrapper.vm.$nextTick();

      // Проверяем, что highlightTermsInText был вызван
      // Проверяем фактическое значение computed - оно должно содержать текст вопроса
      expect(highlightedQuestion).toContain('What is JavaScript?');
      expect(mockHighlightTermsInText).toHaveBeenCalled();
    });

    it('должен корректно обрабатывать подсветку с номером вопроса', async () => {
      const question = createMockQuestion({ number: 5, question: 'Test?' });
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      // Ждем, пока computed свойство вычислится и шаблон отрендерится
      await wrapper.vm.$nextTick();
      // Принудительно обращаемся к computed свойству, чтобы оно вычислилось
      // Используем as any для доступа к computed свойству через vm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedQuestion = (wrapper.vm as any).highlightedQuestion;
      expect(highlightedQuestion).toBeDefined();
      await wrapper.vm.$nextTick();

      // Проверяем фактическое значение computed - оно должно содержать номер и текст вопроса
      expect(highlightedQuestion).toContain('5.');
      expect(highlightedQuestion).toContain('Test?');

      // Проверяем, что highlightTermsInText был вызван
      const calls = mockHighlightTermsInText.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toContain('5.');
      expect(lastCall?.[0]).toContain('Test?');
    });
  });

  describe('Обработка событий мыши', () => {
    it('должен обрабатывать события мыши для терминов', async () => {
      const question = createMockQuestion();
      wrapper = mount(QuestionItem, {
        props: {
          question,
        },
      });

      await wrapper.vm.$nextTick();

      // Мокаем window.dispatchEvent для проверки вызова CustomEvent
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      // Создаем элемент с классом dictionary-term и вставляем его в DOM header
      const header = wrapper.find('.question-item__header');
      const mockElement = document.createElement('span');
      mockElement.classList.add('dictionary-term');
      mockElement.setAttribute('data-term-id', 'term-1');
      mockElement.setAttribute('data-term', 'JavaScript');

      // Вставляем элемент в header
      header.element.appendChild(mockElement);

      // Мокаем getBoundingClientRect для mockElement
      mockElement.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        width: 100,
        height: 20,
        right: 110,
        bottom: 40,
        x: 10,
        y: 20,
        toJSON: vi.fn(),
      }));

      // Вызываем handleMouseOver напрямую с mock-событием, где target = mockElement
      // Используем unknown для обхода проверки типов, так как нам нужен только target
      const mockEvent = {
        target: mockElement,
      } as unknown as MouseEvent;

      // Вызываем обработчик напрямую через wrapper.vm
      // Используем as any для доступа к методу handleMouseOver через vm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (wrapper.vm as any).handleMouseOver(mockEvent);

      await wrapper.vm.$nextTick();

      // Проверяем, что window.dispatchEvent был вызван с CustomEvent 'term-hover'
      expect(dispatchEventSpy).toHaveBeenCalled();
      const callArgs = dispatchEventSpy.mock.calls[0];
      expect(callArgs).toBeDefined();
      if (callArgs && callArgs[0]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((callArgs[0] as any).type).toBe('term-hover');
      }

      dispatchEventSpy.mockRestore();
    });
  });
});
