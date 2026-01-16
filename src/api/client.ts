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

/**
 * Retry логика с exponential backoff
 */
async function retryRequest(
  requestFn: () => Promise<Response>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await requestFn();

      // Если успешный ответ или ошибка, которую не стоит повторять, возвращаем сразу
      if (
        response.ok ||
        (response.status >= 400 && response.status < 500 && response.status !== 429)
      ) {
        return response;
      }

      // Для временных ошибок (503, 502, 500, 429) повторяем
      if (
        response.status === 503 ||
        response.status === 502 ||
        response.status === 500 ||
        response.status === 429
      ) {
        if (attempt === maxRetries - 1) {
          return response; // Последняя попытка, возвращаем ответ
        }
        // Вычисляем задержку с exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Для сетевых ошибок повторяем
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt === maxRetries - 1) {
          throw lastError;
        }
        // Вычисляем задержку с exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Для других ошибок не повторяем
      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after retries');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // Получаем JWT токен или старый токен из localStorage
  const accessToken = localStorage.getItem('admin_access_token');
  const legacyToken = localStorage.getItem('is_auth_admin');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // Приоритет: JWT токен в заголовке Authorization
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    // Для обратной совместимости: старый метод через заголовок
    ...(!accessToken && legacyToken === 'true' && { 'X-Admin-Auth': 'true' }),
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
    // Используем retry логику для запроса
    const response = await retryRequest(() => fetch(url, config), 3, 1000);

    // Если получили 401 и есть access token, пытаемся обновить его
    if (response.status === 401 && accessToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/admin/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.accessToken) {
            // Сохраняем новый токен
            localStorage.setItem('admin_access_token', refreshData.accessToken);
            // Повторяем оригинальный запрос с новым токеном
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${refreshData.accessToken}`,
            };
            const newConfig = { ...config, headers: newHeaders };
            const retryResponse = await fetch(url, newConfig);
            if (retryResponse.ok) {
              if (retryResponse.status === 204) {
                return null as T;
              }
              try {
                return (await retryResponse.json()) as T;
              } catch {
                return {} as T;
              }
            }
          }
        }
      } catch {
        // Если не удалось обновить токен, удаляем его
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('is_auth_admin');
      }
    }

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
