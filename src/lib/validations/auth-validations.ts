import { z } from "zod";

export const userSignUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and privacy policy.",
  }),
});

export type UserSignUpValues = z.infer<typeof userSignUpSchema>;

export const userSignInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export type UserSignInValues = z.infer<typeof userSignInSchema>;

export const userForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export type UserForgotPasswordValues = z.infer<typeof userForgotPasswordSchema>;

export const userResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export type UserResetPasswordValues = z.infer<typeof userResetPasswordSchema>;
