const prisma = require('../utils/prisma')

const getSections = async (req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    res.json(sections)
  } catch (error) {
    next(error)
  }
}

const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params

    // Try to find by UUID first, then by sectionId
    let section = await prisma.section.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            answers: true
          },
          orderBy: {
            number: 'asc'
          }
        }
      }
    })

    // If not found by UUID, try by sectionId
    if (!section) {
      section = await prisma.section.findUnique({
        where: { sectionId: id },
        include: {
          questions: {
            include: {
              answers: true
            },
            orderBy: {
              number: 'asc'
            }
          }
        }
      })
    }

    if (!section) {
      return res.status(404).json({ error: 'Section not found' })
    }

    res.json(section)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSections,
  getSectionById
}
