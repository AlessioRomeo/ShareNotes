"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, ArrowLeft, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface QuizQuestion {
    id: string
    question: string
    options: {
        id: string
        text: string
        isCorrect: boolean
    }[]
    explanation?: string
}

interface QuizModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    questions: QuizQuestion[]
    boardId?: string
    onCreateQuiz?: (imageData: string) => Promise<QuizQuestion[]>
}

export function QuizModal({ open, onOpenChange, title, questions }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasSelectedOption = selectedOptions[currentQuestion?.id]

  const handleOptionSelect = (optionId: string) => {
    if (selectedOptions[currentQuestion.id]) return // Prevent changing answer after selection

    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion.id]: optionId,
    })

    setShowExplanation(true)
  }

  const handleNext = () => {
    setShowExplanation(false)

    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setShowExplanation(!!selectedOptions[questions[currentQuestionIndex - 1].id])
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedOptions({})
    setShowResults(false)
    setShowExplanation(false)
  }

  const calculateScore = () => {
    let correctAnswers = 0

    questions.forEach((question) => {
      const selectedOptionId = selectedOptions[question.id]
      if (selectedOptionId) {
        const selectedOption = question.options.find((option) => option.id === selectedOptionId)
        if (selectedOption?.isCorrect) {
          correctAnswers++
        }
      }
    })

    return {
      score: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
    }
  }

  const isOptionCorrect = (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return false

    const option = question.options.find((o) => o.id === optionId)
    return option?.isCorrect || false
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500"
    if (percentage >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        {!showResults ? (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Test your knowledge with this AI-generated quiz</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium">
                  {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                </span>
              </div>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />

              <div className="mt-6 mb-4">
                <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOptions[currentQuestion.id] === option.id
                    const showCorrectness = selectedOptions[currentQuestion.id] != null
                    const isCorrect = option.isCorrect

                    return (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={cn(
                          "w-full justify-start h-auto py-3 px-4 font-normal text-left",
                          isSelected && "border-2",
                          showCorrectness && isSelected && isCorrect && "border-green-500 bg-green-50",
                          showCorrectness && isSelected && !isCorrect && "border-red-500 bg-red-50",
                          showCorrectness && !isSelected && isCorrect && "border-green-500",
                        )}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={showCorrectness}
                      >
                        <div className="flex items-start gap-3">
                          {showCorrectness && isSelected ? (
                            isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            )
                          ) : (
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full border-2 shrink-0 mt-0.5",
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground",
                              )}
                            />
                          )}
                          <span>{option.text}</span>
                        </div>
                      </Button>
                    )
                  })}
                </div>

                {showExplanation && currentQuestion.explanation && (
                  <Card className="mt-4 p-4 bg-muted/50">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Explanation</h4>
                        <p className="text-sm">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button onClick={handleNext} disabled={!hasSelectedOption}>
                {isLastQuestion ? "See Results" : "Next"}
                {!isLastQuestion && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quiz Results</DialogTitle>
              <DialogDescription>Here's how you did on the quiz</DialogDescription>
            </DialogHeader>

            <div className="py-6">
              {(() => {
                const { score, total, percentage } = calculateScore()
                const scoreColor = getScoreColor(percentage)

                return (
                  <div className="mb-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
                          <span className={cn("text-3xl font-bold", scoreColor)}>{percentage}%</span>
                        </div>
                        <Trophy className="absolute -top-2 -right-2 h-10 w-10 text-yellow-500" />
                      </div>

                      <h3 className="text-xl font-bold mb-1">
                        You got{" "}
                        <span className={scoreColor}>
                          {score} out of {total}
                        </span>{" "}
                        questions right
                      </h3>

                      <p className="text-muted-foreground">
                        {percentage >= 80
                          ? "Excellent work! You've mastered this topic."
                          : percentage >= 60
                            ? "Good job! You have a solid understanding."
                            : "Keep practicing to improve your knowledge."}
                      </p>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Score breakdown</span>
                        <span className="font-medium">
                          {score}/{total} correct
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500",
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium">Question Summary</div>
                <div className="divide-y">
                  {questions.map((question, index) => {
                    const selectedOptionId = selectedOptions[question.id]
                    const isCorrect = selectedOptionId && isOptionCorrect(question.id, selectedOptionId)
                    const selectedOption = question.options.find((o) => o.id === selectedOptionId)
                    const correctOption = question.options.find((o) => o.isCorrect)

                    return (
                      <div key={question.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3 mb-2">
                          <div className={cn("rounded-full p-1 shrink-0", isCorrect ? "bg-green-100" : "bg-red-100")}>
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">Question {index + 1}</h4>
                            <p>{question.question}</p>
                          </div>
                        </div>

                        {!isCorrect && (
                          <div className="ml-9 mt-2 text-sm">
                            <p className="text-red-500 mb-1">Your answer: {selectedOption?.text || "Not answered"}</p>
                            <p className="text-green-500">Correct answer: {correctOption?.text}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleRestart}>Restart Quiz</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

