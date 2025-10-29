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
import { updateSavingGoal } from "@/lib/services/saving-goal";
import { toast } from "sonner";
import { useState } from "react";

type AllocateFormProps = {
  amountSaved: number;
  goalId: string;
};

export function AllocateForm({ amountSaved, goalId }: AllocateFormProps) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<AllocateAmountValues>({
    resolver: zodResolver(AllocateAmountSchema) as any,
    defaultValues: { amount: undefined },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.amount) return;

    setIsLoading(true);

    try {
      const newAmount = (amountSaved || 0) + values.amount;

      const res = await updateSavingGoal({
        goalId,
        updatedData: { amountSaved: newAmount },
      });

      if (res.success) {
        toast.success("Updated monthly allocation");
        form.reset({ amount: undefined });
      } else {
        toast.error("Failed to update");
      }
    } catch (error) {
      console.error("Error updating saving goal:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          variant="outline"
          type="submit"
          disabled={isLoading}
          className="dark:border-border-blue !bg-dark-blue-background flex cursor-pointer items-center gap-3"
        >
          {isLoading ? (
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
                  disabled={isLoading}
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
