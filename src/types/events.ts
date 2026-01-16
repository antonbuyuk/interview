/**
 * Типы для кастомных событий window
 */

import type { Section, Question } from './api';

/**
 * Событие открытия управления разделами
 */
export interface OpenManageSectionsEvent extends CustomEvent {
  type: 'open-manage-sections';
}

/**
 * Событие открытия добавления термина
 */
export interface OpenAddTermEvent extends CustomEvent {
  type: 'open-add-term';
}

/**
 * Событие открытия добавления вопроса
 */
export interface OpenAddQuestionEvent extends CustomEvent {
  type: 'open-add-question';
}

/**
 * Событие редактирования вопроса
 */
export interface EditQuestionEvent extends CustomEvent<{ question: Question }> {
  type: 'edit-question';
}

/**
 * Событие обновления текущего раздела
 */
export interface CurrentSectionUpdatedEvent extends CustomEvent<{
  sectionId?: string;
  section?: Section;
}> {
  type: 'current-section-updated';
}

/**
 * Событие hover на термине
 */
export interface TermHoverEvent extends CustomEvent<{
  term?: { id: string };
  position?: { x: number; y: number };
}> {
  type: 'term-hover';
}

/**
 * Событие обновления терминов
 */
export interface TermsUpdatedEvent extends CustomEvent {
  type: 'terms-updated';
}

/**
 * Событие обновления разделов
 */
export interface SectionsUpdatedEvent extends CustomEvent {
  type: 'sections-updated';
}

/**
 * Событие необходимости перезагрузки вопросов
 */
export interface QuestionsNeedReloadEvent extends CustomEvent {
  type: 'questions-need-reload';
}

/**
 * Событие изменения авторизации администратора
 */
export interface AdminAuthChangedEvent extends CustomEvent<{ isAdmin: boolean }> {
  type: 'admin-auth-changed';
}

/**
 * Тип для всех кастомных событий
 */
export type AppCustomEvent =
  | OpenManageSectionsEvent
  | OpenAddTermEvent
  | OpenAddQuestionEvent
  | EditQuestionEvent
  | CurrentSectionUpdatedEvent
  | TermHoverEvent
  | TermsUpdatedEvent
  | SectionsUpdatedEvent
  | QuestionsNeedReloadEvent
  | AdminAuthChangedEvent;

/**
 * Расширение Window для типизации addEventListener
 */
declare global {
  interface WindowEventMap {
    'open-manage-sections': OpenManageSectionsEvent;
    'open-add-term': OpenAddTermEvent;
    'open-add-question': OpenAddQuestionEvent;
    'edit-question': EditQuestionEvent;
    'current-section-updated': CurrentSectionUpdatedEvent;
    'term-hover': TermHoverEvent;
    'terms-updated': TermsUpdatedEvent;
    'sections-updated': SectionsUpdatedEvent;
    'questions-need-reload': QuestionsNeedReloadEvent;
    'admin-auth-changed': AdminAuthChangedEvent;
  }
}
