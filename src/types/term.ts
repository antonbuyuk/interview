/**
 * Типы для терминов (Term)
 */

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

export interface CreateTermRequest {
  term: string;
  translation: string;
  examples?: string[];
  phrases?: string[];
}

export interface UpdateTermRequest extends Partial<CreateTermRequest> {}

export interface GetTermsFilters {
  search?: string;
  sortBy?: string;
}

export interface TermSuggestionsRequest {
  term: string;
}

export interface TermSuggestionsResponse {
  translation: string;
  phrases: string[];
  examples: string[];
}

// Utility types для работы с Term
export type TermWithExamples = Term & {
  examples: TermExample[];
};

export type TermWithPhrases = Term & {
  phrases: TermPhrase[];
};

export type TermFull = TermWithExamples & TermWithPhrases;
