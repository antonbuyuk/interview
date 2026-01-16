-- Скрипт для проверки и создания поля number в таблице Question
-- Выполните этот скрипт в вашей БД, если поле number отсутствует

-- Проверяем, существует ли поле number
DO $$
BEGIN
    -- Проверяем наличие колонки number
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Question' 
        AND column_name = 'number'
    ) THEN
        -- Добавляем колонку number
        ALTER TABLE "Question" ADD COLUMN "number" INTEGER NOT NULL DEFAULT 1;
        
        -- Обновляем существующие записи: присваиваем порядковый номер
        WITH numbered_questions AS (
            SELECT 
                id,
                ROW_NUMBER() OVER (PARTITION BY "sectionId" ORDER BY "createdAt") as row_num
            FROM "Question"
        )
        UPDATE "Question" q
        SET "number" = nq.row_num
        FROM numbered_questions nq
        WHERE q.id = nq.id;
        
        -- Создаем уникальный индекс для sectionId и number
        CREATE UNIQUE INDEX IF NOT EXISTS "Question_sectionId_number_key" 
        ON "Question"("sectionId", "number");
        
        RAISE NOTICE 'Поле number успешно добавлено в таблицу Question';
    ELSE
        RAISE NOTICE 'Поле number уже существует в таблице Question';
    END IF;
END $$;
