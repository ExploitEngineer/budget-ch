import { z } from "zod";

const accountType = ["checking", "savings", "credit-card", "cash"] as const;

export const transferDialogSchema = z.object({
  from: z.enum(accountType, { message: "From account is required" }),
  to: z.enum(accountType, { message: "To account is required" }),
  amount: z.coerce.number().min(0, { message: "Amount is required" }),
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  text: z.string().optional(),
});

export type TransferDialogValues = z.infer<typeof transferDialogSchema>;
