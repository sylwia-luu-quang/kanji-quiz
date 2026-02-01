/**
 * Error Message Mapper
 *
 * Maps API error codes to user-friendly messages for display in forms
 */

import type { AuthErrorResponseDTO } from "../../types.ts";

/**
 * Map error codes to user-friendly messages
 */
export function getErrorMessage(code: string, defaultMessage?: string): string {
  const errorMessages: Record<string, string> = {
    // Authentication errors
    EMAIL_ALREADY_EXISTS: "An account with this email already exists",
    INVALID_CREDENTIALS: "Invalid email or password",
    WEAK_PASSWORD:
      "Password must be at least 8 characters and contain uppercase, lowercase, and number",
    SESSION_EXPIRED: "Your session has expired. Please sign in again",
    AUTH_SERVICE_ERROR: "An error occurred during authentication. Please try again",
    AUTHENTICATION_REQUIRED: "You must be signed in to access this resource",

    // Validation errors
    VALIDATION_ERROR: "Please check your input and try again",

    // Generic fallback
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
  };

  return errorMessages[code] || defaultMessage || errorMessages.UNKNOWN_ERROR;
}

/**
 * Extract field-specific error from validation error details
 */
export function getFieldError(
  errorResponse: AuthErrorResponseDTO,
  fieldName: string,
): string | undefined {
  if (errorResponse.code === "VALIDATION_ERROR" && errorResponse.details?.field === fieldName) {
    return errorResponse.error;
  }
  return undefined;
}

/**
 * Get a user-friendly error message from an auth error response
 */
export function formatAuthError(errorResponse: AuthErrorResponseDTO): string {
  // For validation errors, use the specific message
  if (errorResponse.code === "VALIDATION_ERROR") {
    return errorResponse.error;
  }

  // For other errors, use the mapped message
  return getErrorMessage(errorResponse.code, errorResponse.error);
}
