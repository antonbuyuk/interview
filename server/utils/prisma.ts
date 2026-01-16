import { PrismaClient } from '@prisma/client';

// Настройка connection pooling для оптимизации производительности
const prisma = new PrismaClient({
  log: (process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']) as (
    | 'query'
    | 'error'
    | 'warn'
  )[],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
};

process.on('beforeExit', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default prisma;
