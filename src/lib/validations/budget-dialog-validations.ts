import { z } from "zod";

const colorMakerEnum = ["standard", "green", "orange", "red"] as const;

export const BudgetDialogSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  budgetChf: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  istChf: z.coerce.number().min(0, { message: "Must be 0 or more" }),
  warning: z.coerce
    .number()
    .min(0)
    .max(100, { message: "Must be between 0 and 100" }),
  colorMarker: z.enum(colorMakerEnum, { message: "Color marker is required" }),
});

export type BudgetDialogValues = z.infer<typeof BudgetDialogSchema>;
