/**
 * Утилита для парсинга вопросов из markdown файлов
 */

export interface ParsedQuestion {
  id: string;
  number: number;
  question: string;
  questionRaw: string;
  answerRu: string | null;
  answerEn: string | null;
  answerSenior: string | null;
  codeBlocks: Array<{ language: string; code: string }>;
  rawMarkdown: string;
}

export interface ParsedQuestionForTraining extends ParsedQuestion {
  sectionId: string;
  hasAnswerEn: boolean;
  hasAnswerRu: boolean;
  hasAnswerSenior: boolean;
}

/**
 * Проверяет, является ли раздел русским разделом (жирный текст с кириллицей)
 */
const isRussianSectionMarker = (text: string): boolean => {
  const match = text.match(/\*\*([^*]+):\*\*/);
  if (!match || !match[1]) return false;
  const headerText = match[1];
  // Проверяем наличие кириллицы, но исключаем маркеры "Ответ", "Ответ Senior", "Answer EN"
  if (/[а-яёА-ЯЁ]/.test(headerText)) {
    const lowerText = headerText.toLowerCase();
    return !lowerText.includes('ответ') && !lowerText.includes('answer en');
  }
  return false;
};

/**
 * Парсит markdown и извлекает структурированные данные о вопросах
 */
export function parseQuestions(markdown: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const questionRegex = /^###\s+\d+\.\s+(.+)$/gm;

  // Находим все вопросы
  const questionMatches: Array<{ text: string; index: number; fullMatch: string }> = [];
  let match: RegExpExecArray | null;
  questionRegex.lastIndex = 0;

  while ((match = questionRegex.exec(markdown)) !== null) {
    const questionText = match[1];
    if (!questionText) continue;
    questionMatches.push({
      text: questionText.trim(),
      index: match.index,
      fullMatch: match[0],
    });
  }

  // Обрабатываем каждый вопрос
  questionMatches.forEach((qMatch, idx) => {
    const questionIndex = qMatch.index;
    const nextMatch = questionMatches[idx + 1];
    const nextIndex = nextMatch ? nextMatch.index : markdown.length;

    const questionSection = markdown.substring(questionIndex, nextIndex);

    // Очищаем текст вопроса от markdown разметки
    const cleanQuestionText = qMatch.text.replace(/\*\*/g, '').replace(/`/g, '').trim();

    // Ищем русский ответ
    let answerRu: string | null = null;
    const answerRuMatch = questionSection.match(/\*\*Ответ:\*\*\s*/);

    if (answerRuMatch) {
      const answerRuStart = questionSection.indexOf(answerRuMatch[0]) + answerRuMatch[0].length;
      let answerRuEnd = questionSection.length;

      // Ищем конец русского ответа (начало Answer EN или Senior)
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

    // Ищем Answer EN
    let answerEn: string | null = null;
    const answerEnMatch = questionSection.match(/\*\*Answer EN:\*\*\s*/);
    if (answerEnMatch) {
      const answerEnStart = questionSection.indexOf(answerEnMatch[0]) + answerEnMatch[0].length;
      let answerEnEnd = questionSection.length;

      // Ищем конец Answer EN
      const seniorStart = questionSection.indexOf('**Ответ Senior:**', answerEnStart);
      if (seniorStart !== -1) {
        answerEnEnd = seniorStart;
      } else {
        // Ищем русские разделы
        const sectionRegex = /\*\*[^*]+:\*\*/g;
        sectionRegex.lastIndex = answerEnStart;
        let sectionMatch: RegExpExecArray | null;
        while ((sectionMatch = sectionRegex.exec(questionSection)) !== null) {
          if (sectionMatch.index < answerEnStart) continue;
          if (isRussianSectionMarker(sectionMatch[0])) {
            answerEnEnd = sectionMatch.index;
            break;
          }
        }
      }

      const answerEnText = questionSection.substring(answerEnStart, answerEnEnd).trim();
      if (answerEnText) {
        answerEn = answerEnText;
      }
    }

    // Ищем Senior ответ
    let answerSenior: string | null = null;
    const seniorMatch = questionSection.match(/\*\*Ответ Senior:\*\*\s*/);
    if (seniorMatch) {
      const seniorStart = questionSection.indexOf(seniorMatch[0]) + seniorMatch[0].length;
      const seniorEnd = questionSection.length;
      const seniorText = questionSection.substring(seniorStart, seniorEnd).trim();
      if (seniorText) {
        answerSenior = seniorText;
      }
    }

    // Извлекаем блоки кода из всего вопроса
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch: RegExpExecArray | null;
    while ((codeMatch = codeBlockRegex.exec(questionSection)) !== null) {
      const codeContent = codeMatch[2];
      if (codeContent !== undefined) {
        codeBlocks.push({
          language: codeMatch[1] || '',
          code: codeContent.trim(),
        });
      }
    }

    questions.push({
      id: `question-${idx + 1}`,
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

/**
 * Парсит вопросы из markdown для использования в режиме тренировки
 */
export function parseQuestionsForTraining(
  markdown: string,
  sectionId: string
): ParsedQuestionForTraining[] {
  const questions = parseQuestions(markdown);
  return questions.map(q => ({
    ...q,
    sectionId,
    hasAnswerEn: !!q.answerEn,
    hasAnswerRu: !!q.answerRu,
    hasAnswerSenior: !!q.answerSenior,
  }));
}
