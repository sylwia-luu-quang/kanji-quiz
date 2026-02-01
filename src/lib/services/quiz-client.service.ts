/**
 * Quiz Client Service
 *
 * Type-safe client-side API methods for quiz operations
 */

import type {
  QuizWithQuestionsDTO,
  QuizDTO,
  QuestionAnswerResponseDTO,
  SubmitAnswerCommandDTO,
  NeedReviewDTO,
  AddNeedReviewCommandDTO,
  ErrorResponseDTO,
} from "@/types";

/**
 * Custom error class for API errors with status code and details
 */
export class QuizAPIError extends Error {
  constructor(
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(`API Error: ${status}`);
    this.name = "QuizAPIError";
  }
}

/**
 * Fetch a quiz by ID with all questions
 */
export async function getQuiz(quizId: number): Promise<QuizWithQuestionsDTO> {
  const response = await fetch(`/api/quizzes/${quizId}`);

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  return response.json();
}

/**
 * Submit an answer to a specific question
 */
export async function submitAnswer(
  quizId: number,
  questionId: number,
  answer: string
): Promise<QuestionAnswerResponseDTO> {
  const body: SubmitAnswerCommandDTO = { user_answer: answer };

  const response = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  return response.json();
}

/**
 * Complete a quiz
 */
export async function completeQuiz(quizId: number): Promise<QuizDTO> {
  const response = await fetch(`/api/quizzes/${quizId}/complete`, {
    method: "POST",
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  return response.json();
}

/**
 * Abandon a quiz
 */
export async function abandonQuiz(quizId: number): Promise<QuizDTO> {
  const response = await fetch(`/api/quizzes/${quizId}/abandon`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  return response.json();
}

/**
 * Add a kanji to the need-review list
 */
export async function addNeedReview(kanjiId: number): Promise<NeedReviewDTO> {
  const body: AddNeedReviewCommandDTO = { kanji_id: kanjiId };

  const response = await fetch("/api/need-reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  return response.json();
}

/**
 * Remove a kanji from the need-review list
 */
export async function removeNeedReview(kanjiId: number): Promise<void> {
  const response = await fetch(`/api/need-reviews/${kanjiId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new QuizAPIError(response.status, error.code, error.details);
  }

  // DELETE returns 204 No Content
}
