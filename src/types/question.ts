/**
 * Типы для вопросов (Question) и ответов (Answer)
 */

import type { Section } from './section';

export type AnswerType = 'ru' | 'en' | 'senior';

export interface CodeBlock {
  language: string;
  code: string;
}

export interface Answer {
  id: string;
  questionId: string;
  type: AnswerType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sectionId: string;
  section?: Section;
  number: number;
  question: string;
  questionRaw: string;
  questionEn: string | null;
  codeBlocks: CodeBlock[] | null;
  rawMarkdown: string;
  answers?: Answer[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnswerRequest {
  type: AnswerType;
  content: string;
}

export interface UpdateAnswerRequest extends Partial<CreateAnswerRequest> {}

export interface CreateQuestionRequest {
  sectionId: string;
  number: number;
  question: string;
  questionRaw: string;
  questionEn?: string | null;
  codeBlocks?: CodeBlock[] | null;
  rawMarkdown: string;
  answers?: CreateAnswerRequest[];
}

export interface UpdateQuestionRequest extends Partial<
  Omit<CreateQuestionRequest, 'sectionId' | 'number'>
> {
  sectionId?: string;
  number?: number;
}

export interface TranslateTextRequest {
  text: string;
  from?: string;
  to?: string;
}

export interface TranslateTextResponse {
  translatedText: string;
}

// Utility types для работы с Question
export type QuestionWithAnswers = Question & {
  answers: Answer[];
};

export type QuestionWithSection = Question & {
  section: Section;
};

export type QuestionFull = QuestionWithAnswers & QuestionWithSection;
