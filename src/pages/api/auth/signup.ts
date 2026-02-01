/**
 * POST /api/auth/signup
 *
 * Registers a new user with email and password
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { isAuthError } from "../../../lib/errors/auth.errors.ts";
import { AuthService } from "../../../lib/services/auth.service.ts";
import { parseSignUpBody } from "../../../lib/validation/auth.validation.ts";
import type { AuthErrorResponseDTO, SignUpResponseDTO } from "../../../types.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    let validatedData;
    try {
      validatedData = parseSignUpBody(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const errorResponse: AuthErrorResponseDTO = {
          error: firstError.message,
          code: "VALIDATION_ERROR",
          details: {
            field: firstError.path.join("."),
            issues: error.errors,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const authService = new AuthService(supabase);

    const result = await authService.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    const response: SignUpResponseDTO = {
      userId: result.userId,
      email: result.email,
      emailConfirmationRequired: result.emailConfirmationRequired,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
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

    const errorResponse: AuthErrorResponseDTO = {
      error: "An unexpected error occurred",
      code: "AUTH_SERVICE_ERROR",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
