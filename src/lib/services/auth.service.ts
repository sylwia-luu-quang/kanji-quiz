/**
 * Authentication Service
 *
 * Handles all authentication operations with Supabase Auth
 */

import type { SupabaseServerClient } from "../../db/supabase.client.ts";
import {
  AuthServiceError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  SessionExpiredError,
} from "../errors/auth.errors.ts";

/**
 * Parameters for sign-up operation
 */
export interface SignUpParams {
  email: string;
  password: string;
}

/**
 * Result of sign-up operation
 */
export interface SignUpResult {
  userId: string;
  email: string;
  emailConfirmationRequired: boolean;
}

/**
 * Parameters for sign-in operation
 */
export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Result of sign-in operation
 */
export interface SignInResult {
  userId: string;
  email: string;
}

/**
 * Session data
 */
export interface SessionData {
  userId: string;
  email: string;
  expiresAt: string | null;
}

/**
 * AuthService class - handles authentication operations
 */
export class AuthService {
  constructor(private readonly supabase: SupabaseServerClient) {}

  /**
   * Register a new user
   * @throws EmailAlreadyExistsError if email is already registered
   * @throws AuthServiceError for other errors
   */
  async signUp(params: SignUpParams): Promise<SignUpResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (error) {
        // Check for specific error types
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          throw new EmailAlreadyExistsError();
        }
        throw new AuthServiceError(`Sign-up failed: ${error.message}`, error);
      }

      if (!data.user || !data.user.email) {
        throw new AuthServiceError("Sign-up succeeded but no user data returned");
      }

      return {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmationRequired: data.user.identities?.length === 0,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof EmailAlreadyExistsError || error instanceof AuthServiceError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AuthServiceError("Unexpected error during sign-up", error);
    }
  }

  /**
   * Authenticate a user with email and password
   * @throws InvalidCredentialsError if credentials are incorrect
   * @throws AuthServiceError for other errors
   */
  async signIn(params: SignInParams): Promise<SignInResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) {
        // Generic error for invalid credentials (security: don't reveal if email exists)
        if (
          error.message.includes("Invalid") ||
          error.message.includes("credentials") ||
          error.message.includes("password")
        ) {
          throw new InvalidCredentialsError();
        }
        throw new AuthServiceError(`Sign-in failed: ${error.message}`, error);
      }

      if (!data.user || !data.user.email) {
        throw new AuthServiceError("Sign-in succeeded but no user data returned");
      }

      return {
        userId: data.user.id,
        email: data.user.email,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof InvalidCredentialsError || error instanceof AuthServiceError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AuthServiceError("Unexpected error during sign-in", error);
    }
  }

  /**
   * Sign out the current user
   * @throws AuthServiceError on failure
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new AuthServiceError(`Sign-out failed: ${error.message}`, error);
      }
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthServiceError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AuthServiceError("Unexpected error during sign-out", error);
    }
  }

  /**
   * Get current session data
   * @returns SessionData or null if not authenticated
   * @throws AuthServiceError on failure
   */
  async getSession(): Promise<SessionData | null> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        throw new AuthServiceError(`Failed to get session: ${error.message}`, error);
      }

      if (!session || !session.user || !session.user.email) {
        return null;
      }

      return {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at ? String(session.expires_at) : null,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthServiceError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AuthServiceError("Unexpected error getting session", error);
    }
  }

  /**
   * Refresh the current session
   * @throws SessionExpiredError if session cannot be refreshed
   * @throws AuthServiceError for other errors
   */
  async refreshSession(): Promise<SessionData> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.refreshSession();

      if (error) {
        if (error.message.includes("expired") || error.message.includes("refresh")) {
          throw new SessionExpiredError();
        }
        throw new AuthServiceError(`Failed to refresh session: ${error.message}`, error);
      }

      if (!session || !session.user || !session.user.email) {
        throw new SessionExpiredError();
      }

      return {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at ? String(session.expires_at) : null,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof SessionExpiredError || error instanceof AuthServiceError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AuthServiceError("Unexpected error refreshing session", error);
    }
  }
}
