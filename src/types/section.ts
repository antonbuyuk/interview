/**
 * Типы для разделов (Section)
 */

// Branded type для ID раздела
export type SectionId = string & { readonly __brand: 'SectionId' };

// Forward reference для Question чтобы избежать циклической зависимости
export interface Section {
  id: string;
  sectionId: string;
  title: string;
  path: string;
  dir: string;
  questions?: import('./question').Question[];
  _count?: {
    questions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  sectionId: string;
  title: string;
  path: string;
  dir: string;
}

export interface UpdateSectionRequest extends Partial<CreateSectionRequest> {}

// Utility types для работы с Section
export type SectionWithCount = Section & {
  _count: {
    questions: number;
  };
};

export type SectionWithoutQuestions = Omit<Section, 'questions'>;
