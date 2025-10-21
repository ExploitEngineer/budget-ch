import { z } from "zod";

const accountType = ["checking", "savings", "credit-card", "cash"] as const;

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

const householdSizes = ["single", "couple", "family"] as const;
const subscriptionPlans = ["free", "individual", "family"] as const;

export const profileHouseholdSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  householdSize: z
    .string()
    .refine(
      (val) => householdSizes.includes(val as (typeof householdSizes)[number]),
      {
        message: "Please select a household size.",
      },
    ),
  subscriptionLocal: z
    .string()
    .refine(
      (val) =>
        subscriptionPlans.includes(val as (typeof subscriptionPlans)[number]),
      {
        message: "Please select a subscription plan.",
      },
    ),
  address: z.string().optional(),
});

export type ProfileHouseholdValues = z.infer<typeof profileHouseholdSchema>;

export const languages = ["en", "de", "fr", "it"] as const;
export const currencies = ["chf", "eur", "usd"] as const;
export const themes = ["dark", "light", "auto"] as const;
export const firstDays = ["monday", "sunday"] as const;
export const densities = ["comfort", "compact"] as const;
export const roundings = ["5-rappen", "1-rappen"] as const;

export const appearanceSchema = z.object({
  language: z
    .string()
    .refine((val) => languages.includes(val as (typeof languages)[number]), {
      message: "Please select a valid language.",
    }),
  currency: z
    .string()
    .refine((val) => currencies.includes(val as (typeof currencies)[number]), {
      message: "Please select a valid currency.",
    }),
  theme: z
    .string()
    .refine((val) => themes.includes(val as (typeof themes)[number]), {
      message: "Please select a valid theme.",
    }),
  firstDay: z
    .string()
    .refine((val) => firstDays.includes(val as (typeof firstDays)[number]), {
      message: "Please select a valid first day.",
    }),
  density: z
    .string()
    .refine((val) => densities.includes(val as (typeof densities)[number]), {
      message: "Please select a valid density.",
    }),
  rounding: z
    .string()
    .refine((val) => roundings.includes(val as (typeof roundings)[number]), {
      message: "Please select a valid rounding.",
    }),
});

export type AppearanceValues = z.infer<typeof appearanceSchema>;

// Content Dialog Schema
export const NewAccountDialogSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  type: z.enum(accountType, { message: "Type is required" }),
  balance: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  iban: z.string().optional(),
  note: z.string().optional(),
});

export type NewAccountDialogValues = z.infer<typeof NewAccountDialogSchema>;

// Main Transfer Dialog Schema
export const transferDialogSchema = z.object({
  from: z.string().min(1, { message: "From account is required" }),
  to: z.string().min(1, { message: "To account is required" }),
  amount: z.coerce.number().min(0, { message: "Amount is required" }),
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  text: z.string().optional(),
});

export type TransferDialogValues = z.infer<typeof transferDialogSchema>;

// Filter Dialog Schema
export const filterDialogSchema = z.object({
  from: z.coerce
    .date()
    .optional()
    .refine((d) => !d || !isNaN(d.getTime()), { message: "Invalid date" }),
  to: z.coerce
    .date()
    .optional()
    .refine((d) => !d || !isNaN(d.getTime()), { message: "Invalid date" }),
  text: z.string().optional(),
});

export type FilterDialogValues = z.infer<typeof filterDialogSchema>;
