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
