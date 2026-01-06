require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Import sections data
const sectionsData = [
  {
    id: 'javascript-typescript',
    title: 'JavaScript / TypeScript',
    path: '/javascript-typescript',
    dir: 'javascript-typescript',
  },
  {
    id: 'vuejs',
    title: 'Vue.js',
    path: '/vuejs',
    dir: 'vuejs',
  },
  {
    id: 'nuxtjs',
    title: 'Nuxt.js',
    path: '/nuxtjs',
    dir: 'nuxtjs',
  },
  {
    id: 'typescript',
    title: 'TypeScript',
    path: '/typescript',
    dir: 'typescript',
  },
  {
    id: 'microfrontends',
    title: 'Микрофронтенды',
    path: '/microfrontends',
    dir: 'microfrontends',
  },
  {
    id: 'css-styling',
    title: 'CSS / Styling',
    path: '/css-styling',
    dir: 'css-styling',
  },
  {
    id: 'web-performance',
    title: 'Web Performance',
    path: '/web-performance',
    dir: 'web-performance',
  },
  {
    id: 'http-api',
    title: 'HTTP / API',
    path: '/http-api',
    dir: 'http-api',
  },
  {
    id: 'general',
    title: 'Общие вопросы',
    path: '/general',
    dir: 'general-questions',
  },
  {
    id: 'practical',
    title: 'Практические задачи',
    path: '/practical',
    dir: 'practical-tasks',
  },
  {
    id: 'architecture',
    title: 'Архитектура и паттерны',
    path: '/architecture',
    dir: 'architecture-patterns',
  },
  {
    id: 'performance',
    title: 'Производительность',
    path: '/performance',
    dir: 'performance',
  },
  {
    id: 'security',
    title: 'Безопасность',
    path: '/security',
    dir: 'security',
  },
  {
    id: 'testing',
    title: 'Тестирование',
    path: '/testing',
    dir: 'testing',
  },
  {
    id: 'accessibility',
    title: 'Accessibility (a11y)',
    path: '/accessibility',
    dir: 'accessibility-a11y',
  },
  {
    id: 'practical-senior',
    title: 'Практические задачи (Senior)',
    path: '/practical-senior',
    dir: 'practical-tasks-senior',
  },
];

// Copy of parseQuestions function from questionParser.js
function parseQuestions(markdown) {
  const questions = [];
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm;

  const questionMatches = [];
  let match;
  questionRegex.lastIndex = 0;

  while ((match = questionRegex.exec(markdown)) !== null) {
    questionMatches.push({
      text: match[1].trim(),
      index: match.index,
      fullMatch: match[0],
    });
  }

  questionMatches.forEach((qMatch, idx) => {
    const questionIndex = qMatch.index;
    const nextIndex = questionMatches[idx + 1] ? questionMatches[idx + 1].index : markdown.length;

    const questionSection = markdown.substring(questionIndex, nextIndex);

    const cleanQuestionText = qMatch.text.replace(/\*\*/g, '').replace(/`/g, '').trim();

    let answerRu = null;
    const answerRuMatch = questionSection.match(/\*\*Ответ:\*\*\s*/);
    if (answerRuMatch) {
      const answerRuStart = questionSection.indexOf(answerRuMatch[0]) + answerRuMatch[0].length;
      let answerRuEnd = questionSection.length;

      const answerEnStart = questionSection.indexOf('**Answer EN:**');
      if (answerEnStart !== -1 && answerEnStart > answerRuStart) {
        answerRuEnd = answerEnStart;
      } else {
        const seniorStart = questionSection.indexOf('**Ответ Senior:**');
        if (seniorStart !== -1 && seniorStart > answerRuStart) {
          answerRuEnd = seniorStart;
        }
      }

      const answerRuText = questionSection.substring(answerRuStart, answerRuEnd).trim();
      if (answerRuText) {
        answerRu = answerRuText;
      }
    }

    let answerEn = null;
    const answerEnMatch = questionSection.match(/\*\*Answer EN:\*\*\s*/);
    if (answerEnMatch) {
      const answerEnStart = questionSection.indexOf(answerEnMatch[0]) + answerEnMatch[0].length;
      let answerEnEnd = questionSection.length;

      const seniorStart = questionSection.indexOf('**Ответ Senior:**', answerEnStart);
      if (seniorStart !== -1) {
        answerEnEnd = seniorStart;
      }

      const answerEnText = questionSection.substring(answerEnStart, answerEnEnd).trim();
      if (answerEnText) {
        answerEn = answerEnText;
      }
    }

    let answerSenior = null;
    const seniorMatch = questionSection.match(/\*\*Ответ Senior:\*\*\s*/);
    if (seniorMatch) {
      const seniorStart = questionSection.indexOf(seniorMatch[0]) + seniorMatch[0].length;
      const seniorEnd = questionSection.length;
      const seniorText = questionSection.substring(seniorStart, seniorEnd).trim();
      if (seniorText) {
        answerSenior = seniorText;
      }
    }

    const codeBlocks = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeBlockRegex.exec(questionSection)) !== null) {
      codeBlocks.push({
        language: codeMatch[1] || '',
        code: codeMatch[2].trim(),
      });
    }

    questions.push({
      number: idx + 1,
      question: cleanQuestionText,
      questionRaw: qMatch.text,
      answerRu: answerRu,
      answerEn: answerEn,
      answerSenior: answerSenior,
      codeBlocks: codeBlocks,
      rawMarkdown: questionSection,
    });
  });

  return questions;
}

async function migrateSections() {
  console.log('📁 Migrating sections...');

  for (const sectionData of sectionsData) {
    const existing = await prisma.section.findUnique({
      where: { sectionId: sectionData.id },
    });

    if (existing) {
      console.log(`  ✓ Section "${sectionData.title}" already exists`);
      continue;
    }

    await prisma.section.create({
      data: {
        sectionId: sectionData.id,
        title: sectionData.title,
        path: sectionData.path,
        dir: sectionData.dir,
      },
    });
    console.log(`  ✓ Created section: ${sectionData.title}`);
  }
}

async function migrateQuestions() {
  console.log('\n📝 Migrating questions...');

  for (const sectionData of sectionsData) {
    const section = await prisma.section.findUnique({
      where: { sectionId: sectionData.id },
    });

    if (!section) {
      console.log(`  ⚠ Section not found: ${sectionData.id}`);
      continue;
    }

    const markdownPath = path.join(__dirname, '..', 'content', sectionData.dir, 'README.md');

    try {
      const markdown = await fs.readFile(markdownPath, 'utf-8');
      const questions = parseQuestions(markdown);

      console.log(`  📄 Processing ${questions.length} questions from ${sectionData.title}...`);

      for (const q of questions) {
        // Check if question already exists
        const existing = await prisma.question.findUnique({
          where: {
            sectionId_number: {
              sectionId: section.id,
              number: q.number,
            },
          },
        });

        if (existing) {
          console.log(`    ⏭ Question #${q.number} already exists, skipping...`);
          continue;
        }

        // Create question
        const question = await prisma.question.create({
          data: {
            sectionId: section.id,
            number: q.number,
            question: q.question,
            questionRaw: q.questionRaw,
            codeBlocks: q.codeBlocks.length > 0 ? q.codeBlocks : null,
            rawMarkdown: q.rawMarkdown,
          },
        });

        // Create answers
        const answers = [];
        if (q.answerRu) {
          answers.push({ type: 'ru', content: q.answerRu });
        }
        if (q.answerEn) {
          answers.push({ type: 'en', content: q.answerEn });
        }
        if (q.answerSenior) {
          answers.push({ type: 'senior', content: q.answerSenior });
        }

        for (const answer of answers) {
          await prisma.answer.create({
            data: {
              questionId: question.id,
              type: answer.type,
              content: answer.content,
            },
          });
        }

        console.log(`    ✓ Created question #${q.number} with ${answers.length} answer(s)`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  ⚠ File not found: ${markdownPath}`);
      } else {
        console.error(`  ❌ Error processing ${sectionData.title}:`, error.message);
      }
    }
  }
}

async function migrateTerms() {
  console.log('\n📚 Migrating terms...');

  const vocabularyPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary.json');

  try {
    const vocabularyData = JSON.parse(await fs.readFile(vocabularyPath, 'utf-8'));

    console.log(`  📄 Processing ${vocabularyData.length} terms...`);

    for (const termData of vocabularyData) {
      // Check if term already exists
      const existing = await prisma.term.findUnique({
        where: { term: termData.term },
      });

      if (existing) {
        console.log(`    ⏭ Term "${termData.term}" already exists, skipping...`);
        continue;
      }

      const examplesCount = termData.examples?.length || 0;
      const phrasesCount = termData.phrases?.length || 0;
      console.log(
        `    ✓ Created term "${termData.term}" with ${examplesCount} example(s) and ${phrasesCount} phrase(s)`
      );
    }
  } catch (error) {
    console.error('  ❌ Error migrating terms:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting migration...\n');

    await migrateSections();
    await migrateQuestions();
    await migrateTerms();

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
