import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseAddNeedReviewBody, parseNeedReviewQueryParams } from "../../../lib/validation/need-review.validation";
import { NeedReviewService } from "../../../lib/services/need-review.service";
import { KanjiNotFoundError, NeedReviewCreationError } from "../../../lib/errors/need-review.errors";
import type { ErrorResponseDTO } from "../../../types";

/**
 * GET /api/need-reviews
 *
 * Retrieves the authenticated user's need-review list with embedded kanji details.
 * Supports pagination to handle large need-review lists efficiently.
 *
 * Query Parameters:
 * - limit (optional): Number of results per page (1-100, default: 50)
 * - offset (optional): Pagination offset (default: 0)
 *
 * Success Response (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": 501,
 *       "user_id": "uuid-here",
 *       "kanji_id": 42,
 *       "kanji": {
 *         "id": 42,
 *         "character": "行",
 *         "level": "N5",
 *         "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
 *         "meanings": ["go", "conduct", "line"]
 *       },
 *       "created_at": "2026-01-18T10:01:30Z"
 *     }
 *   ],
 *   "pagination": {
 *     "total": 25,
 *     "limit": 50,
 *     "offset": 0
 *   }
 * }
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized (handled by middleware)
 * - 500: Internal server error
 *
 * TODO: Implement JWT authentication to extract user_id from token
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const queryParams = parseNeedReviewQueryParams(url.searchParams);

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

    const needReviewService = new NeedReviewService(locals.supabase);
    const result = await needReviewService.getNeedReviewList(userId, queryParams);

    return new Response(JSON.stringify(result), {
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

    const errorResponse: ErrorResponseDTO = {
      error: error instanceof Error ? error.message : "Internal server error",
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
 * POST /api/need-reviews
 *
 * Adds a kanji to the user's need-review list for later practice.
 * This is an idempotent operation - calling it multiple times with the same
 * kanji_id will not create duplicates.
 *
 * Request Body:
 * {
 *   "kanji_id": 123
 * }
 *
 * Success Response (201 Created - new entry):
 * {
 *   "id": 456,
 *   "user_id": "uuid",
 *   "kanji_id": 123,
 *   "created_at": "2026-01-31T...",
 *   "kanji": {
 *     "id": 123,
 *     "character": "日",
 *     "level": "N5",
 *     "readings": ["ニチ", "ジツ", "ひ"],
 *     "meanings": ["day", "sun", "Japan"],
 *     "created_at": "2026-01-25T..."
 *   }
 * }
 *
 * Success Response (200 OK - already exists):
 * Same structure as 201, but status code indicates entry already existed
 *
 * Error Responses:
 * - 400: Invalid request body (validation error)
 * - 404: Kanji not found
 * - 500: Internal server error or missing user ID
 *
 * TODO: Implement JWT authentication to extract user_id from token
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedBody = parseAddNeedReviewBody(body);

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

    const needReviewService = new NeedReviewService(locals.supabase);
    const result = await needReviewService.addNeedReview(userId, validatedBody.kanji_id);

    const statusCode = result.isNewEntry ? 201 : 200;

    return new Response(JSON.stringify(result.needReview), {
      status: statusCode,
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

    if (error instanceof KanjiNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.message,
        code: "KANJI_NOT_FOUND",
        details: {
          kanjiId: error.kanjiId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (error instanceof NeedReviewCreationError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to add kanji to need-review list. Please try again later.",
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
