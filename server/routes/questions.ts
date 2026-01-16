import express from 'express';
import * as questionsController from '../controllers/questionsController';
import * as answersController from '../controllers/answersController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';
import {
  validateRequest,
  createQuestionSchema,
  updateQuestionSchema,
  translateTextSchema,
  reorderQuestionsSchema,
  createAnswerSchema,
} from '../utils/validation.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Получить список вопросов
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID раздела для фильтрации
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список вопросов
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Question'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', questionsController.getQuestions);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Получить вопрос по ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID вопроса
 *     responses:
 *       200:
 *         description: Вопрос найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: Вопрос не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', questionsController.getQuestionById);
/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Создать новый вопрос
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionId
 *               - question
 *               - questionRaw
 *               - rawMarkdown
 *             properties:
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               question:
 *                 type: string
 *               questionRaw:
 *                 type: string
 *               questionEn:
 *                 type: string
 *                 nullable: true
 *               codeBlocks:
 *                 type: array
 *                 nullable: true
 *               rawMarkdown:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [ru, en, senior]
 *                     content:
 *                       type: string
 *     responses:
 *       201:
 *         description: Вопрос создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       401:
 *         description: Требуется авторизация
 *       400:
 *         description: Ошибка валидации
 */
router.post(
  '/',
  authAdmin,
  writeLimiter,
  validateRequest(createQuestionSchema),
  questionsController.createQuestion
);
router.put(
  '/:id',
  authAdmin,
  writeLimiter,
  validateRequest(updateQuestionSchema),
  questionsController.updateQuestion
);
router.delete('/:id', authAdmin, writeLimiter, questionsController.deleteQuestion);
router.post('/translate', validateRequest(translateTextSchema), questionsController.translateText);
router.post(
  '/reorder',
  authAdmin,
  writeLimiter,
  validateRequest(reorderQuestionsSchema),
  questionsController.reorderQuestions
);

// Nested routes for answers
router.get('/:questionId/answers', answersController.getAnswersByQuestion);
router.post(
  '/:questionId/answers',
  authAdmin,
  validateRequest(createAnswerSchema),
  answersController.createAnswer
);

router.use(errorHandler);

export default router;
