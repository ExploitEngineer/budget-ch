import { z } from "zod";

const accountType = [
  "current-account",
  "credit-card",
  "savings",
  "cash",
] as const;
const categoryType = [
  "categories",
  "groceries",
  "restaurant",
  "transportation",
] as const;

export const calculationFormSchema = z
  .object({
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    select1: z.enum(accountType, { message: "Account is required" }),
    select2: z.enum(categoryType, { message: "Category is required" }),
    amountMin: z.coerce
      .number()
      .min(0, { message: "Amount must be 0 or more" })
      .optional(),
    amountMax: z.coerce
      .number()
      .min(0, { message: "Amount must be 0 or more" })
      .optional(),
    text: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo;
      }
      return true;
    },
    { message: "From date must be before To date", path: ["dateTo"] },
  )
  .refine(
    (data) => {
      if (data.amountMin !== undefined && data.amountMax !== undefined) {
        return data.amountMin <= data.amountMax;
      }
      return true;
    },
    { message: "Min amount must be less than Max amount", path: ["amountMax"] },
  );

export type CalculationFormValues = z.infer<typeof calculationFormSchema>;
