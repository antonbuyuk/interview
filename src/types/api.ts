/**
 * Типы для API на основе Prisma схемы
 */

export type AnswerType = 'ru' | 'en' | 'senior';

export interface TermExample {
  id: string;
  termId: string;
  example: string;
  createdAt: string;
}

export interface TermPhrase {
  id: string;
  termId: string;
  phrase: string;
  createdAt: string;
}

export interface Term {
  id: string;
  term: string;
  translation: string;
  examples?: TermExample[];
  phrases?: TermPhrase[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  type: AnswerType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeBlock {
  language: string;
  code: string;
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

export interface Section {
  id: string;
  sectionId: string;
  title: string;
  path: string;
  dir: string;
  questions?: Question[];
  _count?: {
    questions: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Request/Response типы для API

export interface CreateSectionRequest {
  sectionId: string;
  title: string;
  path: string;
  dir: string;
}

export interface UpdateSectionRequest {
  sectionId?: string;
  title?: string;
  path?: string;
  dir?: string;
}

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

export interface UpdateQuestionRequest {
  sectionId?: string;
  number?: number;
  question?: string;
  questionRaw?: string;
  questionEn?: string | null;
  codeBlocks?: CodeBlock[] | null;
  rawMarkdown?: string;
}

export interface CreateAnswerRequest {
  type: AnswerType;
  content: string;
}

export interface UpdateAnswerRequest {
  type?: AnswerType;
  content?: string;
}

export interface CreateTermRequest {
  term: string;
  translation: string;
  examples?: string[];
  phrases?: string[];
}

export interface UpdateTermRequest {
  term?: string;
  translation?: string;
  examples?: string[];
  phrases?: string[];
}

export interface GetTermsFilters {
  search?: string;
  sortBy?: string;
}

export interface TranslateTextRequest {
  text: string;
  from?: string;
  to?: string;
}

export interface TranslateTextResponse {
  translatedText: string;
}

export interface TermSuggestionsRequest {
  term: string;
}

export interface TermSuggestionsResponse {
  translation: string;
  phrases: string[];
  examples: string[];
}

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
}
