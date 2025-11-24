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
import CreateCategoryDialog from "@/app/me/dashboard/_components/create-category-dialog";
import type { Transaction } from "@/lib/types/dashboard-types";
import { useEffect } from "react";
import { parse } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/services/transaction";
import { transactionKeys, accountKeys, categoryKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { getCategories } from "@/lib/services/category";
import type { AccountRow } from "@/lib/types/row-types";

interface EditTransactionDialogProps {
  variant?: "outline" | "default" | "gradient";
  text?: string;
  transaction?: Omit<Transaction, "type">;
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

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery<{ id: string; name: string }[]>({
    queryKey: categoryKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getCategories(hubId);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch categories");
      }
      return res.data;
    },
    enabled: open && !!hubId, // Only fetch when dialog is open and hubId exists
  });

  const categories = categoriesData?.map((cat) => cat.name) ?? [];

  const createTransactionMutation = useMutation({
    mutationFn: async (data: {
      category: string;
      amount: number;
      note?: string;
      source: string;
      transactionType: "income" | "expense";
      accountId: string;
    }) => {
      const result = await createTransaction({
        categoryName: data.category.trim(),
        amount: data.amount,
        note: data.note,
        source: data.source,
        transactionType: data.transactionType,
        accountId: data.accountId,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to create transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Transaction created successfully!");
    },
    onError: (error: Error) => {
      if (
        !error.message?.includes("already exists") &&
        !error.message?.includes("financial account") &&
        !error.message?.includes("Failed to create transaction")
      ) {
        toast.error(error.message || "Something went wrong while creating the transaction.");
      } else {
        toast.error(error.message);
      }
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateTransaction(id, formData);
      if (!result.success) {
        throw new Error(result.message || "Failed to update transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Transaction updated successfully!");
    },
    onError: (error: Error) => {
      if (!error.message?.includes("Failed to update transaction")) {
        toast.error(error.message || "Something went wrong while updating.");
      } else {
        toast.error(error.message);
      }
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransaction(id);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete transaction");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Transaction deleted successfully!");
    },
    onError: (error: Error) => {
      if (!error.message?.includes("Failed to delete transaction")) {
        toast.error(error.message || "Something went wrong while deleting.");
      } else {
        toast.error(error.message);
      }
    },
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const t = useTranslations(
    "main-dashboard.transactions-page.transaction-edit-dialog",
  );

  const form = useForm<TransactionDialogValues>({
    resolver: zodResolver(TransactionDialogSchema) as any,
    defaultValues: {
      date: transaction
        ? parse(transaction.date, "dd/MM/yyyy", new Date())
        : new Date(),
      accountId: "",
      recipient: transaction?.recipient || "",
      category: transaction?.category || "",
      amount: transaction?.amount || 0,
      note: transaction?.note || "",
      splits: [],
      transactionType: "expense",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });

  useEffect(() => {
    if (transaction?.category) {
      setSelectedCategory(transaction.category);
    }
  }, [transaction]);

  async function onSubmit(values: TransactionDialogValues) {
    const payload = {
      category: selectedCategory || values.category.trim(),
      amount: values.amount,
      note: values.note,
      source: values.recipient,
      transactionType: values.transactionType,
    };

    try {
      if (isEditMode) {
        const fd = new FormData();
        Object.entries({
          ...payload,
          addedAt: values.date.toISOString(),
          categoryName: payload.category,
        }).forEach(([k, v]) => fd.append(k, String(v)));

        await updateTransactionMutation.mutateAsync({
          id: transaction!.id,
          formData: fd,
        });
      } else {
        await createTransactionMutation.mutateAsync({
          category: payload.category,
          amount: payload.amount,
          note: payload.note,
          source: payload.source,
          transactionType: payload.transactionType,
          accountId: values.accountId,
        });
      }

      form.reset();
      setSelectedCategory(null);
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
      setSelectedCategory(null);
      setOpen(false);
    } catch (err: any) {
      // Error already handled in onError
      console.error("Error deleting transaction:", err);
    }
  }

  function handleCategoryAdded(newCategory: string) {
    setSelectedCategory(newCategory);
    form.setValue("category", newCategory);
    // Refetch categories to get the updated list
    queryClient.invalidateQueries({ queryKey: categoryKeys.list(hubId) });
  }
  return (
    <>
      <CreateCategoryDialog
        open={isAddCategoryOpen}
        onOpenChangeAction={setIsAddCategoryOpen}
        onCategoryAddedAction={handleCategoryAdded}
        hubId={hubId}
      />

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
              {variant === "gradient" ? t("title-2") : text}
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
                {t("dialog.title")}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  className="cursor-pointer border"
                  variant="ghost"
                >
                  {t("dialog.close")}
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
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("dialog.labels.date")}</FormLabel>
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
                                  : t("dialog.placeholders.date")}
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
                        <FormLabel>{t("dialog.labels.account")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={accountsLoading}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={
                                  accountsLoading
                                    ? "Loading accounts..."
                                    : t("dialog.placeholders.account")
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

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem className="flex !flex-1 flex-col">
                        <FormLabel>
                          {t("dialog.labels.transactionType.title")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full flex-1">
                              <SelectValue
                                placeholder={t(
                                  "dialog.labels.transactionType.options.income",
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">
                                {t(
                                  "dialog.labels.transactionType.options.income",
                                )}
                              </SelectItem>
                              <SelectItem value="expense">
                                {t(
                                  "dialog.labels.transactionType.options.expense",
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
                      <FormItem className="flex-1">
                        <FormLabel>{t("dialog.labels.recipient")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("dialog.placeholders.recipient")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 3️⃣ Category + Amount */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("dialog.labels.category")}</FormLabel>
                        <FormControl>
                          <Select
                            value={selectedCategory || ""}
                            onValueChange={(value) => {
                              setSelectedCategory(value);
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select or add a category" />
                            </SelectTrigger>

                            <SelectContent>
                              <div className="flex items-center justify-between border-b px-2 py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full cursor-pointer justify-center text-sm"
                                  onClick={() => setIsAddCategoryOpen(true)}
                                >
                                  + {t("dialog.new-category")}
                                </Button>
                              </div>

                              {categoriesLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading categories...
                                </SelectItem>
                              ) : categories.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  {t("dialog.no-category")}
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("dialog.labels.amount")}</FormLabel>
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
                      <FormLabel>{t("dialog.labels.note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("dialog.placeholders.note")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Split Rows Section */}
                <div className="flex flex-col gap-3 pt-2">
                  <FormLabel>{t("dialog.labels.splitSum")}</FormLabel>

                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
                    >
                      {/* Category Select */}
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

                      {/* Amount Input */}
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

                      {/* Description Input */}
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

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Row Badge */}
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
                </div>

                {/* 7️⃣ Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    disabled={deleteTransactionMutation.isPending}
                    onClick={handleDelete}
                  >
                    {deleteTransactionMutation.isPending ? <Spinner /> : t("dialog.buttons.delete")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditMode ? updateTransactionMutation.isPending : createTransactionMutation.isPending}
                    className="cursor-pointer"
                  >
                    {(isEditMode ? updateTransactionMutation.isPending : createTransactionMutation.isPending) ? (
                      <Spinner />
                    ) : (
                      t("dialog.buttons.save")
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
