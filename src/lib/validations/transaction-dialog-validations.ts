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
  recipient: z.string().optional().nullable(),
  category: z.string().optional(),
  destinationAccountId: z.string().optional(),
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  note: z.string().optional(),
  splits: z.array(splitSchema).optional(),
  // Recurring transaction fields
  isRecurring: z.boolean().default(false),
  frequencyDays: z.coerce.number().min(1, { message: "Frequency must be at least 1 day" }).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  recurringStatus: z.enum(["active", "inactive"]).optional(),
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
  )
  .refine(
    (data) => {
      // If recurring, frequencyDays is required
      if (data.isRecurring) {
        return !!data.frequencyDays && data.frequencyDays >= 1;
      }
      return true;
    },
    {
      message: "Frequency is required for recurring transactions.",
      path: ["frequencyDays"],
    }
  )
  .refine(
    (data) => {
      // If recurring, startDate is required
      if (data.isRecurring) {
        return !!data.startDate && !isNaN(data.startDate.getTime());
      }
      return true;
    },
    {
      message: "Start date is required for recurring transactions.",
      path: ["startDate"],
    }
  );

export type TransactionDialogValues = z.infer<typeof TransactionDialogSchema>;
