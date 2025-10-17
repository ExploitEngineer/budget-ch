import { z } from "zod";

const accountType = ["giro", "credit-card", "sparen", "bar"] as const;
const categoryType = [
  "lebensmittel",
  "restaurant",
  "oev",
  "haushalt",
  "einnahmen",
] as const;

const splitSchema = z.object({
  category: z.enum(categoryType, { message: "Category is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be 0 or more" }),
  description: z.string().optional(),
});

export const transactionEditSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  account: z.enum(accountType, { message: "Account is required" }),
  recipient: z.string().min(1, { message: "Recipient is required" }),
  category: z.enum(categoryType, { message: "Category is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be 0 or more" }),
  note: z.string().optional(),
  file: z
    .instanceof(File)
    .optional()
    .refine(
      (file) =>
        !file ||
        ["image/png", "image/jpeg", "application/pdf"].includes(file.type),
      {
        message: "Only .png, .jpg, .jpeg, or .pdf files are allowed",
      },
    ),
  splits: z.array(splitSchema).optional(),
});

export type TransactionEditValues = z.infer<typeof transactionEditSchema>;
