/**
 * Password validation constants shared between frontend and backend
 * These should match exactly with frontend passwordValidation.ts
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireUppercase: true,
  requireLowercase: true,
  requireNumberOrSpecialChar: true,
} as const;

// Regex pattern - MUST match frontend exactly
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d!@#$%^&*(),.?":{}|<>]).{6,}$/;

export const PASSWORD_ERROR_MESSAGE =
  'Password must be at least 6 characters long, contain at least one uppercase letter, one lowercase letter, and either a number or special character.';

/**
 * Individual validation functions for granular checking
 */
export const PasswordValidators = {
  hasMinLength: (password: string): boolean =>
    password.length >= PASSWORD_REQUIREMENTS.minLength,
  hasUpperCase: (password: string): boolean => /[A-Z]/.test(password),
  hasLowerCase: (password: string): boolean => /[a-z]/.test(password),
  hasNumber: (password: string): boolean => /\d/.test(password),
  hasSpecialChar: (password: string): boolean =>
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
} as const;
