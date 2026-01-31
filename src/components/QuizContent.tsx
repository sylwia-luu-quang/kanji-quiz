/**
 * QuizContent Component
 *
 * Main content area that displays progress indicator and current question
 */

import { ProgressIndicator } from "./ProgressIndicator";
import { CurrentQuestion } from "./CurrentQuestion";
import type { QuestionViewModel } from "@/components/types/quiz-view.types";

interface QuizContentProps {
  currentQuestion: QuestionViewModel;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onNextQuestion: () => void;
  onToggleNeedReview: (kanjiId: number, state: boolean) => Promise<void>;
  isLastQuestion: boolean;
  needReviewState: boolean;
}

export function QuizContent({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  onSubmitAnswer,
  onNextQuestion,
  onToggleNeedReview,
  isLastQuestion,
  needReviewState,
}: QuizContentProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        <ProgressIndicator currentQuestionIndex={currentQuestionIndex} totalQuestions={totalQuestions} />

        <CurrentQuestion
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          onSubmitAnswer={onSubmitAnswer}
          onNextQuestion={onNextQuestion}
          onToggleNeedReview={onToggleNeedReview}
          isLastQuestion={isLastQuestion}
          needReviewState={needReviewState}
        />
      </div>
    </div>
  );
}
