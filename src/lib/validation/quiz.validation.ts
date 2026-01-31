import { z } from "zod";

/**
 * Validation schema for POST /api/quizzes request body
 *
 * Supports two quiz types:
 * 1. level: Quiz based on specific JLPT level (requires level parameter)
 * 2. need_review: Quiz based on user's need-review list (level not allowed)
 *
 * Validates:
 * - type: Must be "level" or "need_review"
 * - level: Required for type="level", forbidden for type="need_review"
 * - question_count: Must be 10, 20, or 50 (represents number of kanji)
 */

const jlptLevels = ["N5", "N4", "N3", "N2", "N1"] as const;
const questionCounts = [10, 20, 50] as const;

/**
 * Discriminated union schema for creating a quiz
 * Uses Zod's discriminatedUnion for optimal error messages
 */
export const createQuizSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("level"),
    level: z.enum(jlptLevels, {
      errorMap: () => ({ message: "Level must be one of: N5, N4, N3, N2, N1" }),
    }),
    question_count: z
      .number()
      .int()
      .refine((val) => questionCounts.includes(val as 10 | 20 | 50), {
        message: "Question count must be 10, 20, or 50",
      }),
  }),
  z.object({
    type: z.literal("need_review"),
    question_count: z
      .number()
      .int()
      .refine((val) => questionCounts.includes(val as 10 | 20 | 50), {
        message: "Question count must be 10, 20, or 50",
      }),
  }),
]);

export type CreateQuizSchema = z.infer<typeof createQuizSchema>;

/**
 * Parses and validates request body for quiz creation
 *
 * @param body - Raw request body
 * @returns Validated CreateQuizCommandDTO
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseCreateQuizBody(body: unknown): CreateQuizSchema {
  return createQuizSchema.parse(body);
}

/**
 * Validation schema for GET /api/quizzes query parameters
 *
 * Supports filtering and pagination:
 * - status: Optional filter by quiz status
 * - limit: Number of results per page (1-100, default 20)
 * - offset: Pagination offset (min 0, default 0)
 */
export const getQuizListQuerySchema = z.object({
  status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  offset: z.number().int().min(0, "Offset must be non-negative").default(0),
});

export type GetQuizListQuery = z.infer<typeof getQuizListQuerySchema>;

/**
 * Parses and validates query parameters for quiz list retrieval
 *
 * @param query - URLSearchParams from request URL
 * @returns Validated GetQuizListQuery with defaults applied
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseGetQuizListQuery(query: URLSearchParams): GetQuizListQuery {
  const rawParams = {
    status: query.get("status") || undefined,
    limit: query.get("limit") ? Number(query.get("limit")) : 20,
    offset: query.get("offset") ? Number(query.get("offset")) : 0,
  };

  return getQuizListQuerySchema.parse(rawParams);
}

/**
 * Validation schema for POST /api/quizzes/:id/complete path parameter
 *
 * Validates:
 * - id: Must be a valid positive integer string, transformed to number
 */
export const completeQuizParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Quiz ID must be a valid number")
    .transform(Number)
    .refine((val) => val > 0, {
      message: "Quiz ID must be a positive number",
    }),
});

export type CompleteQuizParams = z.infer<typeof completeQuizParamsSchema>;

/**
 * Parses and validates path parameters for quiz completion
 *
 * @param id - Raw quiz ID from path parameter
 * @returns Validated CompleteQuizParams with transformed number ID
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseCompleteQuizParams(id: string): CompleteQuizParams {
  return completeQuizParamsSchema.parse({ id });
}
