/**
 * Middleware для проверки авторизации администратора
 * Проверяет наличие cookie is_auth_admin === 'true'
 */
const authAdmin = (req, res, next) => {
  const isAuthAdmin = req.cookies?.is_auth_admin === 'true';

  if (!isAuthAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  next();
};

module.exports = authAdmin;
