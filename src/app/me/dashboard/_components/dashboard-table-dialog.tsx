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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecurringTransactionTemplate, updateRecurringTransactionTemplate } from "@/lib/services/transaction";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const recurringTemplateSchema = z.object({
  frequencyDays: z.coerce.number().min(1, { message: "Must be at least 1 day" }),
  startDate: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(),
  hasEndDate: z.boolean().default(false),
  status: z.enum(["active", "inactive"]),
});

type RecurringTemplateValues = z.infer<typeof recurringTemplateSchema>;

interface DashboardTableAdjustDialogProps {
  templateId: string;
}

import { Spinner } from "@/components/ui/spinner";

export default function DashboardTableAdjustDialog({
  templateId,
}: DashboardTableAdjustDialogProps) {
  const t = useTranslations(
    "main-dashboard.dashboard-page.dashbaord-table-adjust-dialog",
  );
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
    enabled: open && !!templateId, // Only fetch when dialog is open
  });

  const form = useForm<RecurringTemplateValues>({
    resolver: zodResolver(recurringTemplateSchema) as any,
    defaultValues: {
      frequencyDays: 30,
      startDate: new Date(),
      endDate: null,
      hasEndDate: false,
      status: "active",
    },
  });

  const hasEndDate = form.watch("hasEndDate");

  // Update form when template data loads
  useEffect(() => {
    if (templateData) {
      form.reset({
        frequencyDays: templateData.frequencyDays,
        startDate: new Date(templateData.startDate),
        endDate: templateData.endDate ? new Date(templateData.endDate) : null,
        hasEndDate: !!templateData.endDate,
        status: templateData.status,
      });
    }
  }, [templateData, form]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (values: RecurringTemplateValues) => {
      const result = await updateRecurringTransactionTemplate(templateId, {
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
        queryKey: transactionKeys.upcomingRecurring(hubId),
      });
      queryClient.invalidateQueries({
        queryKey: ["recurring-template", templateId],
      });
      toast.success(t("dialog.messages.success"));
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dialog.messages.error"));
    },
  });

  function onSubmit(values: RecurringTemplateValues) {
    updateTemplateMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="cursor-pointer" asChild>
        <Button
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          variant="outline"
        >
          <span className="text-xs">{t("button")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
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

        {templateLoading ? (
          <div className="py-8 flex justify-center">
            <Spinner />
          </div>
        ) : templateError ? (
          <div className="py-8 text-center text-red-500">
            {templateError instanceof Error
              ? templateError.message
              : t("dialog.messages.load-error")}
          </div>
        ) : templateData ? (
          <div className="space-y-6">
            {/* Read-only transaction details */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <h3 className="text-sm font-semibold">
                {t("dialog.read-only.title")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("dialog.labels.account")}
                  </p>
                  <p className="text-sm font-medium">
                    {templateData.accountName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("dialog.labels.amount")}
                  </p>
                  <p className="text-sm font-medium">
                    {commonT("currency")} {templateData.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable recurrence details */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <FormField
                    control={form.control}
                    name="frequencyDays"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>
                          {t("dialog.labels.frequency-days")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="30"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("dialog.descriptions.frequency-days")}
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
                        <FormLabel>{t("dialog.labels.status")}</FormLabel>
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
                                {t("dialog.options.status.active")}
                              </SelectItem>
                              <SelectItem value="inactive">
                                {t("dialog.options.status.inactive")}
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
                      <FormLabel>{t("dialog.labels.start-date")}</FormLabel>
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
                                : t("dialog.placeholders.start-date")}
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
                        <FormLabel>
                          {t("dialog.labels.has-end-date")}
                        </FormLabel>
                        <FormDescription>
                          {t("dialog.descriptions.has-end-date")}
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
                        <FormLabel>{t("dialog.labels.end-date")}</FormLabel>
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
                                  : t("dialog.placeholders.end-date")}
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

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateTemplateMutation.isPending}
                  >
                    {updateTemplateMutation.isPending
                      ? t("dialog.buttons.saving")
                      : t("dialog.buttons.save")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
