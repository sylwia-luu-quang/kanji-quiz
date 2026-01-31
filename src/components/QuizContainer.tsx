/**
 * QuizContainer Component
 *
 * Main React component managing quiz state, question navigation, API calls, and overall flow
 * Wraps everything with ErrorBoundary and ToastProvider
 */

import type { QuizWithQuestionsDTO } from "@/types";
import { useQuizState } from "@/components/hooks/useQuizState";
import { ToastProvider, useToast } from "@/components/hooks/useToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuizHeader } from "./QuizHeader";
import { QuizContent } from "./QuizContent";
import { CompletionModal } from "./CompletionModal";
import { QuizAPIError } from "@/lib/services/quiz-client.service";

interface QuizContainerProps {
  initialQuiz: QuizWithQuestionsDTO;
  quizId: number;
}

function QuizContainerInner({ initialQuiz, quizId }: QuizContainerProps) {
  const toast = useToast();
  const {
    quiz,
    currentQuestion,
    currentQuestionIndex,
    isLastQuestion,
    isAbandoning,
    completionSummary,
    needReviewMap,
    handleAbandonQuiz,
    submitQuestionAnswer,
    goToNextQuestion,
    toggleNeedReview,
    updateCurrentAnswer,
  } = useQuizState({ initialQuiz, quizId });

  // Handle API errors with toast notifications
  const handleError = (error: unknown, defaultMessage: string) => {
    if (error instanceof QuizAPIError) {
      switch (error.status) {
        case 400:
          toast.showToast((error.details?.message as string) || "Invalid request", "error");
          break;
        case 401:
          toast.showToast("Your session has expired. Please sign in again.", "error");
          setTimeout(() => {
            window.location.href = `/signin?redirect=/quiz/${quizId}`;
          }, 2000);
          break;
        case 403:
          toast.showToast("You do not have permission to access this quiz.", "error");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
          break;
        case 404:
          toast.showToast("Quiz not found.", "error");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
          break;
        case 409:
          toast.showToast("This quiz has already been completed or abandoned.", "info");
          break;
        default:
          toast.showToast(defaultMessage, "error");
      }
    } else if (error instanceof Error) {
      toast.showToast(error.message, "error");
    } else {
      toast.showToast(defaultMessage, "error");
    }
  };

  // Handle abandon quiz
  const handleAbandon = async () => {
    try {
      await handleAbandonQuiz();
      toast.showToast("Quiz abandoned", "info");
      // Navigate to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      handleError(error, "Failed to abandon quiz. Please try again.");
    }
  };

  // Handle submit answer
  const handleSubmit = async (answer: string) => {
    try {
      await submitQuestionAnswer(answer);
    } catch (error) {
      handleError(error, "Failed to submit answer. Please try again.");
      throw error; // Re-throw to let CurrentQuestion handle it
    }
  };

  // Handle toggle need review
  const handleToggle = async (kanjiId: number) => {
    try {
      await toggleNeedReview(kanjiId);
    } catch (error) {
      handleError(error, "Failed to update review status. Please try again.");
      throw error; // Re-throw to let component handle rollback
    }
  };

  // Handle return to dashboard
  const handleReturnToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Show loading state if no current question
  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const canAbandon = quiz.status === "in_progress";
  const needReviewState = needReviewMap.get(currentQuestion.kanji.id) || false;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <QuizHeader onAbandonQuiz={handleAbandon} isAbandoning={isAbandoning} canAbandon={canAbandon} />

      <main>
        <QuizContent
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={quiz.questions.length}
          currentAnswer={currentQuestion.currentAnswer}
          onAnswerChange={updateCurrentAnswer}
          onSubmitAnswer={handleSubmit}
          onNextQuestion={goToNextQuestion}
          onToggleNeedReview={handleToggle}
          isLastQuestion={isLastQuestion}
          needReviewState={needReviewState}
        />
      </main>

      {completionSummary && (
        <CompletionModal
          isOpen={true}
          scorePercent={completionSummary.scorePercent}
          correctCount={completionSummary.correctCount}
          totalCount={completionSummary.totalCount}
          encouragementMessage={completionSummary.encouragementMessage}
          onReturnToDashboard={handleReturnToDashboard}
        />
      )}
    </div>
  );
}

export function QuizContainer(props: QuizContainerProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QuizContainerInner {...props} />
      </ToastProvider>
    </ErrorBoundary>
  );
}
