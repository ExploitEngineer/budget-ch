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
import type { BudgetRow } from "@/lib/types/row-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBudget, updateBudget, deleteBudget } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface EditBudgetDialogProps {
  variant?: "gradient" | "outline";
  text?: string;
  budget?: BudgetRow;
}

export default function EditBudgetDialog({
  variant = "gradient",
  text,
  budget,
}: EditBudgetDialogProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [open, setOpen] = useState(false);
  const t = useTranslations(
    "main-dashboard.budgets-page.sidebar-header.dialog",
  );

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
      toast.success("Budget created successfully!");
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create budget");
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({
      budgetId,
      updatedData,
    }: {
      budgetId: string;
      updatedData: {
        categoryName?: string;
        allocatedAmount?: number;
        spentAmount?: number;
        warningPercentage?: number;
        markerColor?: string;
      };
    }) => {
      const result = await updateBudget({ budgetId, updatedData });
      if (!result.success) {
        throw new Error(result.message || "Failed to update budget");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.amounts(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesCount(hubId) });
      toast.success("Budget updated successfully!");
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update budget");
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const result = await deleteBudget(budgetId);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete budget");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.amounts(hubId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoriesCount(hubId) });
      toast.success("Budget deleted successfully!");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete budget");
    },
  });

  const form = useForm<BudgetDialogValues>({
    resolver: zodResolver(BudgetDialogSchema) as any,
    defaultValues: {
      category: budget?.category ?? "",
      budgetChf: budget?.allocated ?? 0,
      istChf: budget?.spent ?? 0,
      warning: 0,
      colorMarker: "standard",
    },
  });

  async function onSubmit(values: BudgetDialogValues) {
    try {
      if (budget) {
        await updateBudgetMutation.mutateAsync({
          budgetId: budget.id,
          updatedData: {
            categoryName: values.category,
            allocatedAmount: values.budgetChf,
            spentAmount: values.istChf,
            warningPercentage: values.warning,
            markerColor: values.colorMarker.toLowerCase(),
          },
        });
      } else {
        await createBudgetMutation.mutateAsync({
          categoryName: values.category,
          allocatedAmount: values.budgetChf,
          spentAmount: values.istChf,
          warningPercentage: values.warning,
          markerColor: values.colorMarker.toLowerCase(),
        });
      }
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  async function handleDelete() {
    if (!budget) return;
    try {
      await deleteBudgetMutation.mutateAsync(budget.id);
    } catch (err: any) {
      // Error already handled in onError
    }
  }

  return (
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
          {variant === "gradient" ? (
            <>
              <Plus className="h-5 w-5" />
              <span className="hidden text-sm sm:block">{t("title")}</span>
            </>
          ) : (
            <span>{text}</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {budget ? t("edit-budget") : t("create-budget")}
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
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.category.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("labels.category.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
              {budget && (
                <Button
                  type="button"
                  className="cursor-pointer"
                  variant="outline"
                  disabled={deleteBudgetMutation.isPending}
                  onClick={handleDelete}
                >
                  {deleteBudgetMutation.isPending ? <Spinner /> : t("delete-btn")}
                </Button>
              )}
              <Button
                className="cursor-pointer"
                disabled={budget ? updateBudgetMutation.isPending : createBudgetMutation.isPending}
                type="submit"
              >
                {(budget ? updateBudgetMutation.isPending : createBudgetMutation.isPending) ? (
                  <Spinner />
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
