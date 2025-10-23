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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  SavingsGoalDialogSchema,
  SavingsGoalDialogValues,
} from "@/lib/validations/saving-goal-validations";

export default function SavingGoalsDialog() {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.sidebar-header.dialog",
  );

  const form = useForm<SavingsGoalDialogValues>({
    resolver: zodResolver(SavingsGoalDialogSchema) as any,
    defaultValues: {
      name: "",
      goalAmount: 0,
      savedAmount: 0,
      dueDate: undefined,
      account: "savings",
      monthlyAllocation: 0,
    },
  });

  function onSubmit(values: SavingsGoalDialogValues) {
    console.log("Savings goal submitted:", values);
  }

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        <Button
          variant="outline"
          className="dark:border-border-blue !bg-dark-blue-background"
        >
          {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("edit-dialog")}
          </DialogTitle>
          <DialogClose asChild>
            <Button className="cursor-pointer border" variant="ghost">
              {t("button")}
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Row 1: Name */}
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

            {/* Row 2: Target + Already Saved */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.goal-amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.saved-amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Due Date + Account */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
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
                  <FormItem className="flex flex-1 flex-col">
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
                          <SelectItem value="save">
                            {t("labels.account.options.save")}
                          </SelectItem>
                          <SelectItem value="checking">
                            {t("labels.account.options.checking")}
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

            {/* Row 4: Monthly Allocation */}
            <FormField
              control={form.control}
              name="monthlyAllocation"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>{t("labels.monthly-allocation")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.5}
                      min={0}
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="cursor-pointer"
                variant="outline"
              >
                {t("delete")}
              </Button>
              <Button type="submit" className="cursor-pointer">
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
