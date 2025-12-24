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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  BudgetDialogSchema,
  BudgetDialogValues,
} from "@/lib/validations/budget-dialog-validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBudget } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import CategorySelector from "@/components/category-selector";

export default function CreateBudgetDialog({
  variant = "gradient",
  text,
  defaultCategory = "",
}: {
  variant?: "gradient" | "outline";
  text?: string;
  defaultCategory?: string;
}) {
  const t = useTranslations(
    "main-dashboard.budgets-page.sidebar-header.dialog",
  );

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [open, setOpen] = useState<boolean>(false);

  const createBudgetMutation = useMutation({
    mutationFn: async (data: {
      categoryName: string;
      allocatedAmount: number;
      spentAmount: number;
      warningPercentage: number;
      markerColor: string;
    }) => {
      const result = await createBudget(data);
      if (!result.success) {
        throw new Error(result.message || "Failed to create budget");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.amounts(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesCount(hubId) });
      toast.success(t("messages.created"));
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("messages.error.create"));
    },
  });

  const form = useForm<BudgetDialogValues>({
    resolver: zodResolver(BudgetDialogSchema) as any,
    defaultValues: {
      category: defaultCategory,
      budgetChf: 0,
      istChf: 0,
      warning: 0,
      colorMarker: "standard",
    },
  });

  async function onSubmit(values: BudgetDialogValues) {
    try {
      await createBudgetMutation.mutateAsync({
        categoryName: values.category,
        allocatedAmount: values.budgetChf,
        spentAmount: values.istChf,
        warningPercentage: values.warning,
        markerColor: values.colorMarker.toLowerCase(),
      });
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  function handleCategoryAdded(newCategory: string) {
    form.setValue("category", newCategory);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          // Reset form when dialog closes
          form.reset();
        }
      }}
    >
      <DialogTrigger className="cursor-pointer" asChild>
        <Button
          className={
            variant === "gradient"
              ? "btn-gradient flex items-center gap-2 dark:text-white"
              : "bg-dark-blue-background! dark:border-border-blue flex cursor-pointer items-center gap-2"
          }
          variant={variant === "gradient" ? "default" : "outline"}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden text-sm sm:block">
            {variant === "gradient" ? t("title") : text}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("title")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer border"
            >
              {t("button")}
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Row 1: Category */}
            <CategorySelector
              control={form.control}
              name="category"
              hubId={hubId}
              label={t("labels.category.title")}
              enabled={open}
              onCategoryAdded={handleCategoryAdded}
            />
            {/* Row 2: Budget & Ist */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="budgetChf"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.budget-chf")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        {...field}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="istChf"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.1-chf")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        {...field}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Warning and Color Marker */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="warning"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.warning")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={1}
                        min={0}
                        max={100}
                        {...field}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="colorMarker"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.color-marker.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("labels.color-marker.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            {t("labels.color-marker.options.std")}
                          </SelectItem>
                          <SelectItem value="green">
                            {t("labels.color-marker.options.green")}
                          </SelectItem>
                          <SelectItem value="orange">
                            {t("labels.color-marker.options.orange")}
                          </SelectItem>
                          <SelectItem value="red">
                            {t("labels.color-marker.options.red")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="cursor-pointer"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                className="cursor-pointer"
                disabled={createBudgetMutation.isPending}
                type="submit"
              >
                {createBudgetMutation.isPending ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
