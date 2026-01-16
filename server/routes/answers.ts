import express from 'express';
const router = express.Router();
import * as answersController from '../controllers/answersController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';
import { validateRequest, updateAnswerSchema } from '../utils/validation.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

router.put(
  '/:id',
  authAdmin,
  writeLimiter,
  validateRequest(updateAnswerSchema),
  answersController.updateAnswer
);
router.delete('/:id', authAdmin, writeLimiter, answersController.deleteAnswer);

router.use(errorHandler);

export default router;
