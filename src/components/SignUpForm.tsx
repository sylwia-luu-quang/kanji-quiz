/**
 * SignUpForm - User registration form component
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SignUpFormProps, SignUpFormState } from "./types/auth.types";
import { signUp, signIn, ApiError } from "@/lib/client/auth.client";
import { formatAuthError } from "@/lib/client/error-mapper";
import type { AuthErrorResponseDTO } from "@/types";

export default function SignUpForm({ redirectTo = "/dashboard" }: SignUpFormProps) {
  const [formState, setFormState] = useState<SignUpFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    isSubmitting: false,
    showPassword: false,
    showConfirmPassword: false,
    registrationSuccess: false,
    errors: {},
  });

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return "Email is required";
    }
    if (email.length > 255) {
      return "Email is too long";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password.length > 255) {
      return "Password is too long";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return undefined;
  }, []);

  const validateConfirmPassword = useCallback((confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return undefined;
  }, []);

  const handleInputChange = useCallback(
    (field: keyof Pick<SignUpFormState, "email" | "password" | "confirmPassword">, value: string) => {
      setFormState((prev) => {
        const newState = {
          ...prev,
          [field]: value,
          errors: {
            ...prev.errors,
            [field]: undefined,
            form: undefined,
          },
        };

        if (field === "password" && prev.errors.confirmPassword) {
          newState.errors.confirmPassword = undefined;
        }

        return newState;
      });
    },
    []
  );

  const togglePasswordVisibility = useCallback((field: "showPassword" | "showConfirmPassword") => {
    setFormState((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const isFormValid = useCallback(() => {
    if (!formState.email || !formState.password || !formState.confirmPassword) {
      return false;
    }
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);
    const confirmPasswordError = validateConfirmPassword(formState.confirmPassword, formState.password);
    return !emailError && !passwordError && !confirmPasswordError;
  }, [
    formState.email,
    formState.password,
    formState.confirmPassword,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
  ]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const emailError = validateEmail(formState.email);
      const passwordError = validatePassword(formState.password);
      const confirmPasswordError = validateConfirmPassword(formState.confirmPassword, formState.password);

      if (emailError || passwordError || confirmPasswordError) {
        setFormState((prev) => ({
          ...prev,
          errors: {
            email: emailError,
            password: passwordError,
            confirmPassword: confirmPasswordError,
          },
        }));
        return;
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true, errors: {} }));

      try {
        await signUp(formState.email, formState.password, formState.confirmPassword);

        await signIn(formState.email, formState.password);

        window.location.href = redirectTo;
      } catch (error) {
        if (error instanceof ApiError) {
          const errorResponse: AuthErrorResponseDTO = {
            error: error.message,
            code: error.code as AuthErrorResponseDTO["code"],
            details: error.details,
          };

          if (errorResponse.code === "VALIDATION_ERROR" && errorResponse.details?.field) {
            const field = errorResponse.details.field as string;
            setFormState((prev) => ({
              ...prev,
              isSubmitting: false,
              errors: {
                ...prev.errors,
                [field]: errorResponse.error,
              },
            }));
          } else {
            setFormState((prev) => ({
              ...prev,
              isSubmitting: false,
              errors: {
                form: formatAuthError(errorResponse),
              },
            }));
          }
        } else {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Unexpected sign-up error:", error);
          }
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: {
              form: "An unexpected error occurred. Please try again.",
            },
          }));
        }
      }
    },
    [
      formState.email,
      formState.password,
      formState.confirmPassword,
      validateEmail,
      validatePassword,
      validateConfirmPassword,
      redirectTo,
    ]
  );

  return (
    <Card className="w-[28rem]">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to start practicing kanji</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formState.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={formState.isSubmitting}
              error={!!formState.errors.email}
              aria-describedby={formState.errors.email ? "email-error" : undefined}
            />
            {formState.errors.email && (
              <p id="email-error" role="alert" className="text-sm text-destructive">
                {formState.errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={formState.showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={formState.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={formState.isSubmitting}
                error={!!formState.errors.password}
                aria-describedby={formState.errors.password ? "password-error" : "password-hint"}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("showPassword")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
                disabled={formState.isSubmitting}
                aria-label={formState.showPassword ? "Hide password" : "Show password"}
              >
                {formState.showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {formState.errors.password ? (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {formState.errors.password}
              </p>
            ) : (
              <p id="password-hint" className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={formState.showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={formState.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                disabled={formState.isSubmitting}
                error={!!formState.errors.confirmPassword}
                aria-describedby={formState.errors.confirmPassword ? "confirm-password-error" : undefined}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("showConfirmPassword")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
                disabled={formState.isSubmitting}
                aria-label={formState.showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {formState.showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {formState.errors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
                {formState.errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Form-level Error */}
          {formState.errors.form && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {formState.errors.form}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid() || formState.isSubmitting}
            className="w-full"
            aria-label="Sign up"
          >
            {formState.isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>

          {/* Link to Sign In */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href={`/auth/signin${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
