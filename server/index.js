import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import questionsRoutes from './routes/questions.js';
import answersRoutes from './routes/answers.js';
import termsRoutes from './routes/terms.js';
import sectionsRoutes from './routes/sections.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://antonbuyuk.github.io',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Функция для нормализации origin (убирает trailing slash и приводит к стандартному виду)
const normalizeOrigin = (origin) => {
  return origin.replace(/\/$/, '');
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Разрешаем запросы без origin (например, Postman, мобильные приложения, server-to-server)
      if (!origin) return callback(null, true);

      // Нормализуем origin для сравнения
      const normalizedOrigin = normalizeOrigin(origin);

      // Проверяем точное совпадение
      const exactMatch = allowedOrigins.some(allowed =>
        normalizeOrigin(allowed) === normalizedOrigin
      );

      // Проверяем поддомены GitHub Pages (*.github.io)
      const isGitHubPages = /^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(normalizedOrigin);

      if (exactMatch || isGitHubPages) {
        callback(null, true);
      } else {
        // В development разрешаем все
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Auth'],
    exposedHeaders: ['Content-Type'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
