import { z } from "zod";

/**
 * Validation schema for POST /api/need-reviews request body
 *
 * Validates:
 * - kanji_id: Must be a positive integer (references kanji table ID)
 */
export const addNeedReviewSchema = z.object({
  kanji_id: z
    .number({
      required_error: "kanji_id is required",
      invalid_type_error: "kanji_id must be a number",
    })
    .int("kanji_id must be an integer")
    .positive("kanji_id must be a positive number"),
});

export type AddNeedReviewSchema = z.infer<typeof addNeedReviewSchema>;

/**
 * Parses and validates request body for adding a need-review entry
 *
 * @param body - Raw request body
 * @returns Validated AddNeedReviewCommandDTO
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseAddNeedReviewBody(body: unknown): AddNeedReviewSchema {
  return addNeedReviewSchema.parse(body);
}

/**
 * Validation schema for GET /api/need-reviews query parameters
 *
 * Validates:
 * - limit: Number of results per page (1-100, default: 50)
 * - offset: Pagination offset (non-negative, default: 0)
 */
export const GetNeedReviewQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(50).describe("Number of results per page"),

  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
});

export type GetNeedReviewQuery = z.infer<typeof GetNeedReviewQuerySchema>;

/**
 * Parses and validates query parameters from URLSearchParams
 *
 * @param searchParams - URL search parameters from request
 * @returns Validated query parameters
 * @throws ZodError if validation fails
 */
export function parseNeedReviewQueryParams(searchParams: URLSearchParams): GetNeedReviewQuery {
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const rawParams = {
    limit: limitParam ? parseInt(limitParam, 10) : 50,
    offset: offsetParam ? parseInt(offsetParam, 10) : 0,
  };

  return GetNeedReviewQuerySchema.parse(rawParams);
}

/**
 * Validation schema for DELETE /api/need-reviews/:kanjiId path parameter
 *
 * Validates:
 * - kanjiId: Must be a positive integer (references kanji table ID)
 */
export const deleteNeedReviewParamsSchema = z.object({
  kanjiId: z.coerce
    .number({
      required_error: "kanjiId is required",
      invalid_type_error: "kanjiId must be a valid number",
    })
    .int("kanjiId must be an integer")
    .positive("kanjiId must be a positive number"),
});

export type DeleteNeedReviewParams = z.infer<typeof deleteNeedReviewParamsSchema>;

/**
 * Parses and validates path parameter for deleting a need-review entry
 *
 * @param kanjiId - Raw kanjiId from URL path parameter (string)
 * @returns Validated DeleteNeedReviewParams with numeric kanjiId
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseDeleteNeedReviewParams(kanjiId: string | undefined): DeleteNeedReviewParams {
  return deleteNeedReviewParamsSchema.parse({ kanjiId });
}
