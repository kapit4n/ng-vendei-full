export interface AngQuestionOption {
  text: string;
  correct: boolean;
}

export interface AngQuestion {
  id: string;
  text: string;
  options: AngQuestionOption[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface AngExam {
  id: string;
  title: string;
  questionIds: string[];
  createdAt: string;
}

export interface AngExamAnswer {
  questionId: string;
  questionText: string;
  selectedOptions: number[];
  correctOptions: number[];
  isCorrect: boolean;
}

export interface AngExamResult {
  id: string;
  examId: string;
  examTitle: string;
  answers: AngExamAnswer[];
  score: number;
  total: number;
  completedAt: string;
}

export type Complexity = 'basic' | 'intermediate' | 'advanced';
