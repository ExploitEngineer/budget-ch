"use client";

import { useForm } from "react-hook-form";
import {
  AllocateAmountSchema,
  AllocateAmountValues,
} from "@/lib/validations/saving-goal-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export function AllocateForm() {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );

  const form = useForm<AllocateAmountValues>({
    resolver: zodResolver(AllocateAmountSchema) as any,
    defaultValues: { amount: 0 },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem className="max-w-38">
            <FormControl>
              <Input
                type="number"
                className="!bg-dark-blue-background dark:border-border-blue"
                placeholder={`${t(
                  "cards.tax-reserves.content.placeholder",
                )} (CHF)`}
                step={0.5}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
