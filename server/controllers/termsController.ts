import prisma from '../utils/prisma.js';
import Groq from 'groq-sdk';
import type { Response, NextFunction } from 'express';
import type { ExtendedRequest } from '../types/express';
import type {
  CreateTermBody,
  UpdateTermBody,
  GetTermsQuery,
  GetTermSuggestionsBody,
} from '../types/api';
import logger from '../utils/logger.js';

/**
 * Вспомогательная функция для задержки
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Выполняет запрос к Groq API с повторными попытками при временных ошибках
 * @param requestFn - Функция, выполняющая запрос к API
 * @param maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @param initialDelay - Начальная задержка в мс (по умолчанию 1000)
 * @returns Результат запроса
 */
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Извлекаем статус код
      const statusCode =
        (error as { status?: number }).status ||
        (error as { statusCode?: number }).statusCode ||
        (error as { response?: { status?: number } }).response?.status;
      const errorMessage = (error as Error).message || '';

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
        (error as { code?: string }).code === 'ETIMEDOUT' ||
        (error as { code?: string }).code === 'ECONNREFUSED' ||
        (error as { code?: string }).code === 'ENOTFOUND' ||
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
      logger.warn(
        {
          attempt: attempt + 1,
          delay,
          error: errorMessage.substring(0, 100),
        },
        'Request failed, retrying...'
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

const getTerms = async (
  req: ExtendedRequest<unknown, unknown, unknown, GetTermsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, sortBy = 'term' } = req.query;

    const where: {
      OR?: Array<{
        term?: { contains: string; mode: 'insensitive' };
        translation?: { contains: string; mode: 'insensitive' };
        phrases?: { some: { phrase: { contains: string; mode: 'insensitive' } } };
      }>;
    } = {};

    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { translation: { contains: search, mode: 'insensitive' } },
        { phrases: { some: { phrase: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: { term?: 'asc'; translation?: 'asc' } = {};
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

const getTermById = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
      res.status(404).json({ error: 'Term not found' });
      return;
    }

    res.json(term);
  } catch (error) {
    next(error);
  }
};

const getTermByExactName = async (
  req: ExtendedRequest<{ term: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { term: termName } = req.params;
    logger.debug({ term: termName }, 'getTermByExactName called');

    if (!termName || termName.trim().length === 0) {
      res.status(400).json({ error: 'Term name is required' });
      return;
    }

    const trimmedTerm = termName.trim().toLowerCase();

    // Поиск по точному совпадению (case-insensitive)
    // Используем findMany и берем первый результат для совместимости
    const terms = await prisma.term.findMany({
      where: {
        term: {
          equals: trimmedTerm,
          mode: 'insensitive',
        },
      },
      include: {
        examples: true,
        phrases: true,
      },
    });

    if (!terms || terms.length === 0) {
      res.status(404).json({ error: 'Term not found' });
      return;
    }

    res.json(terms[0]);
  } catch (error) {
    logger.error({ error, term: termName }, 'Error in getTermByExactName');
    next(error);
  }
};

const createTerm = async (
  req: ExtendedRequest<unknown, unknown, CreateTermBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { term, translation, examples, phrases } = req.body;

    // Check if term already exists
    const existing = await prisma.term.findUnique({
      where: { term },
    });

    if (existing) {
      res.status(409).json({ error: 'Term already exists' });
      return;
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

const updateTerm = async (
  req: ExtendedRequest<{ id: string }, unknown, UpdateTermBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
        res.status(409).json({ error: 'Term with this name already exists' });
        return;
      }
    }

    // Update term and handle examples/phrases
    const updateData: {
      term?: string;
      translation?: string;
      examples?: { create: Array<{ example: string }> };
      phrases?: { create: Array<{ phrase: string }> };
    } = {
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

const deleteTerm = async (
  req: ExtendedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

const getTermSuggestions = async (
  req: ExtendedRequest<unknown, unknown, GetTermSuggestionsBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { term } = req.body;

    // Валидация: термин должен быть не пустым и минимум 2 символа
    if (!term || typeof term !== 'string' || term.trim().length < 2) {
      res.status(400).json({ error: 'Term must be at least 2 characters long' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('GROQ_API_KEY is not set or is empty');
      res.status(503).json({
        error: 'Groq API key is not configured',
        message: 'Please set GROQ_API_KEY environment variable',
      });
      return;
    }

    const groq = new Groq({ apiKey });

    const prompt = `Ты помощник для создания словаря IT и технических терминов на английском языке.

КОНТЕКСТ: Все термины относятся к области информационных технологий (IT), программирования, веб-разработки, компьютерных наук и смежных технических областей.

Для английского IT-термина "${term}" предоставь:
1. Перевод на русский язык (краткий и точный, используй принятые в IT-сообществе термины)
2. 3-5 распространенных словосочетаний с этим термином в IT-контексте (на английском, например: "web development", "API endpoint", "database query")
3. 3-5 примеров предложений с использованием термина в IT-контексте (на английском, примеры должны быть связаны с программированием, разработкой, технологиями)

ВАЖНО:
- Все примеры и словосочетания должны быть связаны с IT, программированием или технологиями
- Используй профессиональную IT-терминологию
- Верни ответ ТОЛЬКО в формате JSON без дополнительных комментариев, markdown разметки или пояснений. Только чистый JSON:
{
  "translation": "перевод на русский",
  "phrases": ["словосочетание 1", "словосочетание 2", "словосочетание 3"],
  "examples": ["пример предложения 1", "пример предложения 2", "пример предложения 3"]
}`;

    console.log('Sending request to Groq for term:', term);

    // Выполняем запрос с повторными попытками при временных ошибках
    const result = await retryRequest(
      async () => {
        return await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        });
      },
      3, // максимум 3 попытки
      1000 // начальная задержка 1 секунда
    );

    console.log('Groq response received');

    const content = result.choices[0]?.message?.content;

    if (!content) {
      res.status(500).json({ error: 'Failed to get response from Groq' });
      return;
    }

    // Парсим JSON ответ
    let suggestions: {
      translation: string;
      phrases: string[];
      examples: string[];
    };
    try {
      // Убираем возможные markdown code blocks (на случай если модель их добавит)
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      logger.error(
        {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          content: content.substring(0, 500), // Ограничиваем длину для логов
          term,
        },
        'Failed to parse Groq response'
      );
      res.status(500).json({
        error: 'Failed to parse AI response',
        details: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return;
    }

    // Валидация структуры ответа
    if (
      !suggestions.translation ||
      !Array.isArray(suggestions.phrases) ||
      !Array.isArray(suggestions.examples)
    ) {
      res.status(500).json({ error: 'Invalid response format from AI' });
      return;
    }

    res.json({
      translation: suggestions.translation.trim(),
      phrases: suggestions.phrases.filter(p => p && p.trim()).map(p => p.trim()),
      examples: suggestions.examples.filter(e => e && e.trim()).map(e => e.trim()),
    });
  } catch (error) {
    const statusCode =
      (error as { status?: number }).status ||
      (error as { statusCode?: number }).statusCode ||
      (error as { response?: { status?: number } }).response?.status ||
      (error as { code?: number }).code;
    const errorMessage = (error as Error).message || 'Unknown error';

    logger.error(
      {
        error: errorMessage,
        statusCode,
        term,
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error getting term suggestions'
    );

    // Обработка ошибок Groq API - проверка API ключа
    if (
      statusCode === 401 ||
      errorMessage.includes('401') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('Invalid API key') ||
      errorMessage.includes('API key not valid')
    ) {
      res.status(503).json({
        error: 'Groq authentication failed',
        message:
          'Invalid API key. Please check GROQ_API_KEY environment variable and ensure it is correct.',
      });
      return;
    }

    // Обработка ошибок квоты и лимитов
    if (
      statusCode === 429 ||
      errorMessage.includes('429') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota')
    ) {
      res.status(503).json({
        error: 'Groq rate limit exceeded',
        message: 'Too many requests or quota exceeded. Please try again later.',
      });
      return;
    }

    // Обработка ошибок сервера Groq
    if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
      res.status(503).json({
        error: 'Groq service error',
        message: `Groq API returned error ${statusCode}. Please try again later.`,
      });
      return;
    }

    // Обработка сетевых ошибок и таймаутов
    if (
      (error as { code?: string }).code === 'ECONNREFUSED' ||
      (error as { code?: string }).code === 'ETIMEDOUT' ||
      (error as { code?: string }).code === 'ENOTFOUND' ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed')
    ) {
      res.status(503).json({
        error: 'Groq connection failed',
        message:
          'Could not connect to Groq API. Please check your internet connection and try again.',
      });
      return;
    }

    // Обработка ошибок "Error fetching from" - обычно это проблемы с API ключом или сетью
    if (errorMessage.includes('Error fetching from')) {
      // Проверяем, установлен ли API ключ
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        res.status(503).json({
          error: 'Groq API key not configured',
          message: 'GROQ_API_KEY environment variable is not set. Please add it to your .env file.',
        });
        return;
      }

      res.status(503).json({
        error: 'Groq service unavailable',
        message:
          'Failed to connect to Groq API. Please check: 1) Your API key is correct, 2) You have internet connection, 3) Groq service is available.',
      });
      return;
    }

    // Если это ошибка Groq, но статус неизвестен
    if (errorMessage.includes('Groq')) {
      res.status(503).json({
        error: 'Groq service unavailable',
        message: errorMessage || 'An error occurred while communicating with Groq API',
      });
      return;
    }

    // Для остальных ошибок используем стандартный обработчик
    next(error);
  }
};

export {
  getTerms,
  getTermById,
  getTermByExactName,
  createTerm,
  updateTerm,
  deleteTerm,
  getTermSuggestions,
};
