import api from './client';

/**
 * Получить вопросы по разделу
 * @param {string} sectionId - ID раздела
 * @returns {Promise<Array>}
 */
export async function getQuestions(sectionId = null) {
  const params = sectionId ? `?sectionId=${sectionId}` : '';
  return api.get(`/questions${params}`);
}

/**
 * Получить вопрос по ID
 * @param {string} id - ID вопроса
 * @returns {Promise<Object>}
 */
export async function getQuestionById(id) {
  return api.get(`/questions/${id}`);
}

/**
 * Создать вопрос
 * @param {Object} questionData - Данные вопроса
 * @returns {Promise<Object>}
 */
export async function createQuestion(questionData) {
  return api.post('/questions', questionData);
}

/**
 * Обновить вопрос
 * @param {string} id - ID вопроса
 * @param {Object} questionData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateQuestion(id, questionData) {
  return api.put(`/questions/${id}`, questionData);
}

/**
 * Удалить вопрос
 * @param {string} id - ID вопроса
 * @returns {Promise<void>}
 */
export async function deleteQuestion(id) {
  return api.delete(`/questions/${id}`);
}

/**
 * Получить ответы вопроса
 * @param {string} questionId - ID вопроса
 * @returns {Promise<Array>}
 */
export async function getAnswersByQuestion(questionId) {
  return api.get(`/questions/${questionId}/answers`);
}

/**
 * Добавить ответ к вопросу
 * @param {string} questionId - ID вопроса
 * @param {Object} answerData - Данные ответа { type: 'ru'|'en'|'senior', content: string }
 * @returns {Promise<Object>}
 */
export async function createAnswer(questionId, answerData) {
  return api.post(`/questions/${questionId}/answers`, answerData);
}

/**
 * Обновить ответ
 * @param {string} id - ID ответа
 * @param {Object} answerData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateAnswer(id, answerData) {
  return api.put(`/answers/${id}`, answerData);
}

/**
 * Удалить ответ
 * @param {string} id - ID ответа
 * @returns {Promise<void>}
 */
export async function deleteAnswer(id) {
  return api.delete(`/answers/${id}`);
}
