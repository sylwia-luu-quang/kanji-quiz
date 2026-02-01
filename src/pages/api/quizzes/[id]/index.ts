import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseGetQuizByIdParams } from "../../../../lib/validation/quiz.validation";
import { QuizService } from "../../../../lib/services/quiz.service";
import { QuizNotFoundError, QuizAccessDeniedError, QuizCreationError } from "../../../../lib/errors/quiz.errors";
import type { ErrorResponseDTO } from "../../../../types";

/**
 * GET /api/quizzes/:id
 *
 * Retrieves a single quiz by ID with complete details including all questions,
 * answers, and embedded kanji information.
 *
 * Path Parameters:
 * - id: Quiz ID (must be positive integer)
 *
 * Success Response (200 OK):
 * {
 *   "id": 123,
 *   "user_id": "uuid",
 *   "type": "level",
 *   "level": "N5",
 *   "question_count": 10,
 *   "status": "completed",
 *   "score_percent": 85.0,
 *   "created_at": "2026-01-18T10:00:00Z",
 *   "completed_at": "2026-01-18T10:05:32Z",
 *   "questions": [
 *     {
 *       "id": 1001,
 *       "quiz_id": 123,
 *       "kanji_id": 42,
 *       "sequence": 1,
 *       "question_type": "reading",
 *       "kanji": {
 *         "id": 42,
 *         "character": "行",
 *         "level": "N5",
 *         "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
 *         "meanings": ["go", "conduct", "line"],
 *         "created_at": "2026-01-18T10:00:00Z"
 *       },
 *       "user_answer": "こう",
 *       "answered_at": "2026-01-18T10:01:15Z",
 *       "is_correct": true,
 *       "created_at": "2026-01-18T10:00:00Z"
 *     }
 *   ]
 * }
 *
 * Error Responses:
 * - 400: Invalid quiz ID format
 * - 403: User doesn't own the quiz
 * - 404: Quiz not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      const errorResponse: ErrorResponseDTO = {
        error: "Quiz ID is required",
        code: "VALIDATION_ERROR",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const validatedParams = parseGetQuizByIdParams(id);

    const userId = locals.user?.id;

    if (!userId) {
      const errorResponse: ErrorResponseDTO = {
        error: "User not authenticated",
        code: "UNAUTHORIZED",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const quizService = new QuizService(locals.supabase);
    const quiz = await quizService.getQuizById(validatedParams.id, userId);

    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
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

    if (error instanceof QuizAccessDeniedError) {
      const errorResponse: ErrorResponseDTO = {
        error: "You do not have permission to access this quiz",
        code: "ACCESS_DENIED",
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

    if (error instanceof QuizCreationError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to retrieve quiz",
        code: "DATABASE_ERROR",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

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
