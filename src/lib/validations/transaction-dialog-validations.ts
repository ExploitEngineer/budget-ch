import { z } from "zod";

const transactionType = ["income", "expense"] as const;

const splitSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be 0 or more" }),
  description: z.string().optional(),
});

export const TransactionDialogSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  accountId: z.string().min(1, { message: "Account is required" }),
  transactionType: z.enum(transactionType, {
    message: "Transaction Type is required",
  }),
  recipient: z.string().min(1, { message: "Recipient is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  amount: z.coerce.number({ message: "Amount must be 0 or more" }),
  note: z.string().optional(),
  splits: z.array(splitSchema).optional(),
});

export type TransactionDialogValues = z.infer<typeof TransactionDialogSchema>;
