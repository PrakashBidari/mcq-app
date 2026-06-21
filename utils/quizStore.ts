// Module-level in-memory store — eliminates JSON serialization across quiz screens
let _questions: any[] | null = null;
let _answers: number[] | null = null;

export const quizStore = {
  setQuestions(q: any[]) { _questions = q; },
  getQuestions(): any[] | null { return _questions; },
  setAnswers(a: number[]) { _answers = a; },
  getAnswers(): number[] | null { return _answers; },
  clear() { _questions = null; _answers = null; },
};
