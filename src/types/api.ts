/**
 * Главный файл экспорта всех типов API
 * Реэкспортирует типы из отдельных модулей для обратной совместимости
 */

// Section types
export type {
  Section,
  SectionId,
  CreateSectionRequest,
  UpdateSectionRequest,
  SectionWithCount,
  SectionWithoutQuestions,
} from './section';

// Question and Answer types
export type {
  AnswerType,
  CodeBlock,
  Answer,
  Question,
  CreateAnswerRequest,
  UpdateAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  TranslateTextRequest,
  TranslateTextResponse,
  QuestionWithAnswers,
  QuestionWithSection,
  QuestionFull,
} from './question';

// Term types
export type {
  TermExample,
  TermPhrase,
  Term,
  CreateTermRequest,
  UpdateTermRequest,
  GetTermsFilters,
  TermSuggestionsRequest,
  TermSuggestionsResponse,
  TermWithExamples,
  TermWithPhrases,
  TermFull,
} from './term';

// Auth types
export type { LoginRequest, LoginResponse } from './auth';
