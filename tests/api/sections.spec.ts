import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSections, createSection, updateSection, deleteSection } from '../../src/api/sections';

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

describe('Sections API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSections', () => {
    it('должен получать список разделов', async () => {
      const mockSections = [
        {
          id: '1',
          sectionId: 'javascript-typescript',
          title: 'JavaScript / TypeScript',
          path: '/javascript-typescript',
          dir: 'javascript-typescript',
        },
      ];
      mockApi.get.mockResolvedValue(mockSections);

      const result = await getSections();

      expect(mockApi.get).toHaveBeenCalledWith('/sections');
      expect(result).toEqual(mockSections);
    });
  });

  describe('createSection', () => {
    it('должен создавать новый раздел', async () => {
      const sectionData = {
        sectionId: 'new-section',
        title: 'New Section',
        path: '/new-section',
        dir: 'new-section',
      };
      const mockResponse = { id: 'new-id', ...sectionData };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createSection(sectionData);

      expect(mockApi.post).toHaveBeenCalledWith('/sections', sectionData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateSection', () => {
    it('должен обновлять раздел', async () => {
      const sectionId = 'section-1';
      const updateData = { title: 'Updated Title' };
      const mockResponse = { id: sectionId, ...updateData };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await updateSection(sectionId, updateData);

      expect(mockApi.put).toHaveBeenCalledWith(`/sections/${sectionId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteSection', () => {
    it('должен удалять раздел', async () => {
      const sectionId = 'section-1';
      mockApi.delete.mockResolvedValue(null);

      await deleteSection(sectionId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/sections/${sectionId}`);
    });
  });
});
