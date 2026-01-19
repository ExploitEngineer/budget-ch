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
  FormDescription,
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
import { CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringTransactionTemplate,
  updateRecurringTransactionTemplate,
} from "@/lib/services/transaction";
import { transactionKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { getFinancialAccounts as getFinancialAccountsAPI } from "@/lib/api";
import { mapAccountsToRows } from "@/app/me/accounts/account-adapters";
import type { AccountRow } from "@/lib/types/ui-types";
import type { FinancialAccount } from "@/lib/types/domain-types";
import type { TransactionType } from "@/lib/types/common-types";
import CategorySelector from "@/components/category-selector";

const recurringTemplateSchema = z.object({
  // Transaction details
  source: z.string().nullable().optional(),
  amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  financialAccountId: z.string().min(1, { message: "Account is required" }),
  transactionCategoryId: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  destinationAccountId: z.string().nullable().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  note: z.string().nullable().optional(),
  // Recurrence settings
  frequencyDays: z.coerce.number().min(1, { message: "Must be at least 1 day" }),
  startDate: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(),
  hasEndDate: z.boolean().default(false),
  status: z.enum(["active", "inactive"]),
});

type RecurringTemplateValues = z.infer<typeof recurringTemplateSchema>;

interface EditRecurringTemplateDialogProps {
  templateId: string;
  onSuccess?: () => void;
}

export default function EditRecurringTemplateDialog({
  templateId,
  onSuccess,
}: EditRecurringTemplateDialogProps) {
  const t = useTranslations("main-dashboard.transactions-page.recurring-templates.edit-dialog");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch template data
  const {
    data: templateData,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery({
    queryKey: ["recurring-template", templateId],
    queryFn: async () => {
      const res = await getRecurringTransactionTemplate(templateId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch template");
      }
      return res.data;
    },
    enabled: open && !!templateId,
  });

  // Fetch accounts
  const { data: domainAccounts, isLoading: accountsLoading } = useQuery<FinancialAccount[]>({
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
    enabled: open && !!hubId,
  });

  const accounts: AccountRow[] | undefined = domainAccounts
    ? mapAccountsToRows(domainAccounts)
    : undefined;

  const form = useForm<RecurringTemplateValues>({
    resolver: zodResolver(recurringTemplateSchema) as any,
    defaultValues: {
      source: "",
      amount: 0,
      financialAccountId: "",
      transactionCategoryId: null,
      categoryName: null,
      destinationAccountId: null,
      type: "expense",
      note: "",
      frequencyDays: 30,
      startDate: new Date(),
      endDate: null,
      hasEndDate: false,
      status: "active",
    },
  });

  const hasEndDate = form.watch("hasEndDate");
  const transactionType = form.watch("type");

  // Update form when template data AND accounts are loaded
  // We need accounts loaded so the Select component can match the financialAccountId
  useEffect(() => {
    if (templateData && accounts) {
      form.reset({
        source: templateData.source || "",
        amount: templateData.amount,
        financialAccountId: templateData.financialAccountId,
        transactionCategoryId: templateData.transactionCategoryId,
        categoryName: templateData.categoryName || "",
        destinationAccountId: templateData.destinationAccountId,
        type: templateData.type,
        note: templateData.note || "",
        frequencyDays: templateData.frequencyDays,
        startDate: new Date(templateData.startDate),
        endDate: templateData.endDate ? new Date(templateData.endDate) : null,
        hasEndDate: !!templateData.endDate,
        status: templateData.status,
      });
    }
  }, [templateData, accounts, form]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (values: RecurringTemplateValues) => {
      const result = await updateRecurringTransactionTemplate(templateId, {
        source: values.source || null,
        amount: values.amount,
        financialAccountId: values.financialAccountId,
        transactionCategoryId: values.transactionCategoryId || null,
        destinationAccountId: values.type === "transfer" ? values.destinationAccountId || null : null,
        type: values.type as TransactionType,
        note: values.note || null,
        frequencyDays: values.frequencyDays,
        startDate: values.startDate,
        endDate: values.hasEndDate ? values.endDate ?? null : null,
        status: values.status,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to update template");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recurringTemplates(hubId),
      });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.upcomingRecurring(hubId),
      });
      queryClient.invalidateQueries({
        queryKey: ["recurring-template", templateId],
      });
      toast.success(t("messages.success"));
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("messages.error"));
    },
  });

  function onSubmit(values: RecurringTemplateValues) {
    updateTemplateMutation.mutate(values);
  }

  function handleCategoryAdded(newCategory: string) {
    form.setValue("categoryName", newCategory);
    form.setValue("transactionCategoryId", null); // Will be created on save
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="cursor-pointer" asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("title")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              className="cursor-pointer border"
              variant="ghost"
            >
              {t("close")}
            </Button>
          </DialogClose>
        </div>

        {templateLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("loading")}
          </div>
        ) : templateError ? (
          <div className="py-8 text-center text-red-500">
            {templateError instanceof Error
              ? templateError.message
              : t("messages.load-error")}
          </div>
        ) : templateData ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Transaction Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("sections.transaction-details")}
                </h3>
                <Separator />

                {/* Type + Source */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.type")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">
                                {t("options.type.income")}
                              </SelectItem>
                              <SelectItem value="expense">
                                {t("options.type.expense")}
                              </SelectItem>
                              <SelectItem value="transfer">
                                {t("options.type.transfer")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.source")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={t("placeholders.source")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account + Amount */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="financialAccountId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.account")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
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
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("placeholders.account")} />
                            </SelectTrigger>
                            <SelectContent>
                              {accountsLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading...
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

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.amount")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={0.01}
                            placeholder="0.00"
                            {...field}
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
                      <FormItem>
                        <FormLabel>{t("labels.destination-account")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={accountsLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("placeholders.destination-account")} />
                            </SelectTrigger>
                            <SelectContent>
                              {accountsLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading...
                                </SelectItem>
                              ) : accounts && accounts.length > 0 ? (
                                accounts
                                  .filter(
                                    (account) =>
                                      account.id !== form.getValues("financialAccountId")
                                  )
                                  .map((account) => (
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
                )}

                {/* Category (not for transfers) */}
                {transactionType !== "transfer" && (
                  <CategorySelector
                    control={form.control}
                    name="categoryName"
                    hubId={hubId}
                    allowCreate={true}
                    label={t("labels.category")}
                    placeholder={t("placeholders.category")}
                    enabled={open && !!hubId}
                    className="w-full"
                    onCategoryAdded={handleCategoryAdded}
                  />
                )}

                {/* Note */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder={t("placeholders.note")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurrence Settings Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("sections.recurrence-settings")}
                </h3>
                <Separator />

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="frequencyDays"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("labels.frequency-days")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="30"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("descriptions.frequency-days")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("labels.status")}</FormLabel>
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
                                {t("options.status.active")}
                              </SelectItem>
                              <SelectItem value="inactive">
                                {t("options.status.inactive")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("labels.start-date")}</FormLabel>
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
                                : t("placeholders.start-date")}
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
                  name="hasEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t("labels.has-end-date")}</FormLabel>
                        <FormDescription>
                          {t("descriptions.has-end-date")}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {hasEndDate && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("labels.end-date")}</FormLabel>
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
                                  : t("placeholders.end-date")}
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
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending
                    ? t("buttons.saving")
                    : t("buttons.save")}
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
