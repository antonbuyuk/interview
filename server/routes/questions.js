const express = require('express')
const router = express.Router()
const questionsController = require('../controllers/questionsController')
const answersController = require('../controllers/answersController')
const errorHandler = require('../middleware/errorHandler')

router.get('/', questionsController.getQuestions)
router.get('/:id', questionsController.getQuestionById)
router.post('/', questionsController.createQuestion)
router.put('/:id', questionsController.updateQuestion)
router.delete('/:id', questionsController.deleteQuestion)

// Nested routes for answers
router.get('/:questionId/answers', answersController.getAnswersByQuestion)
router.post('/:questionId/answers', answersController.createAnswer)

router.use(errorHandler)

module.exports = router
