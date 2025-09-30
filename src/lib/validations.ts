import { z } from "zod";

export const userSignUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export type UserSignUpValues = z.infer<typeof userSignUpSchema>;

export const userSignInSchema = userSignUpSchema.pick({
  email: true,
  password: true,
});

export type UserSignInValues = z.infer<typeof userSignInSchema>;

export const userForgotPasswordSchema = userSignUpSchema.pick({
  email: true,
});

export type UserForgotPasswordValues = z.infer<typeof userForgotPasswordSchema>;

export const entrySchema = z.object({
  select: z.string().min(1, { message: "Select is required" }),
  amount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  description: z.string().optional(),
});

export type EntryValues = z.infer<typeof entrySchema>;

export const mainFormSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  account: z.string().min(1, { message: "Account is required" }),
  dateFrom: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  dateTo: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  text: z.string().min(1, { message: "Text is required" }),
  select: z.string().min(1, { message: "Select is required" }),
  select1: z.string().min(1, { message: "Select is required" }),
  select2: z.string().min(1, { message: "Select is required" }),
  amount: z.coerce.number().min(0).default(0),
  amountMax: z.coerce.number().min(0).default(0),
  amountMin: z.coerce.number().min(0).default(0),
  file: z
    .any()
    .refine((f) => f instanceof File || f === undefined, {
      message: "Invalid file",
    })
    .optional(),
  entries: z.array(entrySchema),
});

export type MainFormValues = z.infer<typeof mainFormSchema>;
