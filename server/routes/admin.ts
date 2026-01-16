import express from 'express';
const router = express.Router();
import * as adminController from '../controllers/adminController';
import errorHandler from '../middleware/errorHandler.js';
import { validateRequest, loginSchema } from '../utils/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Авторизация администратора
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Пароль администратора
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *       401:
 *         description: Неверный пароль
 */
router.post('/login', authLimiter, validateRequest(loginSchema), adminController.login);
/**
 * @swagger
 * /api/admin/refresh:
 *   post:
 *     summary: Обновить access token
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Новый access token получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Невалидный refresh token
 */
router.post('/refresh', authLimiter, adminController.refresh);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Успешный выход
 */
router.post('/logout', adminController.logout);

router.use(errorHandler);

export default router;
