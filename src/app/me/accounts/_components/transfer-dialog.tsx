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
import { CalendarIcon, MoveHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  transferDialogSchema,
  TransferDialogValues,
} from "@/lib/validations/transfer-dialog-validations";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { createAccountTransfer } from "@/lib/services/latest-transfers";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function TransferDialog() {
  const [isTransferringAmount, setIsTransferringAmount] =
    useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<TransferDialogValues>({
    resolver: zodResolver(transferDialogSchema) as any,
    defaultValues: {
      from: "cash",
      to: "cash",
      amount: 0,
      text: "",
    },
  });

  const t = useTranslations("main-dashboard.content-page.sidebar-header");

  async function onSubmit(values: TransferDialogValues) {
    if (values.from === values.to) {
      toast.error("Cannot transfer to the same account.");
      return;
    }
    if (!values.amount || Number(values.amount) <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }

    setIsTransferringAmount(true);
    try {
      const res = await createAccountTransfer({
        fromAccountType: values.from,
        toAccountType: values.to,
        amount: Number(values.amount),
        note: values.text,
      });

      if (!res.success) {
        toast.error(res.message || "Transfer failed.");
        return;
      }

      setIsOpen(false);
      toast.success("Transfer successful.");
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsTransferringAmount(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="cursor-pointer sm:min-w-40" asChild>
        <Button
          className="dark:border-border-blue !bg-dark-blue-background flex items-center gap-2 dark:text-white"
          variant="outline"
        >
          <MoveHorizontal className="h-5 w-5" />
          <span className="hidden text-sm sm:block">{t("button")}</span>
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
              {t("dialog-box.button")}
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog-box.labels.from.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">
                            {t("dialog-box.labels.from.options.giro")}
                          </SelectItem>
                          <SelectItem value="savings">
                            {t("dialog-box.labels.from.options.sparen")}
                          </SelectItem>
                          <SelectItem value="credit-card">
                            {t("dialog-box.labels.from.options.kreditkarte")}
                          </SelectItem>
                          <SelectItem value="cash">
                            {t("dialog-box.labels.from.options.bar")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To */}
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog-box.labels.to.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">
                            {t("dialog-box.labels.to.options.giro")}
                          </SelectItem>
                          <SelectItem value="savings">
                            {t("dialog-box.labels.to.options.sparen")}
                          </SelectItem>
                          <SelectItem value="credit-card">
                            {t("dialog-box.labels.to.options.kreditkarte")}
                          </SelectItem>
                          <SelectItem value="cash">
                            {t("dialog-box.labels.to.options.bar")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount + Date */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog-box.labels.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
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
                              ? format(field.value, "dd/MM/yyyy")
                              : "10/06/2025"}
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
            </div>

            {/* Note */}
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

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isTransferringAmount}
              >
                {isTransferringAmount ? (
                  <Spinner />
                ) : (
                  t("dialog-box.buttons.post")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
