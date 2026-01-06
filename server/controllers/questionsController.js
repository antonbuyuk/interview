const prisma = require('../utils/prisma');

const getQuestions = async (req, res, next) => {
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

const getQuestionById = async (req, res, next) => {
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
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { sectionId, number, question, questionRaw, codeBlocks, rawMarkdown, answers } = req.body;

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
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
      return res
        .status(409)
        .json({ error: 'Question with this number already exists in this section' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        sectionId,
        number,
        question,
        questionRaw,
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

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sectionId, number, question, questionRaw, codeBlocks, rawMarkdown } = req.body;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...(sectionId && { sectionId }),
        ...(number !== undefined && { number }),
        ...(question !== undefined && { question }),
        ...(questionRaw !== undefined && { questionRaw }),
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

const deleteQuestion = async (req, res, next) => {
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

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
