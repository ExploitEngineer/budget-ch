"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  TransactionDialogSchema,
  TransactionDialogValues,
} from "@/lib/validations/transaction-dialog-validations";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { Transaction } from "@/lib/types/dashboard-types";
import CategorySelector from "@/components/category-selector";
import { useEffect } from "react";
import { parse } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/services/transaction";
import { transactionKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { getFinancialAccounts as getFinancialAccountsAPI } from "@/lib/api";
import { mapAccountsToRows } from "@/app/me/accounts/account-adapters";
import type { AccountRow } from "@/lib/types/ui-types";
import type { FinancialAccount } from "@/lib/types/domain-types";
import type { TransactionType } from "@/lib/types/common-types";

interface EditTransactionDialogProps {
  variant?: "outline" | "default" | "gradient";
  text?: string;
  transaction?: Transaction;
}

export default function EditTransactionDialog({
  variant = "default",
  text = "Add Transaction",
  transaction,
}: EditTransactionDialogProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const [open, setOpen] = useState<boolean>(false);
  const isEditMode = !!transaction;

  const { data: domainAccounts, isLoading: accountsLoading } = useQuery<FinancialAccount[]>(
    {
      queryKey: accountKeys.list(hubId),
      queryFn: async () => {
        if (!hubId) {
          throw new Error("Hub ID is required");
        }
        const res = await getFinancialAccountsAPI(hubId);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch accounts");
        }
        return res.data ?? [];
      },
      enabled: open && !!hubId, // Only fetch when dialog is open and hubId exists
    },
  );

  // Transform domain accounts to UI rows
  const accounts: AccountRow[] | undefined = domainAccounts ? mapAccountsToRows(domainAccounts) : undefined;


  const createTransactionMutation = useMutation({
    mutationFn: async (data: {
      category: string;
      amount: number;
      note?: string;
      source?: string | null;
      transactionType: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      isRecurring?: boolean;
      frequencyDays?: number;
      startDate?: Date | null;
      endDate?: Date | null;
      recurringStatus?: "active" | "inactive";
      hubIdArg?: string;
    }) => {
      const result = await createTransaction({
        categoryName: data.category.trim(),
        amount: data.amount,
        note: data.note,
        source: data.source || null,
        transactionType: data.transactionType,
        accountId: data.accountId,
        destinationAccountId: data.destinationAccountId,
        isRecurring: data.isRecurring,
        frequencyDays: data.frequencyDays,
        startDate: data.startDate || undefined,
        endDate: data.endDate,
        recurringStatus: data.recurringStatus,
        hubIdArg: hubId || undefined,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to create transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success(t("messages.created"));
    },
    onError: (error: Error) => {
      if (
        !error.message?.includes("already exists") &&
        !error.message?.includes("financial account") &&
        !error.message?.includes("Failed to create transaction")
      ) {
        toast.error(
          error.message ||
          t("common.error"),
        );
      } else {
        toast.error(error.message);
      }
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      const result = await updateTransaction(id, formData, hubId || undefined);
      if (!result.success) {
        throw new Error(result.message || "Failed to update transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success(t("messages.updated"));
    },
    onError: (error: Error) => {
      if (!error.message?.includes("Failed to update transaction")) {
        toast.error(error.message || t("common.error"));
      } else {
        toast.error(error.message);
      }
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransaction(id, hubId || undefined);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success(t("messages.deleted"));
    },
    onError: (error: Error) => {
      if (!error.message?.includes("Failed to delete transaction")) {
        toast.error(error.message || t("common.error"));
      } else {
        toast.error(error.message);
      }
    },
  });


  const t = useTranslations(
    "main-dashboard.transactions-page",
  );
  const commonT = useTranslations("common");

  const form = useForm<TransactionDialogValues>({
    resolver: zodResolver(TransactionDialogSchema) as any,
    defaultValues: {
      date: transaction
        ? parse(transaction.date, "dd/MM/yyyy", new Date())
        : new Date(),
      accountId: transaction?.accountId || "",
      recipient: transaction?.recipient || "",
      category: transaction?.category || "",
      destinationAccountId: transaction?.destinationAccountId || "",
      amount: transaction?.amount || 0,
      note: transaction?.note || "",
      splits: [],
      transactionType: (transaction?.type || "expense") as TransactionType,
      isRecurring: false,
      frequencyDays: 30,
      startDate: null,
      endDate: null,
      recurringStatus: "active",
    },
  });

  const transactionType = form.watch("transactionType");
  const isRecurring = form.watch("isRecurring");
  const date = form.watch("date");

  // Set startDate to transaction date when recurring is enabled and startDate is not set
  useEffect(() => {
    if (isRecurring && !form.getValues("startDate") && date) {
      form.setValue("startDate", date);
    }
  }, [isRecurring, date, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });

  // Reset form when transaction changes or dialog opens (for edit mode)
  useEffect(() => {
    if (transaction && isEditMode && open) {
      const parsedDate = parse(transaction.date, "dd/MM/yyyy", new Date());
      // Check if date parsing was successful
      const dateValue = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      form.reset({
        date: dateValue,
        accountId: transaction.accountId || "",
        recipient: transaction.recipient || "",
        category: transaction.category || "",
        destinationAccountId: transaction.destinationAccountId || "",
        amount: transaction.amount || 0,
        note: transaction.note || "",
        splits: [],
        transactionType: (transaction.type || "expense") as TransactionType,
        isRecurring: false,
        frequencyDays: 30,
        startDate: null,
        endDate: null,
        recurringStatus: "active",
      });
    } else if (!isEditMode && open) {
      // Reset to defaults when creating new transaction
      form.reset({
        date: new Date(),
        accountId: "",
        recipient: "",
        category: "",
        destinationAccountId: "",
        amount: 0,
        note: "",
        splits: [],
        transactionType: "expense" as TransactionType,
      });
    }
  }, [transaction, isEditMode, open, form]);

  async function onSubmit(values: TransactionDialogValues) {
    const payload = {
      category: values.category?.trim(),
      amount: values.amount,
      note: values.note,
      source: values.recipient || null,
      transactionType: values.transactionType,
      destinationAccountId: values.destinationAccountId,
    };

    try {
      if (isEditMode) {
        const fd = new FormData();
        Object.entries({
          ...payload,
          accountId: values.accountId,
          createdAt: values.date.toISOString(),
          categoryName: payload.category || "",
          destinationAccountId: payload.destinationAccountId || "",
        }).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            fd.append(k, String(v));
          }
        });

        await updateTransactionMutation.mutateAsync({
          id: transaction!.id,
          formData: fd,
        });
      } else {
        await createTransactionMutation.mutateAsync({
          category: payload.category || "",
          amount: payload.amount,
          note: payload.note,
          source: payload.source || null,
          transactionType: payload.transactionType,
          accountId: values.accountId,
          destinationAccountId: payload.destinationAccountId,
          isRecurring: values.isRecurring,
          frequencyDays: values.isRecurring ? values.frequencyDays : undefined,
          startDate: values.isRecurring ? values.startDate : undefined,
          endDate: values.isRecurring ? values.endDate : undefined,
          recurringStatus: values.isRecurring ? values.recurringStatus : undefined,
          hubIdArg: hubId || undefined,
        });
      }

      form.reset();
      setOpen(false);
    } catch (err: any) {
      // Error already handled in onError
      console.error("Error submitting form:", err);
    }
  }

  async function handleDelete() {
    if (!transaction || !isEditMode) return;
    try {
      await deleteTransactionMutation.mutateAsync(transaction.id);
      form.reset();
      setOpen(false);
    } catch (err: any) {
      // Error already handled in onError
      console.error("Error deleting transaction:", err);
    }
  }

  function handleCategoryAdded(newCategory: string) {
    form.setValue("category", newCategory);
  }
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="cursor-pointer" asChild>
          <Button
            className={
              variant === "gradient"
                ? "btn-gradient flex items-center gap-2 dark:text-white"
                : "!bg-dark-blue-background dark:border-border-blue flex cursor-pointer items-center gap-2"
            }
            variant={variant === "gradient" ? "default" : "outline"}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden text-sm sm:block">
              {variant === "gradient" ? t("transaction-edit-dialog.title-2") : text || t("transaction-edit-dialog.title-2")}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent
          className={cn(
            "fixed z-50 m-0 flex h-[80vh] w-screen flex-col overflow-hidden p-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-hidden sm:rounded-lg [&>button]:hidden",
          )}
        >
          {/* Header */}
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-between pb-3">
              <DialogTitle className="text-lg font-semibold">
                {isEditMode ? t("transaction-edit-dialog.dialog.title") : t("transaction-edit-dialog.title-2")}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  className="cursor-pointer border"
                  variant="ghost"
                >
                  {t("transaction-edit-dialog.dialog.close")}
                </Button>
              </DialogClose>
            </div>

            <Separator className="mb-4" />

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* 1️⃣ Date + Account */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t("transaction-edit-dialog.dialog.labels.date")}</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, "dd/MM/yyyy")
                                  : t("transaction-edit-dialog.dialog.placeholders.date")}
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
                      <FormItem className="w-full">
                        <FormLabel>{t("transaction-edit-dialog.dialog.labels.account")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear destination if it matches the new source account
                              if (
                                transactionType === "transfer" &&
                                form.getValues("destinationAccountId") === value
                              ) {
                                form.setValue("destinationAccountId", "");
                              }
                            }}
                            value={field.value}
                            disabled={accountsLoading}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={
                                  accountsLoading
                                    ? t("labels.loading-accounts")
                                    : t("transaction-edit-dialog.placeholders.account")
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
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.name} ({account.type})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-accounts" disabled>
                                  {t("labels.no-accounts")}
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

                <div className="flex flex-col justify-center items-start gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>
                          {t("transaction-edit-dialog.dialog.labels.transactionType.title")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full flex-1">
                              <SelectValue
                                placeholder={t(
                                  "transaction-edit-dialog.dialog.labels.transactionType.options.income",
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">
                                {t(
                                  "transaction-edit-dialog.dialog.labels.transactionType.options.income",
                                )}
                              </SelectItem>
                              <SelectItem value="expense">
                                {t(
                                  "transaction-edit-dialog.dialog.labels.transactionType.options.expense",
                                )}
                              </SelectItem>
                              <SelectItem value="transfer">
                                {t(
                                  "transaction-edit-dialog.dialog.labels.transactionType.options.transfer",
                                )}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 2️⃣ Recipient */}
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t("transaction-edit-dialog.dialog.labels.recipient")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={t("transaction-edit-dialog.dialog.placeholders.recipient")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Destination Account (for transfers) */}
                {transactionType === "transfer" && (
                  <FormField
                    control={form.control}
                    name="destinationAccountId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>
                          {t("transaction-edit-dialog.dialog.labels.destinationAccount")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear destination if it matches the source account
                              if (
                                transactionType === "transfer" &&
                                form.getValues("accountId") === value
                              ) {
                                form.setValue("destinationAccountId", "");
                              }
                            }}
                            value={field.value}
                            disabled={accountsLoading}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={
                                  accountsLoading
                                    ? "Loading accounts..."
                                    : t(
                                      "transaction-edit-dialog.dialog.placeholders.destinationAccount",
                                    )
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {accountsLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading accounts...
                                </SelectItem>
                              ) : accounts && accounts.length > 0 ? (
                                accounts
                                  .filter(
                                    (account) =>
                                      account.id !==
                                      form.getValues("accountId"),
                                  )
                                  .map((account) => (
                                    <SelectItem
                                      key={account.id}
                                      value={account.id}
                                    >
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
                )}

                {/* 3️⃣ Category + Amount */}
                <div className="flex flex-col justify-center items-start gap-4 sm:flex-row sm:gap-3">
                  {transactionType !== "transfer" && (
                    <CategorySelector
                      control={form.control}
                      name="category"
                      hubId={hubId}
                      allowCreate={true}
                      label={t("transaction-edit-dialog.dialog.labels.category")}
                      placeholder={t("transaction-edit-dialog.dialog.placeholders.category-selector")}
                      enabled={open && !!hubId}
                      className="w-full"
                      onCategoryAdded={handleCategoryAdded}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t("transaction-edit-dialog.dialog.labels.amount")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={0.5}
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 4️⃣ Note */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("transaction-edit-dialog.dialog.labels.note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("transaction-edit-dialog.dialog.placeholders.note")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurring Transaction Section */}
                <div className="flex flex-col gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            {t("transaction-edit-dialog.dialog.labels.recurring")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {isRecurring && (
                    <div className="flex flex-col gap-4 pl-7 sm:flex-row sm:gap-3">
                      <FormField
                        control={form.control}
                        name="frequencyDays"
                        render={({ field }) => (
                          <FormItem className="flex flex-1 flex-col">
                            <FormLabel>{t("transaction-edit-dialog.dialog.labels.frequencyDays")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-1 flex-col">
                            <FormLabel>{t("transaction-edit-dialog.dialog.labels.startDate")}</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "dd/MM/yyyy")
                                      : t("transaction-edit-dialog.dialog.placeholders.startDate")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
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
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-1 flex-col">
                            <FormLabel>{t("transaction-edit-dialog.dialog.labels.endDate")}</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "dd/MM/yyyy")
                                      : t("transaction-edit-dialog.dialog.placeholders.endDate")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
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
                        name="recurringStatus"
                        render={({ field }) => (
                          <FormItem className="flex flex-1 flex-col">
                            <FormLabel>{t("transaction-edit-dialog.dialog.labels.recurringStatus")}</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">
                                    {t("transaction-edit-dialog.dialog.options.active")}
                                  </SelectItem>
                                  <SelectItem value="inactive">
                                    {t("transaction-edit-dialog.dialog.options.inactive")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Split Rows Section - COMMENTED OUT */}
                {/* <div className="flex flex-col gap-3 pt-2">
                  <FormLabel>{t("dialog.labels.splitSum")}</FormLabel>

                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
                    >
                      {/* Category Select *\/}
                      <FormField
                        control={form.control}
                        name={`splits.${index}.category`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={t(
                                      "dialog.placeholders.category",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lebensmittel">
                                    {t("dialog.options.lebensmittel")}
                                  </SelectItem>
                                  <SelectItem value="restaurant">
                                    {t("dialog.options.restaurant")}
                                  </SelectItem>
                                  <SelectItem value="oev">
                                    {t("dialog.options.oev")}
                                  </SelectItem>
                                  <SelectItem value="haushalt">
                                    {t("dialog.options.haushalt")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Amount Input *\/}
                      <FormField
                        control={form.control}
                        name={`splits.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-[120px]">
                            <FormControl>
                              <Input
                                type="number"
                                step={0.5}
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Description Input *\/}
                      <FormField
                        control={form.control}
                        name={`splits.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "dialog.placeholders.note-optional",
                                )}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Remove Button *\/}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Row Badge *\/}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="flex cursor-pointer items-center gap-1"
                      onClick={() =>
                        append({
                          category: "oev",
                          amount: 0,
                          description: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      {t("dialog.badges.row")}
                    </Badge>

                    <Badge variant="secondary">
                      {t("dialog.badges.splitTotal")}
                    </Badge>
                  </div>
                </div> */}

                {/* 7️⃣ Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    disabled={deleteTransactionMutation.isPending}
                    onClick={handleDelete}
                  >
                    {deleteTransactionMutation.isPending ? (
                      <Spinner />
                    ) : (
                      t("transaction-edit-dialog.dialog.buttons.delete")
                    )}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isEditMode
                        ? updateTransactionMutation.isPending
                        : createTransactionMutation.isPending
                    }
                    className="cursor-pointer"
                  >
                    {(
                      isEditMode
                        ? updateTransactionMutation.isPending
                        : createTransactionMutation.isPending
                    ) ? (
                      <Spinner />
                    ) : (
                      t("transaction-edit-dialog.dialog.buttons.save")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
