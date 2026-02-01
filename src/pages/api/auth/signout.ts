/**
 * POST /api/auth/signout
 *
 * Signs out the current user and clears session cookies
 */

import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { isAuthError } from "../../../lib/errors/auth.errors.ts";
import { AuthService } from "../../../lib/services/auth.service.ts";
import type { AuthErrorResponseDTO } from "../../../types.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance with SSR cookie handling
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Initialize auth service
    const authService = new AuthService(supabase);

    // Sign out
    await authService.signOut();

    // Return success response
    return new Response(
      JSON.stringify({
        message: "Successfully signed out",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle authentication errors
    if (isAuthError(error)) {
      const errorResponse: AuthErrorResponseDTO = {
        error: error.message,
        code: error.code as AuthErrorResponseDTO["code"],
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // Note: Signout should always succeed gracefully
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/signout] Unexpected error:", error);

    // Return success anyway to ensure user can always sign out
    return new Response(
      JSON.stringify({
        message: "Signed out",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
