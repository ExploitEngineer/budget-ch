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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import AddCategory from "../../dashboard/_components/add-category-dialog";
import { useState } from "react";
import {
  TransactionDialogValues,
  TransactionDialogSchema,
} from "@/lib/validations/transaction-dialog-validations";
import { Spinner } from "@/components/ui/spinner";
import { useTransactionStore } from "@/store/transaction-store";

export default function CreateTransactionDialog({
  variant,
  text,
}: {
  variant?: "outline" | "default" | "gradient";
  text?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { createTransactionAndSync, createLoading } = useTransactionStore();

  const t = useTranslations(
    "main-dashboard.transactions-page.transaction-edit-dialog",
  );

  const form = useForm<TransactionDialogValues>({
    resolver: zodResolver(TransactionDialogSchema) as any,
    defaultValues: {
      date: new Date(),
      account: "savings",
      recipient: "",
      category: "",
      amount: 0,
      note: "",
      splits: [],
    },
  });

  async function onSubmit(values: TransactionDialogValues) {
    try {
      await createTransactionAndSync({
        category: values.category.trim(),
        amount: values.amount,
        note: values.note,
        source: values.recipient,
        transactionType: values.transactionType,
        accountType: values.account,
      });

      form.reset();
      setSelectedCategory(null);
      setCategories([]);
      setOpen(false);
    } catch (err: any) {
      console.error("Error submitting form:", err);
    }
  }

  function handleCategoryAdded(newCategory: string) {
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategory(newCategory);
    form.setValue("category", newCategory);
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "splits",
  });

  return (
    <>
      <AddCategory
        open={isAddCategoryOpen}
        onOpenChangeAction={setIsAddCategoryOpen}
        onCategoryAddedAction={handleCategoryAdded}
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
                    name="account"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("dialog.labels.account")}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={t("dialog.placeholders.account")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">
                                {t("dialog.options.checking")}
                              </SelectItem>
                              <SelectItem value="savings">
                                {t("dialog.options.savings")}
                              </SelectItem>
                              <SelectItem value="credit-card">
                                {t("dialog.options.credit-card")}
                              </SelectItem>
                              <SelectItem value="cash">
                                {t("dialog.options.cash")}
                              </SelectItem>
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

                              {categories.length === 0 ? (
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
                    onClick={() => setOpen(false)}
                  >
                    {t("dialog.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    className="cursor-pointer"
                  >
                    {createLoading ? <Spinner /> : t("dialog.buttons.save")}
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
