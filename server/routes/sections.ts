import express from 'express';
const router = express.Router();
import * as sectionsController from '../controllers/sectionsController';
import errorHandler from '../middleware/errorHandler';
import authAdmin from '../middleware/authAdmin';

router.get('/', sectionsController.getSections);
router.get('/:id', sectionsController.getSectionById);
router.post('/', authAdmin, sectionsController.createSection);
router.put('/:id', authAdmin, sectionsController.updateSection);
router.delete('/:id', authAdmin, sectionsController.deleteSection);

router.use(errorHandler);

export default router;
