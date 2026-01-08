/**
 * Middleware для проверки авторизации администратора
 * Проверяет наличие заголовка X-Admin-Auth === 'true' или cookie is_auth_admin === 'true' (для обратной совместимости)
 */
const authAdmin = (req, res, next) => {
  // Проверяем заголовок X-Admin-Auth (из localStorage)
  const headerAuth = req.headers['x-admin-auth'] === 'true';
  // Проверяем cookie для обратной совместимости
  const cookieAuth = req.cookies?.is_auth_admin === 'true';

  const isAuthAdmin = headerAuth || cookieAuth;

  if (!isAuthAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  next();
};

module.exports = authAdmin;
