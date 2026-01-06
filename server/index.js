require('dotenv').config()
const express = require('express')
const cors = require('cors')
const questionsRoutes = require('./routes/questions')
const answersRoutes = require('./routes/answers')
const termsRoutes = require('./routes/terms')
const sectionsRoutes = require('./routes/sections')

const app = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://antonbuyuk.github.io',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, Postman, мобильные приложения)
    if (!origin) return callback(null, true)

    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true)
    } else {
      // В development разрешаем все
      if (process.env.NODE_ENV === 'development') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/questions', questionsRoutes)
app.use('/api/answers', answersRoutes)
app.use('/api/terms', termsRoutes)
app.use('/api/sections', sectionsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
