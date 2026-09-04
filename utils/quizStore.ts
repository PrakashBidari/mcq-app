// Module-level in-memory store — eliminates JSON serialization across quiz screens
let _questions: any[] | null = null;
let _answers: number[] | null = null;
let _startedAt: number | null = null;
let _questionSetId: number | null = null;
let _categoryId: number | null = null;

// Access grant summary for the set/package currently being played (attempts or days
// left), as returned by GET /question-set/{id} -> data.set.access. null for free
// content or when the player isn't taking it under a limited grant.
export interface QuizAccessSummary {
  kind:
    | "attempts"
    | "trial_attempts"
    | "days"
    | "trial_days"
    | "subscription"
    | "unlimited"
    | "wallet";
  attempts_used?: number;
  attempts_total?: number;
  attempts_remaining?: number;
  expires_at?: string;
  days_remaining?: number;
}

let _access: QuizAccessSummary | null = null;

export const quizStore = {
  setQuestions(q: any[]) { _questions = q; },
  getQuestions(): any[] | null { return _questions; },
  setAnswers(a: number[]) { _answers = a; },
  getAnswers(): number[] | null { return _answers; },
  setStartedAt(t: number) { _startedAt = t; },
  getStartedAt(): number | null { return _startedAt; },
  setQuestionSetId(id: number | null) { _questionSetId = id; },
  getQuestionSetId(): number | null { return _questionSetId; },
  setCategoryId(id: number | null) { _categoryId = id; },
  getCategoryId(): number | null { return _categoryId; },
  setAccess(a: QuizAccessSummary | null) { _access = a; },
  getAccess(): QuizAccessSummary | null { return _access; },
  clear() {
    _questions = null;
    _answers = null;
    _startedAt = null;
    _questionSetId = null;
    _categoryId = null;
    _access = null;
  },
};
