/**
 * Custom error classes for quiz operations
 * Provides specific error types for better error handling and user feedback
 */

/**
 * Error thrown when there are insufficient kanji available to create a quiz
 * with the requested number of questions
 */
export class InsufficientKanjiError extends Error {
  constructor(
    public readonly requested: number,
    public readonly available: number
  ) {
    super(`Insufficient kanji available for the requested quiz. Requested: ${requested}, Available: ${available}`);
    this.name = "InsufficientKanjiError";
  }
}

/**
 * Error thrown when an invalid quiz type is provided
 */
export class InvalidQuizTypeError extends Error {
  constructor(public readonly type: string) {
    super(`Invalid quiz type: ${type}. Must be 'level' or 'need_review'`);
    this.name = "InvalidQuizTypeError";
  }
}

/**
 * Error thrown when quiz creation fails due to database or transaction issues
 */
export class QuizCreationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "QuizCreationError";
  }
}
