/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication request payloads
 */

import { z } from "zod";

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email is too long");

/**
 * Password validation schema for sign-in
 * Sign-in only requires the password to be present
 */
const signInPasswordSchema = z.string().min(1, "Password is required");

/**
 * Password validation schema for sign-up
 * Enforces strong password requirements
 */
const signUpPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(255, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Sign-in request body schema
 */
export const signInBodySchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

/**
 * Sign-up request body schema
 */
export const signUpBodySchema = z
  .object({
    email: emailSchema,
    password: signUpPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Parse and validate sign-in request body
 * @throws ZodError if validation fails
 */
export function parseSignInBody(body: unknown) {
  return signInBodySchema.parse(body);
}

/**
 * Parse and validate sign-up request body
 * @throws ZodError if validation fails
 */
export function parseSignUpBody(body: unknown) {
  return signUpBodySchema.parse(body);
}

/**
 * Safe parse sign-in body with error formatting
 */
export function safeParseSignInBody(body: unknown) {
  return signInBodySchema.safeParse(body);
}

/**
 * Safe parse sign-up body with error formatting
 */
export function safeParseSignUpBody(body: unknown) {
  return signUpBodySchema.safeParse(body);
}

// Export types inferred from schemas
export type SignInBodySchema = z.infer<typeof signInBodySchema>;
export type SignUpBodySchema = z.infer<typeof signUpBodySchema>;
