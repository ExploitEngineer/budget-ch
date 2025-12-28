import { z } from "zod";

export const getUserSignUpSchema = (t: any) =>
  z.object({
    name: z.string().min(2, { message: t("validations.name-min") }),
    email: z.string().email({ message: t("validations.email-invalid") }),
    password: z.string().min(8, { message: t("validations.password-min") }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: t("validations.accept-terms"),
    }),
  });

export type UserSignUpValues = z.infer<ReturnType<typeof getUserSignUpSchema>>;

export const getUserSignInSchema = (t: any) =>
  z.object({
    email: z.string().email({ message: t("validations.email-invalid") }),
    password: z.string().min(8, { message: t("validations.password-min") }),
  });

export type UserSignInValues = z.infer<ReturnType<typeof getUserSignInSchema>>;

export const getUserForgotPasswordSchema = (t: any) =>
  z.object({
    email: z.string().email({ message: t("validations.email-invalid") }),
  });

export type UserForgotPasswordValues = z.infer<
  ReturnType<typeof getUserForgotPasswordSchema>
>;

export const getUserResetPasswordSchema = (t: any) =>
  z.object({
    password: z.string().min(8, { message: t("validations.password-min") }),
    confirmPassword: z
      .string()
      .min(8, { message: t("validations.password-min") }),
  });

export type UserResetPasswordValues = z.infer<
  ReturnType<typeof getUserResetPasswordSchema>
>;
