/**
 * Базовый HTTP клиент для работы с API
 */

// Типы для ошибок API
export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Типы для HTTP методов
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

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

// Строгие типы для опций запроса
export interface RequestOptions {
  headers?: HeadersInit;
  body?: unknown;
  method?: HttpMethod;
  credentials?: RequestCredentials;
}

// Тип для сериализуемого тела запроса
type SerializableBody =
  | string
  | number
  | boolean
  | null
  | SerializableBody[]
  | { [key: string]: SerializableBody };

// Проверка, является ли значение сериализуемым объектом
function isSerializableObject(value: unknown): value is Record<string, SerializableBody> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof FormData)
  );
}

// Безопасное извлечение ошибки из ответа
function extractErrorFromResponse(error: unknown): ApiErrorResponse {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    return {
      error: typeof errorObj.error === 'string' ? errorObj.error : 'Unknown error',
      message: typeof errorObj.message === 'string' ? errorObj.message : undefined,
      code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
    };
  }
  return { error: 'Unknown error occurred' };
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
    credentials: options.credentials ?? 'include', // Включаем отправку cookies (на случай, если нужны другие cookies)
    method: options.method ?? 'GET',
  };

  // Устанавливаем body из options
  if (options.body !== undefined) {
    if (isSerializableObject(options.body)) {
      config.body = JSON.stringify(options.body);
    } else if (options.body instanceof FormData || typeof options.body === 'string') {
      config.body = options.body;
    } else {
      // Для других типов пытаемся сериализовать
      config.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        const error = await response.json();
        errorData = extractErrorFromResponse(error);
      } catch {
        // Если не удалось распарсить JSON, используем статус текст
        errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
      }

      throw new ApiError(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData.code
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    try {
      return (await response.json()) as T;
    } catch (jsonError) {
      // Если не удалось распарсить JSON, но статус OK, возвращаем пустой объект
      console.warn('Failed to parse JSON response:', jsonError);
      return {} as T;
    }
  } catch (error) {
    // Если это уже ApiError, пробрасываем дальше
    if (error instanceof ApiError) {
      throw error;
    }

    // Для других ошибок создаем ApiError
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API request failed:', error);
    throw new ApiError(errorMessage, 0);
  }
}

// Generic типы для API ответов
export type ApiResponse<T> = T;

// Типизированный API клиент
export interface TypedApiClient {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;
  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) => Promise<T>;
  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;
}

export const api: TypedApiClient = {
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
