/**
 * Типы для API запросов и ответов
 */

import type { Prisma } from '@prisma/client';

/**
 * Типы для запросов вопросов
 */
export interface GetQuestionsQuery {
  sectionId?: string;
}

export interface CreateQuestionBody {
  sectionId: string;
  number: number;
  question: string;
  questionRaw: string;
  questionEn?: string | null;
  codeBlocks?: Prisma.JsonValue;
  rawMarkdown: string;
  answers?: CreateAnswerBody[];
}

export interface UpdateQuestionBody {
  sectionId?: string;
  number?: number;
  question?: string;
  questionRaw?: string;
  questionEn?: string | null;
  codeBlocks?: Prisma.JsonValue;
  rawMarkdown?: string;
}

export interface ReorderQuestionsBody {
  questionIds: string[]; // Array of question IDs in the new order
  sectionId: string; // Section ID to ensure questions belong to the same section
}

export interface CreateAnswerBody {
  type: 'ru' | 'en' | 'senior';
  content: string;
}

export interface UpdateAnswerBody {
  type?: 'ru' | 'en' | 'senior';
  content?: string;
}

export interface TranslateTextBody {
  text: string;
  from?: string;
  to?: string;
}

/**
 * Типы для запросов разделов
 */
export interface CreateSectionBody {
  sectionId: string;
  title: string;
  path: string;
  dir: string;
}

export interface UpdateSectionBody {
  sectionId?: string;
  title?: string;
  path?: string;
  dir?: string;
}

/**
 * Типы для запросов терминов
 */
export interface CreateTermBody {
  term: string;
  translation: string;
  examples?: string[];
  phrases?: string[];
}

export interface UpdateTermBody {
  term?: string;
  translation?: string;
  examples?: string[];
  phrases?: string[];
}

export interface GetTermsQuery {
  search?: string;
  sortBy?: string;
}
