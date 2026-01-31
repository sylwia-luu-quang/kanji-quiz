/**
 * View Model Types for Quiz View
 *
 * These types extend DTOs with UI-specific state and behavior
 * for managing the quiz-taking experience.
 */

import type { QuizWithQuestionsDTO, QuizQuestionDTO, QuestionFeedbackDTO } from "@/types";

/**
 * Enum representing the current state of a question during quiz-taking
 */
export enum QuestionState {
  UNANSWERED = "UNANSWERED",
  SUBMITTING = "SUBMITTING",
  FEEDBACK = "FEEDBACK",
  READY_TO_PROCEED = "READY_TO_PROCEED",
}

/**
 * Extended question model with UI state
 */
export interface QuestionViewModel extends QuizQuestionDTO {
  currentAnswer: string;
  isSubmitting: boolean;
  feedbackData: QuestionFeedbackDTO | null;
  isAnswered: boolean;
}

/**
 * Quiz state with UI-specific information
 */
export interface QuizViewModel {
  quiz: QuizWithQuestionsDTO;
  currentQuestionIndex: number;
  needReviewMap: Map<number, boolean>;
  isAbandoning: boolean;
  isCompleting: boolean;
}

/**
 * Progress tracking model
 */
export interface ProgressViewModel {
  current: number;
  total: number;
  percentComplete: number;
}

/**
 * Completion summary with calculated values and message
 */
export interface CompletionSummaryViewModel {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  encouragementMessage: string;
}
