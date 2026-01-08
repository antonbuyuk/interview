import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../client';

// Мокируем fetch
global.fetch = vi.fn();

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Мокируем import.meta.env для тестирования getApiUrl
    // По умолчанию используем production режим для тестов
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: false },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request to correct endpoint', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const result = await api.get('/questions');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should use custom API URL from env', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: { VITE_API_URL: 'https://api.example.com', DEV: false },
        writable: true,
        configurable: true,
      });

      // Перезагружаем модуль для применения нового env
      vi.resetModules();
      const { api: reloadedApi } = await import('../client');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await reloadedApi.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.any(Object)
      );
    });

    it('should handle API URL with trailing slash', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: { VITE_API_URL: 'https://api.example.com/', DEV: false },
        writable: true,
        configurable: true,
      });

      vi.resetModules();
      const { api: reloadedApi } = await import('../client');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await reloadedApi.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.any(Object)
      );
    });

    it('should handle API URL that already ends with /api', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: { VITE_API_URL: 'https://api.example.com/api', DEV: false },
        writable: true,
        configurable: true,
      });

      vi.resetModules();
      const { api: reloadedApi } = await import('../client');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await reloadedApi.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const requestData = { password: 'test-password' };
      const responseData = { success: true };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      } as Response);

      const result = await api.post('/admin/login', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/admin/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should make POST request without body', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.post('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with body', async () => {
      const requestData = { id: 1, name: 'Updated' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => requestData,
      } as Response);

      const result = await api.put('/questions/1', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(requestData);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.delete('/questions/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('authentication headers', () => {
    it('should add X-Admin-Auth header when admin token exists', async () => {
      localStorage.setItem('is_auth_admin', 'true');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Admin-Auth': 'true',
          }),
        })
      );
    });

    it('should not add X-Admin-Auth header when admin token is missing', async () => {
      localStorage.removeItem('is_auth_admin');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.get('/test');

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const headers = (callArgs?.[1] as RequestInit)?.headers as HeadersInit;
      const headerObj = headers instanceof Headers ? Object.fromEntries(headers) : headers;

      expect(headerObj).not.toHaveProperty('X-Admin-Auth');
    });

    it('should not add X-Admin-Auth header when admin token is false', async () => {
      localStorage.setItem('is_auth_admin', 'false');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.get('/test');

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const headers = (callArgs?.[1] as RequestInit)?.headers as HeadersInit;
      const headerObj = headers instanceof Headers ? Object.fromEntries(headers) : headers;

      expect(headerObj).not.toHaveProperty('X-Admin-Auth');
    });
  });

  describe('custom headers', () => {
    it('should merge custom headers with default headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.get('/test', {
        headers: {
          'Custom-Header': 'custom-value',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error for non-ok response with error message', async () => {
      const errorResponse = { error: 'Unauthorized' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => errorResponse,
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(api.get('/test')).rejects.toThrow('Unauthorized');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw error with statusText when error JSON is invalid', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(api.get('/test')).rejects.toThrow('Internal Server Error');

      consoleSpy.mockRestore();
    });

    it('should throw error with message field if available', async () => {
      const errorResponse = { message: 'Custom error message' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
      } as Response);

      await expect(api.get('/test')).rejects.toThrow('Custom error message');
    });

    it('should throw error with status code when no message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(api.get('/test')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(global.fetch).mockRejectedValueOnce(networkError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(api.get('/test')).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('API request failed:', networkError);

      consoleSpy.mockRestore();
    });
  });

  describe('204 No Content handling', () => {
    it('should return null for 204 status', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await api.delete('/test');

      expect(result).toBeNull();
    });
  });

  describe('body serialization', () => {
    it('should serialize object body to JSON', async () => {
      const body = { key: 'value', number: 123 };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.post('/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle null body', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.post('/test', null);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const config = (callArgs?.[1] as RequestInit) ?? {};
      expect(config.body).toBeDefined();
    });
  });

  describe('credentials', () => {
    it('should include credentials in all requests', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await api.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });
});
