import express from 'express';
import * as questionsController from '../controllers/questionsController.js';
import * as answersController from '../controllers/answersController.js';
import errorHandler from '../middleware/errorHandler.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

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

export default router;
