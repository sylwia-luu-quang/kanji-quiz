/**
 * SignInForm - User authentication form component
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SignInFormProps, SignInFormState } from "./types/auth.types";
import { signIn, ApiError } from "@/lib/client/auth.client";

export default function SignInForm({ redirectTo = "/dashboard" }: SignInFormProps) {
  const [formState, setFormState] = useState<SignInFormState>({
    email: "",
    password: "",
    isSubmitting: false,
    showPassword: false,
    errors: {},
  });

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return "Email is required";
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
    return undefined;
  }, []);

  const handleInputChange = useCallback((field: keyof Pick<SignInFormState, "email" | "password">, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: {
        ...prev.errors,
        [field]: undefined,
        form: undefined,
      },
    }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate inputs
      const emailError = validateEmail(formState.email);
      const passwordError = validatePassword(formState.password);

      if (emailError || passwordError) {
        setFormState((prev) => ({
          ...prev,
          errors: {
            email: emailError,
            password: passwordError,
          },
        }));
        return;
      }

      // Set submitting state
      setFormState((prev) => ({ ...prev, isSubmitting: true, errors: {} }));

      try {
        // Call sign-in API
        await signIn(formState.email, formState.password);

        // Success - redirect to target page
        window.location.href = redirectTo;
      } catch (error) {
        // Handle errors
        if (error instanceof ApiError) {
          // Handle structured API errors
          if (error.code === "VALIDATION_ERROR" && error.details?.field) {
            // Set field-specific error
            const field = error.details.field as "email" | "password";
            setFormState((prev) => ({
              ...prev,
              isSubmitting: false,
              errors: {
                [field]: error.message,
              },
            }));
          } else {
            // Set form-level error
            setFormState((prev) => ({
              ...prev,
              isSubmitting: false,
              errors: {
                form: error.message,
              },
            }));
          }
        } else {
          // Handle unexpected errors
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: {
              form: "An unexpected error occurred. Please try again.",
            },
          }));
          // Log error for debugging in development
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Sign-in error:", error);
          }
        }
      }
    },
    [formState.email, formState.password, redirectTo, validateEmail, validatePassword]
  );

  return (
    <Card className="w-[28rem]">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
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
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formState.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={formState.isSubmitting}
                error={!!formState.errors.password}
                aria-describedby={formState.errors.password ? "password-error" : undefined}
                className="pr-16"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
                disabled={formState.isSubmitting}
                aria-label={formState.showPassword ? "Hide password" : "Show password"}
              >
                {formState.showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {formState.errors.password && (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {formState.errors.password}
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
          <Button type="submit" disabled={formState.isSubmitting} className="w-full" aria-label="Sign in">
            {formState.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          {/* Link to Sign Up */}
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href={`/auth/signup${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
