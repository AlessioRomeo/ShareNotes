export interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  text: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer: string
}

export interface QuizResult {
  quizId: string
  userId: string
  score: number
  answers: Answer[]
  completedAt: string
}

export interface Answer {
  questionId: string
  userAnswer: string
  isCorrect: boolean
} 