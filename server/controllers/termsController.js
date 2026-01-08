const prisma = require('../utils/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Вспомогательная функция для задержки
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Выполняет запрос к Gemini API с повторными попытками при временных ошибках
 * @param {Function} requestFn - Функция, выполняющая запрос к API
 * @param {number} maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @param {number} initialDelay - Начальная задержка в мс (по умолчанию 1000)
 * @returns {Promise} Результат запроса
 */
async function retryRequest(requestFn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Извлекаем статус код
      const statusCode = error.status || error.statusCode || error.response?.status;
      const errorMessage = error.message || '';

      // Проверяем, стоит ли повторять запрос
      // НЕ повторяем при ошибках авторизации (401) или клиентских ошибках (400)
      const shouldNotRetry =
        statusCode === 401 ||
        statusCode === 400 ||
        errorMessage.includes('401') ||
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('Invalid API key');

      if (shouldNotRetry) {
        throw error;
      }

      // Повторяем при временных ошибках сервера и сетевых проблемах
      const shouldRetry =
        statusCode === 503 ||
        statusCode === 502 ||
        statusCode === 429 ||
        statusCode === 500 ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('fetch failed');

      // Если это последняя попытка или ошибка не требует повтора, выбрасываем ошибку
      if (attempt === maxRetries - 1 || !shouldRetry) {
        throw error;
      }

      // Вычисляем задержку с экспоненциальным backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        `Error: ${errorMessage.substring(0, 100)}`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

const getTerms = async (req, res, next) => {
  try {
    const { search, sortBy = 'term' } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { translation: { contains: search, mode: 'insensitive' } },
        { phrases: { some: { phrase: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = {};
    switch (sortBy) {
      case 'term':
        orderBy.term = 'asc';
        break;
      case 'translation':
        orderBy.translation = 'asc';
        break;
      default:
        orderBy.term = 'asc';
    }

    const terms = await prisma.term.findMany({
      where,
      include: {
        examples: true,
        phrases: true,
      },
      orderBy,
    });

    res.json(terms);
  } catch (error) {
    next(error);
  }
};

const getTermById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const term = await prisma.term.findUnique({
      where: { id },
      include: {
        examples: true,
        phrases: true,
      },
    });

    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    res.json(term);
  } catch (error) {
    next(error);
  }
};

const createTerm = async (req, res, next) => {
  try {
    const { term, translation, examples, phrases } = req.body;

    // Check if term already exists
    const existing = await prisma.term.findUnique({
      where: { term },
    });

    if (existing) {
      return res.status(409).json({ error: 'Term already exists' });
    }

    const newTerm = await prisma.term.create({
      data: {
        term,
        translation,
        examples: examples
          ? {
              create: examples.map(example => ({
                example,
              })),
            }
          : undefined,
        phrases: phrases
          ? {
              create: phrases.map(phrase => ({
                phrase,
              })),
            }
          : undefined,
      },
      include: {
        examples: true,
        phrases: true,
      },
    });

    res.status(201).json(newTerm);
  } catch (error) {
    next(error);
  }
};

const updateTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { term, translation, examples, phrases } = req.body;

    // If updating term name, check for conflicts
    if (term) {
      const existing = await prisma.term.findFirst({
        where: {
          term,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Term with this name already exists' });
      }
    }

    // Update term and handle examples/phrases
    const updateData = {
      ...(term !== undefined && { term }),
      ...(translation !== undefined && { translation }),
    };

    // Handle examples update (delete all and recreate)
    if (examples !== undefined) {
      await prisma.termExample.deleteMany({
        where: { termId: id },
      });
      updateData.examples = {
        create: examples.map(example => ({ example })),
      };
    }

    // Handle phrases update (delete all and recreate)
    if (phrases !== undefined) {
      await prisma.termPhrase.deleteMany({
        where: { termId: id },
      });
      updateData.phrases = {
        create: phrases.map(phrase => ({ phrase })),
      };
    }

    const updatedTerm = await prisma.term.update({
      where: { id },
      data: updateData,
      include: {
        examples: true,
        phrases: true,
      },
    });

    res.json(updatedTerm);
  } catch (error) {
    next(error);
  }
};

const deleteTerm = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.term.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getTermSuggestions = async (req, res, next) => {
  try {
    const { term } = req.body;

    // Валидация: термин должен быть не пустым и минимум 2 символа
    if (!term || typeof term !== 'string' || term.trim().length < 2) {
      return res.status(400).json({ error: 'Term must be at least 2 characters long' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY is not set or is empty');
      return res.status(503).json({
        error: 'Gemini API key is not configured',
        message: 'Please set GEMINI_API_KEY environment variable',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Ты помощник для создания словаря технических терминов на английском языке.

Для английского термина "${term.trim()}" предоставь:
1. Перевод на русский язык (краткий и точный)
2. 3-5 распространенных словосочетаний с этим термином (на английском)
3. 3-5 примеров предложений с использованием термина (на английском)

ВАЖНО: Верни ответ ТОЛЬКО в формате JSON без дополнительных комментариев, markdown разметки или пояснений. Только чистый JSON:
{
  "translation": "перевод на русский",
  "phrases": ["словосочетание 1", "словосочетание 2", "словосочетание 3"],
  "examples": ["пример предложения 1", "пример предложения 2", "пример предложения 3"]
}`;

    console.log('Sending request to Gemini for term:', term.trim());

    // Выполняем запрос с повторными попытками при временных ошибках
    const result = await retryRequest(
      async () => {
        return await model.generateContent(prompt);
      },
      3, // максимум 3 попытки
      1000 // начальная задержка 1 секунда
    );

    console.log('Gemini response received');

    const response = result.response;
    const content = response.text();

    if (!content) {
      return res.status(500).json({ error: 'Failed to get response from Gemini' });
    }

    // Парсим JSON ответ
    let suggestions;
    try {
      // Убираем возможные markdown code blocks (на случай если модель их добавит)
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content);
      console.error('Parse error:', parseError.message);
      return res
        .status(500)
        .json({ error: 'Failed to parse AI response', details: parseError.message });
    }

    // Валидация структуры ответа
    if (
      !suggestions.translation ||
      !Array.isArray(suggestions.phrases) ||
      !Array.isArray(suggestions.examples)
    ) {
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }

    res.json({
      translation: suggestions.translation.trim(),
      phrases: suggestions.phrases.filter(p => p && p.trim()).map(p => p.trim()),
      examples: suggestions.examples.filter(e => e && e.trim()).map(e => e.trim()),
    });
  } catch (error) {
    console.error('Error getting term suggestions:', error);
    console.error(
      'Full error object:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    // Извлекаем статус код из разных возможных мест
    const statusCode = error.status || error.statusCode || error.response?.status || error.code;
    const errorMessage = error.message || 'Unknown error';

    console.error('Error details:', {
      message: errorMessage,
      status: error.status,
      statusCode: error.statusCode,
      responseStatus: error.response?.status,
      code: error.code,
      type: error.constructor.name,
      name: error.name,
      stack: error.stack,
    });

    // Обработка ошибок Gemini API - проверка API ключа
    if (
      statusCode === 401 ||
      errorMessage.includes('401') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('Invalid API key') ||
      errorMessage.includes('API key not valid')
    ) {
      return res.status(503).json({
        error: 'Gemini authentication failed',
        message:
          'Invalid API key. Please check GEMINI_API_KEY environment variable and ensure it is correct.',
      });
    }

    // Обработка ошибок квоты и лимитов
    if (
      statusCode === 429 ||
      errorMessage.includes('429') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota')
    ) {
      return res.status(503).json({
        error: 'Gemini rate limit exceeded',
        message: 'Too many requests or quota exceeded. Please try again later.',
      });
    }

    // Обработка ошибок сервера Gemini
    if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
      return res.status(503).json({
        error: 'Gemini service error',
        message: `Gemini API returned error ${statusCode}. Please try again later.`,
      });
    }

    // Обработка сетевых ошибок и таймаутов
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed')
    ) {
      return res.status(503).json({
        error: 'Gemini connection failed',
        message:
          'Could not connect to Gemini API. Please check your internet connection and try again.',
      });
    }

    // Обработка ошибок "Error fetching from" - обычно это проблемы с API ключом или сетью
    if (
      errorMessage.includes('Error fetching from') ||
      errorMessage.includes('generativelanguage.googleapis.com')
    ) {
      // Проверяем, установлен ли API ключ
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(503).json({
          error: 'Gemini API key not configured',
          message:
            'GEMINI_API_KEY environment variable is not set. Please add it to your .env file.',
        });
      }

      return res.status(503).json({
        error: 'Gemini service unavailable',
        message:
          'Failed to connect to Gemini API. Please check: 1) Your API key is correct, 2) You have internet connection, 3) Gemini service is available.',
      });
    }

    // Если это ошибка Gemini, но статус неизвестен
    if (
      errorMessage.includes('Gemini') ||
      errorMessage.includes('GoogleGenerativeAI') ||
      error.constructor.name === 'GoogleGenerativeAIError'
    ) {
      return res.status(503).json({
        error: 'Gemini service unavailable',
        message: errorMessage || 'An error occurred while communicating with Gemini API',
      });
    }

    // Для остальных ошибок используем стандартный обработчик
    next(error);
  }
};

module.exports = {
  getTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm,
  getTermSuggestions,
};
