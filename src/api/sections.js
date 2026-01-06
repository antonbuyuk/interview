import api from './client';

/**
 * Получить все разделы
 * @returns {Promise<Array>}
 */
export async function getSections() {
  return api.get('/sections');
}

/**
 * Получить раздел по ID
 * @param {string} id - ID раздела
 * @returns {Promise<Object>}
 */
export async function getSectionById(id) {
  return api.get(`/sections/${id}`);
}

/**
 * Создать новый раздел
 * @param {Object} sectionData - Данные раздела
 * @param {string} sectionData.sectionId - Уникальный идентификатор раздела
 * @param {string} sectionData.title - Название раздела
 * @param {string} sectionData.path - Путь для роутинга
 * @param {string} sectionData.dir - Директория раздела
 * @returns {Promise<Object>}
 */
export async function createSection(sectionData) {
  return api.post('/sections', sectionData);
}

/**
 * Обновить раздел
 * @param {string} id - ID раздела
 * @param {Object} sectionData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateSection(id, sectionData) {
  return api.put(`/sections/${id}`, sectionData);
}

/**
 * Удалить раздел
 * @param {string} id - ID раздела
 * @returns {Promise<void>}
 */
export async function deleteSection(id) {
  return api.delete(`/sections/${id}`);
}
