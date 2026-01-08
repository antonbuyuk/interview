import express from 'express';
const router = express.Router();
import * as termsController from '../controllers/termsController.js';
import errorHandler from '../middleware/errorHandler.js';
import authAdmin from '../middleware/authAdmin.js';

router.get('/', termsController.getTerms);
// Важно: маршрут /by-name/:term должен быть ПЕРЕД /:id, иначе Express будет интерпретировать "by-name" как ID
router.get('/by-name/:term', termsController.getTermByExactName);
router.get('/:id', termsController.getTermById);
router.post('/suggestions', termsController.getTermSuggestions);
router.post('/', authAdmin, termsController.createTerm);
router.put('/:id', authAdmin, termsController.updateTerm);
router.delete('/:id', authAdmin, termsController.deleteTerm);

router.use(errorHandler);

export default router;
