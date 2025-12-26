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
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  SavingsGoalDialogSchema,
  SavingsGoalDialogValues,
} from "@/lib/validations/saving-goal-validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createSavingGoal } from "@/lib/services/saving-goal";
import { savingGoalKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getFinancialAccounts as getFinancialAccountsAPI } from "@/lib/api";
import { mapAccountsToRows } from "@/app/me/accounts/account-adapters";
import type { AccountRow } from "@/lib/types/ui-types";
import type { FinancialAccount } from "@/lib/types/domain-types";

export default function CreateSavingGoalDialog() {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.sidebar-header.dialog",
  );

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [open, setOpen] = useState<boolean>(false);

  const {
    data: domainAccounts,
    isLoading: accountsLoading,
  } = useQuery<FinancialAccount[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getFinancialAccountsAPI(hubId);
      if (!res.success) {
        throw new Error(res.message || t("messages.error.create"));
      }
      return res.data ?? [];
    },
    enabled: open && !!hubId, // Only fetch when dialog is open and hubId exists
  });

  // Transform domain accounts to UI rows
  const accounts: AccountRow[] | undefined = domainAccounts ? mapAccountsToRows(domainAccounts) : undefined;

  const form = useForm<SavingsGoalDialogValues>({
    resolver: zodResolver(SavingsGoalDialogSchema) as any,
    defaultValues: {
      name: "",
      goalAmount: 0,
      savedAmount: 0,
      dueDate: undefined,
      accountId: "",
      monthlyAllocation: 0,
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      goalAmount: number;
      amountSaved: number;
      monthlyAllocation: number;
      financialAccountId: string;
    }) => {
      const result = await createSavingGoal(data);
      if (!result.success) {
        throw new Error(result.message || t("messages.error.create"));
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.summary(hubId) });
      toast.success(t("messages.created"));
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("messages.error.create"));
    },
  });

  async function onSubmit(values: SavingsGoalDialogValues) {
    try {
      await createGoalMutation.mutateAsync({
        name: values.name,
        goalAmount: values.goalAmount,
        amountSaved: values.savedAmount,
        monthlyAllocation: values.monthlyAllocation,
        financialAccountId: values.accountId,
      });
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="btn-gradient flex cursor-pointer items-center gap-2 dark:text-white"
          variant="default"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden text-sm sm:block">{t("title")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("subtitle")}
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

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Row 1: Name */}
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

            {/* Row 2: Target + Already Saved */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.goal-amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.saved-amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Due Date + Account */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
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
                  <FormItem className="flex flex-1 flex-col">
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
                                ? t("loading-accounts")
                                : t("labels.account.title")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {accountsLoading ? (
                            <SelectItem value="loading" disabled>
                              {t("loading-accounts")}
                            </SelectItem>
                          ) : accounts && accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.type})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-accounts" disabled>
                              {t("no-accounts")}
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

            {/* Row 4: Monthly Allocation */}
            <FormField
              control={form.control}
              name="monthlyAllocation"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>{t("labels.monthly-allocation")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.5}
                      min={0}
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={createGoalMutation.isPending}
                className="cursor-pointer"
              >
                {createGoalMutation.isPending ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
