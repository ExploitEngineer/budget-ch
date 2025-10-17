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
  TransactionEditValues,
  transactionEditSchema,
} from "@/lib/validations/transaction-edit-dialog-validations";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function TransactionEditDialog({
  variant,
  text,
}: {
  variant?: "outline" | "default" | "gradient";
  text?: string;
}) {
  const t = useTranslations(
    "main-dashboard.transactions-page.transaction-edit-dialog",
  );

  const form = useForm<TransactionEditValues>({
    resolver: zodResolver(transactionEditSchema) as any,
    defaultValues: {
      date: new Date(),
      account: "giro",
      recipient: "",
      category: "oev",
      amount: 0,
      note: "",
      splits: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });

  function onSubmit(values: TransactionEditValues) {
    console.log(values);
  }

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        <Button
          className={
            variant === "gradient"
              ? "btn-gradient flex items-center gap-2 dark:text-white"
              : "!bg-dark-blue-background dark:border-border-blue flex cursor-pointer items-center gap-2"
          }
          variant={variant === "gradient" ? "default" : "outline"}
        >
          <span className="hidden text-sm sm:block">
            {variant === "gradient" ? t("title-2") : text}
          </span>
          <Plus className="h-5 w-5" />
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <SelectItem value="bar">
                              {t("dialog.options.bar")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 2️⃣ Recipient */}
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
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
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t("dialog.placeholders.category")}
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
                            <SelectItem value="einnahmen">
                              {t("dialog.options.einnahmen")}
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

              {/* 5️⃣ File Upload */}
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem className="w-1/2 cursor-pointer">
                    <FormLabel>{t("dialog.labels.file")}</FormLabel>
                    <FormControl className="cursor-pointer border bg-gray-100/70 py-1 shadow-none">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="cursor-pointer !text-xs text-gray-500/80"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 🆕 Split Rows Section */}
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
                <Button variant="outline" type="button">
                  {t("dialog.buttons.delete")}
                </Button>
                <Button type="submit">{t("dialog.buttons.save")}</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
