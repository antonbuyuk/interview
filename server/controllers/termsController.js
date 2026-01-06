const prisma = require('../utils/prisma');

const getTerms = async (req, res, next) => {
  try {
    const { category, search, sortBy = 'term' } = req.query;

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { translation: { contains: search, mode: 'insensitive' } },
        { phrases: { some: { phrase: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = {};
    switch (sortBy) {
      case 'term':
        orderBy.term = 'asc';
        break;
      case 'translation':
        orderBy.translation = 'asc';
        break;
      case 'category':
        orderBy.category = 'asc';
        break;
      default:
        orderBy.term = 'asc';
    }

    const terms = await prisma.term.findMany({
      where,
      include: {
        examples: true,
        phrases: true,
      },
      orderBy,
    });

    res.json(terms);
  } catch (error) {
    next(error);
  }
};

const getTermById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const term = await prisma.term.findUnique({
      where: { id },
      include: {
        examples: true,
        phrases: true,
      },
    });

    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    res.json(term);
  } catch (error) {
    next(error);
  }
};

const createTerm = async (req, res, next) => {
  try {
    const { term, translation, category, categoryTitle, examples, phrases } = req.body;

    // Check if term already exists
    const existing = await prisma.term.findUnique({
      where: { term },
    });

    if (existing) {
      return res.status(409).json({ error: 'Term already exists' });
    }

    const newTerm = await prisma.term.create({
      data: {
        term,
        translation,
        category,
        categoryTitle,
        examples: examples
          ? {
              create: examples.map(example => ({
                example,
              })),
            }
          : undefined,
        phrases: phrases
          ? {
              create: phrases.map(phrase => ({
                phrase,
              })),
            }
          : undefined,
      },
      include: {
        examples: true,
        phrases: true,
      },
    });

    res.status(201).json(newTerm);
  } catch (error) {
    next(error);
  }
};

const updateTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { term, translation, category, categoryTitle, examples, phrases } = req.body;

    // If updating term name, check for conflicts
    if (term) {
      const existing = await prisma.term.findFirst({
        where: {
          term,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Term with this name already exists' });
      }
    }

    // Update term and handle examples/phrases
    const updateData = {
      ...(term !== undefined && { term }),
      ...(translation !== undefined && { translation }),
      ...(category !== undefined && { category }),
      ...(categoryTitle !== undefined && { categoryTitle }),
    };

    // Handle examples update (delete all and recreate)
    if (examples !== undefined) {
      await prisma.termExample.deleteMany({
        where: { termId: id },
      });
      updateData.examples = {
        create: examples.map(example => ({ example })),
      };
    }

    // Handle phrases update (delete all and recreate)
    if (phrases !== undefined) {
      await prisma.termPhrase.deleteMany({
        where: { termId: id },
      });
      updateData.phrases = {
        create: phrases.map(phrase => ({ phrase })),
      };
    }

    const updatedTerm = await prisma.term.update({
      where: { id },
      data: updateData,
      include: {
        examples: true,
        phrases: true,
      },
    });

    res.json(updatedTerm);
  } catch (error) {
    next(error);
  }
};

const deleteTerm = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.term.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm,
};
