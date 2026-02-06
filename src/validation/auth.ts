import { z } from "zod";

const passwordMinLength = 6;

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email").trim().toLowerCase(),
  password: z.string().min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`),
  phone: z.string().trim().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
