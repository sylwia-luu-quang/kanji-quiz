/**
 * Client-Side Authentication Helpers
 *
 * Provides convenient wrapper functions for calling authentication API endpoints
 * from React components
 */

import type {
  AuthErrorResponseDTO,
  SignInCommandDTO,
  SignInResponseDTO,
  SignUpCommandDTO,
  SignUpResponseDTO,
  SessionResponseDTO,
} from "../../types.ts";

/**
 * Generic API error class for client-side
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Sign in a user with email and password
 * @throws ApiError on failure
 */
export async function signIn(email: string, password: string): Promise<SignInResponseDTO> {
  const payload: SignInCommandDTO = { email, password };

  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as AuthErrorResponseDTO;
    throw new ApiError(
      errorData.error,
      errorData.code,
      response.status,
      errorData.details,
    );
  }

  return data as SignInResponseDTO;
}

/**
 * Sign up a new user
 * @throws ApiError on failure
 */
export async function signUp(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<SignUpResponseDTO> {
  const payload: SignUpCommandDTO = { email, password, confirmPassword };

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as AuthErrorResponseDTO;
    throw new ApiError(
      errorData.error,
      errorData.code,
      response.status,
      errorData.details,
    );
  }

  return data as SignUpResponseDTO;
}

/**
 * Sign out the current user
 * @throws ApiError on failure
 */
export async function signOut(): Promise<void> {
  const response = await fetch("/api/auth/signout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = (await response.json()) as AuthErrorResponseDTO;
    throw new ApiError(data.error, data.code, response.status, data.details);
  }
}

/**
 * Get current session information
 * @throws ApiError on failure
 */
export async function getSession(): Promise<SessionResponseDTO> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as AuthErrorResponseDTO;
    throw new ApiError(
      errorData.error,
      errorData.code,
      response.status,
      errorData.details,
    );
  }

  return data as SessionResponseDTO;
}
