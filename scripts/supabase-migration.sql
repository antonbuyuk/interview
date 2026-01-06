-- SQL скрипт для создания таблиц в Supabase
-- Выполните этот скрипт в Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Создание таблицы Section
CREATE TABLE IF NOT EXISTS "Section" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "dir" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- Создание уникального индекса для sectionId
CREATE UNIQUE INDEX IF NOT EXISTS "Section_sectionId_key" ON "Section"("sectionId");

-- Создание таблицы Question
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "questionRaw" TEXT NOT NULL,
    "codeBlocks" JSONB,
    "rawMarkdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- Создание индекса для sectionId в Question
CREATE INDEX IF NOT EXISTS "Question_sectionId_idx" ON "Question"("sectionId");

-- Создание уникального индекса для sectionId и number
CREATE UNIQUE INDEX IF NOT EXISTS "Question_sectionId_number_key" ON "Question"("sectionId", "number");

-- Создание таблицы Answer
CREATE TABLE IF NOT EXISTS "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- Создание индекса для questionId в Answer
CREATE INDEX IF NOT EXISTS "Answer_questionId_idx" ON "Answer"("questionId");

-- Создание уникального индекса для questionId и type
CREATE UNIQUE INDEX IF NOT EXISTS "Answer_questionId_type_key" ON "Answer"("questionId", "type");

-- Создание таблицы Term
CREATE TABLE IF NOT EXISTS "Term" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- Создание уникального индекса для term
CREATE UNIQUE INDEX IF NOT EXISTS "Term_term_key" ON "Term"("term");

-- Создание индекса для category в Term
CREATE INDEX IF NOT EXISTS "Term_category_idx" ON "Term"("category");

-- Создание таблицы TermExample
CREATE TABLE IF NOT EXISTS "TermExample" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermExample_pkey" PRIMARY KEY ("id")
);

-- Создание индекса для termId в TermExample
CREATE INDEX IF NOT EXISTS "TermExample_termId_idx" ON "TermExample"("termId");

-- Создание таблицы TermPhrase
CREATE TABLE IF NOT EXISTS "TermPhrase" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermPhrase_pkey" PRIMARY KEY ("id")
);

-- Создание индекса для termId в TermPhrase
CREATE INDEX IF NOT EXISTS "TermPhrase_termId_idx" ON "TermPhrase"("termId");

-- Создание внешних ключей (Foreign Keys) с проверкой существования
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Question_sectionId_fkey'
    ) THEN
        ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey"
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Answer_questionId_fkey'
    ) THEN
        ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey"
        FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TermExample_termId_fkey'
    ) THEN
        ALTER TABLE "TermExample" ADD CONSTRAINT "TermExample_termId_fkey"
        FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TermPhrase_termId_fkey'
    ) THEN
        ALTER TABLE "TermPhrase" ADD CONSTRAINT "TermPhrase_termId_fkey"
        FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
