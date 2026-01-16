import prisma from '../utils/prisma.js';
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type { CreateAnswerBody, UpdateAnswerBody } from '../types/api';

const getAnswersByQuestion = async (
  req: ExtendedRequest<{ questionId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionId } = req.params;

    const answers = await prisma.answer.findMany({
      where: { questionId },
      orderBy: {
        type: 'asc',
      },
    });

    res.json(answers);
  } catch (error) {
    next(error);
  }
};

const createAnswer = async (
  req: ExtendedRequest<{ questionId: string }, unknown, CreateAnswerBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionId } = req.params;
    const { type, content } = req.body;

    // Validate type
    const validTypes = ['ru', 'en', 'senior'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        error: 'Invalid answer type',
        message: `Type must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Check if answer with this type already exists
    const existing = await prisma.answer.findUnique({
      where: {
        questionId_type: {
          questionId,
          type,
        },
      },
    });

    if (existing) {
      res
        .status(409)
        .json({ error: 'Answer with this type already exists for this question' });
      return;
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        type,
        content,
      },
    });

    res.status(201).json(answer);
  } catch (error) {
    next(error);
  }
};

const updateAnswer = async (
  req: ExtendedRequest<{ id: string }, unknown, UpdateAnswerBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
      },
    });

    res.json(updatedAnswer);
  } catch (error) {
    next(error);
  }
};

const deleteAnswer = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.answer.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getAnswersByQuestion, createAnswer, updateAnswer, deleteAnswer };
