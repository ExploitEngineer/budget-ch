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
  TransactionFiltersFormValues,
  transactionFiltersFormSchema,
} from "@/lib/validations/transaction-filters-validations";
import { useMemo, useState } from "react";
import CreateCategoryDialog from "@/app/me/dashboard/_components/create-category-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/query-keys";
import { getCategories } from "@/lib/services/category";

interface FiltersSectionProps {
  onFilter: (filters: TransactionFiltersFormValues) => void;
  onReset?: () => void;
}

export function FiltersSection({ onFilter, onReset }: FiltersSectionProps) {
  const t = useTranslations("main-dashboard.transactions-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const defaultFilterValues: TransactionFiltersFormValues = {
    dateFrom: undefined,
    dateTo: undefined,
    category: "",
    amountMax: 0,
    amountMin: 0,
    text: "",
    withReceipt: false,
    isRecurring: false,
    transfersOnly: false,
  };

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
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
    enabled: !!hubId,
  });

  const availableCategories = useMemo(() => {
    const fetchedNames = categoriesData?.map((category) => category.name) ?? [];
    const uniqueCategories = new Set<string>(fetchedNames);
    customCategories.forEach((category) => uniqueCategories.add(category));
    return Array.from(uniqueCategories);
  }, [categoriesData, customCategories]);

  const form = useForm<TransactionFiltersFormValues>({
    resolver: zodResolver(transactionFiltersFormSchema) as any,
    defaultValues: defaultFilterValues,
  });

  const handleApply = async (values: TransactionFiltersFormValues) => {
    onFilter(values);
    form.reset(values, { keepValues: true });
  };

  const handleReset = () => {
    form.reset(defaultFilterValues);
    onReset?.();
    setSelectedCategory(null);
  };

  function handleCategoryAdded(newCategory: string) {
    setCustomCategories((prev) =>
      prev.includes(newCategory) ? prev : [...prev, newCategory],
    );
    refetchCategories();
    setSelectedCategory(newCategory);
    form.setValue("category", newCategory);
  }

  return (
    <section>
      <CreateCategoryDialog
        open={isAddCategoryOpen}
        onOpenChangeAction={setIsAddCategoryOpen}
        onCategoryAddedAction={handleCategoryAdded}
        hubId={hubId}
      />

      <div>
        <Card className="bg-blue-background dark:border-border-blue">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleApply)}>
              <CardContent className="p-4">
                {/* Top Row */}
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
                                  ? format(field.value, "dd/MM/yyyy")
                                  : t("transaction-edit-dialog.dialog.placeholders.pick-date")}
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
                                  ? format(field.value, "dd/MM/yyyy")
                                  : t("transaction-edit-dialog.dialog.placeholders.pick-date")}
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
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>{t("labels.category.title")}</FormLabel>
                        <FormControl>
                          <Select
                            value={selectedCategory || ""}
                            onValueChange={(value) => {
                              setSelectedCategory(value);
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("transaction-edit-dialog.dialog.placeholders.category-selector")} />
                            </SelectTrigger>

                            <SelectContent>
                              <div className="flex items-center justify-between border-b px-2 py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full cursor-pointer justify-center text-sm"
                                  onClick={() => setIsAddCategoryOpen(true)}
                                >
                                  + {t("labels.category.data.new-category")}
                                </Button>
                              </div>

                              {availableCategories.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  {categoriesLoading
                                    ? commonT("loading")
                                    : t("labels.category.data.no-category")}
                                </SelectItem>
                              ) : (
                                availableCategories.map((category) => (
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
                </div>

                {/* Second Row */}
                <div className="mt-4 flex flex-col flex-wrap gap-4 md:flex-row">
                  <FormField
                    control={form.control}
                    name="amountMin"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Min ({commonT("currency")})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="!bg-dark-blue-background dark:border-border-blue"
                            placeholder="0.00"
                            step={0.5}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amountMax"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Max ({commonT("currency")})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="!bg-dark-blue-background dark:border-border-blue"
                            placeholder="0.00"
                            step={0.5}
                            {...field}
                          />
                        </FormControl>
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
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

              {/* Footer */}
              <CardFooter className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FormField
                    control={form.control}
                    name="withReceipt"
                    render={({ field }) => (
                      <Badge
                        variant="outline"
                        className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                      >
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="cursor-pointer">
                            {t("checkboxes.recipient")}
                          </span>
                        </label>
                      </Badge>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <Badge
                        variant="outline"
                        className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                      >
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="cursor-pointer">
                            {t("checkboxes.recurring")}
                          </span>
                        </label>
                      </Badge>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transfersOnly"
                    render={({ field }) => (
                      <Badge
                        variant="outline"
                        className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
                      >
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="cursor-pointer">
                            {t("checkboxes.transfers")}
                          </span>
                        </label>
                      </Badge>
                    )}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
                  >
                    {t("buttons.reset")}
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isApplying || !form.formState.isDirty}
                    className="btn-gradient cursor-pointer border-transparent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? <Spinner /> : t("buttons.apply")}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
}
