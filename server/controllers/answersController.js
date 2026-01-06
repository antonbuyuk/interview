const prisma = require('../utils/prisma')

const getAnswersByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params

    const answers = await prisma.answer.findMany({
      where: { questionId },
      orderBy: {
        type: 'asc'
      }
    })

    res.json(answers)
  } catch (error) {
    next(error)
  }
}

const createAnswer = async (req, res, next) => {
  try {
    const { questionId } = req.params
    const { type, content } = req.body

    // Validate type
    const validTypes = ['ru', 'en', 'senior']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid answer type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      })
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    // Check if answer with this type already exists
    const existing = await prisma.answer.findUnique({
      where: {
        questionId_type: {
          questionId,
          type
        }
      }
    })

    if (existing) {
      return res.status(409).json({ error: 'Answer with this type already exists for this question' })
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        type,
        content
      }
    })

    res.status(201).json(answer)
  } catch (error) {
    next(error)
  }
}

const updateAnswer = async (req, res, next) => {
  try {
    const { id } = req.params
    const { content } = req.body

    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: {
        ...(content !== undefined && { content })
      }
    })

    res.json(updatedAnswer)
  } catch (error) {
    next(error)
  }
}

const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.answer.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAnswersByQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer
}
