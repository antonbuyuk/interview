import prisma from '../utils/prisma.js';
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type { CreateSectionBody, UpdateSectionBody } from '../types/api';

const getSections = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    res.json(sections);
  } catch (error) {
    next(error);
  }
};

const getSectionById = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Try to find by UUID first, then by sectionId
    let section = await prisma.section.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    // If not found by UUID, try by sectionId
    if (!section) {
      section = await prisma.section.findUnique({
        where: { sectionId: id },
        include: {
          questions: {
            include: {
              answers: true,
            },
            orderBy: {
              number: 'asc',
            },
          },
        },
      });
    }

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    res.json(section);
  } catch (error) {
    next(error);
  }
};

const createSection = async (
  req: ExtendedRequest<unknown, unknown, CreateSectionBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sectionId, title, path, dir } = req.body;

    // Check if sectionId already exists
    const existing = await prisma.section.findUnique({
      where: { sectionId },
    });

    if (existing) {
      res.status(409).json({ error: 'Section with this sectionId already exists' });
      return;
    }

    const newSection = await prisma.section.create({
      data: {
        sectionId,
        title,
        path,
        dir,
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    res.status(201).json(newSection);
  } catch (error) {
    next(error);
  }
};

const updateSection = async (
  req: ExtendedRequest<{ id: string }, unknown, UpdateSectionBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { sectionId, title, path, dir } = req.body;

    // If updating sectionId, check for conflicts
    if (sectionId) {
      const existing = await prisma.section.findFirst({
        where: {
          sectionId,
          NOT: { id },
        },
      });

      if (existing) {
        res.status(409).json({ error: 'Section with this sectionId already exists' });
        return;
      }
    }

    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        ...(sectionId !== undefined && { sectionId }),
        ...(title !== undefined && { title }),
        ...(path !== undefined && { path }),
        ...(dir !== undefined && { dir }),
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    res.json(updatedSection);
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if section has questions
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    if (section._count.questions > 0) {
      res.status(409).json({
        error:
          'Cannot delete section with existing questions. Please delete or move questions first.',
      });
      return;
    }

    await prisma.section.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getSections, getSectionById, createSection, updateSection, deleteSection };
