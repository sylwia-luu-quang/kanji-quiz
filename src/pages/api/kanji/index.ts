import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseKanjiQueryParams } from "../../../lib/validation/kanji.validation";
import { KanjiService } from "../../../lib/services/kanji.service";
import type { ErrorResponseDTO } from "../../../types";

/**
 * GET /api/kanji
 *
 * Retrieves a paginated list of kanji characters with optional JLPT level filtering.
 * This is a public endpoint that does not require authentication.
 *
 * Query Parameters:
 * - level (optional): JLPT level filter (N5, N4, N3, N2, N1)
 * - limit (optional): Number of results per page (1-100, default: 50)
 * - offset (optional): Pagination offset (default: 0)
 *
 * Success Response (200):
 * {
 *   "data": [{ id, character, level, readings[], meanings[], created_at }],
 *   "pagination": { total, limit, offset }
 * }
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Validate query parameters
    const queryParams = parseKanjiQueryParams(url.searchParams);

    // Initialize service
    const kanjiService = new KanjiService(locals.supabase);

    // Fetch kanji data
    const result = await kanjiService.getKanji(queryParams);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
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

    // Log unexpected errors for debugging
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/kanji:", error);

    // Handle database and other errors
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
 * Formats Zod validation errors into a user-friendly details object
 *
 * @param error - Zod validation error
 * @returns Record of field names to error messages
 */
function formatZodError(error: ZodError): Record<string, unknown> {
  const details: Record<string, unknown> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    details[path] = issue.message;
  }

  return details;
}
