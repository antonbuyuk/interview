/**
 * Контроллер для авторизации администратора
 */
const login = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const adminPassword = process.env.IS_ADMIN_PASS;

    if (!adminPassword) {
      console.error('IS_ADMIN_PASS is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Устанавливаем cookie с авторизацией
    // path: '/' чтобы cookie был доступен для всего сайта
    // httpOnly: false чтобы фронтенд мог читать cookie
    // maxAge: 30 дней в миллисекундах
    res.cookie('is_auth_admin', 'true', {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      sameSite: 'lax',
    });

    res.json({ success: true, message: 'Admin authenticated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};