import { z } from "zod";

const accountType = ["checking", "savings", "credit-card", "cash"] as const;

export const FinancialAccountDialogSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  type: z.enum(accountType, { message: "Type is required" }),
  balance: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  iban: z.string().optional(),
  note: z.string().optional(),
});

export type FinancialAccountDialogValues = z.infer<
  typeof FinancialAccountDialogSchema
>;
