import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseDeleteNeedReviewParams } from "../../../lib/validation/need-review.validation";
import { NeedReviewService } from "../../../lib/services/need-review.service";
import type { ErrorResponseDTO } from "../../../types";
import { defaultUserId } from "../../../db/supabase.client";

/**
 * DELETE /api/need-reviews/:kanjiId
 *
 * Removes a specific kanji from the authenticated user's need-review list.
 * This is an idempotent operation - it always returns success (204 No Content)
 * regardless of whether the kanji was actually in the user's list.
 *
 * Path Parameters:
 * - kanjiId: ID of the kanji to remove (must be a positive integer)
 *
 * Success Response (204 No Content):
 * - Empty body
 * - Returns 204 whether entry existed or not (idempotent)
 *
 * Error Responses:
 * - 400: Invalid kanjiId parameter (not an integer, negative, zero)
 * - 401: Unauthorized (handled by middleware)
 * - 500: Internal server error
 *
 * Key Characteristics:
 * - Idempotent: Multiple identical requests produce the same result
 * - User-scoped: Can only delete own entries (enforced by userId filter)
 * - No 404 errors: Missing entries are treated as successful deletion
 *
 * TODO: Implement JWT authentication to extract user_id from token
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate path parameter
    const validatedParams = parseDeleteNeedReviewParams(params.kanjiId);

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

    // Call service layer to remove need-review entry
    const needReviewService = new NeedReviewService(locals.supabase);
    await needReviewService.removeNeedReview(userId, validatedParams.kanjiId);

    // Return 204 No Content (idempotent - always success)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid kanjiId parameter",
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

    // Log unexpected errors for debugging
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/need-reviews/:kanjiId:", error);

    // Handle database and other errors
    const errorResponse: ErrorResponseDTO = {
      error: error instanceof Error ? error.message : "Failed to remove kanji from need-review list",
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
    const path = issue.path.join(".") || "parameter";
    details[path] = issue.message;
  }

  return details;
}

export const prerender = false;
