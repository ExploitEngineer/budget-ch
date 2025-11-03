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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSavingGoalStore } from "@/store/saving-goal-store";
import { useState } from "react";

type AllocateFormProps = {
  amountSaved: number;
  goalId: string;
};

export function AllocateForm({ amountSaved, goalId }: AllocateFormProps) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );

  const { updateGoalAndSync, updateLoading } = useSavingGoalStore();

  const form = useForm<AllocateAmountValues>({
    resolver: zodResolver(AllocateAmountSchema) as any,
    defaultValues: { amount: undefined },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.amount) return;

    try {
      const newAmount = (amountSaved || 0) + values.amount;

      await updateGoalAndSync(goalId, {
        amountSaved: newAmount,
      });

      form.reset({ amount: undefined });
    } catch (err: any) {
      console.error("Error updating saving goal:", err);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          variant="outline"
          type="submit"
          disabled={updateLoading}
          className="dark:border-border-blue !bg-dark-blue-background flex cursor-pointer items-center gap-3"
        >
          {updateLoading ? (
            "Updating..."
          ) : (
            <>
              <Plus />
              <span>{t("cards.tax-reserves.content.button")}</span>
            </>
          )}
        </Button>
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
                  disabled={updateLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
