/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains type definitions for DTOs used in API communication,
 * all derived from the underlying database schema defined in database.types.ts
 */

import type { Database, Tables } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

/**
 * Base entity types directly from database schema
 */
export type KanjiEntity = Tables<"kanji">;
export type QuizEntity = Tables<"quiz">;
export type QuizQuestionEntity = Tables<"quiz_questions">;
export type NeedReviewEntity = Tables<"need_reviews">;

/**
 * Database enum types
 */
export type JLPTLevel = Database["public"]["Enums"]["jlpt_level"];
export type QuestionType = Database["public"]["Enums"]["question_type"];
export type QuizStatus = Database["public"]["Enums"]["quiz_status"];
export type QuizType = Database["public"]["Enums"]["quiz_type"];

// ============================================================================
// Kanji DTOs
// ============================================================================

/**
 * Kanji DTO with properly typed readings and meanings arrays
 * Used in: GET /api/kanji, GET /api/kanji/:id
 */
export type KanjiDTO = Omit<KanjiEntity, "readings" | "meanings"> & {
  readings: string[];
  meanings: string[];
};

/**
 * Paginated list response for kanji
 * Used in: GET /api/kanji
 */
export interface KanjiListResponseDTO {
  data: KanjiDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Quiz DTOs
// ============================================================================

/**
 * Command model for creating a new quiz
 * Used in: POST /api/quizzes (request body)
 *
 * Validation rules:
 * - type must be 'level' or 'need_review'
 * - level is required when type='level', must be null when type='need_review'
 * - question_count represents number of kanji (each generates 2 questions)
 */
export type CreateQuizCommandDTO =
  | {
      type: "level";
      level: JLPTLevel;
      question_count: number;
    }
  | {
      type: "need_review";
      level?: never;
      question_count: number;
    };

/**
 * Basic quiz DTO without questions
 * Used in: GET /api/quizzes (list items), POST /api/quizzes/:id/complete
 */
export type QuizDTO = QuizEntity;

/**
 * Quiz with embedded questions and kanji details
 * Used in: POST /api/quizzes (response), GET /api/quizzes/:id
 */
export interface QuizWithQuestionsDTO extends QuizDTO {
  questions: QuizQuestionDTO[];
}

/**
 * Simplified quiz DTO for list views
 * Used in: GET /api/quizzes
 */
export type QuizListItemDTO = QuizDTO;

/**
 * Paginated list response for quizzes
 * Used in: GET /api/quizzes
 */
export interface QuizListResponseDTO {
  data: QuizListItemDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Quiz Question DTOs
// ============================================================================

/**
 * Quiz question with embedded kanji details
 * Used in quiz responses and answer submissions
 */
export interface QuizQuestionDTO extends QuizQuestionEntity {
  kanji: KanjiDTO;
}

/**
 * Command model for submitting an answer to a question
 * Used in: PATCH /api/quizzes/:quizId/questions/:questionId (request body)
 */
export interface SubmitAnswerCommandDTO {
  user_answer: string;
}

/**
 * Feedback provided after answer submission
 */
export interface QuestionFeedbackDTO {
  is_correct: boolean;
  correct_answers: string[];
}

/**
 * Response after submitting an answer
 * Used in: PATCH /api/quizzes/:quizId/questions/:questionId (response)
 */
export interface QuestionAnswerResponseDTO extends QuizQuestionDTO {
  feedback: QuestionFeedbackDTO;
}

// ============================================================================
// Need Review DTOs
// ============================================================================

/**
 * Need review entry with embedded kanji details
 * Used in: GET /api/need-reviews, POST /api/need-reviews
 */
export interface NeedReviewDTO extends NeedReviewEntity {
  kanji: KanjiDTO;
}

/**
 * Command model for adding a kanji to need-review list
 * Used in: POST /api/need-reviews (request body)
 */
export interface AddNeedReviewCommandDTO {
  kanji_id: number;
}

/**
 * Paginated list response for need-reviews
 * Used in: GET /api/need-reviews
 */
export interface NeedReviewListResponseDTO {
  data: NeedReviewDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Common DTOs
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Type Guards and Validation Helpers
// ============================================================================

/**
 * Type guard to check if a value is a valid JLPT level
 */
export function isJLPTLevel(value: unknown): value is JLPTLevel {
  return typeof value === "string" && ["N5", "N4", "N3", "N2", "N1"].includes(value);
}

/**
 * Type guard to check if a value is a valid quiz type
 */
export function isQuizType(value: unknown): value is QuizType {
  return typeof value === "string" && ["level", "need_review"].includes(value);
}

/**
 * Type guard to check if a value is a valid question type
 */
export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && ["reading", "meaning"].includes(value);
}

/**
 * Type guard to check if a value is a valid quiz status
 */
export function isQuizStatus(value: unknown): value is QuizStatus {
  return typeof value === "string" && ["in_progress", "completed", "abandoned"].includes(value);
}
