import { config, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import { vi } from 'vitest';
import type { Component } from 'vue';

// Глобальная конфигурация Vue Test Utils
config.global.mocks = {
  $router: {},
  $route: {},
};

/**
 * Создает Pinia store для тестов
 */
export function setupPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * Создает Vue Router для тестов
 */
export function setupRouter(routes: any[] = []): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes:
      routes.length > 0 ? routes : [{ path: '/', component: { template: '<div>Home</div>' } }],
  });
  return router;
}

/**
 * Мокает composable useDictionaryHighlight
 */
export function mockUseDictionaryHighlight() {
  const mockHighlightTermsInText = vi.fn((text: string) => text);
  const mockHighlightTermsInHTML = vi.fn((html: string) => html);

  vi.mock('../../src/composables/useDictionaryHighlight', () => ({
    useDictionaryHighlight: () => ({
      highlightTermsInText: mockHighlightTermsInText,
      highlightTermsInHTML: mockHighlightTermsInHTML,
      terms: { value: [] },
      loading: { value: false },
      loadDictionary: vi.fn(),
      refreshDictionary: vi.fn(),
      findTerm: vi.fn(),
      findTermById: vi.fn(),
    }),
  }));

  return {
    mockHighlightTermsInText,
    mockHighlightTermsInHTML,
  };
}

/**
 * Создает wrapper для компонента с общими настройками
 */
export function createTestWrapper<T extends Component>(
  component: T,
  options: {
    props?: Record<string, any>;
    global?: any;
    slots?: Record<string, any>;
    router?: Router;
  } = {}
): VueWrapper<any> {
  const { props = {}, global = {}, slots = {}, router } = options;

  const pinia = setupPinia();
  const testRouter = router || setupRouter();

  return mount(component, {
    props,
    slots,
    global: {
      plugins: [pinia, testRouter],
      stubs: {
        'router-link': {
          template: '<a><slot /></a>',
          props: ['to'],
        },
        'router-view': {
          template: '<div><slot /></div>',
        },
      },
      ...global,
    },
  });
}

/**
 * Утилита для ожидания следующего тика
 */
export async function waitForNextTick() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Утилита для создания mock объекта вопроса
 */
export function createMockQuestion(overrides: any = {}) {
  return {
    id: '1',
    number: 1,
    question: 'Test question?',
    questionRaw: 'Test question?',
    questionEn: 'Test question EN?',
    codeBlocks: [],
    answers: [
      { type: 'ru', content: 'Answer RU' },
      { type: 'en', content: 'Answer EN' },
    ],
    ...overrides,
  };
}

/**
 * Утилита для создания mock объекта секции
 */
export function createMockSection(overrides: any = {}) {
  return {
    id: '1',
    sectionId: 'test-section',
    title: 'Test Section',
    path: '/test-section',
    ...overrides,
  };
}
