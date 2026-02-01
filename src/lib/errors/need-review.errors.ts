/**
 * Custom error classes for need-review operations
 * Provides specific error types for better error handling and user feedback
 */

/**
 * Error thrown when a kanji with the specified ID is not found
 */
export class KanjiNotFoundError extends Error {
  constructor(public readonly kanjiId: number) {
    super(`Kanji not found with id: ${kanjiId}`);
    this.name = "KanjiNotFoundError";
  }
}

/**
 * Error thrown when creating a need-review entry fails
 * due to database or transaction issues
 */
export class NeedReviewCreationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "NeedReviewCreationError";
  }
}
