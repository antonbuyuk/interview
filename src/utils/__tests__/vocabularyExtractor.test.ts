import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractVocabularyFromMarkdown, getDefaultVocabulary } from '../vocabularyExtractor';
import { getSections } from '../../api/sections';

// Мокируем API
vi.mock('../../api/sections', () => ({
  getSections: vi.fn(),
}));

// Мокируем fetch для тестирования extractVocabularyFromMarkdown
global.fetch = vi.fn();

describe('vocabularyExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокируем import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: { BASE_URL: '/' },
      writable: true,
    });
  });

  describe('getDefaultVocabulary', () => {
    it('should return default vocabulary terms', () => {
      const vocabulary = getDefaultVocabulary();

      expect(Array.isArray(vocabulary)).toBe(true);
      expect(vocabulary.length).toBeGreaterThan(0);
    });

    it('should include TypeScript term', () => {
      const vocabulary = getDefaultVocabulary();
      const typescriptTerm = vocabulary.find(term => term.term === 'TypeScript');

      expect(typescriptTerm).toBeDefined();
      expect(typescriptTerm?.category).toBe('typescript');
      expect(typescriptTerm?.examples).toBeDefined();
      expect(typescriptTerm?.phrases).toBeDefined();
    });

    it('should include JavaScript term', () => {
      const vocabulary = getDefaultVocabulary();
      const jsTerm = vocabulary.find(term => term.term === 'JavaScript');

      expect(jsTerm).toBeDefined();
      expect(jsTerm?.category).toBe('javascript-typescript');
    });

    it('should include Vue term', () => {
      const vocabulary = getDefaultVocabulary();
      const vueTerm = vocabulary.find(term => term.term === 'Vue');

      expect(vueTerm).toBeDefined();
      expect(vueTerm?.category).toBe('vuejs');
    });

    it('should include React term', () => {
      const vocabulary = getDefaultVocabulary();
      const reactTerm = vocabulary.find(term => term.term === 'React');

      expect(reactTerm).toBeDefined();
    });

    it('should include API term', () => {
      const vocabulary = getDefaultVocabulary();
      const apiTerm = vocabulary.find(term => term.term === 'API');

      expect(apiTerm).toBeDefined();
      expect(apiTerm?.translation).toContain('Application Programming Interface');
    });

    it('should include DOM term', () => {
      const vocabulary = getDefaultVocabulary();
      const domTerm = vocabulary.find(term => term.term === 'DOM');

      expect(domTerm).toBeDefined();
      expect(domTerm?.translation).toContain('Document Object Model');
    });

    it('should include closure term', () => {
      const vocabulary = getDefaultVocabulary();
      const closureTerm = vocabulary.find(term => term.term === 'closure');

      expect(closureTerm).toBeDefined();
      expect(closureTerm?.translation).toBe('замыкание');
    });

    it('should include hoisting term', () => {
      const vocabulary = getDefaultVocabulary();
      const hoistingTerm = vocabulary.find(term => term.term === 'hoisting');

      expect(hoistingTerm).toBeDefined();
      expect(hoistingTerm?.translation).toBe('поднятие');
    });

    it('should include reactive term', () => {
      const vocabulary = getDefaultVocabulary();
      const reactiveTerm = vocabulary.find(term => term.term === 'reactive');

      expect(reactiveTerm).toBeDefined();
      expect(reactiveTerm?.category).toBe('vuejs');
    });

    it('should include component term', () => {
      const vocabulary = getDefaultVocabulary();
      const componentTerm = vocabulary.find(term => term.term === 'component');

      expect(componentTerm).toBeDefined();
      expect(componentTerm?.category).toBe('vuejs');
    });

    it('should have all required fields for each term', () => {
      const vocabulary = getDefaultVocabulary();

      vocabulary.forEach(term => {
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('translation');
        expect(term).toHaveProperty('category');
        expect(term).toHaveProperty('categoryTitle');
        expect(term).toHaveProperty('examples');
        expect(term).toHaveProperty('phrases');
        expect(term).toHaveProperty('source');
        expect(Array.isArray(term.examples)).toBe(true);
        expect(Array.isArray(term.phrases)).toBe(true);
      });
    });
  });

  describe('extractVocabularyFromMarkdown', () => {
    it('should return empty array if sections fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getSections).mockRejectedValueOnce(new Error('Network error'));

      const result = await extractVocabularyFromMarkdown();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Ошибка загрузки разделов:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return empty array if no sections', async () => {
      vi.mocked(getSections).mockResolvedValueOnce([]);

      const result = await extractVocabularyFromMarkdown();

      expect(result).toEqual([]);
    });

    it('should extract terms from markdown files', async () => {
      const mockSections = [
        {
          sectionId: 'test-section',
          title: 'Test Section',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = `
# Test Section

Here is some JavaScript code and TypeScript examples.

\`\`\`javascript
function ExampleFunction() {
  const API = 'https://api.example.com';
}
\`\`\`

**Answer EN:**

React is a JavaScript library. The DOM represents HTML structure.
      `;

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      expect(result.length).toBeGreaterThan(0);
      expect(getSections).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/test/README.md');
    });

    it('should handle fetch errors gracefully', async () => {
      const mockSections = [
        {
          sectionId: 'test-section',
          title: 'Test Section',
          dir: 'test',
          path: '/test',
        },
      ];

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await extractVocabularyFromMarkdown();

      // Должен вернуть массив (может быть пустым или с другими разделами)
      expect(Array.isArray(result)).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle non-ok response', async () => {
      const mockSections = [
        {
          sectionId: 'test-section',
          title: 'Test Section',
          dir: 'test',
          path: '/test',
        },
      ];

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      expect(Array.isArray(result)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Не удалось загрузить'));

      consoleSpy.mockRestore();
    });

    it('should merge terms from multiple sections', async () => {
      const mockSections = [
        {
          sectionId: 'section1',
          title: 'Section 1',
          dir: 'section1',
          path: '/section1',
        },
        {
          sectionId: 'section2',
          title: 'Section 2',
          dir: 'section2',
          path: '/section2',
        },
      ];

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '**Answer EN:** React is a library.',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '**Answer EN:** Vue is a framework.',
        } as Response);

      const result = await extractVocabularyFromMarkdown();

      expect(getSections).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should extract PascalCase terms', async () => {
      const mockSections = [
        {
          sectionId: 'test',
          title: 'Test',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = 'TypeScript and JavaScript are languages.';

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      const terms = result.map(t => t.term);
      expect(terms.some(term => term.includes('TypeScript'))).toBe(true);
      expect(terms.some(term => term.includes('JavaScript'))).toBe(true);
    });

    it('should extract acronyms', async () => {
      const mockSections = [
        {
          sectionId: 'test',
          title: 'Test',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = 'Use API and DOM for web development.';

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      const terms = result.map(t => t.term);
      expect(terms.some(term => term === 'API')).toBe(true);
      expect(terms.some(term => term === 'DOM')).toBe(true);
    });

    it('should extract technical phrases from Answer EN', async () => {
      const mockSections = [
        {
          sectionId: 'test',
          title: 'Test',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = `
**Answer EN:**

static typing is a feature. type inference works automatically.
      `;

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      const terms = result.map(t => t.term.toLowerCase());
      expect(terms.some(term => term.includes('static typing'))).toBe(true);
      expect(terms.some(term => term.includes('type inference'))).toBe(true);
    });

    it('should extract terms from code blocks', async () => {
      const mockSections = [
        {
          sectionId: 'test',
          title: 'Test',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = `
\`\`\`javascript
function ExampleFunction() {
  const MyVariable = 10;
}
\`\`\`
      `;

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      const terms = result.map(t => t.term);
      expect(terms.some(term => term.includes('ExampleFunction'))).toBe(true);
    });

    it('should set correct category and categoryTitle for terms', async () => {
      const mockSections = [
        {
          sectionId: 'vuejs',
          title: 'Vue.js',
          dir: 'vuejs',
          path: '/vuejs',
        },
      ];

      const mockMarkdown = '**Answer EN:** Vue component is reactive.';

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      if (result.length > 0) {
        const term = result[0];
        expect(term.category).toBe('vuejs');
        expect(term.categoryTitle).toBe('Vue.js');
        expect(term.source).toBe('vuejs');
      }
    });

    it('should handle terms with examples and phrases', async () => {
      const mockSections = [
        {
          sectionId: 'test',
          title: 'Test',
          dir: 'test',
          path: '/test',
        },
      ];

      const mockMarkdown = `
**Answer EN:**

TypeScript is a superset of JavaScript. TypeScript provides static typing. TypeScript compiler checks types.
      `;

      vi.mocked(getSections).mockResolvedValueOnce(mockSections as never);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      } as Response);

      const result = await extractVocabularyFromMarkdown();

      const typescriptTerm = result.find(t => t.term === 'TypeScript');
      if (typescriptTerm) {
        expect(Array.isArray(typescriptTerm.examples)).toBe(true);
        expect(Array.isArray(typescriptTerm.phrases)).toBe(true);
      }
    });
  });
});
