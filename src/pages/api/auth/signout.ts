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
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const authService = new AuthService(supabase);

    await authService.signOut();

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
