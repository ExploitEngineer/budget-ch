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

const recurringPaymentSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), { message: "Date is required" }),
  account: z.string().min(1, { message: "Account is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  amount: z.coerce.number().min(0, { message: "Must be 0 or more" }),
});

type RecurringPaymentValues = z.infer<typeof recurringPaymentSchema>;

export default function DashboardTableAdjustDialog() {
  const t = useTranslations(
    "main-dashboard.dashboard-page.dashbaord-table-adjust-dialog",
  );

  const form = useForm<RecurringPaymentValues>({
    resolver: zodResolver(recurringPaymentSchema) as any,
    defaultValues: {
      date: new Date(),
      account: "",
      name: "",
      amount: 0,
    },
  });

  function onSubmit(values: RecurringPaymentValues) {
    console.log(values);
  }

  return (
    <Dialog>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                name="account"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog.labels.account")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("dialog.placeholders.account")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="giro">
                            {t("dialog.options.giro")}
                          </SelectItem>
                          <SelectItem value="credit-card">
                            {t("dialog.options.credit-card")}
                          </SelectItem>
                          <SelectItem value="sparen">
                            {t("dialog.options.sparen")}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.labels.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dialog.placeholders.name")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-start sm:w-1/2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                {t("dialog.buttons.delete")}
              </Button>
              <Button type="submit">{t("dialog.buttons.save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
