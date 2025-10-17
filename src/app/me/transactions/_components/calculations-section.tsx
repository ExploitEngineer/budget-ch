"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalculationFormValues,
  calculationFormSchema,
} from "@/lib/validations/calculation-section-validations";

export function CalculationSection() {
  const t = useTranslations("main-dashboard.transactions-page");

  const form = useForm<CalculationFormValues>({
    resolver: zodResolver(calculationFormSchema) as any,
    defaultValues: {
      dateFrom: undefined,
      dateTo: undefined,
      select1: "savings",
      select2: "restaurant",
      amountMax: 0,
      amountMin: 0,
      text: "",
    },
  });

  return (
    <section>
      <FormProvider {...form}>
        <Card className="bg-blue-background dark:border-border-blue">
          <CardContent>
            <Form {...form}>
              <div className="flex flex-col flex-wrap gap-4 md:flex-row">
                <FormField
                  control={form.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.from")}</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="!bg-dark-blue-background dark:border-border-blue text-foreground w-full justify-start"
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
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.to")}</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="!bg-dark-blue-background dark:border-border-blue text-foreground w-full justify-start"
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
                  name="select1"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.account.title")}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="!bg-dark-blue-background dark:border-border-blue text-foreground w-full">
                            <SelectValue
                              placeholder={t(
                                "labels.account.data.current-account",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current-account">
                              {t("labels.account.data.current-account")}
                            </SelectItem>
                            <SelectItem value="credit-card">
                              {t("labels.account.data.credit-card")}
                            </SelectItem>
                            <SelectItem value="savings">
                              {t("labels.account.data.savings")}
                            </SelectItem>
                            <SelectItem value="cash">
                              {t("labels.account.data.cash")}
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
                  name="select2"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.category.title")}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="!bg-dark-blue-background dark:border-border-blue text-foreground w-full">
                            <SelectValue
                              placeholder={t("labels.category.data.categories")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="categories">
                              {t("labels.category.data.categories")}
                            </SelectItem>
                            <SelectItem value="groceries">
                              {t("labels.category.data.groceries")}
                            </SelectItem>
                            <SelectItem value="restaurant">
                              {t("labels.category.data.restaurant")}
                            </SelectItem>
                            <SelectItem value="transportation">
                              {t("labels.category.data.transportation")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4 flex flex-col flex-wrap gap-4 md:flex-row">
                <FormField
                  control={form.control}
                  name="amountMax"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Min (CHF)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="!bg-dark-blue-background dark:border-border-blue"
                          placeholder="0.00"
                          step={0.5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountMin"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Max (CHF)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="!bg-dark-blue-background dark:border-border-blue"
                          placeholder="0.00"
                          step={0.5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.search.title")}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="!bg-dark-blue-background dark:border-border-blue"
                          placeholder={t("labels.search.placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                asChild
              >
                <label className="flex items-center gap-2">
                  <Checkbox />
                  <span>{t("checkboxes.receipt")}</span>
                </label>
              </Badge>
              <Badge
                variant="outline"
                className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                asChild
              >
                <label className="flex items-center gap-2">
                  <Checkbox />
                  <span>{t("checkboxes.recurring")}</span>
                </label>
              </Badge>
              <Badge
                variant="outline"
                className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                asChild
              >
                <label className="flex items-center gap-2">
                  <Checkbox />
                  <span>{t("checkboxes.transfers")}</span>
                </label>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
              >
                {t("buttons.reset")}
              </Button>
              <Button
                variant="outline"
                className="btn-gradient cursor-pointer border-transparent"
              >
                {t("buttons.apply")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </FormProvider>
    </section>
  );
}
