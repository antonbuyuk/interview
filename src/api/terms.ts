import api from './client';
import type {
  Term,
  CreateTermRequest,
  UpdateTermRequest,
  GetTermsFilters,
  TermSuggestionsRequest,
  TermSuggestionsResponse,
} from '../types/api';

/**
 * Получить термины
 */
export async function getTerms(filters: GetTermsFilters = {}): Promise<Term[]> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }

  const queryString = params.toString();
  return api.get<Term[]>(`/terms${queryString ? `?${queryString}` : ''}`);
}

/**
 * Получить термин по ID
 */
export async function getTermById(id: string): Promise<Term> {
  return api.get<Term>(`/terms/${id}`);
}

/**
 * Получить термин по точному совпадению имени (case-insensitive)
 */
export async function getTermByExactName(term: string): Promise<Term | null> {
  try {
    const encodedTerm = encodeURIComponent(term.trim());
    return await api.get<Term>(`/terms/by-name/${encodedTerm}`);
  } catch (error) {
    // Если термин не найден (404), возвращаем null
    if (error instanceof Error && 'response' in error) {
      const httpError = error as Error & { response?: { status?: number } };
      if (httpError.response?.status === 404) {
        return null;
      }
    }
    // Для других ошибок пробрасываем дальше
    throw error;
  }
}

/**
 * Создать термин
 */
export async function createTerm(termData: CreateTermRequest): Promise<Term> {
  return api.post<Term>('/terms', termData);
}

/**
 * Обновить термин
 */
export async function updateTerm(id: string, termData: UpdateTermRequest): Promise<Term> {
  return api.put<Term>(`/terms/${id}`, termData);
}

/**
 * Удалить термин
 */
export async function deleteTerm(id: string): Promise<void> {
  return api.delete<void>(`/terms/${id}`);
}

/**
 * Получить AI-предложения для термина
 */
export async function getTermSuggestions(term: string): Promise<TermSuggestionsResponse> {
  return api.post<TermSuggestionsResponse>('/terms/suggestions', {
    term: term.toLowerCase(),
  } as TermSuggestionsRequest);
}
