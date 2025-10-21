import { z } from "zod";

const AccountType = ["checking", "savings", "credit-card", "cash"] as const;

export const SavingsGoalDialogSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  goalAmount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  savedAmount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  dueDate: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Due date is required" }),
  account: z.enum(AccountType, { message: "Account is required" }),
  monthlyAllocation: z.coerce.number().min(0, { message: "Must be 0 or more" }),
});

export type SavingsGoalDialogValues = z.infer<typeof SavingsGoalDialogSchema>;
