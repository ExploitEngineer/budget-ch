"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogHeader,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  SavingsGoalDialogSchema,
  SavingsGoalDialogValues,
} from "@/lib/validations/saving-goal-validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { SavingGoalRow } from "@/lib/types/ui-types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateSavingGoal, deleteSavingGoal } from "@/lib/services/saving-goal";
import { savingGoalKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import type { AccountRow } from "@/lib/types/row-types";

export default function EditSavingGoalDialog({
  goalData,
}: {
  goalData: SavingGoalRow;
}) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.sidebar-header.dialog",
  );

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [open, setOpen] = useState(false);

  const {
    data: accounts,
    isLoading: accountsLoading,
  } = useQuery<AccountRow[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      const res = await getFinancialAccounts();
      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }
      return res.tableData ?? [];
    },
    enabled: open, // Only fetch when dialog is open
  });

  const form = useForm<SavingsGoalDialogValues>({
    resolver: zodResolver(SavingsGoalDialogSchema) as any,
    defaultValues: {
      name: goalData?.name ?? "",
      goalAmount: goalData?.goalAmount ?? 0,
      savedAmount: goalData?.amountSaved ?? 0,
      dueDate: goalData?.dueDate ? new Date(goalData.dueDate) : undefined,
      accountId: goalData?.financialAccountId ?? "",
      monthlyAllocation: goalData?.monthlyAllocation ?? 0,
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (updatedData: {
      name?: string;
      goalAmount?: number;
      amountSaved?: number;
      monthlyAllocation?: number;
      financialAccountId?: string | null;
      dueDate?: Date | null;
    }) => {
      const result = await updateSavingGoal({
        goalId: goalData.id,
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
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update saving goal");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteSavingGoal(goalData.id);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete saving goal");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.summary(hubId) });
      toast.success("Saving goal deleted successfully!");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete saving goal");
    },
  });

  async function onSubmit(values: SavingsGoalDialogValues) {
    try {
      await updateGoalMutation.mutateAsync({
        name: values.name,
        goalAmount: values.goalAmount,
        amountSaved: values.savedAmount,
        monthlyAllocation: values.monthlyAllocation,
        financialAccountId: values.accountId,
        dueDate: values.dueDate ?? null,
      });
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  async function handleDelete() {
    try {
      await deleteGoalMutation.mutateAsync();
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
        >
          {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("edit-dialog")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer border"
            >
              {t("button")}
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.name.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("labels.name.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal + Saved */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.goal-amount")}</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.5} min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.saved-amount")}</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.5} min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date + Account */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.due-date.title")}</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : t("labels.due-date.placeholder")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.account.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={accountsLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              accountsLoading
                                ? "Loading accounts..."
                                : t("labels.account.title")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {accountsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading accounts...
                            </SelectItem>
                          ) : accounts && accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.type})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-accounts" disabled>
                              No accounts available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Monthly Allocation */}
            <FormField
              control={form.control}
              name="monthlyAllocation"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>{t("labels.monthly-allocation")}</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.5} min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="cursor-pointer"
                variant="outline"
                onClick={handleDelete}
                disabled={deleteGoalMutation.isPending}
              >
                {deleteGoalMutation.isPending ? <Spinner /> : t("delete")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={updateGoalMutation.isPending}
              >
                {updateGoalMutation.isPending ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
