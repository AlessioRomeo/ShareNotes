import type { ObjectId } from "mongodb"

export interface Question {
    prompt: string
    options: string[]
    correct_answer: string // A, B, C, or D
}

export interface Quiz {
    id: ObjectId
    owner_id: ObjectId
    title: string
    description?: string
    reference_board?: ObjectId
    questions: Question[]
    created_at: Date
    updated_at: Date
    shared_with: any[]
}

export interface CreateQuizRequest {
    title: string
    description?: string
    image_data?: string
    reference_board?: string
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
