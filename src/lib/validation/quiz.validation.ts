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
