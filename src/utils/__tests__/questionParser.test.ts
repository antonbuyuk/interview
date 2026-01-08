import { describe, it, expect } from 'vitest';
import { parseQuestions, parseQuestionsForTraining } from '../questionParser';

describe('questionParser', () => {
  describe('parseQuestions', () => {
    it('should parse a simple question without answers', () => {
      const markdown = `### 1. What is JavaScript?`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'question-1',
        number: 1,
        question: 'What is JavaScript?',
        answerRu: null,
        answerEn: null,
        answerSenior: null,
      });
      expect(result[0].codeBlocks).toEqual([]);
    });

    it('should parse question with Russian answer', () => {
      const markdown = `### 1. What is JavaScript?

**Ответ:**

JavaScript - это язык программирования.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerRu).toContain('JavaScript - это язык программирования');
      expect(result[0].answerEn).toBeNull();
      expect(result[0].answerSenior).toBeNull();
    });

    it('should parse question with Answer EN', () => {
      const markdown = `### 1. What is JavaScript?

**Answer EN:**

JavaScript is a programming language.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerEn).toContain('JavaScript is a programming language');
      expect(result[0].answerRu).toBeNull();
      expect(result[0].answerSenior).toBeNull();
    });

    it('should parse question with Senior answer', () => {
      const markdown = `### 1. What is JavaScript?

**Ответ Senior:**

JavaScript is a high-level, interpreted programming language.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerSenior).toContain('high-level, interpreted programming language');
      expect(result[0].answerRu).toBeNull();
      expect(result[0].answerEn).toBeNull();
    });

    it('should parse question with all three answers', () => {
      const markdown = `### 1. What is JavaScript?

**Ответ:**

JavaScript - это язык программирования.

**Answer EN:**

JavaScript is a programming language.

**Ответ Senior:**

JavaScript is a high-level, interpreted programming language.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerRu).toBeTruthy();
      expect(result[0].answerEn).toBeTruthy();
      expect(result[0].answerSenior).toBeTruthy();
      expect(result[0].answerRu).toContain('JavaScript - это язык');
      expect(result[0].answerEn).toContain('JavaScript is a programming language');
      expect(result[0].answerSenior).toContain('high-level, interpreted');
    });

    it('should extract code blocks from question', () => {
      const markdown = `### 1. What is a closure?

\`\`\`javascript
function outer() {
  const x = 10;
  return function inner() {
    return x;
  };
}
\`\`\`

**Ответ:**

Замыкание - это функция, которая имеет доступ к переменным внешней области видимости.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].codeBlocks).toHaveLength(1);
      expect(result[0].codeBlocks[0]).toMatchObject({
        language: 'javascript',
        code: expect.stringContaining('function outer()'),
      });
    });

    it('should extract multiple code blocks', () => {
      const markdown = `### 1. Show examples of closures

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`typescript
const y = 2;
\`\`\`

**Ответ:**

Примеры замыканий.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].codeBlocks).toHaveLength(2);
      expect(result[0].codeBlocks[0].language).toBe('javascript');
      expect(result[0].codeBlocks[1].language).toBe('typescript');
    });

    it('should extract code blocks without language', () => {
      const markdown = `### 1. Example question

\`\`\`
some code here
\`\`\`

**Ответ:**

Answer text.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].codeBlocks).toHaveLength(1);
      expect(result[0].codeBlocks[0].language).toBe('');
      expect(result[0].codeBlocks[0].code).toContain('some code here');
    });

    it('should parse multiple questions', () => {
      const markdown = `### 1. First question?

**Ответ:**

First answer.

### 2. Second question?

**Ответ:**

Second answer.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[0].question).toBe('First question?');
      expect(result[1].number).toBe(2);
      expect(result[1].question).toBe('Second question?');
    });

    it('should handle question with markdown formatting in question text', () => {
      const markdown = `### 1. What is **closure** and \`hoisting\`?`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('What is closure and hoisting?');
      expect(result[0].questionRaw).toContain('**closure**');
    });

    it('should correctly separate Russian answer from Answer EN', () => {
      const markdown = `### 1. Question?

**Ответ:**

This is Russian answer.

**Answer EN:**

This is English answer.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerRu).not.toContain('English answer');
      expect(result[0].answerEn).not.toContain('Russian answer');
      expect(result[0].answerRu).toContain('Russian answer');
      expect(result[0].answerEn).toContain('English answer');
    });

    it('should correctly separate Answer EN from Senior answer', () => {
      const markdown = `### 1. Question?

**Answer EN:**

This is English answer.

**Ответ Senior:**

This is Senior answer.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerEn).not.toContain('Senior answer');
      expect(result[0].answerSenior).not.toContain('English answer');
      expect(result[0].answerEn).toContain('English answer');
      expect(result[0].answerSenior).toContain('Senior answer');
    });

    it('should handle question with Russian section markers in Answer EN', () => {
      const markdown = `### 1. Question?

**Answer EN:**

English answer.

**Особенности:**

Some Russian section that should not be part of Answer EN.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerEn).not.toContain('Особенности');
      expect(result[0].answerEn).toContain('English answer');
    });

    it('should return empty array for empty markdown', () => {
      const result = parseQuestions('');
      expect(result).toEqual([]);
    });

    it('should return empty array for markdown without questions', () => {
      const markdown = `# Title

Some text without questions.`;
      const result = parseQuestions(markdown);
      expect(result).toEqual([]);
    });

    it('should handle question with only question text and no content', () => {
      const markdown = `### 1. Question text?`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].answerRu).toBeNull();
      expect(result[0].answerEn).toBeNull();
      expect(result[0].answerSenior).toBeNull();
      expect(result[0].codeBlocks).toEqual([]);
    });

    it('should preserve raw markdown for each question', () => {
      const markdown = `### 1. Question?

**Ответ:**

Answer.`;

      const result = parseQuestions(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].rawMarkdown).toContain('### 1. Question?');
      expect(result[0].rawMarkdown).toContain('**Ответ:**');
      expect(result[0].rawMarkdown).toContain('Answer.');
    });
  });

  describe('parseQuestionsForTraining', () => {
    it('should add sectionId and answer flags to parsed questions', () => {
      const markdown = `### 1. Question?

**Ответ:**

Russian answer.

**Answer EN:**

English answer.

**Ответ Senior:**

Senior answer.`;

      const result = parseQuestionsForTraining(markdown, 'test-section');

      expect(result).toHaveLength(1);
      expect(result[0].sectionId).toBe('test-section');
      expect(result[0].hasAnswerRu).toBe(true);
      expect(result[0].hasAnswerEn).toBe(true);
      expect(result[0].hasAnswerSenior).toBe(true);
    });

    it('should correctly set answer flags when answers are missing', () => {
      const markdown = `### 1. Question?`;

      const result = parseQuestionsForTraining(markdown, 'test-section');

      expect(result).toHaveLength(1);
      expect(result[0].sectionId).toBe('test-section');
      expect(result[0].hasAnswerRu).toBe(false);
      expect(result[0].hasAnswerEn).toBe(false);
      expect(result[0].hasAnswerSenior).toBe(false);
    });

    it('should handle multiple questions with sectionId', () => {
      const markdown = `### 1. First question?

**Ответ:**

First answer.

### 2. Second question?

**Answer EN:**

Second answer.`;

      const result = parseQuestionsForTraining(markdown, 'javascript-basics');

      expect(result).toHaveLength(2);
      result.forEach(q => {
        expect(q.sectionId).toBe('javascript-basics');
      });
      expect(result[0].hasAnswerRu).toBe(true);
      expect(result[0].hasAnswerEn).toBe(false);
      expect(result[1].hasAnswerRu).toBe(false);
      expect(result[1].hasAnswerEn).toBe(true);
    });
  });
});
