import { z } from "zod";

const accountType = ["checking", "savings", "credit-card", "cash"] as const;
const categoryType = [
  "groceries",
  "restaurant",
  "transportation",
  "household",
  "income",
] as const;

export const TransactionDialogSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  account: z.enum(accountType, { message: "Account is required" }),
  recipient: z.string().min(1, { message: "Text is required" }),
  select: z.enum(categoryType, { message: "Category is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be 0 or more" }),
  note: z.string().optional(),
});

export type TransactionDialogValues = z.infer<typeof TransactionDialogSchema>;
