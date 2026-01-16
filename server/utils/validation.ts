/**
 * Схемы валидации с использованием Zod
 */

import { z } from 'zod';

/**
 * Схема валидации для логина
 */
export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * Схема валидации для создания раздела
 */
export const createSectionSchema = z.object({
  sectionId: z
    .string()
    .min(1, 'sectionId is required')
    .regex(/^[a-z0-9-]+$/, 'sectionId must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  path: z.string().min(1, 'Path is required'),
  dir: z.string().min(1, 'Directory is required'),
});

/**
 * Схема валидации для обновления раздела
 */
export const updateSectionSchema = z
  .object({
    sectionId: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'sectionId must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    title: z.string().min(1, 'Title is required').optional(),
    path: z.string().min(1, 'Path is required').optional(),
    dir: z.string().min(1, 'Directory is required').optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Схема валидации для создания вопроса
 */
export const createQuestionSchema = z.object({
  sectionId: z.string().uuid('sectionId must be a valid UUID'),
  question: z.string().min(1, 'Question is required'),
  questionRaw: z.string().min(1, 'Question raw is required'),
  questionEn: z.string().optional().nullable(),
  codeBlocks: z.any().optional().nullable(),
  rawMarkdown: z.string().min(1, 'Raw markdown is required'),
  answers: z
    .array(
      z.object({
        type: z.enum(['ru', 'en', 'senior']),
        content: z.string().min(1, 'Answer content is required'),
      })
    )
    .optional(),
});

/**
 * Схема валидации для обновления вопроса
 */
export const updateQuestionSchema = z
  .object({
    sectionId: z.string().uuid('sectionId must be a valid UUID').optional(),
    number: z.number().int().positive('Number must be a positive integer').optional(),
    question: z.string().min(1, 'Question is required').optional(),
    questionRaw: z.string().min(1, 'Question raw is required').optional(),
    questionEn: z.string().optional().nullable(),
    codeBlocks: z.any().optional().nullable(),
    rawMarkdown: z.string().min(1, 'Raw markdown is required').optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Схема валидации для перевода текста
 */
export const translateTextSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  from: z.string().length(2, 'From must be a 2-letter language code').optional(),
  to: z.string().length(2, 'To must be a 2-letter language code').optional(),
});

/**
 * Схема валидации для изменения порядка вопросов
 */
export const reorderQuestionsSchema = z.object({
  questionIds: z
    .array(z.string().uuid('Question ID must be a valid UUID'))
    .min(1, 'At least one question ID is required'),
  sectionId: z.string().uuid('sectionId must be a valid UUID'),
});

/**
 * Схема валидации для создания ответа
 */
export const createAnswerSchema = z.object({
  type: z.enum(['ru', 'en', 'senior']),
  content: z.string().min(1, 'Content is required'),
});

/**
 * Схема валидации для обновления ответа
 */
export const updateAnswerSchema = z
  .object({
    type: z.enum(['ru', 'en', 'senior']).optional(),
    content: z.string().min(1, 'Content is required').optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Схема валидации для создания термина
 */
export const createTermSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  translation: z.string().min(1, 'Translation is required'),
  examples: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
});

/**
 * Схема валидации для обновления термина
 */
export const updateTermSchema = z
  .object({
    term: z.string().min(1, 'Term is required').optional(),
    translation: z.string().min(1, 'Translation is required').optional(),
    examples: z.array(z.string()).optional(),
    phrases: z.array(z.string()).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Схема валидации для получения предложений термина
 */
export const getTermSuggestionsSchema = z.object({
  term: z.string().min(1, 'Term is required'),
});

/**
 * Middleware для валидации запросов
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T
): (req: any, res: any, next: any) => void {
  return (req, res, next) => {
    try {
      // Валидируем body, query или params в зависимости от типа схемы
      const dataToValidate = req.body || req.query || req.params;
      const validated = schema.parse(dataToValidate);

      // Заменяем оригинальные данные валидированными
      if (req.body) {
        req.body = validated;
      } else if (req.query) {
        req.query = validated;
      } else if (req.params) {
        req.params = validated;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
