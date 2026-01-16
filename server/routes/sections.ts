import express from 'express';
const router = express.Router();
import * as sectionsController from '../controllers/sectionsController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';
import { validateRequest, createSectionSchema, updateSectionSchema } from '../utils/validation.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Получить список всех разделов
 *     tags: [Sections]
 *     responses:
 *       200:
 *         description: Список разделов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Section'
 */
router.get('/', sectionsController.getSections);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Получить раздел по ID
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID или sectionId раздела
 *     responses:
 *       200:
 *         description: Раздел найден
 *       404:
 *         description: Раздел не найден
 */
router.get('/:id', sectionsController.getSectionById);
router.post(
  '/',
  authAdmin,
  writeLimiter,
  validateRequest(createSectionSchema),
  sectionsController.createSection
);
router.put(
  '/:id',
  authAdmin,
  writeLimiter,
  validateRequest(updateSectionSchema),
  sectionsController.updateSection
);
router.delete('/:id', authAdmin, writeLimiter, sectionsController.deleteSection);

router.use(errorHandler);

export default router;
