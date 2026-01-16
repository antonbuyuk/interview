import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/adminController.ts';
import errorHandler from '../middleware/errorHandler.js';

router.post('/login', adminController.login);

router.use(errorHandler);

export default router;
