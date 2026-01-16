import api from './client';
import type {
  Question,
  Answer,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateAnswerRequest,
  UpdateAnswerRequest,
  TranslateTextRequest,
  TranslateTextResponse,
} from '../types/api';

/**
 * Интерфейс для пагинации
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Ответ API с пагинацией
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Получить вопросы по разделу (без пагинации, для обратной совместимости)
 */
export async function getQuestions(sectionId: string | null = null): Promise<Question[]> {
  const params = sectionId ? `?sectionId=${sectionId}` : '';
  return api.get<Question[]>(`/questions${params}`);
}

/**
 * Получить вопросы по разделу с поддержкой пагинации
 */
export async function getQuestionsPaginated(
  sectionId: string | null = null,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<Question>> {
  const params = new URLSearchParams();
  if (sectionId) params.append('sectionId', sectionId);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  return api.get<PaginatedResponse<Question>>(`/questions?${params.toString()}`);
}

/**
 * Получить вопрос по ID
 */
export async function getQuestionById(id: string): Promise<Question> {
  return api.get<Question>(`/questions/${id}`);
}

/**
 * Создать вопрос
 */
export async function createQuestion(questionData: CreateQuestionRequest): Promise<Question> {
  return api.post<Question>('/questions', questionData);
}

/**
 * Обновить вопрос
 */
export async function updateQuestion(
  id: string,
  questionData: UpdateQuestionRequest
): Promise<Question> {
  return api.put<Question>(`/questions/${id}`, questionData);
}

/**
 * Удалить вопрос
 */
export async function deleteQuestion(id: string): Promise<void> {
  return api.delete<void>(`/questions/${id}`);
}

/**
 * Получить ответы вопроса
 */
export async function getAnswersByQuestion(questionId: string): Promise<Answer[]> {
  return api.get<Answer[]>(`/questions/${questionId}/answers`);
}

/**
 * Добавить ответ к вопросу
 */
export async function createAnswer(
  questionId: string,
  answerData: CreateAnswerRequest
): Promise<Answer> {
  return api.post<Answer>(`/questions/${questionId}/answers`, answerData);
}

/**
 * Обновить ответ
 */
export async function updateAnswer(id: string, answerData: UpdateAnswerRequest): Promise<Answer> {
  return api.put<Answer>(`/answers/${id}`, answerData);
}

/**
 * Удалить ответ
 */
export async function deleteAnswer(id: string): Promise<void> {
  return api.delete<void>(`/answers/${id}`);
}

/**
 * Перевести текст
 */
export async function translateText(
  text: string,
  from: string = 'ru',
  to: string = 'en'
): Promise<TranslateTextResponse> {
  return api.post<TranslateTextResponse>('/questions/translate', {
    text,
    from,
    to,
  } as TranslateTextRequest);
}

/**
 * Изменить порядок вопросов
 */
export async function reorderQuestions(
  questionIds: string[],
  sectionId: string
): Promise<Question[]> {
  return api.post<Question[]>('/questions/reorder', {
    questionIds,
    sectionId,
  });
}
