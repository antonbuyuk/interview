import prisma from '../utils/prisma.js';
import { translate } from '@vitalets/google-translate-api';
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type {
  GetQuestionsQuery,
  CreateQuestionBody,
  UpdateQuestionBody,
  TranslateTextBody,
} from '../types/api';

const getQuestions = async (
  req: ExtendedRequest<unknown, unknown, unknown, GetQuestionsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId } = req.query;

    const where = sectionId ? { sectionId } : {};

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
    });

    res.json(questions);
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
    const {
      sectionId,
      number,
      question,
      questionRaw,
      questionEn,
      codeBlocks,
      rawMarkdown,
      answers,
    } = req.body;

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    // Check if question number already exists in section
    const existing = await prisma.question.findUnique({
      where: {
        sectionId_number: {
          sectionId,
          number,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        error: 'Question with this number already exists in this section',
      });
      return;
    }

    const newQuestion = await prisma.question.create({
      data: {
        sectionId,
        number,
        question,
        questionRaw,
        questionEn: questionEn || null,
        codeBlocks: codeBlocks || null,
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

    // Если изменяется раздел или номер, проверяем уникальность
    if (
      (sectionId && sectionId !== currentQuestion.sectionId) ||
      (number !== undefined && number !== currentQuestion.number)
    ) {
      const targetSectionId = sectionId || currentQuestion.sectionId;
      const targetNumber = number !== undefined ? number : currentQuestion.number;

      // Проверяем, существует ли уже вопрос с таким номером в целевом разделе
      const existing = await prisma.question.findUnique({
        where: {
          sectionId_number: {
            sectionId: targetSectionId,
            number: targetNumber,
          },
        },
      });

      // Если найден другой вопрос (не текущий) с таким номером в целевом разделе
      if (existing && existing.id !== id) {
        res.status(409).json({
          error: 'Question with this number already exists in this section',
        });
        return;
      }

      // Проверяем, что раздел существует
      if (sectionId && sectionId !== currentQuestion.sectionId) {
        const section = await prisma.section.findUnique({
          where: { id: sectionId },
        });

        if (!section) {
          res.status(404).json({ error: 'Section not found' });
          return;
        }
      }
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...(sectionId && { sectionId }),
        ...(number !== undefined && { number }),
        ...(question !== undefined && { question }),
        ...(questionRaw !== undefined && { questionRaw }),
        ...(questionEn !== undefined && { questionEn }),
        ...(codeBlocks !== undefined && { codeBlocks }),
        ...(rawMarkdown !== undefined && { rawMarkdown }),
      },
      include: {
        section: true,
        answers: true,
      },
    });

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

    await prisma.question.delete({
      where: { id },
    });

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
      if (
        translateError instanceof Error &&
        translateError.message.includes('Too Many Requests')
      ) {
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

export { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, translateText };
