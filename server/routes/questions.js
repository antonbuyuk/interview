const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController');
const answersController = require('../controllers/answersController');
const errorHandler = require('../middleware/errorHandler');
const authAdmin = require('../middleware/authAdmin');

router.get('/', questionsController.getQuestions);
router.get('/:id', questionsController.getQuestionById);
router.post('/', authAdmin, questionsController.createQuestion);
router.put('/:id', authAdmin, questionsController.updateQuestion);
router.delete('/:id', authAdmin, questionsController.deleteQuestion);
router.post('/translate', questionsController.translateText);

// Nested routes for answers
router.get('/:questionId/answers', answersController.getAnswersByQuestion);
router.post('/:questionId/answers', authAdmin, answersController.createAnswer);

router.use(errorHandler);

module.exports = router;
