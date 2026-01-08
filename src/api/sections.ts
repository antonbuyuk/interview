import api from './client';
import type { Section, CreateSectionRequest, UpdateSectionRequest } from '../types/api';

/**
 * Получить все разделы
 */
export async function getSections(): Promise<Section[]> {
  return api.get<Section[]>('/sections');
}

/**
 * Получить раздел по ID
 */
export async function getSectionById(id: string): Promise<Section> {
  return api.get<Section>(`/sections/${id}`);
}

/**
 * Создать новый раздел
 */
export async function createSection(sectionData: CreateSectionRequest): Promise<Section> {
  return api.post<Section>('/sections', sectionData);
}

/**
 * Обновить раздел
 */
export async function updateSection(
  id: string,
  sectionData: UpdateSectionRequest
): Promise<Section> {
  return api.put<Section>(`/sections/${id}`, sectionData);
}

/**
 * Удалить раздел
 */
export async function deleteSection(id: string): Promise<void> {
  return api.delete<void>(`/sections/${id}`);
}
