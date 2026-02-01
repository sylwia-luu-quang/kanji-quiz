/**
 * Authentication Component Types
 *
 * These types represent the UI state and data models for authentication forms and components.
 */

/**
 * Form state for sign-in component
 */
export interface SignInFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  showPassword: boolean;
  errors: {
    email?: string;
    password?: string;
    form?: string;
  };
}

/**
 * Form state for sign-up component
 */
export interface SignUpFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  registrationSuccess: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  };
}

/**
 * Props for SignInForm component
 */
export interface SignInFormProps {
  redirectTo?: string;
}

/**
 * Props for SignUpForm component
 */
export interface SignUpFormProps {
  redirectTo?: string;
}

/**
 * View model for user display in header
 */
export interface UserViewModel {
  email: string;
  id: string;
}
