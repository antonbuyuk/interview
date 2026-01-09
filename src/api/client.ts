/**
 * Базовый HTTP клиент для работы с API
 */

// Формируем базовый URL API
const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Если VITE_API_URL не установлена, используем localhost для разработки
  if (!apiUrl) {
    return 'http://localhost:3001/api';
  }

  // Убираем trailing slash и добавляем /api если его нет
  const baseUrl = apiUrl.replace(/\/$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const API_URL = getApiUrl();

interface RequestOptions {
  headers?: HeadersInit;
  body?: unknown;
  method?: string;
  credentials?: RequestCredentials;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // Получаем токен авторизации из localStorage
  const authToken = localStorage.getItem('is_auth_admin');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // Отправляем токен в заголовке, если он есть
    ...(authToken === 'true' && { 'X-Admin-Auth': 'true' }),
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    headers,
    credentials: 'include', // Включаем отправку cookies (на случай, если нужны другие cookies)
    method: options.method,
  };

  // Устанавливаем body из options
  if (options.body !== undefined) {
    if (typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body as BodyInit;
    }
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        (error as { error?: string; message?: string }).error ||
          (error as { error?: string; message?: string }).message ||
          `HTTP error! status: ${response.status}`
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'POST', body: data }),
  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'PUT', body: data }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
