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
  DialogHeader,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  SavingsGoalDialogSchema,
  SavingsGoalDialogValues,
} from "@/lib/validations/saving-goal-validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useSavingGoalStore } from "@/store/saving-goal-store";
import { Spinner } from "@/components/ui/spinner";
import type { SavingGoal } from "@/db/queries";

export default function EditSavingGoalDialog({
  goalData,
}: {
  goalData: SavingGoal;
}) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.sidebar-header.dialog",
  );

  const { updateGoalAndSync, deleteGoalAndSync, updateLoading, deleteLoading } =
    useSavingGoalStore();
  const [open, setOpen] = useState(false);

  const form = useForm<SavingsGoalDialogValues>({
    resolver: zodResolver(SavingsGoalDialogSchema) as any,
    defaultValues: {
      name: goalData?.name ?? "",
      goalAmount: goalData?.goalAmount ?? 0,
      savedAmount: goalData?.amountSaved ?? 0,
      dueDate: goalData?.dueDate ? new Date(goalData.dueDate) : new Date(),
      account: goalData?.accountType ?? "savings",
      monthlyAllocation: goalData?.monthlyAllocation ?? 0,
    },
  });

  async function onSubmit(values: SavingsGoalDialogValues) {
    try {
      await updateGoalAndSync(goalData.id, {
        name: values.name,
        goalAmount: values.goalAmount,
        amountSaved: values.savedAmount,
        monthlyAllocation: values.monthlyAllocation,
        accountType: values.account,
        dueDate: values.dueDate ?? null,
      });

      setOpen(false);
      form.reset(values);
    } catch (err: any) {
      console.error("Error submitting form:", err);
    }
  }

  async function handleDelete() {
    try {
      await deleteGoalAndSync(goalData.id);
      setOpen(false);
    } catch (err: any) {
      console.error("Error deleting saving goal:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
        >
          {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("edit-dialog")}
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
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.name.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("labels.name.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal + Saved */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.goal-amount")}</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.5} min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.saved-amount")}</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.5} min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date + Account */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.due-date.title")}</FormLabel>
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
                              : t("labels.due-date.placeholder")}
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
                  <FormItem className="flex-1">
                    <FormLabel>{t("labels.account.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("labels.account.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">
                            {t("labels.account.options.checking")}
                          </SelectItem>
                          <SelectItem value="savings">
                            {t("labels.account.options.save")}
                          </SelectItem>
                          <SelectItem value="credit-card">
                            {t("labels.account.options.credit-card")}
                          </SelectItem>
                          <SelectItem value="cash">
                            {t("labels.account.options.cash")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Monthly Allocation */}
            <FormField
              control={form.control}
              name="monthlyAllocation"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>{t("labels.monthly-allocation")}</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.5} min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="cursor-pointer"
                variant="outline"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Spinner /> : t("delete")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={updateLoading}
              >
                {updateLoading ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
