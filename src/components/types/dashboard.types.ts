/**
 * Dashboard View Model Types
 *
 * These types represent the UI state and data models for the Dashboard view,
 * transformed from backend DTOs for optimal presentation.
 */

import type { JLPTLevel } from "../../types";

/**
 * Complete state for the Dashboard view
 */
export interface DashboardViewState {
  levelForm: LevelQuizFormState;
  needReviewForm: NeedReviewQuizFormState;
  needReviewList: NeedReviewListItemVM[];
  historyList: HistoryItemVM[];
  needReviewPagination: PaginationState;
  historyPagination: PaginationState;
  loading: {
    needReview: boolean;
    history: boolean;
  };
  errors: {
    needReview?: string;
    history?: string;
    levelQuiz?: string;
    needReviewQuiz?: string;
  };
}

/**
 * Form state for level-based quiz creation
 */
export interface LevelQuizFormState {
  level: JLPTLevel | "";
  questionCount: 1 | 10 | 20 | 50 | null; // 1 for development
  isSubmitting: boolean;
}

/**
 * Form state for need-review quiz creation
 */
export interface NeedReviewQuizFormState {
  questionCount: 1 | 10 | 20 | 50 | null; // 1 for development
  availableCount: number;
  isSubmitting: boolean;
}

/**
 * View model for a need-review list item
 */
export interface NeedReviewListItemVM {
  id: number;
  kanjiId: number;
  character: string;
  level: JLPTLevel;
  readings: string[];
  meanings: string[];
  createdAt: string;
}

/**
 * View model for a completed quiz in history
 */
export interface HistoryItemVM {
  id: number;
  type: "level" | "need_review";
  level?: JLPTLevel | null;
  questionCount: number;
  scorePercent: number | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Pagination state for lists
 */
export interface PaginationState {
  limit: number;
  offset: number;
  total: number;
}

/**
 * View model for inline alert messages
 */
export interface InlineAlertVM {
  variant: "error" | "info";
  message: string;
}

/**
 * View model for user header
 */
export interface UserHeaderVM {
  email: string;
}
