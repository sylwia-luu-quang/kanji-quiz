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

/**
 * Error thrown when a quiz is not found
 */
export class QuizNotFoundError extends Error {
  constructor(public readonly quizId: number) {
    super(`Quiz not found with id: ${quizId}`);
    this.name = "QuizNotFoundError";
  }
}

/**
 * Error thrown when a user doesn't have permission to access a quiz
 */
export class QuizAccessDeniedError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly userId: string
  ) {
    super(`User ${userId} does not have permission to access quiz ${quizId}`);
    this.name = "QuizAccessDeniedError";
  }
}

/**
 * Error thrown when attempting to complete an already completed quiz
 */
export class QuizAlreadyCompletedError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly completedAt: string,
    public readonly scorePercent: number
  ) {
    super(`Quiz ${quizId} is already completed`);
    this.name = "QuizAlreadyCompletedError";
  }
}

/**
 * Error thrown when attempting to complete a quiz with unanswered questions
 */
export class IncompleteQuizError extends Error {
  constructor(
    public readonly totalQuestions: number,
    public readonly answeredQuestions: number
  ) {
    super(`Cannot complete quiz. ${answeredQuestions} of ${totalQuestions} questions answered.`);
    this.name = "IncompleteQuizError";
  }
}

/**
 * Error thrown when quiz completion fails due to database or transaction issues
 */
export class QuizCompletionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "QuizCompletionError";
  }
}

/**
 * Error thrown when attempting to abandon a quiz that cannot be abandoned
 * (quiz is already completed or abandoned)
 */
export class QuizNotAbandonableError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly currentStatus: string
  ) {
    super(`Quiz ${quizId} cannot be abandoned. Current status: ${currentStatus}`);
    this.name = "QuizNotAbandonableError";
  }
}

/**
 * Error thrown when quiz abandonment fails due to database or transaction issues
 */
export class QuizAbandonmentError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "QuizAbandonmentError";
  }
}

/**
 * Error thrown when a question is not found
 */
export class QuestionNotFoundError extends Error {
  constructor(
    public readonly questionId: number,
    public readonly quizId?: number
  ) {
    super(quizId ? `Question ${questionId} not found in quiz ${quizId}` : `Question ${questionId} not found`);
    this.name = "QuestionNotFoundError";
  }
}

/**
 * Error thrown when attempting to answer an already answered question
 */
export class QuestionAlreadyAnsweredError extends Error {
  constructor(
    public readonly questionId: number,
    public readonly answeredAt: string
  ) {
    super(`Question ${questionId} has already been answered at ${answeredAt}`);
    this.name = "QuestionAlreadyAnsweredError";
  }
}

/**
 * Error thrown when answer submission fails due to database or validation issues
 */
export class AnswerSubmissionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AnswerSubmissionError";
  }
}

/**
 * Error thrown when quiz is not in a valid state for answering questions
 */
export class QuizInvalidStateError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly currentStatus: string
  ) {
    super(`Quiz ${quizId} cannot accept answers. Current status: ${currentStatus}`);
    this.name = "QuizInvalidStateError";
  }
}
