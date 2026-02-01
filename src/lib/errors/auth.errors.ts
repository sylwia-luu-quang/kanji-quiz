/**
 * Authentication Error Classes
 *
 * Provides specialized error types for authentication operations
 * with proper HTTP status codes and error codes for API responses
 */

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Error thrown when email already exists during registration
 * HTTP Status: 409 Conflict
 */
export class EmailAlreadyExistsError extends AuthError {
  constructor(message = "An account with this email already exists") {
    super(message, "EMAIL_ALREADY_EXISTS", 409);
    this.name = "EmailAlreadyExistsError";
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when login credentials are invalid
 * HTTP Status: 401 Unauthorized
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message = "Invalid email or password") {
    super(message, "INVALID_CREDENTIALS", 401);
    this.name = "InvalidCredentialsError";
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * Error thrown when password doesn't meet requirements
 * HTTP Status: 400 Bad Request
 */
export class WeakPasswordError extends AuthError {
  constructor(
    message = "Password must be at least 8 characters and contain uppercase, lowercase, and number",
  ) {
    super(message, "WEAK_PASSWORD", 400);
    this.name = "WeakPasswordError";
    Object.setPrototypeOf(this, WeakPasswordError.prototype);
  }
}

/**
 * Error thrown when session has expired
 * HTTP Status: 401 Unauthorized
 */
export class SessionExpiredError extends AuthError {
  constructor(message = "Your session has expired. Please sign in again") {
    super(message, "SESSION_EXPIRED", 401);
    this.name = "SessionExpiredError";
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

/**
 * Error thrown when authentication is required but not provided
 * HTTP Status: 401 Unauthorized
 */
export class AuthenticationRequiredError extends AuthError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_REQUIRED", 401);
    this.name = "AuthenticationRequiredError";
    Object.setPrototypeOf(this, AuthenticationRequiredError.prototype);
  }
}

/**
 * Generic error for auth service failures
 * HTTP Status: 500 Internal Server Error
 */
export class AuthServiceError extends AuthError {
  constructor(message = "Authentication service error", public readonly originalError?: unknown) {
    super(message, "AUTH_SERVICE_ERROR", 500);
    this.name = "AuthServiceError";
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
