import express from 'express';
const router = express.Router();
import * as termsController from '../controllers/termsController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';
import {
  validateRequest,
  createTermSchema,
  updateTermSchema,
  getTermSuggestionsSchema,
} from '../utils/validation.js';
import { groqLimiter, writeLimiter } from '../middleware/rateLimiter.js';

router.get('/', termsController.getTerms);
// Важно: маршрут /by-name/:term должен быть ПЕРЕД /:id, иначе Express будет интерпретировать "by-name" как ID
router.get('/by-name/:term', async (req, res, next) => {
  const { default: logger } = await import('../utils/logger.js');
  logger.debug({ term: req.params.term }, 'Route /by-name/:term matched');
  termsController.getTermByExactName(req, res, next);
});
router.get('/:id', termsController.getTermById);
router.post(
  '/suggestions',
  groqLimiter,
  validateRequest(getTermSuggestionsSchema),
  termsController.getTermSuggestions
);
router.post(
  '/',
  authAdmin,
  writeLimiter,
  validateRequest(createTermSchema),
  termsController.createTerm
);
router.put(
  '/:id',
  authAdmin,
  writeLimiter,
  validateRequest(updateTermSchema),
  termsController.updateTerm
);
router.delete('/:id', authAdmin, writeLimiter, termsController.deleteTerm);

router.use(errorHandler);

export default router;
