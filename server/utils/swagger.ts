/**
 * Конфигурация Swagger для API документации
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Interview Questions API',
      version: '1.0.0',
      description: 'API для управления вопросами для интервью, разделами и терминами',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен для авторизации администратора',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token в httpOnly cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
            },
            message: {
              type: 'string',
              description: 'Дополнительное сообщение',
            },
            code: {
              type: 'string',
              description: 'Код ошибки',
            },
          },
        },
        Section: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'UUID раздела',
            },
            sectionId: {
              type: 'string',
              description: 'Уникальный идентификатор раздела',
              example: 'javascript-typescript',
            },
            title: {
              type: 'string',
              description: 'Название раздела',
              example: 'JavaScript / TypeScript',
            },
            path: {
              type: 'string',
              description: 'URL путь раздела',
              example: '/javascript-typescript',
            },
            dir: {
              type: 'string',
              description: 'Название директории',
              example: 'javascript-typescript',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sectionId: {
              type: 'string',
              format: 'uuid',
            },
            number: {
              type: 'integer',
              description: 'Порядковый номер вопроса в разделе',
            },
            question: {
              type: 'string',
              description: 'Текст вопроса (HTML)',
            },
            questionRaw: {
              type: 'string',
              description: 'Исходный текст вопроса',
            },
            questionEn: {
              type: 'string',
              nullable: true,
              description: 'Вопрос на английском',
            },
            codeBlocks: {
              type: 'array',
              items: {
                type: 'object',
              },
              nullable: true,
            },
            rawMarkdown: {
              type: 'string',
              description: 'Исходный markdown',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Answer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            questionId: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['ru', 'en', 'senior'],
              description: 'Тип ответа',
            },
            content: {
              type: 'string',
              description: 'Содержимое ответа',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Term: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            term: {
              type: 'string',
              description: 'Термин',
            },
            translation: {
              type: 'string',
              description: 'Перевод',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Текущая страница',
            },
            limit: {
              type: 'integer',
              description: 'Количество элементов на странице',
            },
            total: {
              type: 'integer',
              description: 'Общее количество элементов',
            },
            totalPages: {
              type: 'integer',
              description: 'Общее количество страниц',
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Есть ли следующая страница',
            },
            hasPreviousPage: {
              type: 'boolean',
              description: 'Есть ли предыдущая страница',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes/*.ts', './server/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
