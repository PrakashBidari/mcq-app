// Module-level in-memory store — eliminates JSON serialization across quiz screens
let _questions: any[] | null = null;
let _answers: number[] | null = null;
let _startedAt: number | null = null;
let _questionSetId: number | null = null;
let _categoryId: number | null = null;

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
  clear() {
    _questions = null;
    _answers = null;
    _startedAt = null;
    _questionSetId = null;
    _categoryId = null;
  },
};
