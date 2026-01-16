/**
 * Type guards для безопасной проверки типов во время выполнения
 */

import type { AnswerType, Term, Question, Section, Answer, CodeBlock } from '../types/api';

/**
 * Проверяет, является ли значение типом AnswerType
 */
export function isAnswerType(value: unknown): value is AnswerType {
  return typeof value === 'string' && (value === 'ru' || value === 'en' || value === 'senior');
}

/**
 * Проверяет, является ли значение объектом Term
 */
export function isTerm(value: unknown): value is Term {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const term = value as Record<string, unknown>;

  return (
    typeof term.id === 'string' &&
    typeof term.term === 'string' &&
    typeof term.translation === 'string' &&
    typeof term.createdAt === 'string' &&
    typeof term.updatedAt === 'string' &&
    (term.examples === undefined || Array.isArray(term.examples)) &&
    (term.phrases === undefined || Array.isArray(term.phrases))
  );
}

/**
 * Проверяет, является ли значение массивом Term
 */
export function isTermArray(value: unknown): value is Term[] {
  return Array.isArray(value) && value.every(isTerm);
}

/**
 * Проверяет, является ли значение объектом CodeBlock
 */
export function isCodeBlock(value: unknown): value is CodeBlock {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const block = value as Record<string, unknown>;

  return typeof block.language === 'string' && typeof block.code === 'string';
}

/**
 * Проверяет, является ли значение массивом CodeBlock
 */
export function isCodeBlockArray(value: unknown): value is CodeBlock[] {
  return Array.isArray(value) && value.every(isCodeBlock);
}

/**
 * Проверяет, является ли значение объектом Answer
 */
export function isAnswer(value: unknown): value is Answer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const answer = value as Record<string, unknown>;

  return (
    typeof answer.id === 'string' &&
    typeof answer.questionId === 'string' &&
    isAnswerType(answer.type) &&
    typeof answer.content === 'string' &&
    typeof answer.createdAt === 'string' &&
    typeof answer.updatedAt === 'string'
  );
}

/**
 * Проверяет, является ли значение массивом Answer
 */
export function isAnswerArray(value: unknown): value is Answer[] {
  return Array.isArray(value) && value.every(isAnswer);
}

/**
 * Проверяет, является ли значение объектом Question
 */
export function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const question = value as Record<string, unknown>;

  return (
    typeof question.id === 'string' &&
    typeof question.sectionId === 'string' &&
    typeof question.number === 'number' &&
    typeof question.question === 'string' &&
    typeof question.questionRaw === 'string' &&
    (question.questionEn === null || typeof question.questionEn === 'string') &&
    (question.codeBlocks === null || isCodeBlockArray(question.codeBlocks)) &&
    typeof question.rawMarkdown === 'string' &&
    typeof question.createdAt === 'string' &&
    typeof question.updatedAt === 'string' &&
    (question.answers === undefined || isAnswerArray(question.answers))
  );
}

/**
 * Проверяет, является ли значение массивом Question
 */
export function isQuestionArray(value: unknown): value is Question[] {
  return Array.isArray(value) && value.every(isQuestion);
}

/**
 * Проверяет, является ли значение объектом Section
 */
export function isSection(value: unknown): value is Section {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return (
    typeof section.id === 'string' &&
    typeof section.sectionId === 'string' &&
    typeof section.title === 'string' &&
    typeof section.path === 'string' &&
    typeof section.dir === 'string' &&
    typeof section.createdAt === 'string' &&
    typeof section.updatedAt === 'string' &&
    (section.questions === undefined || isQuestionArray(section.questions)) &&
    (section._count === undefined ||
      (typeof section._count === 'object' &&
        section._count !== null &&
        typeof (section._count as Record<string, unknown>).questions === 'number'))
  );
}

/**
 * Проверяет, является ли значение массивом Section
 */
export function isSectionArray(value: unknown): value is Section[] {
  return Array.isArray(value) && value.every(isSection);
}

/**
 * Проверяет, является ли значение строкой (не пустой)
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Проверяет, является ли значение числом (положительным)
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/**
 * Проверяет, является ли значение валидным UUID
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
