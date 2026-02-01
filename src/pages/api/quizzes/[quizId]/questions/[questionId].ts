import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { parseSubmitAnswerParams, parseSubmitAnswerBody } from "../../../../../lib/validation/quiz.validation";
import { QuizService } from "../../../../../lib/services/quiz.service";
import {
  QuizNotFoundError,
  QuizAccessDeniedError,
  QuizInvalidStateError,
  QuestionNotFoundError,
  QuestionAlreadyAnsweredError,
  AnswerSubmissionError,
} from "../../../../../lib/errors/quiz.errors";
import type { ErrorResponseDTO } from "../../../../../types";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";

/**
 * PATCH /api/quizzes/:quizId/questions/:questionId
 *
 * Submits an answer for a specific quiz question. Validates the answer against
 * the kanji's readings (for reading questions) or meanings (for meaning questions),
 * records the answer with a timestamp, determines correctness, and returns immediate
 * feedback including the correct answers.
 *
 * Path Parameters:
 * - quizId: Quiz ID (positive integer)
 * - questionId: Question ID (positive integer)
 *
 * Request Body:
 * {
 *   "user_answer": "こう"
 * }
 *
 * Business Rules:
 * - Quiz must belong to authenticated user
 * - Quiz status must be 'in_progress'
 * - Question must belong to specified quiz
 * - Question cannot be answered twice
 * - Answer validation is case-insensitive
 * - Whitespace is trimmed from answers
 *
 * Success Response (200 OK):
 * {
 *   "id": 1001,
 *   "quiz_id": 123,
 *   "kanji_id": 42,
 *   "sequence": 1,
 *   "question_type": "reading",
 *   "kanji": {
 *     "id": 42,
 *     "character": "行",
 *     "level": "N5",
 *     "readings": ["こう", "ぎょう"],
 *     "meanings": ["go", "conduct", "line"],
 *     "created_at": "2026-01-18T09:00:00Z"
 *   },
 *   "user_answer": "こう",
 *   "answered_at": "2026-01-18T10:01:15Z",
 *   "is_correct": true,
 *   "created_at": "2026-01-18T10:00:00Z",
 *   "feedback": {
 *     "is_correct": true,
 *     "correct_answers": ["こう", "ぎょう"]
 *   }
 * }
 *
 * Error Responses:
 * - 400: Invalid parameters, empty answer, question already answered, or quiz not in progress
 * - 401: Authentication required (disabled for development)
 * - 403: User doesn't own the quiz
 * - 404: Quiz or question not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Extract and validate path parameters
    const validatedParams = parseSubmitAnswerParams(params.quizId || "", params.questionId || "");
    const { quizId, questionId } = validatedParams;

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = parseSubmitAnswerBody(body);
    const { user_answer } = validatedBody;

    // TODO: Extract user_id from authenticated session
    // For development: use default user ID
    const userId = DEFAULT_USER_ID;

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

    // Initialize service and submit answer
    const quizService = new QuizService(locals.supabase);
    const result = await quizService.submitAnswer(quizId, questionId, user_answer, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors (invalid parameters or request body)
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.errors[0].message,
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

    // Handle quiz not found
    if (error instanceof QuizNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Quiz not found",
        code: "QUIZ_NOT_FOUND",
        details: {
          quiz_id: error.quizId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle access denied (user doesn't own quiz)
    if (error instanceof QuizAccessDeniedError) {
      const errorResponse: ErrorResponseDTO = {
        error: "You do not have permission to submit answers for this quiz",
        code: "QUIZ_ACCESS_DENIED",
        details: {
          quiz_id: error.quizId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle quiz invalid state (not in progress)
    if (error instanceof QuizInvalidStateError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.message,
        code: "QUIZ_INVALID_STATE",
        details: {
          quiz_id: error.quizId,
          current_status: error.currentStatus,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle question not found
    if (error instanceof QuestionNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: error.message,
        code: "QUESTION_NOT_FOUND",
        details: {
          question_id: error.questionId,
          quiz_id: error.quizId,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle question already answered
    if (error instanceof QuestionAlreadyAnsweredError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Question has already been answered",
        code: "QUESTION_ALREADY_ANSWERED",
        details: {
          question_id: error.questionId,
          answered_at: error.answeredAt,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle answer submission errors
    if (error instanceof AnswerSubmissionError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to submit answer. Please try again later.",
        code: "ANSWER_SUBMISSION_ERROR",
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
    const path = issue.path.join(".") || "unknown";
    details[path] = issue.message;
  }

  return details;
}

export const prerender = false;
