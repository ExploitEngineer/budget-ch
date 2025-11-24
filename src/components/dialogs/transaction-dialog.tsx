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
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  TransactionDialogValues,
  TransactionDialogSchema,
} from "@/lib/validations/transaction-dialog-validations";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { createTransaction } from "@/lib/services/transaction";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import AddCategory from "@/app/me/dashboard/_components/add-category-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";

export default function TransactionDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const form = useForm<TransactionDialogValues>({
    resolver: zodResolver(TransactionDialogSchema) as any,
    defaultValues: {
      date: new Date(),
      account: "checking",
      transactionType: "income",
      recipient: "",
      category: "",
      amount: 0,
      note: "",
    },
  });

  const t = useTranslations("main-dashboard.dashboard-page");

  async function onSubmit(values: TransactionDialogValues) {
    setIsLoading(true);
    try {
      const result = await createTransaction({
        categoryName: values.category.trim(),
        amount: values.amount,
        note: values.note,
        source: values.recipient,
        transactionType: values.transactionType,
        accountType: values.account,
      });

      if (!result.success) {
        if (result.reason === "CATEGORY_ALREADY_EXISTS") {
          toast.error("This category already exists. Transaction not created!");
        } else if (result.reason === "NO_ACCOUNT") {
          toast.error("Please create a financial account first!");
        } else {
          toast.error(result.message || "Failed to create transaction.");
        }
        return;
      }

      toast.success("Transaction and category created successfully!");
      form.reset();
      setSelectedCategory(null);
      setCategories([]);
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });

      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong while creating the transaction.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCategoryAdded(newCategory: string) {
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategory(newCategory);
    form.setValue("category", newCategory);
  }
  return (
    <>
      <AddCategory
        open={isAddCategoryOpen}
        onOpenChangeAction={setIsAddCategoryOpen}
        onCategoryAddedAction={handleCategoryAdded}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="cursor-pointer sm:min-w-40" asChild>
          <Button
            className="btn-gradient flex items-center gap-2 dark:text-white"
            variant="default"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden text-sm sm:block">
              {t("dialog-box.title")}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl [&>button]:hidden">
          <div className="flex items-center justify-between border-b pb-3">
            <DialogTitle className="text-lg font-semibold">
              {t("dialog-box.title")}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                className="cursor-pointer border"
                variant="ghost"
              >
                {t("dialog-box.btn-close")}
              </Button>
            </DialogClose>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1 */}
              <div className="flex items-center justify-between gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
                      <FormLabel>{t("dialog-box.labels.date")}</FormLabel>
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
                                : "mm/dd/yyy"}
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
                    <FormItem className="flex !flex-1 flex-col">
                      <FormLabel>
                        {t("dialog-box.labels.account.title")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t(
                                "dialog-box.labels.account.placeholder",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">
                              {t("dialog-box.labels.account.options.checking")}
                            </SelectItem>
                            <SelectItem value="savings">
                              {t("dialog-box.labels.account.options.save")}
                            </SelectItem>
                            <SelectItem value="credit-card">
                              {t(
                                "dialog-box.labels.account.options.credit-card",
                              )}
                            </SelectItem>
                            <SelectItem value="cash">
                              {t("dialog-box.labels.account.options.cash")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between gap-3">
                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem className="flex !flex-1 flex-col">
                      <FormLabel>
                        {t("dialog-box.labels.transactionType.title")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t(
                                "dialog-box.labels.transactionType.options.income",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">
                              {t(
                                "dialog-box.labels.transactionType.options.income",
                              )}
                            </SelectItem>
                            <SelectItem value="expense">
                              {t(
                                "dialog-box.labels.transactionType.options.expense",
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
                      <FormLabel>
                        {t("dialog-box.labels.quelle.title")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            "dialog-box.labels.quelle.placeholder",
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between gap-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
                      <FormLabel>
                        {t("dialog-box.labels.category.title")}
                      </FormLabel>
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
                                + {t("dialog-box.buttons.new-category")}
                              </Button>
                            </div>

                            {categories.length === 0 ? (
                              <SelectItem value="none" disabled>
                                {t("dialog-box.no-categories-yet")}
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
                      <FormLabel>{t("dialog-box.labels.amount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step={0.5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4 */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dialog-box.labels.note.title")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("dialog-box.labels.note.placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline">
                  {t("dialog-box.buttons.save")}
                </Button>
                <Button
                  className="cursor-pointer"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? <Spinner /> : t("dialog-box.buttons.post")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
