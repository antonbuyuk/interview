import prisma from '../utils/prisma.js';
import cache from '../utils/cache.js';
import { translate } from '@vitalets/google-translate-api';
import { Prisma } from '@prisma/client';
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type {
  GetQuestionsQuery,
  CreateQuestionBody,
  UpdateQuestionBody,
  TranslateTextBody,
  ReorderQuestionsBody,
} from '../types/api';

const CACHE_TTL_QUESTIONS = 2 * 60 * 1000; // 2 минуты для вопросов

const getQuestions = async (
  req: ExtendedRequest<unknown, unknown, unknown, GetQuestionsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId, page, limit } = req.query;

    const where = sectionId ? { sectionId } : {};

    // Пагинация опциональна - если не указана, возвращаем все данные
    const usePagination = page !== undefined || limit !== undefined;
    const pageNumber = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSize = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50; // Максимум 100, по умолчанию 50
    const skip = usePagination ? (pageNumber - 1) * pageSize : undefined;
    const take = usePagination ? pageSize : undefined;

    // Ключ кеша зависит от параметров запроса
    const cacheKey = `questions:${sectionId || 'all'}:${pageNumber}:${pageSize}`;

    // Проверяем кеш только для непагинированных запросов (для обратной совместимости)
    if (!usePagination) {
      const cached = cache.get<unknown[]>(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
    }

    // Получаем общее количество для пагинации (только если используется пагинация)
    const total = usePagination ? await prisma.question.count({ where }) : undefined;

    // Получаем вопросы
    const questions = await prisma.question.findMany({
      where,
      include: {
        section: true,
        answers: {
          orderBy: {
            type: 'asc',
          },
        },
      },
      orderBy: [{ sectionId: 'asc' }, { number: 'asc' }],
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });

    // Если используется пагинация, возвращаем с метаинформацией
    if (usePagination && total !== undefined) {
      res.json({
        data: questions,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNextPage: pageNumber * pageSize < total,
          hasPreviousPage: pageNumber > 1,
        },
      });
    } else {
      // Для обратной совместимости возвращаем просто массив
      // Сохраняем в кеш только непагинированные запросы
      cache.set(cacheKey, questions, CACHE_TTL_QUESTIONS);
      res.json(questions);
    }
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        section: true,
        answers: {
          orderBy: {
            type: 'asc',
          },
        },
      },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (
  req: ExtendedRequest<unknown, unknown, CreateQuestionBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId, question, questionRaw, questionEn, codeBlocks, rawMarkdown, answers } =
      req.body;

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    // Always create new questions at the beginning (number: 1)
    // All existing questions will be shifted by +1
    const targetNumber = 1;

    // Find all questions that need to be shifted (number >= 1)
    const questionsToShift = await prisma.question.findMany({
      where: {
        sectionId,
        number: { gte: targetNumber },
      },
      orderBy: { number: 'desc' }, // Shift from highest to lowest to avoid unique constraint conflicts
    });

    // Use transaction to atomically shift questions and create new one
    const newQuestion = await prisma.$transaction(async tx => {
      // Shift existing questions by +1
      for (const q of questionsToShift) {
        await tx.question.update({
          where: { id: q.id },
          data: { number: q.number + 1 },
        });
      }

      // Create new question with number: 1
      return tx.question.create({
        data: {
          sectionId,
          number: targetNumber,
          question,
          questionRaw,
          questionEn: questionEn || undefined,
          codeBlocks: codeBlocks || undefined,
          rawMarkdown,
          answers: answers
            ? {
                create: answers.map(answer => ({
                  type: answer.type,
                  content: answer.content,
                })),
              }
            : undefined,
        },
        include: {
          section: true,
          answers: true,
        },
      });
    });

    // Инвалидируем кеш вопросов для этого раздела
    cache.deletePattern(`questions:${sectionId}:`);
    cache.deletePattern('questions:all:');

    res.status(201).json(newQuestion);
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (
  req: ExtendedRequest<{ id: string }, unknown, UpdateQuestionBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { sectionId, number, question, questionRaw, questionEn, codeBlocks, rawMarkdown } =
      req.body;

    // Получаем текущий вопрос для проверки изменений
    const currentQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!currentQuestion) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Check if section exists (if changing section)
    const isSectionChanging = sectionId && sectionId !== currentQuestion.sectionId;
    if (isSectionChanging) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
      });

      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }
    }

    const isNumberChanging = number !== undefined && number !== currentQuestion.number;
    const targetSectionId = sectionId || currentQuestion.sectionId;
    const targetNumber = number !== undefined ? number : currentQuestion.number;

    // If section or number is changing, we need to handle shifting
    if (isSectionChanging || isNumberChanging) {
      const oldNumber = currentQuestion.number;
      const newNumber = targetNumber;
      const oldSectionId = currentQuestion.sectionId;
      const newSectionId = targetSectionId;

      // Find questions that need to be shifted in the target section
      // If moving to a different section, we need to shift questions in the new section
      // If moving to a higher number in the same section, shift questions in range (oldNumber, newNumber] down
      // If moving to a lower number in the same section, shift questions in range [newNumber, oldNumber) up
      let questionsToShift;

      if (isSectionChanging) {
        // Moving to a different section: shift all questions with number >= targetNumber in new section
        questionsToShift = await prisma.question.findMany({
          where: {
            sectionId: newSectionId,
            number: { gte: newNumber },
          },
          orderBy: { number: 'desc' }, // Shift from highest to lowest
        });
      } else if (newNumber > oldNumber) {
        // Moving to a higher number in same section: shift questions in range (oldNumber, newNumber] down by -1
        // Must shift from highest to lowest to avoid conflicts (e.g., if moving 2->5, shift 5->4, then 4->3, then 3->2)
        questionsToShift = await prisma.question.findMany({
          where: {
            sectionId: newSectionId,
            number: { gt: oldNumber, lte: newNumber },
            id: { not: id }, // Exclude current question
          },
          orderBy: { number: 'desc' }, // Shift from highest to lowest to avoid unique constraint conflicts
        });
      } else {
        // Moving to a lower number in same section: shift questions in range [newNumber, oldNumber) up by +1
        questionsToShift = await prisma.question.findMany({
          where: {
            sectionId: newSectionId,
            number: { gte: newNumber, lt: oldNumber },
            id: { not: id }, // Exclude current question
          },
          orderBy: { number: 'desc' }, // Shift from highest to lowest
        });
      }

      // Use transaction to atomically shift questions and update current one
      const updatedQuestion = await prisma.$transaction(async tx => {
        // Shift other questions
        for (const q of questionsToShift) {
          // If moving to different section, always shift up
          // If moving within same section, shift based on direction
          const shiftAmount = isSectionChanging ? 1 : newNumber > oldNumber ? -1 : 1;
          await tx.question.update({
            where: { id: q.id },
            data: {
              number: q.number + shiftAmount,
            },
          });
        }

        // Update current question
        return tx.question.update({
          where: { id },
          data: {
            ...(isSectionChanging && {
              section: {
                connect: { id: newSectionId },
              },
            }),
            number: newNumber,
            ...(question !== undefined && { question }),
            ...(questionRaw !== undefined && { questionRaw }),
            ...(questionEn !== undefined && { questionEn }),
            ...(codeBlocks !== undefined && {
              codeBlocks: codeBlocks === null ? Prisma.JsonNull : codeBlocks,
            }),
            ...(rawMarkdown !== undefined && { rawMarkdown }),
          },
          include: {
            section: true,
            answers: true,
          },
        });
      });

      // Инвалидируем кеш вопросов
      cache.deletePattern(`questions:${targetSectionId}:`);
      cache.deletePattern('questions:all:');

      res.json(updatedQuestion);
      return;
    }

    // If only other fields are changing (not section or number), update normally
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(questionRaw !== undefined && { questionRaw }),
        ...(questionEn !== undefined && { questionEn }),
        ...(codeBlocks !== undefined && {
          codeBlocks: codeBlocks === null ? Prisma.JsonNull : codeBlocks,
        }),
        ...(rawMarkdown !== undefined && { rawMarkdown }),
      },
      include: {
        section: true,
        answers: true,
      },
    });

    // Инвалидируем кеш вопросов для этого раздела
    cache.deletePattern(`questions:${currentQuestion.sectionId}:`);
    cache.deletePattern('questions:all:');

    res.json(updatedQuestion);
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Получаем вопрос перед удалением для инвалидации кеша
    const question = await prisma.question.findUnique({
      where: { id },
      select: { sectionId: true },
    });

    await prisma.question.delete({
      where: { id },
    });

    // Инвалидируем кеш вопросов
    if (question) {
      cache.deletePattern(`questions:${question.sectionId}:`);
    }
    cache.deletePattern('questions:all:');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const translateText = async (
  req: ExtendedRequest<unknown, unknown, TranslateTextBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, from = 'ru', to = 'en' } = req.body;

    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    try {
      const result = await translate(text, { from, to });
      res.json({ translatedText: result.text });
    } catch (translateError) {
      // Если ошибка rate limit, возвращаем специальный код
      if (translateError instanceof Error && translateError.message.includes('Too Many Requests')) {
        res.status(429).json({
          error: 'Translation service is temporarily unavailable. Please try again later.',
          code: 'RATE_LIMIT',
        });
        return;
      }
      throw translateError;
    }
  } catch (error) {
    next(error);
  }
};

const reorderQuestions = async (
  req: ExtendedRequest<unknown, unknown, ReorderQuestionsBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionIds, sectionId } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      res.status(400).json({ error: 'questionIds must be a non-empty array' });
      return;
    }

    if (!sectionId) {
      res.status(400).json({ error: 'sectionId is required' });
      return;
    }

    // Verify all questions belong to the specified section
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        sectionId,
      },
    });

    if (questions.length !== questionIds.length) {
      res.status(400).json({
        error: 'Some questions not found or do not belong to the specified section',
      });
      return;
    }

    // Use transaction to atomically update all question numbers
    // First, set all questions to temporary negative numbers to avoid unique constraint conflicts
    // Then set the correct numbers
    await prisma.$transaction(async tx => {
      // Step 1: Set all questions to temporary negative numbers
      for (let i = 0; i < questionIds.length; i++) {
        await tx.question.update({
          where: { id: questionIds[i] },
          data: { number: -(i + 1) },
        });
      }

      // Step 2: Set correct numbers based on new order
      for (let i = 0; i < questionIds.length; i++) {
        await tx.question.update({
          where: { id: questionIds[i] },
          data: { number: i + 1 },
        });
      }
    });

    // Return updated questions
    const updatedQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        section: true,
        answers: true,
      },
      orderBy: { number: 'asc' },
    });

    res.json(updatedQuestions);
  } catch (error) {
    next(error);
  }
};

export {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  translateText,
  reorderQuestions,
};
