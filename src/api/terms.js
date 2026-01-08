import api from './client';

/**
 * Получить термины
 * @param {Object} filters - Фильтры { category, search, sortBy }
 * @returns {Promise<Array>}
 */
export async function getTerms(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }

  const queryString = params.toString();
  return api.get(`/terms${queryString ? `?${queryString}` : ''}`);
}

/**
 * Получить термин по ID
 * @param {string} id - ID термина
 * @returns {Promise<Object>}
 */
export async function getTermById(id) {
  return api.get(`/terms/${id}`);
}

/**
 * Создать термин
 * @param {Object} termData - Данные термина
 * @returns {Promise<Object>}
 */
export async function createTerm(termData) {
  return api.post('/terms', termData);
}

/**
 * Обновить термин
 * @param {string} id - ID термина
 * @param {Object} termData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateTerm(id, termData) {
  return api.put(`/terms/${id}`, termData);
}

/**
 * Удалить термин
 * @param {string} id - ID термина
 * @returns {Promise<void>}
 */
export async function deleteTerm(id) {
  return api.delete(`/terms/${id}`);
}

/**
 * Получить AI-предложения для термина
 * @param {string} term - Термин на английском
 * @returns {Promise<Object>} { translation, phrases, examples }
 */
export async function getTermSuggestions(term) {
  return api.post('/terms/suggestions', { term: term.toLowerCase() });
}
