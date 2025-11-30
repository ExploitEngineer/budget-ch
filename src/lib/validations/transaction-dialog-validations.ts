import { z } from "zod";

const transactionType = ["income", "expense", "transfer"] as const;

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
  category: z.string().optional(),
  destinationAccountId: z.string().optional(),
  amount: z.coerce.number({ message: "Amount must be 0 or more" }),
  note: z.string().optional(),
  splits: z.array(splitSchema).optional(),
})
  .refine(
    (data) => {
      // For transfer type, destinationAccountId is required and must be different
      if (data.transactionType === "transfer") {
        return !!data.destinationAccountId && data.destinationAccountId !== data.accountId;
      }
      return true;
    },
    {
      message: "Destination account is required and must be different from source account.",
      path: ["destinationAccountId"],
    }
  )
  .refine(
    (data) => {
      // For non-transfer types, category is required
      if (data.transactionType !== "transfer") {
        return !!data.category && data.category.trim().length > 0;
      }
      return true;
    },
    {
      message: "Category is required for income and expense transactions.",
      path: ["category"],
    }
  );

export type TransactionDialogValues = z.infer<typeof TransactionDialogSchema>;
