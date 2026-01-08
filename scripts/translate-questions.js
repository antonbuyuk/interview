require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { translate } = require('@vitalets/google-translate-api');

const prisma = new PrismaClient();

// Функция для задержки между запросами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Функция для перевода текста
async function translateText(text, retries = 3) {
  if (!text || text.trim() === '') {
    return null;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const result = await translate(text, { from: 'ru', to: 'en' });
      return result.text;
    } catch (error) {
      console.error(`  ⚠ Ошибка перевода (попытка ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        // Увеличиваем задержку с каждой попыткой
        await delay(2000 * (i + 1));
      } else {
        throw error;
      }
    }
  }
}

async function translateQuestions() {
  console.log('🌐 Начинаем перевод вопросов на английский язык...\n');

  try {
    // Получаем все вопросы, у которых нет questionEn
    const questions = await prisma.question.findMany({
      where: {
        OR: [{ questionEn: null }, { questionEn: '' }],
      },
      orderBy: [{ sectionId: 'asc' }, { number: 'asc' }],
    });

    console.log(`📝 Найдено ${questions.length} вопросов для перевода\n`);

    if (questions.length === 0) {
      console.log('✅ Все вопросы уже переведены!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = `[${i + 1}/${questions.length}]`;

      // Пропускаем вопросы без questionRaw
      if (!question.questionRaw || question.questionRaw.trim() === '') {
        console.log(
          `${progress} ⏭ Вопрос #${question.number} (ID: ${question.id}) - пропущен (нет questionRaw)`
        );
        skippedCount++;
        continue;
      }

      try {
        console.log(`${progress} 🔄 Перевод вопроса #${question.number} (ID: ${question.id})...`);

        // Переводим questionRaw
        const translatedText = await translateText(question.questionRaw);

        if (translatedText) {
          // Обновляем вопрос в базе данных
          await prisma.question.update({
            where: { id: question.id },
            data: { questionEn: translatedText },
          });

          console.log(`${progress} ✅ Вопрос #${question.number} переведен успешно`);
          successCount++;
        } else {
          console.log(`${progress} ⚠ Вопрос #${question.number} - перевод вернул пустой результат`);
          skippedCount++;
        }

        // Задержка между запросами для избежания rate limits (5 секунд)
        if (i < questions.length - 1) {
          await delay(5000);
        }
      } catch (error) {
        console.error(
          `${progress} ❌ Ошибка при переводе вопроса #${question.number} (ID: ${question.id}):`,
          error.message
        );
        errorCount++;

        // Увеличиваем задержку после ошибки (особенно для rate limit)
        if (error.message.includes('Too Many Requests')) {
          console.log(`${progress} ⏳ Ожидание 60 секунд из-за rate limit...`);
          await delay(60000);
        } else {
          await delay(5000);
        }
      }
    }

    console.log('\n📊 Статистика перевода:');
    console.log(`  ✅ Успешно переведено: ${successCount}`);
    console.log(`  ⏭ Пропущено: ${skippedCount}`);
    console.log(`  ❌ Ошибок: ${errorCount}`);
    console.log(`\n✅ Перевод завершен!`);
  } catch (error) {
    console.error('\n❌ Критическая ошибка при переводе:', error);
    throw error;
  }
}

async function main() {
  try {
    await translateQuestions();
  } catch (error) {
    console.error('\n❌ Скрипт завершился с ошибкой:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
