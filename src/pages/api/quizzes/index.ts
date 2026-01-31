import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseCreateQuizBody, parseGetQuizListQuery } from "../../../lib/validation/quiz.validation";
import { QuizService } from "../../../lib/services/quiz.service";
import { InsufficientKanjiError, QuizCreationError } from "../../../lib/errors/quiz.errors";
import type { ErrorResponseDTO, QuizListResponseDTO } from "../../../types";
import { defaultUserId } from "../../../db/supabase.client";

/**
 * POST /api/quizzes
 *
 * Creates a new quiz session for a user with randomly selected kanji.
 * Generates 2 questions per kanji (reading + meaning) with randomized order.
 *
 * Request Body:
 * - For level-based quiz:
 *   { "type": "level", "level": "N5", "question_count": 10 }
 * - For need-review quiz:
 *   { "type": "need_review", "question_count": 10 }
 *
 * Success Response (201 Created):
 * {
 *   "id": 123,
 *   "user_id": "uuid",
 *   "type": "level",
 *   "level": "N5",
 *   "question_count": 10,
 *   "status": "in_progress",
 *   "score_percent": null,
 *   "created_at": "2026-01-25T...",
 *   "completed_at": null,
 *   "questions": [...]
 * }
 *
 * Error Responses:
 * - 400: Invalid request body or insufficient kanji
 * - 401: Authentication required (disabled for development)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    const validatedBody = parseCreateQuizBody(body);

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

    const quiz = await quizService.createQuiz({
      userId,
      type: validatedBody.type,
      level: validatedBody.type === "level" ? validatedBody.level : undefined,
      questionCount: validatedBody.question_count,
    });

    return new Response(JSON.stringify(quiz), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid request body",
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

    if (error instanceof InsufficientKanjiError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.message,
        code: "INSUFFICIENT_KANJI",
        details: {
          requested: error.requested,
          available: error.available,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (error instanceof QuizCreationError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to create quiz. Please try again later.",
        code: "QUIZ_CREATION_ERROR",
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
 * GET /api/quizzes
 *
 * Retrieves a paginated list of quizzes belonging to the authenticated user.
 * Supports optional filtering by quiz status.
 *
 * Query Parameters:
 * - status (optional): Filter by quiz status ("in_progress" | "completed" | "abandoned")
 * - limit (optional): Number of results per page (1-100, default 20)
 * - offset (optional): Pagination offset (min 0, default 0)
 *
 * Success Response (200 OK):
 * {
 *   "data": [QuizDTO...],
 *   "pagination": {
 *     "total": 15,
 *     "limit": 20,
 *     "offset": 0
 *   }
 * }
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const validatedQuery = parseGetQuizListQuery(url.searchParams);

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

    const result = await quizService.getQuizList({
      userId,
      status: validatedQuery.status,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    });

    const response: QuizListResponseDTO = {
      data: result.quizzes,
      pagination: {
        total: result.total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid query parameters",
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

    if (error instanceof QuizCreationError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to retrieve quiz list",
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
    const path = issue.path.join(".") || "body";
    details[path] = issue.message;
  }

  return details;
}

export const prerender = false;
