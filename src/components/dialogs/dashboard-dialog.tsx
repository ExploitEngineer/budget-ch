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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { mainFormSchema, MainFormValues } from "@/lib/validations";

export default function DashBoardDialog({ onClose }: { onClose?: () => void }) {
  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      date: undefined,
      account: "",
      text: "",
      select: "",
      amount: 0,
      file: undefined,
      entries: [],
    },
  });

  const t = useTranslations("main-dashboard.dashboard-page");

  function onSubmit(values: MainFormValues) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">{t("dialog-box.title")}</h2>
          <Button
            type="button"
            className="cursor-pointer border"
            variant="ghost"
            onClick={onClose}
          >
            {t("dialog-box.btn-close")}
          </Button>
        </div>

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
                          : "Pick a date"}
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
                <FormLabel>{t("dialog-box.labels.account.title")}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("dialog-box.labels.account.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">
                        {t("dialog-box.labels.account.options.checking")}
                      </SelectItem>
                      <SelectItem value="card">
                        {t("dialog-box.labels.account.options.credit-card")}
                      </SelectItem>
                      <SelectItem value="save">
                        {t("dialog-box.labels.account.options.save")}
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
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dialog-box.labels.quelle.title")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("dialog-box.labels.quelle.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 3 */}
        <div className="flex items-center justify-between gap-3">
          <FormField
            control={form.control}
            name="select"
            render={({ field }) => (
              <FormItem className="flex flex-1 flex-col">
                <FormLabel>{t("dialog-box.labels.category.title")}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groceries">
                        {t("dialog-box.labels.category.options.groceries")}
                      </SelectItem>
                      <SelectItem value="restaurant">
                        {t("dialog-box.labels.category.options.restaurant")}
                      </SelectItem>
                      <SelectItem value="transportation">
                        {t("dialog-box.labels.category.options.transportation")}
                      </SelectItem>
                      <SelectItem value="household">
                        {t("dialog-box.labels.category.options.household")}
                      </SelectItem>
                      <SelectItem value="income">
                        {t("dialog-box.labels.category.options.income")}
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
          name="text"
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
          <Button type="button" variant="outline" onClick={onClose}>
            {t("dialog-box.buttons.save")}
          </Button>
          <Button type="submit">{t("dialog-box.buttons.post")}</Button>
        </div>
      </form>
    </Form>
  );
}
