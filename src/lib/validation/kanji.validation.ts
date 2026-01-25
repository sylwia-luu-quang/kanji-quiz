import { z } from "zod";

/**
 * Validation schema for GET /api/kanji query parameters
 *
 * Validates:
 * - level: Optional JLPT level (N5, N4, N3, N2, N1)
 * - limit: Number of results per page (1-100, default: 50)
 * - offset: Pagination offset (non-negative, default: 0)
 */
export const GetKanjiQuerySchema = z.object({
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional().describe("JLPT level filter"),

  limit: z.number().int().positive().max(100).default(50).describe("Number of results per page"),

  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
});

export type GetKanjiQuery = z.infer<typeof GetKanjiQuerySchema>;

/**
 * Parses and validates query parameters from URLSearchParams
 *
 * @param searchParams - URL search parameters from request
 * @returns Validated query parameters
 * @throws ZodError if validation fails
 */
export function parseKanjiQueryParams(searchParams: URLSearchParams): GetKanjiQuery {
  const levelParam = searchParams.get("level");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const rawParams = {
    level: levelParam || undefined,
    limit: limitParam ? parseInt(limitParam, 10) : 50,
    offset: offsetParam ? parseInt(offsetParam, 10) : 0,
  };

  return GetKanjiQuerySchema.parse(rawParams);
}
