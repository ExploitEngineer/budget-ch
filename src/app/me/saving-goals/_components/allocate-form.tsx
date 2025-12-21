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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSavingGoal } from "@/lib/services/saving-goal";
import { savingGoalKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type AllocateFormProps = {
  amountSaved: number;
  goalId: string;
};

export function AllocateForm({ amountSaved, goalId }: AllocateFormProps) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const form = useForm<any>({
    resolver: zodResolver(AllocateAmountSchema),
    defaultValues: { amount: "" },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (updatedData: { amountSaved: number }) => {
      const result = await updateSavingGoal({
        goalId,
        updatedData,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to update saving goal");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.summary(hubId) });
      toast.success("Saving goal updated successfully!");
      form.reset({ amount: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update saving goal");
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.amount) return;

    try {
      const newAmount = (amountSaved || 0) + values.amount;

      await updateGoalMutation.mutateAsync({
        amountSaved: newAmount,
      });
    } catch (err: any) {
      // Error already handled in onError
    }
  });

  // Watch amount to disable button if empty (avoiding validation error)
  const amountValue = form.watch("amount");
  const isButtonDisabled = !amountValue || updateGoalMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          variant="outline"
          type="submit"
          disabled={isButtonDisabled}
          className="dark:border-border-blue !bg-dark-blue-background flex cursor-pointer items-center gap-3"
        >
          {updateGoalMutation.isPending ? (
            tc("updating")
          ) : (
            <>
              <Plus />
              <span>{tc("add")}</span>
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
                  disabled={updateGoalMutation.isPending}
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
