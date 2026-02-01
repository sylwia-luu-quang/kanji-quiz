import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseAbandonQuizParams } from "../../../../lib/validation/quiz.validation";
import { QuizService } from "../../../../lib/services/quiz.service";
import {
  QuizNotFoundError,
  QuizAccessDeniedError,
  QuizNotAbandonableError,
  QuizAbandonmentError,
} from "../../../../lib/errors/quiz.errors";
import type { ErrorResponseDTO } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

/**
 * PATCH /api/quizzes/:id/abandon
 *
 * Abandons an in-progress quiz, changing its status from 'in_progress' to 'abandoned'.
 * Preserves all quiz questions and their state (including answers if any) and need-review
 * toggles made during the quiz session. No scoring or completion timestamp is set.
 *
 * Path Parameters:
 * - id: Quiz ID (positive integer)
 *
 * Business Rules:
 * - Only works on quizzes with status='in_progress'
 * - Preserves all quiz questions and their state
 * - Preserves need-review toggles
 * - No scoring or completion timestamp is set
 * - User can only abandon their own quizzes
 *
 * Success Response (200 OK):
 * {
 *   "id": 123,
 *   "user_id": "uuid",
 *   "type": "level",
 *   "level": "N5",
 *   "question_count": 10,
 *   "status": "abandoned",
 *   "score_percent": null,
 *   "created_at": "2026-01-18T10:00:00.000Z",
 *   "completed_at": null
 * }
 *
 * Error Responses:
 * - 400: Invalid quiz ID or quiz cannot be abandoned (already completed/abandoned)
 * - 401: Authentication required (disabled for development)
 * - 403: User doesn't own the quiz
 * - 404: Quiz not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, locals }) => {
  try {
    // Extract and validate quiz ID from path parameter
    const validatedParams = parseAbandonQuizParams(params.id || "");
    const quizId = validatedParams.id;

    // TODO: Extract user_id from authenticated session
    // For development: use default user ID
    const userId = DEFAULT_USER_ID;

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

    const abandonedQuiz = await quizService.abandonQuiz(quizId, userId);

    return new Response(JSON.stringify(abandonedQuiz), {
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
        error: "You do not have permission to abandon this quiz",
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

    // Handle quiz not abandonable (already completed or abandoned)
    if (error instanceof QuizNotAbandonableError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.message,
        code: "QUIZ_NOT_ABANDONABLE",
        details: {
          quiz_id: error.quizId,
          current_status: error.currentStatus,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle quiz abandonment errors
    if (error instanceof QuizAbandonmentError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to abandon quiz. Please try again later.",
        code: "QUIZ_ABANDONMENT_ERROR",
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
