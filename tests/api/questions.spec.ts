import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../src/api/questions';

// Мокаем API клиент
const { mockApi } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { mockApi };
});

vi.mock('../../src/api/client', () => ({
  api: mockApi,
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

describe('Questions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuestions', () => {
    it('должен получать вопросы без параметров', async () => {
      const mockQuestions = [{ id: '1', question: 'Test question', sectionId: 'section-1' }];
      mockApi.get.mockResolvedValue(mockQuestions);

      const result = await getQuestions();

      expect(mockApi.get).toHaveBeenCalledWith('/questions');
      expect(result).toEqual(mockQuestions);
    });

    it('должен получать вопросы с sectionId', async () => {
      const mockQuestions = [{ id: '1', question: 'Test', sectionId: 'section-1' }];
      mockApi.get.mockResolvedValue(mockQuestions);

      const result = await getQuestions('section-1');

      expect(mockApi.get).toHaveBeenCalledWith('/questions?sectionId=section-1');
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('createQuestion', () => {
    it('должен создавать новый вопрос', async () => {
      const questionData = {
        sectionId: 'section-1',
        question: 'Test question',
        questionRaw: 'Test question',
        rawMarkdown: '# Test',
        number: 1,
      };
      const mockResponse = { id: 'new-id', ...questionData };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createQuestion(questionData);

      expect(mockApi.post).toHaveBeenCalledWith('/questions', questionData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateQuestion', () => {
    it('должен обновлять вопрос', async () => {
      const questionId = 'question-1';
      const updateData = { question: 'Updated question' };
      const mockResponse = { id: questionId, ...updateData };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await updateQuestion(questionId, updateData);

      expect(mockApi.put).toHaveBeenCalledWith(`/questions/${questionId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteQuestion', () => {
    it('должен удалять вопрос', async () => {
      const questionId = 'question-1';
      mockApi.delete.mockResolvedValue(null);

      await deleteQuestion(questionId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/questions/${questionId}`);
    });
  });
});
