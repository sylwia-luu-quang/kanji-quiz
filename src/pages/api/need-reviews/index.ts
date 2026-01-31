import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseAddNeedReviewBody } from "../../../lib/validation/need-review.validation";
import { NeedReviewService } from "../../../lib/services/need-review.service";
import { KanjiNotFoundError, NeedReviewCreationError } from "../../../lib/errors/need-review.errors";
import type { ErrorResponseDTO } from "../../../types";
import { defaultUserId } from "../../../db/supabase.client";

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
    // Parse and validate request body
    const body = await request.json();
    const validatedBody = parseAddNeedReviewBody(body);

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

    // Call service layer to add need-review entry
    const needReviewService = new NeedReviewService(locals.supabase);
    const result = await needReviewService.addNeedReview(userId, validatedBody.kanji_id);

    // Determine status code based on whether entry is new
    const statusCode = result.isNewEntry ? 201 : 200;

    return new Response(JSON.stringify(result.needReview), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
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

    // Handle kanji not found
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

    // Handle database errors
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
    const path = issue.path.join(".") || "body";
    details[path] = issue.message;
  }

  return details;
}

export const prerender = false;
