import api from './client'

/**
 * Получить все разделы
 * @returns {Promise<Array>}
 */
export async function getSections() {
  return api.get('/sections')
}

/**
 * Получить раздел по ID
 * @param {string} id - ID раздела
 * @returns {Promise<Object>}
 */
export async function getSectionById(id) {
  return api.get(`/sections/${id}`)
}
