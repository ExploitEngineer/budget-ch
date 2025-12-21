import { z } from "zod";

export const SavingsGoalDialogSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  goalAmount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  savedAmount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  dueDate: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Invalid date" })
    .optional()
    .or(z.undefined()),
  accountId: z.string().min(1, { message: "Account is required" }),
  monthlyAllocation: z.coerce.number().min(0, { message: "Must be 0 or more" }),
});

export type SavingsGoalDialogValues = z.infer<typeof SavingsGoalDialogSchema>;

export const AllocateAmountSchema = z.object({
  amount: z.string()
    .transform((v) => {
      if (v === "" || v === undefined) return undefined;
      return Number(v);
    })
    .pipe(z.number().min(1, { message: "Must be 1 or more" }).optional()),
});

export type AllocateAmountValues = z.infer<typeof AllocateAmountSchema>;
