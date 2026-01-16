import express from 'express';
const router = express.Router();
import * as answersController from '../controllers/answersController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';

router.put('/:id', authAdmin, answersController.updateAnswer);
router.delete('/:id', authAdmin, answersController.deleteAnswer);

router.use(errorHandler);

export default router;
