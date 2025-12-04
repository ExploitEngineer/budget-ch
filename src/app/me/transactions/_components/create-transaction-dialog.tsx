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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import CreateCategoryDialog from "@/app/me/dashboard/_components/create-category-dialog";
import { useState, useEffect } from "react";
import {
  TransactionDialogValues,
  TransactionDialogSchema,
} from "@/lib/validations/transaction-dialog-validations";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { accountKeys, categoryKeys, transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { AccountRow } from "@/lib/types/row-types";
import { getCategories } from "@/lib/services/category";
import { createTransaction } from "@/lib/services/transaction";
import { toast } from "sonner";
import type { TransactionType } from "@/lib/types/common-types";

export default function CreateTransactionDialog({
  variant,
  text,
}: {
  variant?: "outline" | "default" | "gradient";
  text?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const createTransactionMutation = useMutation({
    mutationFn: async (data: {
      category?: string;
      amount: number;
      note?: string;
      source: string;
      transactionType: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      isRecurring?: boolean;
      frequencyDays?: number;
      startDate?: Date;
      endDate?: Date | null;
      recurringStatus?: "active" | "inactive";
    }) => {
      const result = await createTransaction({
        categoryName: data.category?.trim() || "",
        amount: data.amount,
        note: data.note,
        source: data.source,
        transactionType: data.transactionType,
        accountId: data.accountId,
        destinationAccountId: data.destinationAccountId,
        isRecurring: data.isRecurring,
        frequencyDays: data.frequencyDays,
        startDate: data.startDate,
        endDate: data.endDate,
        recurringStatus: data.recurringStatus,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to create transaction");
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      // Invalidate account queries since balance changes
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Transaction created successfully!");
    },
    onError: (error: Error) => {
      // Only show error if it's not already handled by the service
      if (
        !error.message?.includes("already exists") &&
        !error.message?.includes("financial account") &&
        !error.message?.includes("Failed to create transaction")
      ) {
        toast.error(
          error.message ||
            "Something went wrong while creating the transaction.",
        );
      } else {
        toast.error(error.message);
      }
    },
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<AccountRow[]>(
    {
      queryKey: accountKeys.list(hubId),
      queryFn: async () => {
        const res = await getFinancialAccounts();
        if (!res.status) {
          throw new Error("Failed to fetch accounts");
        }
        return res.tableData ?? [];
      },
      enabled: open, // Only fetch when dialog is open
    },
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<
    { id: string; name: string }[]
  >({
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

  const t = useTranslations(
    "main-dashboard.transactions-page.transaction-edit-dialog",
  );

  const form = useForm<TransactionDialogValues>({
    resolver: zodResolver(TransactionDialogSchema) as any,
    defaultValues: {
      date: new Date(),
      accountId: "",
      recipient: "",
      category: "",
      destinationAccountId: "",
      amount: 0,
      note: "",
      splits: [],
      transactionType: undefined,
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

  async function onSubmit(values: TransactionDialogValues) {
    try {
      await createTransactionMutation.mutateAsync({
        category: values.category?.trim(),
        amount: values.amount,
        note: values.note,
        source: values.recipient,
        transactionType: values.transactionType,
        accountId: values.accountId,
        destinationAccountId: values.destinationAccountId,
        isRecurring: values.isRecurring,
        frequencyDays: values.isRecurring ? values.frequencyDays : undefined,
        startDate: values.isRecurring
          ? values.startDate || undefined
          : undefined,
        endDate: values.isRecurring ? values.endDate : undefined,
        recurringStatus: values.isRecurring
          ? values.recurringStatus
          : undefined,
      });

      form.reset();
      setSelectedCategory(null);
      setOpen(false);
    } catch (err: any) {
      // Error already handled in onError
      console.error("Error submitting form:", err);
    }
  }

  function handleCategoryAdded(newCategory: string) {
    setSelectedCategory(newCategory);
    form.setValue("category", newCategory);
    // Refetch categories to get the updated list
    queryClient.invalidateQueries({ queryKey: categoryKeys.list(hubId) });
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });

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
                {t("title-2")}
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
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.name} ({account.type})
                                    ({account.formattedBalance})
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
                              <SelectItem value="transfer">
                                {t(
                                  "dialog.labels.transactionType.options.transfer",
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

                {/* Destination Account (for transfers) */}
                {transactionType === "transfer" && (
                  <FormField
                    control={form.control}
                    name="destinationAccountId"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>
                          {t("dialog.labels.destinationAccount")}
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
                                        "dialog.placeholders.destinationAccount",
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
                                      {account.name} ({account.type}) ({account.formattedBalance || 0} CHF)
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
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  {transactionType !== "transfer" && (
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex flex-1 flex-col">
                          <FormLabel>{t("dialog.labels.category")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
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
                  )}

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
                            placeholder="-132.40"
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

                {/* Recurring Transaction Section */}
                <div className="flex flex-col gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            {t("dialog.labels.recurring")}
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
                            <FormLabel>
                              {t("dialog.labels.frequencyDays")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="30"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
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
                            <FormLabel>
                              {t("dialog.labels.startDate")}
                            </FormLabel>
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
                                      : t("dialog.placeholders.startDate")}
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
                            <FormLabel>{t("dialog.labels.endDate")}</FormLabel>
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
                                      : t("dialog.placeholders.endDate")}
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
                            <FormLabel>
                              {t("dialog.labels.recurringStatus")}
                            </FormLabel>
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
                                    {t("dialog.options.active")}
                                  </SelectItem>
                                  <SelectItem value="inactive">
                                    {t("dialog.options.inactive")}
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

                {/* Split Rows Section */}
                {/* 
                <div className="flex flex-col gap-3 pt-2">
                  <FormLabel>{t("dialog.labels.splitSum")}</FormLabel>

                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
                    >
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                */}

                {/* 7️⃣ Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    {t("dialog.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                    className="cursor-pointer"
                  >
                    {createTransactionMutation.isPending ? (
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
