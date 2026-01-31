import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseCompleteQuizParams } from "../../../../lib/validation/quiz.validation";
import { QuizService } from "../../../../lib/services/quiz.service";
import {
  QuizNotFoundError,
  QuizAccessDeniedError,
  QuizAlreadyCompletedError,
  IncompleteQuizError,
  QuizCompletionError,
} from "../../../../lib/errors/quiz.errors";
import type { ErrorResponseDTO } from "../../../../types";
import { defaultUserId } from "../../../../db/supabase.client";

/**
 * POST /api/quizzes/:id/complete
 *
 * Marks a quiz as completed after the user has answered all questions.
 * Validates that all questions are answered, calculates the final score percentage,
 * and updates the quiz status with a completion timestamp.
 *
 * Path Parameters:
 * - id: Quiz ID (positive integer)
 *
 * Business Rules:
 * - All questions must have user_answer and answered_at set
 * - Score calculation: (COUNT(is_correct=true) / question_count) * 100
 * - Quiz status must transition from in_progress to completed
 * - Once completed, a quiz cannot be re-completed
 *
 * Success Response (200 OK):
 * {
 *   "id": 123,
 *   "user_id": "uuid",
 *   "type": "level",
 *   "level": "N5",
 *   "question_count": 10,
 *   "status": "completed",
 *   "score_percent": 85.00,
 *   "created_at": "2026-01-18T10:00:00.000Z",
 *   "completed_at": "2026-01-18T10:05:32.000Z"
 * }
 *
 * Error Responses:
 * - 400: Invalid quiz ID or incomplete quiz (not all questions answered)
 * - 401: Authentication required (disabled for development)
 * - 403: User doesn't own the quiz
 * - 404: Quiz not found
 * - 409: Quiz already completed
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Extract and validate quiz ID from path parameter
    const validatedParams = parseCompleteQuizParams(params.id || "");
    const quizId = validatedParams.id;

    // TODO: Extract user_id from authenticated session
    // For development: use default user ID
    const userId = defaultUserId;

    if (!userId) {
      const errorResponse: ErrorResponseDTO = {
        error: "User ID not available",
        code: "MISSING_USER_ID",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const quizService = new QuizService(locals.supabase);

    const completedQuiz = await quizService.completeQuiz(quizId, userId);

    return new Response(JSON.stringify(completedQuiz), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors (invalid quiz ID)
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid quiz ID",
        code: "VALIDATION_ERROR",
        details: formatZodError(error),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle quiz not found
    if (error instanceof QuizNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Quiz not found",
        code: "QUIZ_NOT_FOUND",
        details: {
          quiz_id: error.quizId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle access denied (user doesn't own quiz)
    if (error instanceof QuizAccessDeniedError) {
      const errorResponse: ErrorResponseDTO = {
        error: "You do not have permission to complete this quiz",
        code: "QUIZ_ACCESS_DENIED",
        details: {
          quiz_id: error.quizId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle incomplete quiz (not all questions answered)
    if (error instanceof IncompleteQuizError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Cannot complete quiz. Not all questions have been answered.",
        code: "INCOMPLETE_QUIZ",
        details: {
          total_questions: error.totalQuestions,
          answered_questions: error.answeredQuestions,
          unanswered_questions: error.totalQuestions - error.answeredQuestions,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle already completed quiz
    if (error instanceof QuizAlreadyCompletedError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Quiz is already completed",
        code: "QUIZ_ALREADY_COMPLETED",
        details: {
          quiz_id: error.quizId,
          completed_at: error.completedAt,
          score_percent: error.scorePercent,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle quiz completion errors
    if (error instanceof QuizCompletionError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to complete quiz. Please try again later.",
        code: "QUIZ_COMPLETION_ERROR",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
      code: "SERVER_ERROR",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

/**
 * Formats Zod validation errors into a user-friendly details object
 *
 * @param error - Zod validation error
 * @returns Record of field names to error messages
 */
function formatZodError(error: ZodError): Record<string, unknown> {
  const details: Record<string, unknown> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "id";
    details[path] = issue.message;
  }

  return details;
}

export const prerender = false;
